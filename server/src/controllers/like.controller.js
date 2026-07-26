const { PrismaClient, Prisma } = require("@prisma/client");
const {
    evaluatePositionEligibility,
    loadAndEvaluatePositionEligibility,
} = require("../services/positionEligibility.service");

const prisma = new PrismaClient();

// --- Helpers ---

const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

const isAuthenticated = (req) => {
    return typeof req.user?.id === "string" && req.user.id.trim() !== "";
};

const isRecruiter = (req) => {
    return getRequestRole(req) === "RECRUITER";
};

const getValidId = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

class LikeRequestError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = "LikeRequestError";
        this.statusCode = statusCode;
    }
}

const findVisiblePublishedCV = async (client, cvId) => {
    return client.cV.findFirst({
        where: {
            id: cvId,
            status: "PUBLISHED",
            position: {
                isActive: true,
            },
        },
        select: {
            id: true,
            userId: true,
            positionId: true,
        },
    });
};

// --- Controllers ---

const createLike = async (req, res) => {
    try {
        // 1. Verify authentication
        if (!isAuthenticated(req)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // 2. Verify role
        if (!isRecruiter(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Recruiters can manage CV Likes.",
            });
        }

        // 3. Read and validate cvId from params
        const cvId = getValidId(req.params.cvId);
        if (!cvId) {
            return res.status(400).json({
                success: false,
                message: "CV ID is required.",
            });
        }

        // 4. Transaction: verify visible CV, check eligibility, create like, count likes
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Verify the CV is published, active, and get Candidate ID
                const cv = await findVisiblePublishedCV(tx, cvId);
                if (!cv) {
                    throw new LikeRequestError(404, "CV not found.");
                }

                // Evaluate Candidate's current Position eligibility
                const eligibilityResult = await loadAndEvaluatePositionEligibility(
                    tx,
                    cv.positionId,
                    cv.userId
                );

                if (
                    !eligibilityResult.position ||
                    eligibilityResult.eligibility?.eligible !== true
                ) {
                    throw new LikeRequestError(404, "CV not found.");
                }

                // Attempt to create the like
                await tx.like.create({
                    data: {
                        userId: req.user.id,
                        cvId: cv.id,
                    },
                    select: {
                        id: true,
                    },
                });

                // Count total likes for this CV
                const likesCount = await tx.like.count({
                    where: {
                        cvId: cv.id,
                    },
                });

                return { cvId: cv.id, likesCount };
            });

            return res.status(201).json({
                success: true,
                message: "CV liked successfully.",
                data: {
                    cvId: result.cvId,
                    likedByCurrentUser: true,
                    likesCount: result.likesCount,
                },
            });
        } catch (txError) {
            // Handle duplicate like (P2002 - unique constraint violation)
            if (
                txError instanceof Prisma.PrismaClientKnownRequestError &&
                txError.code === "P2002"
            ) {
                // Revalidate visibility and eligibility before returning current state
                try {
                    const result = await prisma.$transaction(async (tx) => {
                        const cv = await findVisiblePublishedCV(tx, cvId);
                        if (!cv) {
                            throw new LikeRequestError(404, "CV not found.");
                        }

                        const eligibilityResult = await loadAndEvaluatePositionEligibility(
                            tx,
                            cv.positionId,
                            cv.userId
                        );

                        if (
                            !eligibilityResult.position ||
                            eligibilityResult.eligibility?.eligible !== true
                        ) {
                            throw new LikeRequestError(404, "CV not found.");
                        }

                        const likesCount = await tx.like.count({
                            where: {
                                cvId: cv.id,
                            },
                        });

                        return { cvId: cv.id, likesCount };
                    });

                    return res.status(200).json({
                        success: true,
                        message: "CV is already liked.",
                        data: {
                            cvId: result.cvId,
                            likedByCurrentUser: true,
                            likesCount: result.likesCount,
                        },
                    });
                } catch (revalidateError) {
                    if (revalidateError instanceof LikeRequestError) {
                        return res.status(revalidateError.statusCode).json({
                            success: false,
                            message: revalidateError.message,
                        });
                    }
                    throw revalidateError;
                }
            }

            if (txError instanceof LikeRequestError) {
                return res.status(txError.statusCode).json({
                    success: false,
                    message: txError.message,
                });
            }

            throw txError;
        }
    } catch (error) {
        console.error("Like create error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

const getLikes = async (req, res) => {
    try {
        // 1. Verify authentication
        if (!isAuthenticated(req)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // 2. Verify role
        if (!isRecruiter(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Recruiters can view their Liked CVs.",
            });
        }

        // 3. Fetch only the authenticated recruiter's likes for visible CVs with eligibility data
        const likes = await prisma.like.findMany({
            where: {
                userId: req.user.id,
                cv: {
                    status: "PUBLISHED",
                    position: {
                        isActive: true,
                    },
                },
            },
            select: {
                id: true,
                cvId: true,
                createdAt: true,
                cv: {
                    select: {
                        id: true,
                        userId: true,
                        fullName: true,
                        status: true,
                        position: {
                            select: {
                                id: true,
                                title: true,
                                company: true,
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
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // 4. Collect unique Candidate IDs
        const candidateUserIds = [
            ...new Set(
                likes.map((like) => like.cv?.userId).filter(Boolean)
            ),
        ];

        // 5. Collect unique rule attribute IDs across all positions
        const ruleAttributeIds = [
            ...new Set(
                likes.flatMap((like) => {
                    const rules = Array.isArray(like.cv?.position?.accessRules)
                        ? like.cv.position.accessRules
                        : [];
                    return rules.map((rule) => rule.attributeId).filter(Boolean);
                })
            ),
        ];

        // 6. Load all relevant Candidate UserAttributes in one bulk query
        let userAttributes = [];
        if (candidateUserIds.length > 0 && ruleAttributeIds.length > 0) {
            userAttributes = await prisma.userAttribute.findMany({
                where: {
                    userId: {
                        in: candidateUserIds,
                    },
                    attributeId: {
                        in: ruleAttributeIds,
                    },
                },
                select: {
                    userId: true,
                    attributeId: true,
                    value: true,
                },
            });
        }

        // 7. Group UserAttributes by Candidate ID
        const userAttributesByCandidate = new Map();
        for (const ua of userAttributes) {
            const current = userAttributesByCandidate.get(ua.userId) || [];
            current.push({
                attributeId: ua.attributeId,
                value: ua.value,
            });
            userAttributesByCandidate.set(ua.userId, current);
        }

        // 8. Filter Likes by eligibility
        const visibleLikes = likes
            .map((like) => {
                const candidateAttributes = userAttributesByCandidate.get(like.cv.userId) || [];
                const eligibility = evaluatePositionEligibility(
                    like.cv.position,
                    candidateAttributes
                );

                const { accessRules, ...cleanPosition } = like.cv.position;

                return {
                    like: {
                        ...like,
                        cv: {
                            ...like.cv,
                            position: cleanPosition,
                        },
                    },
                    eligible: eligibility.eligible === true,
                };
            })
            .filter((item) => item.eligible)
            .map((item) => item.like);

        return res.status(200).json({
            success: true,
            data: visibleLikes,
        });
    } catch (error) {
        console.error("Like load error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

const deleteLike = async (req, res) => {
    try {
        // 1. Verify authentication
        if (!isAuthenticated(req)) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // 2. Verify role
        if (!isRecruiter(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Recruiters can manage CV Likes.",
            });
        }

        // 3. Read and validate cvId from params
        const cvId = getValidId(req.params.cvId);
        if (!cvId) {
            return res.status(400).json({
                success: false,
                message: "CV ID is required.",
            });
        }

        // 4. Transaction: verify visible CV, check eligibility, delete like, count likes
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Verify the CV is published, active, and get Candidate ID
                const cv = await findVisiblePublishedCV(tx, cvId);
                if (!cv) {
                    throw new LikeRequestError(404, "CV not found.");
                }

                // Evaluate Candidate's current Position eligibility
                const eligibilityResult = await loadAndEvaluatePositionEligibility(
                    tx,
                    cv.positionId,
                    cv.userId
                );

                if (
                    !eligibilityResult.position ||
                    eligibilityResult.eligibility?.eligible !== true
                ) {
                    throw new LikeRequestError(404, "CV not found.");
                }

                // Delete only the authenticated recruiter's like (deleteMany is idempotent)
                const deleted = await tx.like.deleteMany({
                    where: {
                        userId: req.user.id,
                        cvId: cv.id,
                    },
                });

                // Count total likes for this CV
                const likesCount = await tx.like.count({
                    where: {
                        cvId: cv.id,
                    },
                });

                return { deleted, cvId: cv.id, likesCount };
            });

            const wasLiked = result.deleted.count > 0;
            return res.status(200).json({
                success: true,
                message: wasLiked ? "CV unliked successfully." : "CV was not liked.",
                data: {
                    cvId: result.cvId,
                    likedByCurrentUser: false,
                    likesCount: result.likesCount,
                },
            });
        } catch (txError) {
            if (txError instanceof LikeRequestError) {
                return res.status(txError.statusCode).json({
                    success: false,
                    message: txError.message,
                });
            }
            throw txError;
        }
    } catch (error) {
        console.error("Like delete error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

module.exports = {
    createLike,
    getLikes,
    deleteLike,
};