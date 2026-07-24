const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
};

const normalizeOptionalString = (value) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const normalizedValue = value.trim();
    return normalizedValue || null;
};

// --- Controllers ---

const getProfile = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const profile = await prisma.user.findUnique({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                location: true,
                role: true,

                userAttributes: {
                    select: {
                        id: true,
                        value: true,
                        createdAt: true,
                        updatedAt: true,
                        attribute: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                                type: true,
                            },
                        },
                    },
                    orderBy: {
                        updatedAt: "desc",
                    },
                },

                projects: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },

                cvs: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        position: {
                            select: {
                                id: true,
                                title: true,
                                company: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },

                createdAt: true,
                updatedAt: true,
            },
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error("Failed to load profile:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load profile.",
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { firstName, lastName, location, profilePhoto } = req.body;

        const updateData = {};

        if (firstName !== undefined) {
            if (typeof firstName !== "string" || !firstName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "First name cannot be empty.",
                });
            }
            updateData.firstName = firstName.trim();
        }

        if (lastName !== undefined) {
            if (typeof lastName !== "string" || !lastName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Last name cannot be empty.",
                });
            }
            updateData.lastName = lastName.trim();
        }

        if (location !== undefined) {
            const normalizedLocation = normalizeOptionalString(location);
            if (normalizedLocation === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid location format.",
                });
            }
            updateData.location = normalizedLocation;
        }

        if (profilePhoto !== undefined) {
            const normalizedProfilePhoto = normalizeOptionalString(profilePhoto);
            if (normalizedProfilePhoto === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid profile photo URL.",
                });
            }

            if (normalizedProfilePhoto !== null && !isValidHttpUrl(normalizedProfilePhoto)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid profile photo URL.",
                });
            }

            updateData.profilePhoto = normalizedProfilePhoto;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        const updatedProfile = await prisma.user.update({
            where: {
                id: req.user.id,
            },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                location: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedProfile,
        });
    } catch (error) {
        console.error("Failed to update profile:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
};