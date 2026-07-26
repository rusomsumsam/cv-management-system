// server/src/services/projectFiltering.service.js

const DEFAULT_MAX_PROJECTS = 4;
const MIN_MAX_PROJECTS = 1;
const MAX_MAX_PROJECTS = 10;

/**
 * Safely normalizes a stored maxProjects value to a valid integer between 1 and 10.
 * Falls back to DEFAULT_MAX_PROJECTS if the stored value is invalid.
 *
 * @param {number|string|null|undefined} value - Stored maxProjects value
 * @returns {number} Validated maxProjects between 1 and 10
 */
const normalizeMaxProjects = (value) => {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        if (value >= MIN_MAX_PROJECTS && value <= MAX_MAX_PROJECTS) {
            return value;
        }
    }

    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        const parsed = Number(value.trim());
        if (Number.isSafeInteger(parsed) && parsed >= MIN_MAX_PROJECTS && parsed <= MAX_MAX_PROJECTS) {
            return parsed;
        }
    }

    return DEFAULT_MAX_PROJECTS;
};

/**
 * Loads filtered profile projects for a CV based on Position Technology Tags and maxProjects.
 *
 * @param {PrismaClient|PrismaTransactionClient} client - Prisma client or transaction client
 * @param {string} userId - Candidate user ID
 * @param {string} positionId - Position ID to filter projects against
 * @returns {Promise<Array>} Filtered and sorted projects with their tags
 * @throws {TypeError} If client is not provided
 */
const loadFilteredProfileProjects = async (client, userId, positionId) => {
    // Defensive validation
    if (!client) {
        throw new TypeError("Prisma client is required for loadFilteredProfileProjects");
    }

    if (typeof userId !== "string" || !userId.trim()) {
        return [];
    }

    if (typeof positionId !== "string" || !positionId.trim()) {
        return [];
    }

    const trimmedUserId = userId.trim();
    const trimmedPositionId = positionId.trim();

    // 1. Load Position configuration
    const position = await client.position.findUnique({
        where: {
            id: trimmedPositionId,
        },
        select: {
            id: true,
            maxProjects: true,
            positionTags: {
                select: {
                    tagId: true,
                },
            },
        },
    });

    // Position not found → no projects
    if (!position) {
        return [];
    }

    // 2. Extract unique position tag IDs
    const tagIdsSet = new Set();
    if (Array.isArray(position.positionTags)) {
        for (const positionTag of position.positionTags) {
            if (positionTag?.tagId && typeof positionTag.tagId === "string" && positionTag.tagId.trim()) {
                tagIdsSet.add(positionTag.tagId.trim());
            }
        }
    }

    const positionTagIds = Array.from(tagIdsSet);

    // No position tags → no projects can match
    if (positionTagIds.length === 0) {
        return [];
    }

    // 3. Normalize maxProjects safely
    const maxProjects = normalizeMaxProjects(position.maxProjects);

    // 4. Query candidate projects that have at least one matching tag
    const projects = await client.project.findMany({
        where: {
            userId: trimmedUserId,
            projectTags: {
                some: {
                    tagId: {
                        in: positionTagIds,
                    },
                },
            },
        },
        select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            isOngoing: true,
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
                    {
                        createdAt: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
            },
        },
        orderBy: [
            {
                isOngoing: "desc",
            },
            {
                startDate: "desc",
            },
            {
                createdAt: "desc",
            },
            {
                id: "asc",
            },
        ],
        take: maxProjects,
    });

    return projects;
};

module.exports = {
    loadFilteredProfileProjects,
    normalizeMaxProjects,
    DEFAULT_MAX_PROJECTS,
    MIN_MAX_PROJECTS,
    MAX_MAX_PROJECTS,
};