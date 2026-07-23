const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        const project = await prisma.project.create({
            data: {
                title,
                description,
                userId: req.user.id,
            },
        });

        return res.status(201).json({
            success: true,
            data: project,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                userId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: projects,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getProjectById = async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        const project = await prisma.project.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const updatedProject = await prisma.project.update({
            where: {
                id: req.params.id,
            },
            data: {
                title,
                description,
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedProject,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteProject = async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        await prisma.project.delete({
            where: {
                id: req.params.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
};