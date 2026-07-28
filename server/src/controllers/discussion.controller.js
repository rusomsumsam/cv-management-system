// server/src/controllers/discussion.controller.js
const { PrismaClient } = require("@prisma/client");
const {
    evaluatePositionEligibility,
    loadAndEvaluatePositionEligibility,
} = require("../services/positionEligibility.service");

const prisma = new PrismaClient();

// --- Helpers ---

const getRequestRole = (req) =>
    req.user?.role?.toUpperCase() || "";

const isSupportedRole = (role) =>
    ["CANDIDATE", "RECRUITER", "ADMIN"].includes(role);

const getValidId = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

const normalizeContent = (content) => {
    if (typeof content !== "string") {
        return null;
    }
    return content.trim();
};

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

const discussionSafeSelect = {
    id: true,
    content: true,
    userId: true,
    positionId: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
        },
    },
    position: {
        select: {
            id: true,
            title: true,
            description: true,
            company: true,
            location: true,
            department: true,
            isActive: true,
        },
    },
};

// Position eligibility select for getDiscussions evaluation
const positionEligibilitySelect = {
    id: true,
    title: true,
    description: true,
    company: true,
    location: true,
    department: true,
    isActive: true,
    accessType: true,
    accessRuleLogic: true,
    accessRules: {
        select: {
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
        },
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

// --- Controllers ---

const createDiscussion = async (req, res) => {
    try {
        // Authentication check
        if (!req.user?.id || typeof req.user.id !== "string" || req.user.id.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);

        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action.",
            });
        }

        if (role !== "CANDIDATE") {
            return res.status(403).json({
                success: false,
                message: "Only Candidates can create discussions.",
            });
        }

        const body = getRequestBody(req);
        const { positionId, content } = body;

        if (typeof positionId !== "string" || positionId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Position is required.",
            });
        }

        const normalizedPositionId = positionId.trim();

        // Validate content
        const normalizedContent = normalizeContent(content);
        if (normalizedContent === null || normalizedContent === "") {
            return res.status(400).json({
                success: false,
                message: "Discussion content is required.",
            });
        }

        if (normalizedContent.length < 5) {
            return res.status(400).json({
                success: false,
                message: "Discussion content must be at least 5 characters.",
            });
        }

        if (normalizedContent.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Discussion content must not exceed 2000 characters.",
            });
        }

        // Evaluate Position eligibility
        const eligibilityResult = await loadAndEvaluatePositionEligibility(
            prisma,
            normalizedPositionId,
            req.user.id
        );

        if (
            !eligibilityResult.position ||
            eligibilityResult.eligibility?.eligible !== true
        ) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        const discussion = await prisma.discussion.create({
            data: {
                content: normalizedContent,
                positionId: normalizedPositionId,
                userId: req.user.id,
            },
            select: discussionSafeSelect,
        });

        return res.status(201).json({
            success: true,
            data: discussion,
        });
    } catch (error) {
        console.error("Discussion create error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create discussion. Please try again.",
        });
    }
};

