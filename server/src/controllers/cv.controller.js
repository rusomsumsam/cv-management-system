const { Prisma, PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get authenticated role safely
 */
const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

/**
 * Check if role is supported
 */
const isSupportedRole = (role) =>
    ["CANDIDATE", "RECRUITER", "ADMIN"].includes(role);

/**
 * Normalize optional string field
 */
const normalizeOptionalString = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue || null;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate and normalize ID parameter
 */
const getValidId = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

/**
 * Handle server errors safely
 */
const handleServerError = (res, operation, error) => {
    console.error(`CV ${operation} error:`, error);
    return res.status(500).json({
        success: false,
        message: `Failed to ${operation} CV. Please try again.`,
    });
};

/**
 * Shared selection for CV list items
 */
const cvListSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    status: true,
    userId: true,
    positionId: true,
    createdAt: true,
    updatedAt: true,
    position: {
        select: {
            id: true,
            title: true,
            company: true,
            location: true,
            department: true,
            isActive: true,
        },
    },
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
        },
    },
    _count: {
        select: {
            likes: true,
        },
    },
};

/**
 * Shared selection for CV details (without positionAttributes)
 */
const cvDetailSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    status: true,
    userId: true,
    positionId: true,
    createdAt: true,
    updatedAt: true,
    position: {
        select: {
            id: true,
            title: true,
            description: true,
            company: true,
            location: true,
            department: true,
            deadline: true,
            isActive: true,
        },
    },
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
            location: true,
        },
    },
    _count: {
        select: {
            likes: true,
        },
    },
};

/**
 * Expanded selection for CV details with PositionAttributes
 */
const cvDetailWithPositionAttributesSelect = {
    ...cvDetailSelect,
    position: {
        select: {
            ...cvDetailSelect.position.select,
            positionAttributes: {
                select: {
                    id: true,
                    attributeId: true,
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
                    createdAt: "asc",
                },
            },
        },
    },
};

/**
 * Controlled application error for expected transaction failures
 */
class CVRequestError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = "CVRequestError";
        this.statusCode = statusCode;
    }
}

/**
 * Create a new CV
 */
const createCV = async (req, res) => {
    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    if (role === "RECRUITER") {
        return res.status(403).json({
            success: false,
            message: "Recruiters cannot create candidate CVs.",
        });
    }

    const body =
        req.body && typeof req.body === "object" && !Array.isArray(req.body)
            ? req.body
            : {};

    const { fullName, email, positionId, phone, summary, skills, education, experience, projects } = body;

    // Required fields validation
    if (typeof fullName !== "string" || fullName.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Full name is required.",
        });
    }

    if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Email is required.",
        });
    }

    if (!isValidEmail(email.trim())) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email address.",
        });
    }

    if (typeof positionId !== "string" || positionId.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Position is required.",
        });
    }

    // Normalize all values once
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPositionId = positionId.trim();
    const normalizedPhone = normalizeOptionalString(phone);
    const normalizedSummary = normalizeOptionalString(summary);
    const normalizedSkills = normalizeOptionalString(skills);
    const normalizedEducation = normalizeOptionalString(education);
    const normalizedExperience = normalizeOptionalString(experience);
    const normalizedProjects = normalizeOptionalString(projects);

    try {
        // Use one interactive transaction for all database operations
        const newCV = await prisma.$transaction(async (tx) => {
            // 1. Load the Position and its PositionAttribute relations
            const position = await tx.position.findUnique({
                where: { id: normalizedPositionId },
                select: {
                    id: true,
                    isActive: true,
                    positionAttributes: {
                        select: {
                            attributeId: true,
                        },
                    },
                },
            });

            if (!position) {
                throw new CVRequestError(404, "Position not found.");
            }

            if (role === "CANDIDATE" && !position.isActive) {
                throw new CVRequestError(
                    403,
                    "This position is not available for CV creation."
                );
            }

            // 2. Check for duplicate CV using the compound unique selector
            const existingCV = await tx.cV.findUnique({
                where: {
                    userId_positionId: {
                        userId: req.user.id,
                        positionId: normalizedPositionId,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (existingCV) {
                throw new CVRequestError(
                    409,
                    "A CV already exists for this position."
                );
            }

            // 3. Determine which Position Attributes are missing from the user's profile
            const positionAttributeIds = position.positionAttributes.map(
                (item) => item.attributeId
            );

            let missingAttributeIds = [];

            if (positionAttributeIds.length > 0) {
                const existingUserAttributes = await tx.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: positionAttributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                    },
                });

                const existingAttributeIds = new Set(
                    existingUserAttributes.map((item) => item.attributeId)
                );

                missingAttributeIds = positionAttributeIds.filter(
                    (attributeId) => !existingAttributeIds.has(attributeId)
                );
            }

            // 4. Create missing UserAttribute records with value null
            if (missingAttributeIds.length > 0) {
                await tx.userAttribute.createMany({
                    data: missingAttributeIds.map((attributeId) => ({
                        userId: req.user.id,
                        attributeId,
                        value: null,
                    })),
                    skipDuplicates: true,
                });
            }

            // 5. Create the CV as DRAFT
            const createdCV = await tx.cV.create({
                data: {
                    fullName: normalizedFullName,
                    email: normalizedEmail,
                    phone: normalizedPhone,
                    summary: normalizedSummary,
                    skills: normalizedSkills,
                    education: normalizedEducation,
                    experience: normalizedExperience,
                    projects: normalizedProjects,
                    userId: req.user.id,
                    positionId: normalizedPositionId,
                    // status defaults to DRAFT
                },
                select: cvDetailSelect,
            });

            return createdCV;
        });

        return res.status(201).json({
            success: true,
            data: newCV,
        });
    } catch (error) {
        // Controlled expected errors
        if (error instanceof CVRequestError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        // Prisma unique constraint race condition (P2002)
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                success: false,
                message: "A CV already exists for this position.",
            });
        }

        return handleServerError(res, "create", error);
    }
};

