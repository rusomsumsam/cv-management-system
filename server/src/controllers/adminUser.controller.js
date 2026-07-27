// server/src/controllers/adminUser.controller.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getRequestBody = (req) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return {};
    }
    return req.body;
};

const handleServerError = (res, operation, error) => {
    console.error(`Admin user ${operation} error:`, error.message);
    return res.status(500).json({
        success: false,
        message: "User management service is temporarily unavailable. Please try again.",
    });
};

const parsePositiveInteger = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    const str = String(value).trim();
    if (!/^[1-9]\d*$/.test(str)) {
        return null;
    }
    const num = Number(str);
    if (!Number.isSafeInteger(num)) {
        return null;
    }
    return num;
};

const validateUserIds = (userIds) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        return {
            valid: false,
            message: "Please select at least one valid user.",
        };
    }

    if (userIds.length > 100) {
        return {
            valid: false,
            message: "You can manage a maximum of 100 users at a time.",
        };
    }

    const trimmedIds = [];

    for (const userId of userIds) {
        if (typeof userId !== "string" || !userId.trim()) {
            return {
                valid: false,
                message: "Please select at least one valid user.",
            };
        }
        trimmedIds.push(userId.trim());
    }

    const uniqueIds = [...new Set(trimmedIds)];

    if (uniqueIds.length === 0) {
        return {
            valid: false,
            message: "Please select at least one valid user.",
        };
    }

    return {
        valid: true,
        ids: uniqueIds,
    };
};

const getUsers = async (req, res) => {
    try {
        const { search, role, status = "ALL", page = "1", limit = "10" } = req.query;

        // Validate page
        const pageNum = parsePositiveInteger(page);
        if (pageNum === null) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer.",
            });
        }

        // Validate limit
        const limitNum = parsePositiveInteger(limit);
        if (limitNum === null) {
            return res.status(400).json({
                success: false,
                message: "Limit must be a positive integer.",
            });
        }
        if (limitNum > 50) {
            return res.status(400).json({
                success: false,
                message: "Limit cannot exceed 50.",
            });
        }

        const skip = (pageNum - 1) * limitNum;
        const take = limitNum;

        // Build where clause
        const where = {};

        // Role filter
        if (role !== undefined && role !== null && role !== "") {
            if (typeof role !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid user role.",
                });
            }
            const normalizedRole = role.trim().toUpperCase();
            if (!["CANDIDATE", "RECRUITER", "ADMIN"].includes(normalizedRole)) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid user role.",
                });
            }
            where.role = normalizedRole;
        }

        // Status filter
        if (status !== undefined && status !== null && status !== "") {
            if (typeof status !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid user status.",
                });
            }
            const normalizedStatus = status.trim().toUpperCase();
            if (!["ACTIVE", "BLOCKED", "ALL"].includes(normalizedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid user status.",
                });
            }
            if (normalizedStatus === "ACTIVE") {
                where.isBlocked = false;
            } else if (normalizedStatus === "BLOCKED") {
                where.isBlocked = true;
            }
            // ALL: no isBlocked condition
        }

        // Search filter
        if (search !== undefined && search !== null && search !== "") {
            if (typeof search !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Search term cannot exceed 100 characters.",
                });
            }
            const trimmedSearch = search.trim();
            if (trimmedSearch.length > 0) {
                if (trimmedSearch.length > 100) {
                    return res.status(400).json({
                        success: false,
                        message: "Search term cannot exceed 100 characters.",
                    });
                }
                where.OR = [
                    {
                        firstName: {
                            contains: trimmedSearch,
                            mode: "insensitive",
                        },
                    },
                    {
                        lastName: {
                            contains: trimmedSearch,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: trimmedSearch,
                            mode: "insensitive",
                        },
                    },
                ];
            }
        }

        // Execute transaction
        const [users, totalItems] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profilePhoto: true,
                    location: true,
                    role: true,
                    isBlocked: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            projects: true,
                            cvs: true,
                            positions: true,
                        },
                    },
                },
                orderBy: [
                    {
                        createdAt: "desc",
                    },
                    {
                        id: "asc",
                    },
                ],
                skip,
                take,
            }),
            prisma.user.count({
                where,
            }),
        ]);

        const totalPages = Math.ceil(totalItems / limitNum);

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    totalItems,
                    totalPages,
                },
            },
        });
    } catch (error) {
        return handleServerError(res, "list", error);
    }
};

const updateUserRoles = async (req, res) => {
    try {
        const body = getRequestBody(req);
        const { userIds, role } = body;

        // Validate userIds
        const idsValidation = validateUserIds(userIds);
        if (!idsValidation.valid) {
            return res.status(400).json({
                success: false,
                message: idsValidation.message,
            });
        }

        // Validate role
        if (typeof role !== "string" || !role.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid user role.",
            });
        }
        const normalizedRole = role.trim().toUpperCase();
        if (!["CANDIDATE", "RECRUITER", "ADMIN"].includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid user role.",
            });
        }

        // Update roles
        const result = await prisma.user.updateMany({
            where: {
                id: {
                    in: idsValidation.ids,
                },
            },
            data: {
                role: normalizedRole,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching users were found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User roles updated successfully.",
            data: {
                updatedCount: result.count,
            },
        });
    } catch (error) {
        return handleServerError(res, "role update", error);
    }
};

const updateUserBlockStatus = async (req, res) => {
    try {
        const body = getRequestBody(req);
        const { userIds, isBlocked } = body;

        // Validate userIds
        const idsValidation = validateUserIds(userIds);
        if (!idsValidation.valid) {
            return res.status(400).json({
                success: false,
                message: idsValidation.message,
            });
        }

        // Validate isBlocked
        if (typeof isBlocked !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid block status.",
            });
        }

        // Update block status
        const result = await prisma.user.updateMany({
            where: {
                id: {
                    in: idsValidation.ids,
                },
            },
            data: {
                isBlocked,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching users were found.",
            });
        }

        const message = isBlocked ? "Users blocked successfully." : "Users unblocked successfully.";

        return res.status(200).json({
            success: true,
            message,
            data: {
                updatedCount: result.count,
            },
        });
    } catch (error) {
        return handleServerError(res, "block status update", error);
    }
};

const deleteUsers = async (req, res) => {
    try {
        const body = getRequestBody(req);
        const { userIds } = body;

        // Validate userIds
        const idsValidation = validateUserIds(userIds);
        if (!idsValidation.valid) {
            return res.status(400).json({
                success: false,
                message: idsValidation.message,
            });
        }

        // Delete users
        const result = await prisma.user.deleteMany({
            where: {
                id: {
                    in: idsValidation.ids,
                },
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching users were found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Users deleted successfully.",
            data: {
                deletedCount: result.count,
            },
        });
    } catch (error) {
        return handleServerError(res, "delete", error);
    }
};

module.exports = {
    getUsers,
    updateUserRoles,
    updateUserBlockStatus,
    deleteUsers,
};