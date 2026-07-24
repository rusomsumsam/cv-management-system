const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
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

const createProject = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { title, description } = req.body;

        if (!isNonEmptyString(title)) {
            return res.status(400).json({
                success: false,
                message: "Project title is required.",
            });
        }

        const normalizedTitle = title.trim();

        const normalizedDescription = normalizeOptionalString(description);

        if (description !== undefined && normalizedDescription === undefined) {
            return res.status(400).json({
                success: false,
                message: "Invalid project description.",
            });
        }

        const project = await prisma.project.create({
            data: {
                title: normalizedTitle,
                description: normalizedDescription ?? null,
                userId: req.user.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            data: project,
        });
    } catch (error) {
        console.error("Failed to create project:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create project.",
        });
    }
};

const getProjects = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const projects = await prisma.project.findMany({
            where: {
                userId: req.user.id,
            },
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
        });

        return res.status(200).json({
            success: true,
            data: projects,
        });
    } catch (error) {
        console.error("Failed to load projects:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load projects.",
        });
    }
};

const getProjectById = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;

        if (!isNonEmptyString(id)) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const normalizedId = id.trim();

        const project = await prisma.project.findFirst({
            where: {
                id: normalizedId,
                userId: req.user.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
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
        console.error("Failed to load project details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load project details.",
        });
    }
};

const updateProject = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;
        const { title, description } = req.body;

        if (!isNonEmptyString(id)) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const normalizedId = id.trim();

        const existingProject = await prisma.project.findFirst({
            where: {
                id: normalizedId,
                userId: req.user.id,
            },
            select: {
                id: true,
            },
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const updateData = {};

        if (title !== undefined) {
            if (!isNonEmptyString(title)) {
                return res.status(400).json({
                    success: false,
                    message: "Project title cannot be empty.",
                });
            }
            updateData.title = title.trim();
        }

        if (description !== undefined) {
            const normalizedDescription = normalizeOptionalString(description);
            if (normalizedDescription === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project description.",
                });
            }
            updateData.description = normalizedDescription;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        const updatedProject = await prisma.project.update({
            where: {
                id: existingProject.id,
            },
            data: updateData,
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedProject,
        });
    } catch (error) {
        console.error("Failed to update project:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update project.",
        });
    }
};

const deleteProject = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;

        if (!isNonEmptyString(id)) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const normalizedId = id.trim();

        const project = await prisma.project.findFirst({
            where: {
                id: normalizedId,
                userId: req.user.id,
            },
            select: {
                id: true,
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
                id: project.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete project:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete project.",
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