const getDiscussions = async (req, res) => {
    try {
        if (!req.user?.id || typeof req.user.id !== "string" || req.user.id.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);

        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action.",
            });
        }

        // Candidate branch: eligibility-aware filtering
        if (role === "CANDIDATE") {
            // 1. Load Discussions for active Positions with eligibility data
            const discussions = await prisma.discussion.findMany({
                where: {
                    position: {
                        isActive: true,
                    },
                },
                select: {
                    ...discussionSafeSelect,
                    position: {
                        select: positionEligibilitySelect,
                    },
                },
                orderBy: [
                    { createdAt: "desc" },
                    { id: "desc" },
                ],
            });

            // 2. Collect unique rule attribute IDs across all positions
            const ruleAttributeIds = [
                ...new Set(
                    discussions.flatMap((d) => {
                        const rules = Array.isArray(d.position?.accessRules)
                            ? d.position.accessRules
                            : [];
                        return rules.map((rule) => rule.attributeId).filter(Boolean);
                    })
                ),
            ];

            // 3. Load Candidate's relevant UserAttributes in one query
            let candidateUserAttributes = [];
            if (ruleAttributeIds.length > 0) {
                candidateUserAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: ruleAttributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                        value: true,
                    },
                });
            }

            // 4. Evaluate each Position in memory and filter eligible Discussions
            const visibleDiscussions = discussions
                .map((discussion) => {
                    const eligibility = evaluatePositionEligibility(
                        discussion.position,
                        candidateUserAttributes
                    );
                    const {
                        accessRules,
                        accessType,
                        accessRuleLogic,
                        ...cleanPosition
                    } = discussion.position;
                    return {
                        ...discussion,
                        position: cleanPosition,
                        eligible: eligibility.eligible,
                        canDelete: discussion.userId === req.user.id,
                    };
                })
                .filter((item) => item.eligible)
                .map(({ eligible, ...discussion }) => discussion);

            return res.status(200).json({
                success: true,
                data: visibleDiscussions,
            });
        }

        // Recruiter and Admin branches: no Candidate eligibility filtering
        const discussions = await prisma.discussion.findMany({
            where: {
                position: {
                    isActive: true,
                },
            },
            select: discussionSafeSelect,
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
        });

        const discussionsWithDeleteFlag = discussions.map((discussion) => ({
            ...discussion,
            canDelete: discussion.userId === req.user.id || role === "ADMIN",
        }));

        return res.status(200).json({
            success: true,
            data: discussionsWithDeleteFlag,
        });
    } catch (error) {
        console.error("Discussion list error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load discussions. Please try again.",
        });
    }
};

const getDiscussionById = async (req, res) => {
    try {
        if (!req.user?.id || typeof req.user.id !== "string" || req.user.id.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);

        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Discussion ID is required.",
            });
        }

        // Candidate branch: eligibility-aware detail view
        if (role === "CANDIDATE") {
            const discussion = await prisma.discussion.findFirst({
                where: {
                    id,
                    position: {
                        isActive: true,
                    },
                },
                select: {
                    ...discussionSafeSelect,
                    positionId: true,
                    position: {
                        select: positionEligibilitySelect,
                    },
                },
            });

            if (!discussion) {
                return res.status(404).json({
                    success: false,
                    message: "Discussion not found.",
                });
            }

            const eligibilityResult = await loadAndEvaluatePositionEligibility(
                prisma,
                discussion.positionId,
                req.user.id
            );

            if (
                !eligibilityResult.position ||
                eligibilityResult.eligibility?.eligible !== true
            ) {
                return res.status(404).json({
                    success: false,
                    message: "Discussion not found.",
                });
            }

            const {
                accessRules,
                accessType,
                accessRuleLogic,
                ...cleanPosition
            } = discussion.position;

            return res.status(200).json({
                success: true,
                data: {
                    ...discussion,
                    position: cleanPosition,
                    canDelete: discussion.userId === req.user.id,
                },
            });
        }

        // Recruiter and Admin branches: no Candidate eligibility filtering
        const discussion = await prisma.discussion.findFirst({
            where: {
                id,
                position: {
                    isActive: true,
                },
            },
            select: discussionSafeSelect,
        });

        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                ...discussion,
                canDelete: discussion.userId === req.user.id || role === "ADMIN",
            },
        });
    } catch (error) {
        console.error("Discussion detail error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load discussion details. Please try again.",
        });
    }
};

const deleteDiscussion = async (req, res) => {
    try {
        if (!req.user?.id || typeof req.user.id !== "string" || req.user.id.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);

        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Discussion ID is required.",
            });
        }

        // Role-aware authorization
        let where = { id };
        if (role !== "ADMIN") {
            where = {
                id,
                userId: req.user.id,
            };
        }

        const discussion = await prisma.discussion.findFirst({
            where,
            select: {
                id: true,
                userId: true,
            },
        });

        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found.",
            });
        }

        await prisma.discussion.delete({
            where: {
                id: discussion.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Discussion deleted successfully.",
        });
    } catch (error) {
        console.error("Discussion delete error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete discussion. Please try again.",
        });
    }
};

module.exports = {
    createDiscussion,
    getDiscussions,
    getDiscussionById,
    deleteDiscussion,
};