const { Prisma, PrismaClient } = require("@prisma/client");
const {
    evaluatePositionEligibility,
} = require("../services/positionEligibility.service");

const prisma = new PrismaClient();

// --- Helpers ---

const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

const isSupportedRole = (role) =>
    ["CANDIDATE", "RECRUITER", "ADMIN"].includes(role);

const getRequestBody = (req) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return {};
    }
    return req.body;
};

const getValidId = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

const parseOptionalDate = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }

    if (value === null || value === "") {
        return { valid: true, value: null };
    }

    if (typeof value !== "string") {
        return { valid: false, value: undefined };
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return { valid: true, value: null };
    }

    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

    if (dateOnlyPattern.test(normalizedValue)) {
        const parts = normalizedValue.split("-").map(Number);
        const year = parts[0];
        const month = parts[1] - 1;
        const day = parts[2];

        const parsedDate = new Date(Date.UTC(year, month, day));

        if (
            parsedDate.getUTCFullYear() !== year ||
            parsedDate.getUTCMonth() !== month ||
            parsedDate.getUTCDate() !== day
        ) {
            return { valid: false, value: undefined };
        }

        return { valid: true, value: parsedDate };
    }

    const parsedDate = new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) {
        return { valid: false, value: undefined };
    }

    return { valid: true, value: parsedDate };
};

const parseOptionalBoolean = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }

    if (value === true || value === "true") {
        return { valid: true, value: true };
    }

    if (value === false || value === "false") {
        return { valid: true, value: false };
    }

    return { valid: false, value: undefined };
};

const parseOptionalString = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }

    if (value === null) {
        return { valid: true, value: null };
    }

    if (typeof value !== "string") {
        return { valid: false, value: undefined };
    }

    const normalizedValue = value.trim();

    return { valid: true, value: normalizedValue || null };
};

const handleServerError = (res, operation, error) => {
    console.error(`Position ${operation} error:`, error.message);
    return res.status(500).json({
        success: false,
        message: `Failed to ${operation} Position. Please try again.`,
    });
};

const positionSelect = {
    id: true,
    title: true,
    description: true,
    company: true,
    location: true,
    department: true,
    deadline: true,
    isActive: true,
    accessType: true,
    accessRuleLogic: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    },
    _count: {
        select: {
            cvs: true,
            positionAttributes: true,
            discussions: true,
        },
    },
};

const accessRuleSelect = {
    id: true,
    attributeId: true,
    operator: true,
    value: true,
    attribute: {
        select: {
            id: true,
            name: true,
            category: true,
            type: true,
        },
    },
};

const candidatePositionSelect = {
    ...positionSelect,
    accessRules: {
        select: accessRuleSelect,
        orderBy: [
            {
                createdAt: "asc",
            },
            {
                id: "asc",
            },
        ],
    },
};

const getSafeEligibilitySummary = (eligibility) => {
    return {
        eligible: eligibility.eligible,
        reason: eligibility.reason,
        accessType: eligibility.accessType,
        accessRuleLogic: eligibility.accessRuleLogic,
        totalRules: eligibility.totalRules,
        passedRules: eligibility.passedRules,
        failedRules: eligibility.failedRules,
    };
};

// --- Controllers ---

const createPosition = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        if (role !== "RECRUITER") {
            return res.status(403).json({
                success: false,
                message: "Only Recruiters can create Positions through this endpoint.",
            });
        }

        const body = getRequestBody(req);
        const { title, description, company, location, department, deadline } = body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Position title is required.",
            });
        }

        if (!company || typeof company !== "string" || !company.trim()) {
            return res.status(400).json({
                success: false,
                message: "Company name is required.",
            });
        }

        const parsedDescription = parseOptionalString(description);
        if (!parsedDescription.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid description format.",
            });
        }

        const parsedLocation = parseOptionalString(location);
        if (!parsedLocation.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid location format.",
            });
        }

        const parsedDepartment = parseOptionalString(department);
        if (!parsedDepartment.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid department format.",
            });
        }

        const parsedDeadline = parseOptionalDate(deadline);
        if (!parsedDeadline.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid deadline date.",
            });
        }

        const position = await prisma.position.create({
            data: {
                title: title.trim(),
                description: parsedDescription.value,
                company: company.trim(),
                location: parsedLocation.value,
                department: parsedDepartment.value,
                deadline: parsedDeadline.value ?? null,
                userId: req.user.id,
            },
            select: positionSelect,
        });

        return res.status(201).json({
            success: true,
            data: position,
        });
    } catch (error) {
        return handleServerError(res, "create", error);
    }
};

