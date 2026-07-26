const { Prisma, PrismaClient } = require("@prisma/client");
const {
    evaluatePositionEligibility,
} = require("../services/positionEligibility.service");

const prisma = new PrismaClient();

// --- Constants ---

const DEFAULT_MAX_PROJECTS = 4;
const MIN_MAX_PROJECTS = 1;
const MAX_MAX_PROJECTS = 10;
const MAX_POSITION_TAGS = 15;
const MAX_TAG_LENGTH = 50;

// --- Helpers ---

const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

const isSupportedRole = (role) =>
    ["CANDIDATE", "RECRUITER", "ADMIN"].includes(role);

const getRequestBody = (req) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return {};
    }
    return req.body;
};

const getValidId = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

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

    if (dateOnlyPattern.test(normalizedValue)) {
        const parts = normalizedValue.split("-").map(Number);
        const year = parts[0];
        const month = parts[1] - 1;
        const day = parts[2];

        const parsedDate = new Date(Date.UTC(year, month, day));

        if (
            parsedDate.getUTCFullYear() !== year ||
            parsedDate.getUTCMonth() !== month ||
            parsedDate.getUTCDate() !== day
        ) {
            return { valid: false, value: undefined };
        }

        return { valid: true, value: parsedDate };
    }

    const parsedDate = new Date(normalizedValue);

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

const parseOptionalString = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }

    if (value === null) {
        return { valid: true, value: null };
    }

    if (typeof value !== "string") {
        return { valid: false, value: undefined };
    }

    const normalizedValue = value.trim();

    return { valid: true, value: normalizedValue || null };
};

const parseMaxProjects = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }

    if (typeof value === "number" && Number.isSafeInteger(value)) {
        if (value < MIN_MAX_PROJECTS || value > MAX_MAX_PROJECTS) {
            return {
                valid: false,
                error: `Maximum Projects must be an integer between ${MIN_MAX_PROJECTS} and ${MAX_MAX_PROJECTS}.`,
            };
        }
        return { valid: true, value };
    }

    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        const parsed = Number(value.trim());
        if (!Number.isSafeInteger(parsed)) {
            return {
                valid: false,
                error: `Maximum Projects must be an integer between ${MIN_MAX_PROJECTS} and ${MAX_MAX_PROJECTS}.`,
            };
        }
        if (parsed < MIN_MAX_PROJECTS || parsed > MAX_MAX_PROJECTS) {
            return {
                valid: false,
                error: `Maximum Projects must be an integer between ${MIN_MAX_PROJECTS} and ${MAX_MAX_PROJECTS}.`,
            };
        }
        return { valid: true, value: parsed };
    }

    return {
        valid: false,
        error: `Maximum Projects must be an integer between ${MIN_MAX_PROJECTS} and ${MAX_MAX_PROJECTS}.`,
    };
};

const parseVersion = (value) => {
    if (value === undefined) {
        return { valid: false, error: "A valid Position version is required." };
    }

    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
        return { valid: true, value };
    }

    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        const parsed = Number(value.trim());
        if (Number.isSafeInteger(parsed) && parsed > 0) {
            return { valid: true, value: parsed };
        }
    }

    return { valid: false, error: "A valid Position version is required." };
};

const parseTags = (tags) => {
    if (tags === undefined) {
        return { valid: true, value: undefined };
    }

    if (!Array.isArray(tags)) {
        return {
            valid: false,
            error: "Technology Tags must be provided as an array.",
        };
    }

    const normalizedTags = [];
    const seen = new Set();

    for (const tag of tags) {
        if (typeof tag !== "string") {
            return {
                valid: false,
                error: "Each Technology Tag must be a string.",
            };
        }

        const name = tag.trim().replace(/\s+/g, " ");

        if (!name) {
            return {
                valid: false,
                error: "Technology Tag names cannot be empty.",
            };
        }

        if (name.length > MAX_TAG_LENGTH) {
            return {
                valid: false,
                error: `Each Technology Tag can contain at most ${MAX_TAG_LENGTH} characters.`,
            };
        }

        const normalizedName = name.toLowerCase();

        if (seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);

        normalizedTags.push({
            name,
            normalizedName,
        });
    }

    if (normalizedTags.length > MAX_POSITION_TAGS) {
        return {
            valid: false,
            error: `A Position can have at most ${MAX_POSITION_TAGS} Technology Tags.`,
        };
    }

    return { valid: true, value: normalizedTags };
};