/**
 * Get all CVs (role-based filtering)
 */
const getCVs = async (req, res) => {
    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    let where = {};

    if (role === "CANDIDATE") {
        where = { userId: req.user.id };
    } else if (role === "RECRUITER") {
        where = { status: "PUBLISHED" };
    }
    // ADMIN: no additional filter

    try {
        const cvs = await prisma.cV.findMany({
            where,
            select: cvListSelect,
            orderBy: [
                { updatedAt: "desc" },
                { createdAt: "desc" },
            ],
        });

        return res.status(200).json({
            success: true,
            data: cvs,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

/**
 * Get a single CV by ID (role-based authorization)
 */
const getCVById = async (req, res) => {
    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    const id = getValidId(req.params.id);
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "CV ID is required.",
        });
    }

    try {
        // Use expanded selection that includes positionAttributes
        const cv = await prisma.cV.findUnique({
            where: { id },
            select: cvDetailWithPositionAttributesSelect,
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: "CV not found.",
            });
        }

        // Authorization
        if (role === "CANDIDATE" && cv.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this CV.",
            });
        }

        if (role === "RECRUITER" && cv.status !== "PUBLISHED") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this CV.",
            });
        }

        // Determine Position Attribute IDs
        const attributeIds =
            cv.position.positionAttributes?.map(
                (positionAttribute) => positionAttribute.attributeId
            ) || [];

        // Look up master UserAttribute values for the CV owner
        let userAttributes = [];
        if (attributeIds.length > 0) {
            userAttributes = await prisma.userAttribute.findMany({
                where: {
                    userId: cv.userId,
                    attributeId: {
                        in: attributeIds,
                    },
                },
                select: {
                    id: true,
                    attributeId: true,
                    value: true,
                    updatedAt: true,
                },
            });
        }

        // Build a map for fast lookups
        const userAttributeMap = new Map(
            userAttributes.map((userAttribute) => [
                userAttribute.attributeId,
                userAttribute,
            ])
        );

        // Build dynamic attributes array
        const dynamicAttributes = cv.position.positionAttributes.map(
            (positionAttribute) => {
                const userAttribute = userAttributeMap.get(
                    positionAttribute.attributeId
                );

                const value = userAttribute?.value ?? null;
                const isMissing =
                    typeof value !== "string" || value.trim() === "";

                return {
                    positionAttributeId: positionAttribute.id,
                    attributeId: positionAttribute.attributeId,
                    name: positionAttribute.attribute.name,
                    category: positionAttribute.attribute.category,
                    type: positionAttribute.attribute.type,
                    userAttributeId: userAttribute?.id || null,
                    value,
                    isMissing,
                };
            }
        );

        // Remove nested positionAttributes from the response
        const {
            positionAttributes,
            ...cleanPosition
        } = cv.position;

        const responseData = {
            ...cv,
            position: cleanPosition,
            attributes: dynamicAttributes,
        };

        return res.status(200).json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