const getPositions = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        // Candidate branch: eligibility-aware listing
        if (role === "CANDIDATE") {
            const candidatePositions = await prisma.position.findMany({
                where: {
                    isActive: true,
                },
                select: candidatePositionSelect,
                orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            });

            // Collect all unique attribute IDs from all access rules across all positions
            const attributeIds = [
                ...new Set(
                    candidatePositions.flatMap((position) =>
                        Array.isArray(position.accessRules)
                            ? position.accessRules.map((rule) => rule.attributeId).filter(Boolean)
                            : []
                    )
                ),
            ];

            let userAttributes = [];
            if (attributeIds.length > 0) {
                userAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: attributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                        value: true,
                    },
                });
            }

            const candidateVisiblePositions = candidatePositions
                .map((position) => {
                    const eligibility = evaluatePositionEligibility(position, userAttributes);
                    const { accessRules, ...cleanPosition } = position;
                    return {
                        position: cleanPosition,
                        eligibility,
                    };
                })
                .filter((item) => item.eligibility.eligible)
                .map((item) => ({
                    ...item.position,
                    eligibility: getSafeEligibilitySummary(item.eligibility),
                }));

            return res.status(200).json({
                success: true,
                data: candidateVisiblePositions,
            });
        }

        // Recruiter and Admin branch
        let where = {};
        if (role === "RECRUITER") {
            where = { userId: req.user.id };
        } else if (role === "ADMIN") {
            where = {};
        }

        const positions = await prisma.position.findMany({
            where,
            select: positionSelect,
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        });

        return res.status(200).json({
            success: true,
            data: positions,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

const getPositionById = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        // Candidate branch: eligibility-aware detail view
        if (role === "CANDIDATE") {
            const candidatePosition = await prisma.position.findFirst({
                where: {
                    id,
                    isActive: true,
                },
                select: candidatePositionSelect,
            });

            if (!candidatePosition) {
                return res.status(404).json({
                    success: false,
                    message: "Position not found.",
                });
            }

            const rules = Array.isArray(candidatePosition.accessRules)
                ? candidatePosition.accessRules
                : [];

            const attributeIds = [
                ...new Set(rules.map((rule) => rule.attributeId).filter(Boolean)),
            ];

            let userAttributes = [];
            if (attributeIds.length > 0) {
                userAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: attributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                        value: true,
                    },
                });
            }

            const eligibility = evaluatePositionEligibility(candidatePosition, userAttributes);

            if (!eligibility.eligible) {
                return res.status(404).json({
                    success: false,
                    message: "Position not found.",
                });
            }

            const { accessRules, ...cleanPosition } = candidatePosition;

            return res.status(200).json({
                success: true,
                data: {
                    ...cleanPosition,
                    eligibility: getSafeEligibilitySummary(eligibility),
                },
            });
        }

        // Recruiter and Admin branch
        let where = { id };
        if (role === "RECRUITER") {
            where = { id, userId: req.user.id };
        } else if (role === "ADMIN") {
            where = { id };
        }

        const position = await prisma.position.findFirst({
            where,
            select: positionSelect,
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: position,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

const updatePosition = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        if (role !== "RECRUITER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this Position.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        let where = { id };

        if (role === "RECRUITER") {
            where = { id, userId: req.user.id };
        } else if (role === "ADMIN") {
            where = { id };
        }

        const existingPosition = await prisma.position.findFirst({
            where,
        });

        if (!existingPosition) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        const body = getRequestBody(req);
        const {
            title,
            description,
            company,
            location,
            department,
            deadline,
            isActive,
        } = body;

        const updateData = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Position title cannot be empty.",
                });
            }
            updateData.title = title.trim();
        }

        if (company !== undefined) {
            if (typeof company !== "string" || !company.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Company name cannot be empty.",
                });
            }
            updateData.company = company.trim();
        }

        if (description !== undefined) {
            const parsedDescription = parseOptionalString(description);
            if (!parsedDescription.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid description format.",
                });
            }
            updateData.description = parsedDescription.value;
        }

        if (location !== undefined) {
            const parsedLocation = parseOptionalString(location);
            if (!parsedLocation.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid location format.",
                });
            }
            updateData.location = parsedLocation.value;
        }

        if (department !== undefined) {
            const parsedDepartment = parseOptionalString(department);
            if (!parsedDepartment.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department format.",
                });
            }
            updateData.department = parsedDepartment.value;
        }

        if (deadline !== undefined) {
            const parsedDeadline = parseOptionalDate(deadline);
            if (!parsedDeadline.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid deadline date.",
                });
            }
            updateData.deadline = parsedDeadline.value;
        }

        if (isActive !== undefined) {
            const parsedIsActive = parseOptionalBoolean(isActive);
            if (!parsedIsActive.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid position status.",
                });
            }
            updateData.isActive = parsedIsActive.value;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        const updatedPosition = await prisma.position.update({
            where: { id: existingPosition.id },
            data: updateData,
            select: positionSelect,
        });

        return res.status(200).json({
            success: true,
            data: updatedPosition,
        });
    } catch (error) {
        return handleServerError(res, "update", error);
    }
};

const deletePosition = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        if (role !== "RECRUITER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this Position.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        let where = { id };

        if (role === "RECRUITER") {
            where = { id, userId: req.user.id };
        } else if (role === "ADMIN") {
            where = { id };
        }

        const position = await prisma.position.findFirst({
            where,
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        try {
            await prisma.position.delete({
                where: { id: position.id },
            });
        } catch (deleteError) {
            if (
                deleteError instanceof Prisma.PrismaClientKnownRequestError &&
                ["P2003", "P2014"].includes(deleteError.code)
            ) {
                return res.status(409).json({
                    success: false,
                    message: "This Position cannot be deleted because related records still exist.",
                });
            }
            throw deleteError;
        }

        return res.status(200).json({
            success: true,
            message: "Position deleted successfully",
        });
    } catch (error) {
        return handleServerError(res, "delete", error);
    }
};

module.exports = {
    createPosition,
    getPositions,
    getPositionById,
    updatePosition,
    deletePosition,
};