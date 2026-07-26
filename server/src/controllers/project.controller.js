const { Prisma, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

const isCandidate = (req) => getRequestRole(req) === "CANDIDATE";

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

const isNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
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
    const normalized = value.trim();
    return { valid: true, value: normalized || null };
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

const parseOptionalDateOnly = (value) => {
    if (value === undefined) {
        return { valid: true, value: undefined };
    }
    if (value === null || value === "") {
        return { valid: true, value: null };
    }
    if (typeof value !== "string") {
        return { valid: false, value: undefined };
    }
    const normalized = value.trim();
    if (!normalized) {
        return { valid: true, value: null };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return { valid: false, value: undefined };
    }
    const [year, month, day] = normalized.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return { valid: false, value: undefined };
    }
    return { valid: true, value: date };
};

const normalizeTagName = (value) => {
    return value.trim().replace(/\s+/g, " ");
};

const getNormalizedTagKey = (value) => {
    return normalizeTagName(value).toLowerCase();
};

const MAX_TAGS_PER_PROJECT = 15;
const MAX_TAG_LENGTH = 50;

const parseTags = (value) => {
    if (value === undefined) {
        return { valid: true, tags: [] };
    }
    if (!Array.isArray(value)) {
        return { valid: false, message: "Project tags must be provided as an array." };
    }
    const seenKeys = new Set();
    const tags = [];
    for (const item of value) {
        if (typeof item !== "string") {
            return { valid: false, message: "Every Project tag must be a string." };
        }
        const normalizedName = normalizeTagName(item);
        if (!normalizedName) {
            return { valid: false, message: "Project tags cannot be empty." };
        }
        if (normalizedName.length > MAX_TAG_LENGTH) {
            return { valid: false, message: `Project tags cannot exceed ${MAX_TAG_LENGTH} characters.` };
        }
        const normalizedKey = getNormalizedTagKey(normalizedName);
        if (!seenKeys.has(normalizedKey)) {
            seenKeys.add(normalizedKey);
            tags.push({
                name: normalizedName,
                normalizedName: normalizedKey,
            });
        }
    }
    if (tags.length > MAX_TAGS_PER_PROJECT) {
        return { valid: false, message: `A Project cannot contain more than ${MAX_TAGS_PER_PROJECT} tags.` };
    }
    return { valid: true, tags };
};

const upsertTags = async (client, parsedTags) => {
    const tagRecords = [];
    for (const parsedTag of parsedTags) {
        const tag = await client.tag.upsert({
            where: { normalizedName: parsedTag.normalizedName },
            update: {},
            create: {
                name: parsedTag.name,
                normalizedName: parsedTag.normalizedName,
            },
            select: { id: true, name: true, normalizedName: true },
        });
        tagRecords.push(tag);
    }
    return tagRecords;
};

const projectSelect = {
    id: true,
    title: true,
    description: true,
    startDate: true,
    endDate: true,
    isOngoing: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    projectTags: {
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
            { createdAt: "asc" },
            { id: "asc" },
        ],
    },
};

