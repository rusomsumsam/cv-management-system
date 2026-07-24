const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const parseOptionalDate = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }

    if (value === null || value === "") {
        return { valid: true, value: null };
    }

    if (typeof value !== "string") {
        return { valid: false, value: undefined };
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return { valid: true, value: null };
    }

    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

    const parsedDate = dateOnlyPattern.test(normalizedValue)
        ? new Date(`${normalizedValue}T00:00:00.000Z`)
        : new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) {
        return { valid: false, value: undefined };
    }

    return { valid: true, value: parsedDate };
};

const parseOptionalBoolean = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }

    if (value === true || value === "true") {
        return { valid: true, value: true };
    }

    if (value === false || value === "false") {
        return { valid: true, value: false };
    }

    return { valid: false, value: undefined };
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

        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Position title is required.",
            });
        }

        if (!company || typeof company !== "string" || !company.trim()) {
            return res.status(400).json({
                success: false,
                message: "Company name is required.",
            });
        }

        const parsedDeadline = parseOptionalDate(deadline);
        if (!parsedDeadline.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid deadline date.",
            });
        }

        const position = await prisma.position.create({
            data: {
                title: title.trim(),
                description: normalizeOptionalString(description),
                company: company.trim(),
                location: normalizeOptionalString(location),
                department: normalizeOptionalString(department),
                deadline: parsedDeadline.value ?? null,
                userId: req.user.id,
            },
        });

        return res.status(201).json({
            success: true,
            data: position,
        });
    } catch (error) {
        console.error("Failed to create position:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create position.",
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
        console.error("Failed to load positions:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load positions.",
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
        console.error("Failed to load position details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load position details.",
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

        const updateData = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Position title cannot be empty.",
                });
            }
            updateData.title = title.trim();
        }

        if (company !== undefined) {
            if (typeof company !== "string" || !company.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Company name cannot be empty.",
                });
            }
            updateData.company = company.trim();
        }

        if (description !== undefined) {
            const normalizedDescription = normalizeOptionalString(description);
            if (normalizedDescription === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid description format.",
                });
            }
            updateData.description = normalizedDescription;
        }

        if (location !== undefined) {
            const normalizedLocation = normalizeOptionalString(location);
            if (normalizedLocation === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid location format.",
                });
            }
            updateData.location = normalizedLocation;
        }

        if (department !== undefined) {
            const normalizedDepartment = normalizeOptionalString(department);
            if (normalizedDepartment === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department format.",
                });
            }
            updateData.department = normalizedDepartment;
        }

        if (deadline !== undefined) {
            const parsedDeadline = parseOptionalDate(deadline);
            if (!parsedDeadline.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid deadline date.",
                });
            }
            updateData.deadline = parsedDeadline.value;
        }

        if (isActive !== undefined) {
            const parsedIsActive = parseOptionalBoolean(isActive);
            if (!parsedIsActive.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid position status.",
                });
            }
            updateData.isActive = parsedIsActive.value;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        const updatedPosition = await prisma.position.update({
            where: { id },
            data: updateData,
        });

        return res.status(200).json({
            success: true,
            data: updatedPosition,
        });
    } catch (error) {
        console.error("Failed to update position:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update position.",
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
        console.error("Failed to delete position:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete position.",
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