const syncPositionTags = async (tx, positionId, normalizedTags) => {
    // 1. Find existing tags
    const existingTags = await tx.tag.findMany({
        where: {
            normalizedName: {
                in: normalizedTags.map((t) => t.normalizedName),
            },
        },
        select: {
            id: true,
            name: true,
            normalizedName: true,
        },
    });

    const existingNormalizedNames = new Set(
        existingTags.map((t) => t.normalizedName)
    );

    // 2. Create missing tags
    const missingTags = normalizedTags.filter(
        (t) => !existingNormalizedNames.has(t.normalizedName)
    );

    if (missingTags.length > 0) {
        await tx.tag.createMany({
            data: missingTags.map((t) => ({
                name: t.name,
                normalizedName: t.normalizedName,
            })),
            skipDuplicates: true,
        });
    }

    // 3. Fetch all requested tags
    const allTags = await tx.tag.findMany({
        where: {
            normalizedName: {
                in: normalizedTags.map((t) => t.normalizedName),
            },
        },
        select: {
            id: true,
            name: true,
            normalizedName: true,
        },
    });

    // 4. Delete existing position tags
    await tx.positionTag.deleteMany({
        where: {
            positionId,
        },
    });

    // 5. Create new position tags
    if (allTags.length > 0) {
        await tx.positionTag.createMany({
            data: allTags.map((tag) => ({
                positionId,
                tagId: tag.id,
            })),
        });
    }
};

const handleServerError = (res, operation, error) => {
    console.error(`Position ${operation} error:`, error.message);
    return res.status(500).json({
        success: false,
        message: `Failed to ${operation} Position. Please try again.`,
    });
};

// --- Position Selects ---

const authenticatedPositionSelect = {
    id: true,
    title: true,
    description: true,
    company: true,
    location: true,
    department: true,
    deadline: true,
    isActive: true,
    accessType: true,
    accessRuleLogic: true,
    maxProjects: true,
    version: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    },
    _count: {
        select: {
            cvs: true,
            positionAttributes: true,
            discussions: true,
        },
    },
    positionTags: {
        select: {
            id: true,
            tagId: true,
            createdAt: true,
            tag: {
                select: {
                    id: true,
                    name: true,
                    normalizedName: true,
                },
            },
        },
        orderBy: [
            {
                createdAt: "asc",
            },
            {
                id: "asc",
            },
        ],
    },
};

const accessRuleSelect = {
    id: true,
    attributeId: true,
    operator: true,
    value: true,
    attribute: {
        select: {
            id: true,
            name: true,
            category: true,
            type: true,
        },
    },
};

const candidatePositionSelect = {
    ...authenticatedPositionSelect,
    accessRules: {
        select: accessRuleSelect,
        orderBy: [
            {
                createdAt: "asc",
            },
            {
                id: "asc",
            },
        ],
    },
};

const publicPositionSelect = {
    id: true,
    title: true,
    description: true,
    company: true,
    location: true,
    department: true,
    deadline: true,
    accessType: true,
    maxProjects: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            cvs: true,
        },
    },
    positionTags: {
        select: {
            id: true,
            tagId: true,
            createdAt: true,
            tag: {
                select: {
                    id: true,
                    name: true,
                    normalizedName: true,
                },
            },
        },
        orderBy: [
            {
                createdAt: "asc",
            },
            {
                id: "asc",
            },
        ],
    },
};

const getSafeEligibilitySummary = (eligibility) => {
    return {
        eligible: eligibility.eligible,
        reason: eligibility.reason,
        accessType: eligibility.accessType,
        accessRuleLogic: eligibility.accessRuleLogic,
        totalRules: eligibility.totalRules,
        passedRules: eligibility.passedRules,
        failedRules: eligibility.failedRules,
    };
};

// --- Controllers ---

