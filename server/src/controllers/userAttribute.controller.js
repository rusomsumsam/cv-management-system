const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createUserAttribute = async (req, res) => {
    try {
        const { attributeId, value } = req.body;

        const attribute = await prisma.attribute.findUnique({
            where: {
                id: attributeId,
            },
        });

        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        const existingUserAttribute =
            await prisma.userAttribute.findUnique({
                where: {
                    userId_attributeId: {
                        userId: req.user.id,
                        attributeId,
                    },
                },
            });

        if (existingUserAttribute) {
            return res.status(409).json({
                success: false,
                message: "Attribute already added",
            });
        }

        const userAttribute = await prisma.userAttribute.create({
            data: {
                userId: req.user.id,
                attributeId,
                value,
            },
        });

        return res.status(201).json({
            success: true,
            data: userAttribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getUserAttributes = async (req, res) => {
    try {
        const userAttributes = await prisma.userAttribute.findMany({
            where: {
                userId: req.user.id,
            },
            include: {
                attribute: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: userAttributes,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getUserAttributeById = async (req, res) => {
    try {
        const userAttribute = await prisma.userAttribute.findUnique({
            where: {
                id: req.params.id,
            },
            include: {
                attribute: true,
            },
        });

        if (!userAttribute) {
            return res.status(404).json({
                success: false,
                message: "User attribute not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: userAttribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateUserAttribute = async (req, res) => {
    try {
        const { value } = req.body;

        const userAttribute = await prisma.userAttribute.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!userAttribute) {
            return res.status(404).json({
                success: false,
                message: "User attribute not found",
            });
        }

        const updatedUserAttribute =
            await prisma.userAttribute.update({
                where: {
                    id: req.params.id,
                },
                data: {
                    value,
                },
            });

        return res.status(200).json({
            success: true,
            data: updatedUserAttribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteUserAttribute = async (req, res) => {
    try {
        const userAttribute = await prisma.userAttribute.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!userAttribute) {
            return res.status(404).json({
                success: false,
                message: "User attribute not found",
            });
        }

        await prisma.userAttribute.delete({
            where: {
                id: req.params.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "User attribute deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createUserAttribute,
    getUserAttributes,
    getUserAttributeById,
    updateUserAttribute,
    deleteUserAttribute,
};