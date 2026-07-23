const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createPosition = async (req, res) => {
    try {
        const {
            title,
            description,
            company,
            location,
            department,
            deadline,
        } = req.body;

        const position = await prisma.position.create({
            data: {
                title,
                description,
                company,
                location,
                department,
                deadline,
                userId: req.user.id,
            },
        });

        return res.status(201).json({
            success: true,
            data: position,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getPositions = async (req, res) => {
    try {
        const positions = await prisma.position.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: positions,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getPositionById = async (req, res) => {
    try {
        const position = await prisma.position.findUnique({
            where: {
                id: req.params.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: position,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updatePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            description,
            company,
            location,
            department,
            deadline,
            isActive,
        } = req.body;

        const existingPosition = await prisma.position.findUnique({
            where: { id },
        });

        if (!existingPosition) {
            return res.status(404).json({
                success: false,
                message: "Position not found",
            });
        }

        const updatedPosition = await prisma.position.update({
            where: { id },
            data: {
                title,
                description,
                company,
                location,
                department,
                deadline,
                isActive,
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedPosition,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const position = await prisma.position.findUnique({
            where: { id },
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found",
            });
        }

        await prisma.position.delete({
            where: { id },
        });

        return res.status(200).json({
            success: true,
            message: "Position deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createPosition,
    getPositions,
    getPositionById,
    updatePosition,
    deletePosition,
};