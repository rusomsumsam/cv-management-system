const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Public Position Select ---

const publicPositionSelect = {
    id: true,
    title: true,
    description: true,
    company: true,
    location: true,
    department: true,
    deadline: true,
    createdAt: true,
    updatedAt: true,
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
    _count: {
        select: {
            cvs: true,
        },
    },
};

// --- Controller ---

const getPublicHome = async (req, res) => {
    try {
        // 1. Latest Positions (5 most recently active PUBLIC Positions)
        const latestPositions = await prisma.position.findMany({
            where: {
                isActive: true,
                accessType: "PUBLIC",
            },
            select: publicPositionSelect,
            orderBy: [
                {
                    updatedAt: "desc",
                },
                {
                    createdAt: "desc",
                },
                {
                    id: "asc",
                },
            ],
            take: 5,
        });

        // 2. Most Popular Positions (based on PUBLISHED CV count)
        // Fetch up to 20 candidate positions with published CV counts
        const popularPositionGroups = await prisma.cV.groupBy({
            by: ["positionId"],
            where: {
                status: "PUBLISHED",
                position: {
                    isActive: true,
                    accessType: "PUBLIC",
                },
            },
            _count: {
                _all: true,
            },
            orderBy: {
                _count: {
                    positionId: "desc",
                },
            },
            take: 20,
        });

        const popularPositionIds = popularPositionGroups.map((g) => g.positionId);
        const publishedCvsCountMap = new Map(
            popularPositionGroups.map((g) => [g.positionId, g._count._all])
        );

        let popularPositions = [];
        if (popularPositionIds.length > 0) {
            const positions = await prisma.position.findMany({
                where: {
                    id: {
                        in: popularPositionIds,
                    },
                    isActive: true,
                    accessType: "PUBLIC",
                },
                select: publicPositionSelect,
            });

            // Attach publishedCvsCount and prepare for sorting
            popularPositions = positions.map((pos) => ({
                ...pos,
                publishedCvsCount: publishedCvsCountMap.get(pos.id) || 0,
            }));

            // Sort deterministically: publishedCvsCount desc, updatedAt desc, createdAt desc, id asc
            popularPositions.sort((a, b) => {
                // publishedCvsCount descending
                if (b.publishedCvsCount !== a.publishedCvsCount) {
                    return b.publishedCvsCount - a.publishedCvsCount;
                }

                // updatedAt descending (safer date comparison)
                const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                if (bUpdated !== aUpdated) {
                    return bUpdated - aUpdated;
                }

                // createdAt descending
                const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (bCreated !== aCreated) {
                    return bCreated - aCreated;
                }

                // id ascending
                return a.id.localeCompare(b.id);
            });

            // Take top 5
            popularPositions = popularPositions.slice(0, 5);
        }

        // If fewer than 5 Positions have Published CVs, fill remaining slots
        if (popularPositions.length < 5) {
            const existingIds = new Set(popularPositions.map((p) => p.id));
            const needed = 5 - popularPositions.length;

            const fillPositions = await prisma.position.findMany({
                where: {
                    isActive: true,
                    accessType: "PUBLIC",
                    id: {
                        notIn: Array.from(existingIds),
                    },
                },
                select: publicPositionSelect,
                orderBy: [
                    {
                        updatedAt: "desc",
                    },
                    {
                        createdAt: "desc",
                    },
                    {
                        id: "asc",
                    },
                ],
                take: needed,
            });

            // Transform fill positions with zero published CV count
            const normalizedFillPositions = fillPositions.map((position) => ({
                ...position,
                publishedCvsCount: 0,
            }));

            popularPositions = [...popularPositions, ...normalizedFillPositions].slice(0, 5);
        }

        // 3. Technology Tag Cloud (20 most used Tags in active PUBLIC Positions)
        const tagGroups = await prisma.positionTag.groupBy({
            by: ["tagId"],
            where: {
                position: {
                    isActive: true,
                    accessType: "PUBLIC",
                },
            },
            _count: {
                positionId: true,
            },
            orderBy: {
                _count: {
                    positionId: "desc",
                },
            },
            take: 20,
        });

        const tagIds = tagGroups.map((g) => g.tagId);
        const positionCountMap = new Map(
            tagGroups.map((g) => [g.tagId, g._count.positionId])
        );

        let technologyTags = [];
        if (tagIds.length > 0) {
            const tags = await prisma.tag.findMany({
                where: {
                    id: {
                        in: tagIds,
                    },
                },
                select: {
                    id: true,
                    name: true,
                    normalizedName: true,
                },
            });

            technologyTags = tags
                .map((tag) => ({
                    id: tag.id,
                    name: tag.name,
                    normalizedName: tag.normalizedName,
                    positionCount: positionCountMap.get(tag.id) || 0,
                }))
                .filter((tag) => tag.positionCount > 0);

            // Sort deterministically: positionCount desc, name asc, id asc
            technologyTags.sort((a, b) => {
                // positionCount descending
                if (b.positionCount !== a.positionCount) {
                    return b.positionCount - a.positionCount;
                }

                // name ascending
                const nameCompare = a.name.localeCompare(b.name);
                if (nameCompare !== 0) {
                    return nameCompare;
                }

                // id ascending
                return a.id.localeCompare(b.id);
            });

            // Take top 20
            technologyTags = technologyTags.slice(0, 20);
        }

        // 4. Statistics
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            cvsCreatedLast24Hours,
            totalPositions,
            totalCandidates,
            totalRecruiters,
            totalSubmittedCVs,
        ] = await Promise.all([
            // CVs created in last 24 hours (PUBLISHED, active PUBLIC Position)
            prisma.cV.count({
                where: {
                    status: "PUBLISHED",
                    createdAt: {
                        gte: twentyFourHoursAgo,
                    },
                    position: {
                        isActive: true,
                        accessType: "PUBLIC",
                    },
                },
            }),
            // Total active PUBLIC Positions
            prisma.position.count({
                where: {
                    isActive: true,
                    accessType: "PUBLIC",
                },
            }),
            // Total Candidates
            prisma.user.count({
                where: {
                    role: "CANDIDATE",
                },
            }),
            // Total Recruiters (exclude Admins)
            prisma.user.count({
                where: {
                    role: "RECRUITER",
                },
            }),
            // Total Submitted (PUBLISHED) CVs for active PUBLIC Positions
            prisma.cV.count({
                where: {
                    status: "PUBLISHED",
                    position: {
                        isActive: true,
                        accessType: "PUBLIC",
                    },
                },
            }),
        ]);

        // 5. Build response
        const responseData = {
            latestPositions,
            popularPositions,
            technologyTags,
            statistics: {
                cvsCreatedLast24Hours,
                totalPositions,
                totalCandidates,
                totalRecruiters,
                totalSubmittedCVs,
            },
        };

        return res.status(200).json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error("Public Home load error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load the public Home page. Please try again.",
        });
    }
};

module.exports = {
    getPublicHome,
};