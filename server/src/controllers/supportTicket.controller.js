const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PRIORITY_OPTIONS = ["High", "Average", "Low"];
const SUPPORTED_ROLES = ["CANDIDATE", "RECRUITER", "ADMIN"];

const getRequestBody = (req) => {
    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
    ) {
        return {};
    }

    return req.body;
};

const normalizeSummary = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    return value.trim().replace(/\s+/g, " ");
};

const normalizePriority = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    const normalizedValue = value.trim().toLowerCase();

    const matchedPriority = PRIORITY_OPTIONS.find(
        (priority) => priority.toLowerCase() === normalizedValue
    );

    return matchedPriority || "";
};

const normalizeOptionalId = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value.trim();

    return normalizedValue || null;
};

const normalizePageLink = (value) => {
    if (typeof value !== "string" || !value.trim()) {
        return null;
    }

    try {
        const parsedUrl = new URL(value.trim());

        if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
        ) {
            return null;
        }

        parsedUrl.username = "";
        parsedUrl.password = "";
        parsedUrl.hash = "";

        return parsedUrl.toString();
    } catch {
        return null;
    }
};

const createSupportTicket = async (req, res) => {
    try {
        if (
            !req.user?.id ||
            typeof req.user.id !== "string" ||
            !req.user.id.trim()
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role =
            typeof req.user.role === "string"
                ? req.user.role.trim().toUpperCase()
                : "";

        if (!SUPPORTED_ROLES.includes(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to create a support ticket.",
            });
        }

        const body = getRequestBody(req);

        const normalizedSummary = normalizeSummary(body.summary);
        const normalizedPriority = normalizePriority(body.priority);
        const normalizedLink = normalizePageLink(body.link);
        const normalizedPositionId = normalizeOptionalId(body.positionId);

        if (!normalizedSummary) {
            return res.status(400).json({
                success: false,
                message: "Support ticket summary is required.",
            });
        }

        if (normalizedSummary.length < 5) {
            return res.status(400).json({
                success: false,
                message:
                    "Support ticket summary must contain at least 5 characters.",
            });
        }

        if (normalizedSummary.length > 500) {
            return res.status(400).json({
                success: false,
                message:
                    "Support ticket summary cannot exceed 500 characters.",
            });
        }

        if (!normalizedPriority) {
            return res.status(400).json({
                success: false,
                message: "Priority must be High, Average, or Low.",
            });
        }

        if (!normalizedLink) {
            return res.status(400).json({
                success: false,
                message: "A valid reported page link is required.",
            });
        }

        const reporter = await prisma.user.findUnique({
            where: {
                id: req.user.id.trim(),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isBlocked: true,
            },
        });

        if (!reporter || reporter.isBlocked) {
            return res.status(401).json({
                success: false,
                message: "Authentication is no longer valid.",
            });
        }

        const reporterRole =
            typeof reporter.role === "string"
                ? reporter.role.trim().toUpperCase()
                : "";

        if (!SUPPORTED_ROLES.includes(reporterRole)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to create a support ticket.",
            });
        }

        let position = null;

        if (normalizedPositionId) {
            position = await prisma.position.findUnique({
                where: {
                    id: normalizedPositionId,
                },
                select: {
                    id: true,
                    title: true,
                },
            });

            if (!position) {
                return res.status(404).json({
                    success: false,
                    message: "Position not found.",
                });
            }
        }

        const administrators = await prisma.user.findMany({
            where: {
                role: "ADMIN",
                isBlocked: false,
            },
            select: {
                email: true,
            },
            orderBy: {
                email: "asc",
            },
        });

        const adminEmails = [
            ...new Set(
                administrators
                    .map((administrator) =>
                        typeof administrator.email === "string"
                            ? administrator.email.trim().toLowerCase()
                            : ""
                    )
                    .filter(Boolean)
            ),
        ];

        if (adminEmails.length === 0) {
            return res.status(503).json({
                success: false,
                message:
                    "Support ticket delivery is temporarily unavailable because no active administrator email was found.",
            });
        }

        const reporterName = [
            reporter.firstName?.trim(),
            reporter.lastName?.trim(),
        ]
            .filter(Boolean)
            .join(" ");

        const ticket = {
            summary: normalizedSummary,
            reportedBy: {
                id: reporter.id,
                name: reporterName || reporter.email.trim().toLowerCase(),
                email: reporter.email.trim().toLowerCase(),
                role: reporterRole,
            },
            position: position
                ? {
                    id: position.id,
                    title: position.title,
                }
                : null,
            link: normalizedLink,
            priority: normalizedPriority,
            adminEmails,
            createdAt: new Date().toISOString(),
        };

        return res.status(201).json({
            success: true,
            message: "Support ticket payload created successfully.",
            data: ticket,
        });
    } catch (error) {
        console.error("Support ticket create error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to create support ticket. Please try again.",
        });
    }
};

module.exports = {
    createSupportTicket,
};