const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createAttribute = async (req, res) => {
    try {
        const { name, category, type } = req.body;

        const existingAttribute = await prisma.attribute.findUnique({
            where: {
                name,
            },
        });

        if (existingAttribute) {
            return res.status(409).json({
                success: false,
                message: "Attribute already exists",
            });
        }

        const attribute = await prisma.attribute.create({
            data: {
                name,
                category,
                type,
            },
        });

        return res.status(201).json({
            success: true,
            data: attribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getAttributes = async (req, res) => {
    try {
        const attributes = await prisma.attribute.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: attributes,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getAttributeById = async (req, res) => {
    try {
        const attribute = await prisma.attribute.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: attribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateAttribute = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, type } = req.body;

        const attribute = await prisma.attribute.findUnique({
            where: {
                id,
            },
        });

        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        const updatedAttribute = await prisma.attribute.update({
            where: {
                id,
            },
            data: {
                name,
                category,
                type,
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedAttribute,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteAttribute = async (req, res) => {
    try {
        const { id } = req.params;

        const attribute = await prisma.attribute.findUnique({
            where: {
                id,
            },
        });

        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        await prisma.attribute.delete({
            where: {
                id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Attribute deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createAttribute,
    getAttributes,
    getAttributeById,
    updateAttribute,
    deleteAttribute,
};