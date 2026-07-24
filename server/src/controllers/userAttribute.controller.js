const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
};

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
};

const isValidDateOnly = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const normalizeUserAttributeValue = (type, value) => {
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
        return { valid: true, value: null };
    }

    const stringValue = String(value).trim();

    switch (type) {
        case "STRING": {
            if (stringValue.includes("\n") || stringValue.includes("\r")) {
                return { valid: false, value: null };
            }
            return { valid: true, value: stringValue };
        }

        case "TEXT":
            return { valid: true, value: stringValue };

        case "NUMERIC": {
            const numericValue = Number(stringValue);
            if (!Number.isFinite(numericValue)) {
                return { valid: false, value: null };
            }
            return { valid: true, value: String(numericValue) };
        }

        case "BOOLEAN": {
            if (value === true || stringValue.toLowerCase() === "true") {
                return { valid: true, value: "true" };
            }
            if (value === false || stringValue.toLowerCase() === "false") {
                return { valid: true, value: "false" };
            }
            return { valid: false, value: null };
        }

        case "DATE": {
            if (!isValidDateOnly(stringValue)) {
                return { valid: false, value: null };
            }
            return { valid: true, value: stringValue };
        }

        case "IMAGE": {
            if (!isValidHttpUrl(stringValue)) {
                return { valid: false, value: null };
            }
            return { valid: true, value: stringValue };
        }

        case "PERIOD":
        case "DROPDOWN":
            return { valid: true, value: stringValue };

        default:
            return { valid: false, value: null };
    }
};

// --- Controllers ---

const createUserAttribute = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { attributeId, value } = req.body;

        if (!isNonEmptyString(attributeId)) {
            return res.status(400).json({
                success: false,
                message: "Attribute ID is required.",
            });
        }

        const attribute = await prisma.attribute.findUnique({
            where: { id: attributeId.trim() },
            select: {
                id: true,
                name: true,
                category: true,
                type: true,
            },
        });

        if (!attribute) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }

        const existingUserAttribute = await prisma.userAttribute.findUnique({
            where: {
                userId_attributeId: {
                    userId: req.user.id,
                    attributeId: attribute.id,
                },
            },
            select: { id: true },
        });

        if (existingUserAttribute) {
            return res.status(409).json({
                success: false,
                message: "Attribute already added",
            });
        }

        const normalizedValue = normalizeUserAttributeValue(attribute.type, value);
        if (!normalizedValue.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid value for this attribute type.",
            });
        }

        const userAttribute = await prisma.userAttribute.create({
            data: {
                userId: req.user.id,
                attributeId: attribute.id,
                value: normalizedValue.value,
            },
            select: {
                id: true,
                value: true,
                createdAt: true,
                updatedAt: true,
                attribute: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        type: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            data: userAttribute,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Attribute already added",
            });
        }

        console.error("Failed to create user attribute:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create user attribute.",
        });
    }
};

const getUserAttributes = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const userAttributes = await prisma.userAttribute.findMany({
            where: {
                userId: req.user.id,
            },
            select: {
                id: true,
                value: true,
                createdAt: true,
                updatedAt: true,
                attribute: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        type: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: userAttributes,
        });
    } catch (error) {
        console.error("Failed to load user attributes:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load user attributes.",
        });
    }
};

const getUserAttributeById = async (req, res) => {
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
                message: "User attribute ID is required.",
            });
        }

        const userAttribute = await prisma.userAttribute.findFirst({
            where: {
                id: id.trim(),
                userId: req.user.id,
            },
            select: {
                id: true,
                value: true,
                createdAt: true,
                updatedAt: true,
                attribute: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        type: true,
                    },
                },
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
        console.error("Failed to load user attribute details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load user attribute details.",
        });
    }
};

const updateUserAttribute = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;
        const { value } = req.body;

        if (!isNonEmptyString(id)) {
            return res.status(400).json({
                success: false,
                message: "User attribute ID is required.",
            });
        }

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        const userAttribute = await prisma.userAttribute.findFirst({
            where: {
                id: id.trim(),
                userId: req.user.id,
            },
            select: {
                id: true,
                attribute: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        type: true,
                    },
                },
            },
        });

        if (!userAttribute) {
            return res.status(404).json({
                success: false,
                message: "User attribute not found",
            });
        }

        const normalizedValue = normalizeUserAttributeValue(userAttribute.attribute.type, value);
        if (!normalizedValue.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid value for this attribute type.",
            });
        }

        const updatedUserAttribute = await prisma.userAttribute.update({
            where: {
                id: userAttribute.id,
            },
            data: {
                value: normalizedValue.value,
            },
            select: {
                id: true,
                value: true,
                createdAt: true,
                updatedAt: true,
                attribute: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        type: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            data: updatedUserAttribute,
        });
    } catch (error) {
        console.error("Failed to update user attribute:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update user attribute.",
        });
    }
};

const deleteUserAttribute = async (req, res) => {
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
                message: "User attribute ID is required.",
            });
        }

        const userAttribute = await prisma.userAttribute.findFirst({
            where: {
                id: id.trim(),
                userId: req.user.id,
            },
            select: {
                id: true,
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
                id: userAttribute.id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "User attribute deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete user attribute:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user attribute.",
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