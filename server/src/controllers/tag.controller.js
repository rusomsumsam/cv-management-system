// server/src/controllers/tag.controller.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

const isCandidate = (req) => getRequestRole(req) === "CANDIDATE";

const normalizeSearchTerm = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const MAX_SEARCH_LENGTH = 50;

const parseLimit = (value) => {
    if (value === undefined) {
        return DEFAULT_LIMIT;
    }
    if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
        return null;
    }
    const parsed = Number(value.trim());
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
        return null;
    }
    return parsed;
};

const handleServerError = (res, error) => {
    console.error("Tag load error:", error.message);
    return res.status(500).json({
        success: false,
        message: "Failed to load Project Tags. Please try again.",
    });
};

// --- Controller ---

const getTags = async (req, res) => {
    try {
        // 1. Verify authentication
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // 2. Verify role
        if (!isCandidate(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Candidates can search Project Tags.",
            });
        }

        // 3. Parse query parameters
        const searchParam = req.query.search;
        const limitParam = req.query.limit;

        // 4. Validate and normalize search
        const normalizedSearch = normalizeSearchTerm(searchParam);
        if (normalizedSearch.length > MAX_SEARCH_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Tag search cannot exceed ${MAX_SEARCH_LENGTH} characters.`,
            });
        }

        // 5. Validate limit
        const limit = parseLimit(limitParam);
        if (limit === null) {
            return res.status(400).json({
                success: false,
                message: "Tag search limit must be an integer between 1 and 20.",
            });
        }

        // 6. Build where clause
        const where = normalizedSearch
            ? {
                normalizedName: {
                    contains: normalizedSearch,
                },
            }
            : {};

        // 7. Query tags
        const tags = await prisma.tag.findMany({
            where,
            select: {
                id: true,
                name: true,
                normalizedName: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        projectTags: true,
                    },
                },
            },
            orderBy: [
                {
                    projectTags: {
                        _count: "desc",
                    },
                },
                {
                    name: "asc",
                },
                {
                    id: "asc",
                },
            ],
            take: limit,
        });

        // 8. Transform response
        const responseTags = tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            normalizedName: tag.normalizedName,
            usageCount: tag._count.projectTags,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
        }));

        // 9. Return success response
        return res.status(200).json({
            success: true,
            data: responseTags,
            meta: {
                search: normalizedSearch,
                limit: limit,
                count: responseTags.length,
            },
        });
    } catch (error) {
        return handleServerError(res, error);
    }
};

module.exports = {
    getTags,
};