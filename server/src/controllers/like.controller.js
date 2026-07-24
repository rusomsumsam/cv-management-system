const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const isAuthenticated = (req) => {
    return req.user && req.user.id && typeof req.user.id === "string";
};

const isRecruiter = (req) => {
    return req.user && req.user.role === "RECRUITER";
};

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
        const cvId = req.params.cvId;
        if (typeof cvId !== "string" || cvId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "CV ID is required.",
            });
        }

        const trimmedCvId = cvId.trim();

        // 4. Transaction: verify visible CV, create like, count likes
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Verify the CV is published and active
                const cv = await findVisiblePublishedCV(tx, trimmedCvId);
                if (!cv) {
                    throw new Error("CV_NOT_FOUND");
                }

                // Attempt to create the like
                await tx.like.create({
                    data: {
                        userId: req.user.id,
                        cvId: trimmedCvId,
                    },
                    select: {
                        id: true,
                    },
                });

                // Count total likes for this CV
                const likesCount = await tx.like.count({
                    where: {
                        cvId: trimmedCvId,
                    },
                });

                return { likesCount };
            });

            return res.status(201).json({
                success: true,
                message: "CV liked successfully.",
                data: {
                    cvId: trimmedCvId,
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
                // Idempotent: CV is already liked, return current state
                const likesCount = await prisma.like.count({
                    where: {
                        cvId: trimmedCvId,
                    },
                });

                return res.status(200).json({
                    success: true,
                    message: "CV is already liked.",
                    data: {
                        cvId: trimmedCvId,
                        likedByCurrentUser: true,
                        likesCount,
                    },
                });
            }

            // Re-throw known custom errors
            if (txError.message === "CV_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "Published CV not found.",
                });
            }

            throw txError;
        }
    } catch (error) {
        console.error("Failed to create like:", error.message);
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

        // 3. Fetch only the authenticated recruiter's likes for visible CVs
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
                        fullName: true,
                        status: true,
                        position: {
                            select: {
                                id: true,
                                title: true,
                                company: true,
                                isActive: true,
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

        return res.status(200).json({
            success: true,
            data: likes,
        });
    } catch (error) {
        console.error("Failed to get likes:", error.message);
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
        const cvId = req.params.cvId;
        if (typeof cvId !== "string" || cvId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "CV ID is required.",
            });
        }

        const trimmedCvId = cvId.trim();

        // 4. Transaction: verify visible CV, delete like, count likes
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Verify the CV is still published and active (defensive)
                const cv = await findVisiblePublishedCV(tx, trimmedCvId);
                if (!cv) {
                    throw new Error("CV_NOT_FOUND");
                }

                // Delete only the authenticated recruiter's like (deleteMany is idempotent)
                const deleted = await tx.like.deleteMany({
                    where: {
                        userId: req.user.id,
                        cvId: trimmedCvId,
                    },
                });

                // Count total likes for this CV
                const likesCount = await tx.like.count({
                    where: {
                        cvId: trimmedCvId,
                    },
                });

                return { deleted, likesCount };
            });

            // Determine response message based on whether a like was actually removed
            const wasLiked = result.deleted.count > 0;
            return res.status(200).json({
                success: true,
                message: wasLiked ? "CV unliked successfully." : "CV was not liked.",
                data: {
                    cvId: trimmedCvId,
                    likedByCurrentUser: false,
                    likesCount: result.likesCount,
                },
            });
        } catch (txError) {
            if (txError.message === "CV_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "Published CV not found.",
                });
            }
            throw txError;
        }
    } catch (error) {
        console.error("Failed to delete like:", error.message);
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