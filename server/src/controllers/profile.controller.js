const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getProfile = async (req, res) => {
    try {
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
                    include: {
                        attribute: true,
                    },
                },

                projects: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },

                cvs: {
                    include: {
                        position: true,
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
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            location,
            profilePhoto,
        } = req.body;

        const updatedProfile = await prisma.user.update({
            where: {
                id: req.user.id,
            },
            data: {
                firstName,
                lastName,
                location,
                profilePhoto,
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedProfile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
};