const handleServerError = (res, operation, error) => {
    console.error(`Project ${operation} error:`, error.message);
    return res.status(500).json({
        success: false,
        message: `Failed to ${operation} Project. Please try again.`,
    });
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

        if (!isCandidate(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Candidates can manage Projects.",
            });
        }

        const body = getRequestBody(req);
        const { title, description, startDate, endDate, isOngoing, tags } = body;

        if (!isNonEmptyString(title)) {
            return res.status(400).json({
                success: false,
                message: "Project title is required.",
            });
        }

        const parsedDescription = parseOptionalString(description);
        if (!parsedDescription.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid project description.",
            });
        }

        const parsedStartDate = parseOptionalDateOnly(startDate);
        if (!parsedStartDate.valid) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid Project start date in YYYY-MM-DD format.",
            });
        }

        const parsedEndDate = parseOptionalDateOnly(endDate);
        if (!parsedEndDate.valid) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid Project end date in YYYY-MM-DD format.",
            });
        }

        const parsedIsOngoing = parseOptionalBoolean(isOngoing);
        if (!parsedIsOngoing.valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid ongoing Project status.",
            });
        }

        const parsedTags = parseTags(tags);
        if (!parsedTags.valid) {
            return res.status(400).json({
                success: false,
                message: parsedTags.message,
            });
        }

        const finalIsOngoing = parsedIsOngoing.value ?? false;
        let finalEndDate = parsedEndDate.value;
        if (finalIsOngoing) {
            finalEndDate = null;
        }

        if (parsedStartDate.value && finalEndDate) {
            if (finalEndDate.getTime() < parsedStartDate.value.getTime()) {
                return res.status(400).json({
                    success: false,
                    message: "Project end date cannot be earlier than the start date.",
                });
            }
        }

        try {
            const createdProject = await prisma.$transaction(async (tx) => {
                const tagRecords = await upsertTags(tx, parsedTags.tags);

                return tx.project.create({
                    data: {
                        title: title.trim(),
                        description: parsedDescription.value ?? null,
                        startDate: parsedStartDate.value ?? null,
                        endDate: finalEndDate,
                        isOngoing: finalIsOngoing,
                        userId: req.user.id,
                        projectTags: tagRecords.length > 0
                            ? {
                                create: tagRecords.map((tag) => ({
                                    tagId: tag.id,
                                })),
                            }
                            : undefined,
                    },
                    select: projectSelect,
                });
            });

            return res.status(201).json({
                success: true,
                data: createdProject,
            });
        } catch (txError) {
            if (
                txError instanceof Prisma.PrismaClientKnownRequestError &&
                txError.code === "P2002"
            ) {
                return res.status(409).json({
                    success: false,
                    message: "A conflicting Project tag update was detected. Please try again.",
                });
            }
            throw txError;
        }
    } catch (error) {
        return handleServerError(res, "create", error);
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

        if (!isCandidate(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Candidates can manage Projects.",
            });
        }

        const projects = await prisma.project.findMany({
            where: { userId: req.user.id },
            select: projectSelect,
            orderBy: [
                { startDate: "desc" },
                { createdAt: "desc" },
                { id: "asc" },
            ],
        });

        return res.status(200).json({
            success: true,
            data: projects,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
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

        if (!isCandidate(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Candidates can manage Projects.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                userId: req.user.id,
            },
            select: projectSelect,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        return handleServerError(res, "load", error);
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

        if (!isCandidate(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Candidates can manage Projects.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const body = getRequestBody(req);
        const { title, description, startDate, endDate, isOngoing, tags } = body;

        const startDateProvided = Object.prototype.hasOwnProperty.call(body, "startDate");
        const endDateProvided = Object.prototype.hasOwnProperty.call(body, "endDate");
        const isOngoingProvided = Object.prototype.hasOwnProperty.call(body, "isOngoing");
        const tagsProvided = Object.prototype.hasOwnProperty.call(body, "tags");

        const existingProject = await prisma.project.findFirst({
            where: {
                id,
                userId: req.user.id,
            },
            select: {
                id: true,
                startDate: true,
                endDate: true,
                isOngoing: true,
            },
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        const updateData = {};

        if (Object.prototype.hasOwnProperty.call(body, "title")) {
            if (!isNonEmptyString(title)) {
                return res.status(400).json({
                    success: false,
                    message: "Project title cannot be empty.",
                });
            }
            updateData.title = title.trim();
        }

        if (Object.prototype.hasOwnProperty.call(body, "description")) {
            const parsedDescription = parseOptionalString(description);
            if (!parsedDescription.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project description.",
                });
            }
            updateData.description = parsedDescription.value;
        }

        let parsedStartDate;
        if (startDateProvided) {
            parsedStartDate = parseOptionalDateOnly(startDate);
            if (!parsedStartDate.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid Project start date in YYYY-MM-DD format.",
                });
            }
        }

        let parsedEndDate;
        if (endDateProvided) {
            parsedEndDate = parseOptionalDateOnly(endDate);
            if (!parsedEndDate.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid Project end date in YYYY-MM-DD format.",
                });
            }
        }

        let parsedIsOngoing;
        if (isOngoingProvided) {
            parsedIsOngoing = parseOptionalBoolean(isOngoing);
            if (!parsedIsOngoing.valid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid ongoing Project status.",
                });
            }
        }

        const finalStartDate = startDateProvided
            ? parsedStartDate.value
            : existingProject.startDate;

        const finalIsOngoing = isOngoingProvided
            ? parsedIsOngoing.value
            : existingProject.isOngoing;

        let finalEndDate;
        if (finalIsOngoing) {
            finalEndDate = null;
        } else {
            finalEndDate = endDateProvided
                ? parsedEndDate.value
                : existingProject.endDate;
        }

        if (finalStartDate && finalEndDate) {
            if (finalEndDate.getTime() < finalStartDate.getTime()) {
                return res.status(400).json({
                    success: false,
                    message: "Project end date cannot be earlier than the start date.",
                });
            }
        }

        if (startDateProvided) {
            updateData.startDate = finalStartDate;
        }

        if (endDateProvided || (isOngoingProvided && finalIsOngoing)) {
            updateData.endDate = finalEndDate;
        }

        if (isOngoingProvided) {
            updateData.isOngoing = finalIsOngoing;
        }

        if (Object.keys(updateData).length === 0 && !tagsProvided) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        let parsedTags;
        if (tagsProvided) {
            parsedTags = parseTags(tags);
            if (!parsedTags.valid) {
                return res.status(400).json({
                    success: false,
                    message: parsedTags.message,
                });
            }
        }

        try {
            const updatedProject = await prisma.$transaction(async (tx) => {
                if (Object.keys(updateData).length > 0) {
                    await tx.project.update({
                        where: { id: existingProject.id },
                        data: updateData,
                    });
                }

                if (tagsProvided) {
                    await tx.projectTag.deleteMany({
                        where: { projectId: existingProject.id },
                    });

                    if (parsedTags.tags.length > 0) {
                        const tagRecords = await upsertTags(tx, parsedTags.tags);
                        await tx.projectTag.createMany({
                            data: tagRecords.map((tag) => ({
                                projectId: existingProject.id,
                                tagId: tag.id,
                            })),
                        });
                    }
                }

                return tx.project.findUnique({
                    where: { id: existingProject.id },
                    select: projectSelect,
                });
            });

            return res.status(200).json({
                success: true,
                data: updatedProject,
            });
        } catch (txError) {
            if (
                txError instanceof Prisma.PrismaClientKnownRequestError &&
                txError.code === "P2002"
            ) {
                return res.status(409).json({
                    success: false,
                    message: "A conflicting Project tag update was detected. Please try again.",
                });
            }
            if (
                txError instanceof Prisma.PrismaClientKnownRequestError &&
                txError.code === "P2025"
            ) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found.",
                });
            }
            throw txError;
        }
    } catch (error) {
        return handleServerError(res, "update", error);
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

        if (!isCandidate(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Candidates can manage Projects.",
            });
        }

        const id = getValidId(req.params.id);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required.",
            });
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                userId: req.user.id,
            },
            select: {
                id: true,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        try {
            await prisma.$transaction(async (tx) => {
                await tx.projectTag.deleteMany({
                    where: { projectId: project.id },
                });

                await tx.project.delete({
                    where: { id: project.id },
                });
            });

            return res.status(200).json({
                success: true,
                message: "Project deleted successfully.",
            });
        } catch (txError) {
            if (
                txError instanceof Prisma.PrismaClientKnownRequestError &&
                (txError.code === "P2003" || txError.code === "P2014")
            ) {
                return res.status(409).json({
                    success: false,
                    message: "This Project cannot be deleted because related records still exist.",
                });
            }
            if (
                txError instanceof Prisma.PrismaClientKnownRequestError &&
                txError.code === "P2025"
            ) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found.",
                });
            }
            throw txError;
        }
    } catch (error) {
        return handleServerError(res, "delete", error);
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
};