const createPosition = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        if (role !== "RECRUITER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only Recruiters and Admins can create Positions through this endpoint.",
            });
        }

        const body = getRequestBody(req);
        const { title, description, company, location, department, deadline, maxProjects, tags } = body;

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

        const parsedDescription = parseOptionalString(description);
        if (!parsedDescription.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid description format.",
            });
        }

        const parsedLocation = parseOptionalString(location);
        if (!parsedLocation.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid location format.",
            });
        }

        const parsedDepartment = parseOptionalString(department);
        if (!parsedDepartment.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid department format.",
            });
        }

        const parsedDeadline = parseOptionalDate(deadline);
        if (!parsedDeadline.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid deadline date.",
            });
        }

        const parsedMaxProjects = parseMaxProjects(maxProjects);
        if (!parsedMaxProjects.valid) {
            return res.status(400).json({
                success: false,
                message: parsedMaxProjects.error,
            });
        }

        const parsedTags = parseTags(tags);
        if (!parsedTags.valid) {
            return res.status(400).json({
                success: false,
                message: parsedTags.error,
            });
        }

        const maxProjectsValue = parsedMaxProjects.value ?? DEFAULT_MAX_PROJECTS;

        const result = await prisma.$transaction(async (tx) => {
            // Create position
            const position = await tx.position.create({
                data: {
                    title: title.trim(),
                    description: parsedDescription.value,
                    company: company.trim(),
                    location: parsedLocation.value,
                    department: parsedDepartment.value,
                    deadline: parsedDeadline.value ?? null,
                    maxProjects: maxProjectsValue,
                    userId: req.user.id,
                    version: 1,
                },
                select: authenticatedPositionSelect,
            });

            // Sync tags if provided
            if (parsedTags.value) {
                await syncPositionTags(tx, position.id, parsedTags.value);
            }

            // Reload with tags
            const createdPosition = await tx.position.findUnique({
                where: { id: position.id },
                select: authenticatedPositionSelect,
            });

            return createdPosition;
        });

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleServerError(res, "create", error);
    }
};

const getPublicPositions = async (req, res) => {
    try {
        const positions = await prisma.position.findMany({
            where: {
                isActive: true,
                accessType: "PUBLIC",
            },
            select: publicPositionSelect,
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        });

        return res.status(200).json({
            success: true,
            data: positions,
        });
    } catch (error) {
        console.error("Public Position load error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load available Positions. Please try again.",
        });
    }
};

const getPublicPositionById = async (req, res) => {
    try {
        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const position = await prisma.position.findFirst({
            where: {
                id,
                isActive: true,
                accessType: "PUBLIC",
            },
            select: publicPositionSelect,
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: position,
        });
    } catch (error) {
        console.error("Public Position load error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load Position details. Please try again.",
        });
    }
};