/**
 * Update a CV (role-based authorization)
 */
const updateCV = async (req, res) => {
    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    const id = getValidId(req.params.id);
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "CV ID is required.",
        });
    }

    const body =
        req.body && typeof req.body === "object" && !Array.isArray(req.body)
            ? req.body
            : {};

    try {
        const existingCV = await prisma.cV.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                status: true,
                positionId: true,
            },
        });

        if (!existingCV) {
            return res.status(404).json({
                success: false,
                message: "CV not found.",
            });
        }

        // Authorization
        if (role === "RECRUITER") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this CV.",
            });
        }

        if (role === "CANDIDATE" && existingCV.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this CV.",
            });
        }

        // Build updateData from allowed fields only
        const updateData = {};

        const {
            fullName,
            email,
            phone,
            summary,
            skills,
            education,
            experience,
            projects,
            status,
        } = body;

        if (Object.prototype.hasOwnProperty.call(body, "fullName")) {
            if (typeof fullName !== "string" || fullName.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "Full name is required.",
                });
            }
            updateData.fullName = fullName.trim();
        }

        if (Object.prototype.hasOwnProperty.call(body, "email")) {
            if (typeof email !== "string" || email.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "Email is required.",
                });
            }
            if (!isValidEmail(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid email address.",
                });
            }
            updateData.email = email.trim();
        }

        if (Object.prototype.hasOwnProperty.call(body, "phone")) {
            updateData.phone = normalizeOptionalString(phone);
        }

        if (Object.prototype.hasOwnProperty.call(body, "summary")) {
            updateData.summary = normalizeOptionalString(summary);
        }

        if (Object.prototype.hasOwnProperty.call(body, "skills")) {
            updateData.skills = normalizeOptionalString(skills);
        }

        if (Object.prototype.hasOwnProperty.call(body, "education")) {
            updateData.education = normalizeOptionalString(education);
        }

        if (Object.prototype.hasOwnProperty.call(body, "experience")) {
            updateData.experience = normalizeOptionalString(experience);
        }

        if (Object.prototype.hasOwnProperty.call(body, "projects")) {
            updateData.projects = normalizeOptionalString(projects);
        }

        if (Object.prototype.hasOwnProperty.call(body, "status")) {
            if (typeof status !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid CV status.",
                });
            }
            const normalizedStatus = status.trim().toUpperCase();
            if (!["DRAFT", "PUBLISHED"].includes(normalizedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid CV status.",
                });
            }
            updateData.status = normalizedStatus;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid CV fields were provided.",
            });
        }

        const updatedCV = await prisma.cV.update({
            where: { id },
            data: updateData,
            select: cvDetailSelect,
        });

        return res.status(200).json({
            success: true,
            data: updatedCV,
        });
    } catch (error) {
        return handleServerError(res, "update", error);
    }
};

/**
 * Delete a CV (role-based authorization)
 */
const deleteCV = async (req, res) => {
    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    const id = getValidId(req.params.id);
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "CV ID is required.",
        });
    }

    try {
        const existingCV = await prisma.cV.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
            },
        });

        if (!existingCV) {
            return res.status(404).json({
                success: false,
                message: "CV not found.",
            });
        }

        // Authorization
        if (role === "RECRUITER") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this CV.",
            });
        }

        if (role === "CANDIDATE" && existingCV.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this CV.",
            });
        }

        await prisma.cV.delete({
            where: { id },
        });

        return res.status(200).json({
            success: true,
            message: "CV deleted successfully.",
        });
    } catch (error) {
        return handleServerError(res, "delete", error);
    }
};

module.exports = {
    createCV,
    getCVs,
    getCVById,
    updateCV,
    deleteCV,
};