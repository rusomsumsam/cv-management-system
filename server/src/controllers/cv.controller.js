const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


const createCV = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            summary,
            skills,
            education,
            experience,
            projects,
            positionId,
        } = req.body;

        const position = await prisma.position.findUnique({
            where: {
                id: positionId,
            },
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found",
            });
        }

        const cv = await prisma.cV.create({
            data: {
                fullName,
                email,
                phone,
                summary,
                skills,
                education,
                experience,
                projects,
                positionId,
                userId: req.user.id,
            },
        });

        return res.status(201).json({
            success: true,
            data: cv,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getCVs = async (req, res) => {
    try {
        const cvs = await prisma.cV.findMany({
            include: {
                position: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: cvs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getCVById = async (req, res) => {
    try {
        const cv = await prisma.cV.findUnique({
            where: {
                id: req.params.id,
            },
            include: {
                position: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: "CV not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: cv,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateCV = async (req, res) => {
    try {
        const cv = await prisma.cV.update({
            where: {
                id: req.params.id,
            },
            data: req.body,
        });

        return res.status(200).json({
            success: true,
            data: cv,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteCV = async (req, res) => {
    try {
        await prisma.cV.delete({
            where: {
                id: req.params.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "CV deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createCV,
    getCVs,
    getCVById,
    updateCV,
    deleteCV,
};