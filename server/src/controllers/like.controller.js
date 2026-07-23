const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createLike = async (req, res) => {
    try {
        const { cvId } = req.body;

        const cv = await prisma.cV.findUnique({
            where: {
                id: cvId,
            },
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: "CV not found",
            });
        }

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_cvId: {
                    userId: req.user.id,
                    cvId,
                },
            },
        });

        if (existingLike) {
            return res.status(409).json({
                success: false,
                message: "CV already liked",
            });
        }

        const like = await prisma.like.create({
            data: {
                userId: req.user.id,
                cvId,
            },
            include: {
                user: true,
                cv: true,
            },
        });

        return res.status(201).json({
            success: true,
            data: like,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getLikes = async (req, res) => {
    try {
        const likes = await prisma.like.findMany({
            include: {
                user: true,
                cv: true,
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
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteLike = async (req, res) => {
    try {
        const like = await prisma.like.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!like) {
            return res.status(404).json({
                success: false,
                message: "Like not found",
            });
        }

        await prisma.like.delete({
            where: {
                id: req.params.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Like removed successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createLike,
    getLikes,
    deleteLike,
};