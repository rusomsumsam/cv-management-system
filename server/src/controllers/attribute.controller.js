const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Constants ---

const ALLOWED_CATEGORIES = [
    "Certification",
    "Domain Knowledge",
    "Personal Information",
    "Soft Skills",
    "Technical Skills",
    "Language Skills",
];

const ALLOWED_TYPES = [
    "STRING",
    "TEXT",
    "IMAGE",
    "NUMERIC",
    "DATE",
    "PERIOD",
    "BOOLEAN",
    "DROPDOWN",
];

// --- Helpers ---

const normalizeType = (value) => {
    if (typeof value !== "string") return undefined;
    return value.trim().toUpperCase();
};

const normalizeString = (value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
};

// --- Controllers ---

const createAttribute = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { name, category, type } = req.body;

        const normalizedName = normalizeString(name);
        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                message: "Attribute name is required.",
            });
        }

        const normalizedCategory = normalizeString(category);
        if (!normalizedCategory || !ALLOWED_CATEGORIES.includes(normalizedCategory)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attribute category.",
            });
        }

        const normalizedType = normalizeType(type);
        if (!normalizedType || !ALLOWED_TYPES.includes(normalizedType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attribute type.",
            });
        }

        // Case-insensitive duplicate check
        const existingAttribute = await prisma.attribute.findFirst({
            where: {
                name: {
                    equals: normalizedName,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
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
                name: normalizedName,
                category: normalizedCategory,
                type: normalizedType,
            },
            select: {
                id: true,
                name: true,
                category: true,
                type: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            data: attribute,
        });
    } catch (error) {
        // Handle Prisma unique constraint violation (race condition)
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                success: false,
                message: "Attribute already exists",
            });
        }

        console.error("Failed to create attribute:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create attribute.",
        });
    }
};

const getAttributes = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const attributes = await prisma.attribute.findMany({
            select: {
                id: true,
                name: true,
                category: true,
                type: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: attributes,
        });
    } catch (error) {
        console.error("Failed to load attributes:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load attributes.",
        });
    }
};

const getAttributeById = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;

        if (!id || typeof id !== "string" || !id.trim()) {
            return res.status(400).json({
                success: false,
                message: "Attribute ID is required.",
            });
        }

        const attribute = await prisma.attribute.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                category: true,
                type: true,
                createdAt: true,
                updatedAt: true,
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
        console.error("Failed to load attribute details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load attribute details.",
        });
    }
};

const updateAttribute = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;
        const { name, category, type } = req.body;

        // Validate ID
        if (!id || typeof id !== "string" || !id.trim()) {
            return res.status(400).json({
                success: false,
                message: "Attribute ID is required.",
            });
        }

        // Find existing attribute
        const existingAttribute = await prisma.attribute.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                category: true,
                type: true,
            },
        });

        if (!existingAttribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        const updateData = {};

        // Update name
        if (name !== undefined) {
            const normalizedName = normalizeString(name);
            if (!normalizedName) {
                return res.status(400).json({
                    success: false,
                    message: "Attribute name cannot be empty.",
                });
            }

            // Case-insensitive duplicate check (excluding current attribute)
            const duplicateAttribute = await prisma.attribute.findFirst({
                where: {
                    name: {
                        equals: normalizedName,
                        mode: "insensitive",
                    },
                    NOT: {
                        id,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (duplicateAttribute) {
                return res.status(409).json({
                    success: false,
                    message: "Attribute already exists",
                });
            }

            updateData.name = normalizedName;
        }

        // Update category
        if (category !== undefined) {
            const normalizedCategory = normalizeString(category);
            if (!normalizedCategory || !ALLOWED_CATEGORIES.includes(normalizedCategory)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attribute category.",
                });
            }
            updateData.category = normalizedCategory;
        }

        // Update type
        if (type !== undefined) {
            const normalizedType = normalizeType(type);
            if (!normalizedType || !ALLOWED_TYPES.includes(normalizedType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attribute type.",
                });
            }

            // If type is actually changing, check if attribute is in use
            if (normalizedType !== existingAttribute.type) {
                const usedAttribute = await prisma.attribute.findFirst({
                    where: {
                        id,
                        OR: [
                            {
                                userAttributes: {
                                    some: {},
                                },
                            },
                            {
                                positionAttributes: {
                                    some: {},
                                },
                            },
                        ],
                    },
                    select: {
                        id: true,
                    },
                });

                if (usedAttribute) {
                    return res.status(409).json({
                        success: false,
                        message: "The type of an attribute already in use cannot be changed.",
                    });
                }
            }

            updateData.type = normalizedType;
        }

        // Empty update check
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        const updatedAttribute = await prisma.attribute.update({
            where: {
                id,
            },
            data: updateData,
            select: {
                id: true,
                name: true,
                category: true,
                type: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedAttribute,
        });
    } catch (error) {
        // Handle Prisma unique constraint violation (race condition)
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                success: false,
                message: "Attribute already exists",
            });
        }

        console.error("Failed to update attribute:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update attribute.",
        });
    }
};

const deleteAttribute = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;

        if (!id || typeof id !== "string" || !id.trim()) {
            return res.status(400).json({
                success: false,
                message: "Attribute ID is required.",
            });
        }

        // Check existence
        const attribute = await prisma.attribute.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        try {
            await prisma.attribute.delete({
                where: {
                    id,
                },
            });
        } catch (deleteError) {
            // Handle Prisma foreign-key / relation constraint errors
            if (
                deleteError instanceof Prisma.PrismaClientKnownRequestError &&
                ["P2003", "P2014"].includes(deleteError.code)
            ) {
                return res.status(409).json({
                    success: false,
                    message: "This attribute is in use and cannot be deleted.",
                });
            }
            throw deleteError;
        }

        return res.status(200).json({
            success: true,
            message: "Attribute deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete attribute:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete attribute.",
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