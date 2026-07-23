const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createDiscussion = async (req, res) => {
    try {
        const { positionId, content } = req.body;

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

        const discussion = await prisma.discussion.create({
            data: {
                content,
                positionId,
                userId: req.user.id,
            },
            include: {
                user: true,
                position: true,
            },
        });

        return res.status(201).json({
            success: true,
            data: discussion,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getDiscussions = async (req, res) => {
    try {
        const discussions = await prisma.discussion.findMany({
            include: {
                user: true,
                position: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: discussions,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getDiscussionById = async (req, res) => {
    try {
        const discussion = await prisma.discussion.findUnique({
            where: {
                id: req.params.id,
            },
            include: {
                user: true,
                position: true,
            },
        });

        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: discussion,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteDiscussion = async (req, res) => {
    try {
        const discussion = await prisma.discussion.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        await prisma.discussion.delete({
            where: {
                id: req.params.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Discussion deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createDiscussion,
    getDiscussions,
    getDiscussionById,
    deleteDiscussion,
};