const getPositions = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        // Candidate branch: eligibility-aware listing
        if (role === "CANDIDATE") {
            const candidatePositions = await prisma.position.findMany({
                where: {
                    isActive: true,
                },
                select: candidatePositionSelect,
                orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
            });

            // Collect all unique attribute IDs from all access rules across all positions
            const attributeIds = [
                ...new Set(
                    candidatePositions.flatMap((position) =>
                        Array.isArray(position.accessRules)
                            ? position.accessRules.map((rule) => rule.attributeId).filter(Boolean)
                            : []
                    )
                ),
            ];

            let userAttributes = [];
            if (attributeIds.length > 0) {
                userAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: attributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                        value: true,
                    },
                });
            }

            const candidateVisiblePositions = candidatePositions
                .map((position) => {
                    const eligibility = evaluatePositionEligibility(position, userAttributes);
                    const { accessRules, ...cleanPosition } = position;
                    return {
                        position: cleanPosition,
                        eligibility,
                    };
                })
                .filter((item) => item.eligibility.eligible)
                .map((item) => ({
                    ...item.position,
                    eligibility: getSafeEligibilitySummary(item.eligibility),
                }));

            return res.status(200).json({
                success: true,
                data: candidateVisiblePositions,
            });
        }

        // Recruiter and Admin branch: all positions (shared pool)
        const positions = await prisma.position.findMany({
            select: authenticatedPositionSelect,
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        });

        return res.status(200).json({
            success: true,
            data: positions,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

const getPositionById = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        // Candidate branch: eligibility-aware detail view
        if (role === "CANDIDATE") {
            const candidatePosition = await prisma.position.findFirst({
                where: {
                    id,
                    isActive: true,
                },
                select: candidatePositionSelect,
            });

            if (!candidatePosition) {
                return res.status(404).json({
                    success: false,
                    message: "Position not found.",
                });
            }

            const rules = Array.isArray(candidatePosition.accessRules)
                ? candidatePosition.accessRules
                : [];

            const attributeIds = [
                ...new Set(rules.map((rule) => rule.attributeId).filter(Boolean)),
            ];

            let userAttributes = [];
            if (attributeIds.length > 0) {
                userAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: attributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                        value: true,
                    },
                });
            }

            const eligibility = evaluatePositionEligibility(candidatePosition, userAttributes);

            if (!eligibility.eligible) {
                return res.status(404).json({
                    success: false,
                    message: "Position not found.",
                });
            }

            const { accessRules, ...cleanPosition } = candidatePosition;

            return res.status(200).json({
                success: true,
                data: {
                    ...cleanPosition,
                    eligibility: getSafeEligibilitySummary(eligibility),
                },
            });
        }

        // Recruiter and Admin branch: any position
        const position = await prisma.position.findFirst({
            where: { id },
            select: authenticatedPositionSelect,
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: position,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

const duplicatePosition = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        if (role !== "RECRUITER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to duplicate this Position.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Load source position with relations to copy
            const sourcePosition = await tx.position.findFirst({
                where: { id },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    company: true,
                    location: true,
                    department: true,
                    deadline: true,
                    isActive: true,
                    accessType: true,
                    accessRuleLogic: true,
                    maxProjects: true,
                    positionAttributes: {
                        select: {
                            attributeId: true,
                        },
                    },
                    accessRules: {
                        select: {
                            attributeId: true,
                            operator: true,
                            value: true,
                        },
                    },
                    positionTags: {
                        select: {
                            tagId: true,
                        },
                    },
                },
            });

            if (!sourcePosition) {
                throw new Error("Position not found");
            }

            // Create new position
            const newPosition = await tx.position.create({
                data: {
                    title: `${sourcePosition.title} (Copy)`,
                    description: sourcePosition.description,
                    company: sourcePosition.company,
                    location: sourcePosition.location,
                    department: sourcePosition.department,
                    deadline: sourcePosition.deadline,
                    isActive: sourcePosition.isActive,
                    accessType: sourcePosition.accessType,
                    accessRuleLogic: sourcePosition.accessRuleLogic,
                    maxProjects: sourcePosition.maxProjects ?? DEFAULT_MAX_PROJECTS,
                    userId: req.user.id,
                    version: 1,
                },
                select: authenticatedPositionSelect,
            });

            // Copy position attributes
            if (sourcePosition.positionAttributes && sourcePosition.positionAttributes.length > 0) {
                await tx.positionAttribute.createMany({
                    data: sourcePosition.positionAttributes.map((attr) => ({
                        positionId: newPosition.id,
                        attributeId: attr.attributeId,
                    })),
                });
            }

            // Copy access rules
            if (sourcePosition.accessRules && sourcePosition.accessRules.length > 0) {
                await tx.positionAccessRule.createMany({
                    data: sourcePosition.accessRules.map((rule) => ({
                        positionId: newPosition.id,
                        attributeId: rule.attributeId,
                        operator: rule.operator,
                        value: rule.value,
                    })),
                });
            }

            // Copy position tags
            if (sourcePosition.positionTags && sourcePosition.positionTags.length > 0) {
                await tx.positionTag.createMany({
                    data: sourcePosition.positionTags.map((tag) => ({
                        positionId: newPosition.id,
                        tagId: tag.tagId,
                    })),
                });
            }

            // Reload the position
            const duplicatedPosition = await tx.position.findUnique({
                where: { id: newPosition.id },
                select: authenticatedPositionSelect,
            });

            return duplicatedPosition;
        });

        return res.status(201).json({
            success: true,
            message: "Position duplicated successfully.",
            data: result,
        });
    } catch (error) {
        if (error.message === "Position not found") {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }
        return handleServerError(res, "duplicate", error);
    }
};

