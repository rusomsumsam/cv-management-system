const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createPositionAttribute = async (req, res) => {
    try {
        const { positionId, attributeId } = req.body;

        const position = await prisma.position.findUnique({
            where: { id: positionId },
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found",
            });
        }

        const attribute = await prisma.attribute.findUnique({
            where: { id: attributeId },
        });

        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        const existing = await prisma.positionAttribute.findFirst({
            where: {
                positionId,
                attributeId,
            },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Attribute already attached to this position",
            });
        }

        const positionAttribute =
            await prisma.positionAttribute.create({
                data: {
                    positionId,
                    attributeId,
                },
            });

        return res.status(201).json({
            success: true,
            data: positionAttribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getPositionAttributes = async (req, res) => {
    try {
        const positionAttributes =
            await prisma.positionAttribute.findMany({
                include: {
                    position: true,
                    attribute: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        return res.status(200).json({
            success: true,
            data: positionAttributes,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getPositionAttributeById = async (req, res) => {
    try {
        const positionAttribute =
            await prisma.positionAttribute.findUnique({
                where: {
                    id: req.params.id,
                },
                include: {
                    position: true,
                    attribute: true,
                },
            });

        if (!positionAttribute) {
            return res.status(404).json({
                success: false,
                message: "Position attribute not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: positionAttribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deletePositionAttribute = async (req, res) => {
    try {
        const positionAttribute =
            await prisma.positionAttribute.findUnique({
                where: {
                    id: req.params.id,
                },
            });

        if (!positionAttribute) {
            return res.status(404).json({
                success: false,
                message: "Position attribute not found",
            });
        }

        await prisma.positionAttribute.delete({
            where: {
                id: req.params.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Position attribute deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createPositionAttribute,
    getPositionAttributes,
    getPositionAttributeById,
    deletePositionAttribute,
};