const updatePosition = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        if (role !== "RECRUITER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this Position.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const body = getRequestBody(req);
        const {
            title,
            description,
            company,
            location,
            department,
            deadline,
            isActive,
            maxProjects,
            tags,
            version,
        } = body;

        // Validate version
        const parsedVersion = parseVersion(version);
        if (!parsedVersion.valid) {
            return res.status(400).json({
                success: false,
                message: parsedVersion.error,
            });
        }

        // Check if any editable field is being updated
        const hasEditableFields =
            title !== undefined ||
            description !== undefined ||
            company !== undefined ||
            location !== undefined ||
            department !== undefined ||
            deadline !== undefined ||
            isActive !== undefined ||
            maxProjects !== undefined ||
            tags !== undefined;

        if (!hasEditableFields) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        // Build update data
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
            const parsedDescription = parseOptionalString(description);
            if (!parsedDescription.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid description format.",
                });
            }
            updateData.description = parsedDescription.value;
        }

        if (location !== undefined) {
            const parsedLocation = parseOptionalString(location);
            if (!parsedLocation.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid location format.",
                });
            }
            updateData.location = parsedLocation.value;
        }

        if (department !== undefined) {
            const parsedDepartment = parseOptionalString(department);
            if (!parsedDepartment.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department format.",
                });
            }
            updateData.department = parsedDepartment.value;
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

        if (maxProjects !== undefined) {
            const parsedMaxProjects = parseMaxProjects(maxProjects);
            if (!parsedMaxProjects.valid) {
                return res.status(400).json({
                    success: false,
                    message: parsedMaxProjects.error,
                });
            }
            updateData.maxProjects = parsedMaxProjects.value;
        }

        // Parse tags if provided
        let parsedTags = null;
        if (tags !== undefined) {
            parsedTags = parseTags(tags);
            if (!parsedTags.valid) {
                return res.status(400).json({
                    success: false,
                    message: parsedTags.error,
                });
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // Check current version
            const currentPosition = await tx.position.findUnique({
                where: { id },
                select: { version: true },
            });

            if (!currentPosition) {
                throw new Error("Position not found");
            }

            if (currentPosition.version !== parsedVersion.value) {
                throw new Error("Version conflict");
            }

            // Update position with version increment
            const updatedPosition = await tx.position.updateMany({
                where: {
                    id,
                    version: parsedVersion.value,
                },
                data: {
                    ...updateData,
                    version: { increment: 1 },
                },
            });

            if (updatedPosition.count === 0) {
                throw new Error("Version conflict");
            }

            // Sync tags if provided (handles empty array and non-empty array)
            if (tags !== undefined) {
                await syncPositionTags(tx, id, parsedTags.value);
            }

            // Reload updated position
            const reloadedPosition = await tx.position.findUnique({
                where: { id },
                select: authenticatedPositionSelect,
            });

            return reloadedPosition;
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error.message === "Position not found") {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }
        if (error.message === "Version conflict") {
            return res.status(409).json({
                success: false,
                message: "This Position was modified by another user. Reload the latest version and try again.",
            });
        }
        return handleServerError(res, "update", error);
    }
};

const deletePosition = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isSupportedRole(role)) {
            return res.status(403).json({
                success: false,
                message: "Unsupported role.",
            });
        }

        if (role !== "RECRUITER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this Position.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const position = await prisma.position.findFirst({
            where: { id },
        });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        try {
            await prisma.position.delete({
                where: { id: position.id },
            });
        } catch (deleteError) {
            if (
                deleteError instanceof Prisma.PrismaClientKnownRequestError &&
                ["P2003", "P2014"].includes(deleteError.code)
            ) {
                return res.status(409).json({
                    success: false,
                    message: "This Position cannot be deleted because related records still exist.",
                });
            }
            throw deleteError;
        }

        return res.status(200).json({
            success: true,
            message: "Position deleted successfully",
        });
    } catch (error) {
        return handleServerError(res, "delete", error);
    }
};

module.exports = {
    createPosition,
    getPublicPositions,
    getPublicPositionById,
    getPositions,
    getPositionById,
    duplicatePosition,
    updatePosition,
    deletePosition,
};