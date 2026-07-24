const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Search positions using PostgreSQL full-text search
 */
const searchPositions = async ({ query, userRole, limit, offset }) => {
    if (userRole === "CANDIDATE") {
        return prisma.$queryRaw`
      SELECT
        "id",
        "title",
        "description",
        "company",
        "location",
        "department",
        "deadline",
        "isActive",
        "createdAt",
        "updatedAt",
        ts_rank(
          to_tsvector(
            'simple',
            coalesce("title", '') || ' ' ||
            coalesce("description", '') || ' ' ||
            coalesce("company", '') || ' ' ||
            coalesce("location", '') || ' ' ||
            coalesce("department", '')
          ),
          websearch_to_tsquery('simple', ${query})
        )::double precision AS "rank",
        'position' AS "resultType"
      FROM "Position"
      WHERE
        "isActive" = true
        AND to_tsvector(
          'simple',
          coalesce("title", '') || ' ' ||
          coalesce("description", '') || ' ' ||
          coalesce("company", '') || ' ' ||
          coalesce("location", '') || ' ' ||
          coalesce("department", '')
        ) @@ websearch_to_tsquery('simple', ${query})
      ORDER BY
        "rank" DESC,
        "updatedAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    }

    // RECRUITER and ADMIN: return all matching positions
    return prisma.$queryRaw`
    SELECT
      "id",
      "title",
      "description",
      "company",
      "location",
      "department",
      "deadline",
      "isActive",
      "createdAt",
      "updatedAt",
      ts_rank(
        to_tsvector(
          'simple',
          coalesce("title", '') || ' ' ||
          coalesce("description", '') || ' ' ||
          coalesce("company", '') || ' ' ||
          coalesce("location", '') || ' ' ||
          coalesce("department", '')
        ),
        websearch_to_tsquery('simple', ${query})
      )::double precision AS "rank",
      'position' AS "resultType"
    FROM "Position"
    WHERE
      to_tsvector(
        'simple',
        coalesce("title", '') || ' ' ||
        coalesce("description", '') || ' ' ||
        coalesce("company", '') || ' ' ||
        coalesce("location", '') || ' ' ||
        coalesce("department", '')
      ) @@ websearch_to_tsquery('simple', ${query})
    ORDER BY
      "rank" DESC,
      "updatedAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
};

/**
 * Search attributes using PostgreSQL full-text search
 */
const searchAttributes = async ({ query, limit, offset }) => {
    return prisma.$queryRaw`
    SELECT
      "id",
      "name",
      "category",
      "type",
      "createdAt",
      "updatedAt",
      ts_rank(
        to_tsvector(
          'simple',
          coalesce("name", '') || ' ' ||
          coalesce("category", '')
        ),
        websearch_to_tsquery('simple', ${query})
      )::double precision AS "rank",
      'attribute' AS "resultType"
    FROM "Attribute"
    WHERE
      to_tsvector(
        'simple',
        coalesce("name", '') || ' ' ||
        coalesce("category", '')
      ) @@ websearch_to_tsquery('simple', ${query})
    ORDER BY
      "rank" DESC,
      "updatedAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
};

/**
 * Search projects using PostgreSQL full-text search
 */
const searchProjects = async ({ query, userId, userRole, limit, offset }) => {
    if (userRole === "RECRUITER") {
        return [];
    }

    if (userRole === "CANDIDATE") {
        return prisma.$queryRaw`
      SELECT
        "id",
        "title",
        "description",
        "userId",
        "createdAt",
        "updatedAt",
        ts_rank(
          to_tsvector(
            'simple',
            coalesce("title", '') || ' ' ||
            coalesce("description", '')
          ),
          websearch_to_tsquery('simple', ${query})
        )::double precision AS "rank",
        'project' AS "resultType"
      FROM "Project"
      WHERE
        "userId" = ${userId}
        AND to_tsvector(
          'simple',
          coalesce("title", '') || ' ' ||
          coalesce("description", '')
        ) @@ websearch_to_tsquery('simple', ${query})
      ORDER BY
        "rank" DESC,
        "updatedAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    }

    // ADMIN: return all matching projects
    return prisma.$queryRaw`
    SELECT
      "id",
      "title",
      "description",
      "userId",
      "createdAt",
      "updatedAt",
      ts_rank(
        to_tsvector(
          'simple',
          coalesce("title", '') || ' ' ||
          coalesce("description", '')
        ),
        websearch_to_tsquery('simple', ${query})
      )::double precision AS "rank",
      'project' AS "resultType"
    FROM "Project"
    WHERE
      to_tsvector(
        'simple',
        coalesce("title", '') || ' ' ||
        coalesce("description", '')
      ) @@ websearch_to_tsquery('simple', ${query})
    ORDER BY
      "rank" DESC,
      "updatedAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
};

/**
 * Search CVs using PostgreSQL full-text search
 */
const searchCVs = async ({ query, userId, userRole, limit, offset }) => {
    if (userRole === "CANDIDATE") {
        return prisma.$queryRaw`
      SELECT
        c."id",
        c."fullName",
        c."email",
        c."phone",
        c."summary",
        c."skills",
        c."education",
        c."experience",
        c."projects",
        c."status",
        c."userId",
        c."positionId",
        c."createdAt",
        c."updatedAt",
        p."title" AS "positionTitle",
        ts_rank(
          to_tsvector(
            'simple',
            coalesce(c."fullName", '') || ' ' ||
            coalesce(c."email", '') || ' ' ||
            coalesce(c."phone", '') || ' ' ||
            coalesce(c."summary", '') || ' ' ||
            coalesce(c."skills", '') || ' ' ||
            coalesce(c."education", '') || ' ' ||
            coalesce(c."experience", '') || ' ' ||
            coalesce(c."projects", '')
          ),
          websearch_to_tsquery('simple', ${query})
        )::double precision AS "rank",
        'cv' AS "resultType"
      FROM "CV" c
      LEFT JOIN "Position" p ON c."positionId" = p."id"
      WHERE
        c."userId" = ${userId}
        AND to_tsvector(
          'simple',
          coalesce(c."fullName", '') || ' ' ||
          coalesce(c."email", '') || ' ' ||
          coalesce(c."phone", '') || ' ' ||
          coalesce(c."summary", '') || ' ' ||
          coalesce(c."skills", '') || ' ' ||
          coalesce(c."education", '') || ' ' ||
          coalesce(c."experience", '') || ' ' ||
          coalesce(c."projects", '')
        ) @@ websearch_to_tsquery('simple', ${query})
      ORDER BY
        "rank" DESC,
        c."updatedAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    }

    if (userRole === "RECRUITER") {
        return prisma.$queryRaw`
      SELECT
        c."id",
        c."fullName",
        c."email",
        c."phone",
        c."summary",
        c."skills",
        c."education",
        c."experience",
        c."projects",
        c."status",
        c."userId",
        c."positionId",
        c."createdAt",
        c."updatedAt",
        p."title" AS "positionTitle",
        ts_rank(
          to_tsvector(
            'simple',
            coalesce(c."fullName", '') || ' ' ||
            coalesce(c."email", '') || ' ' ||
            coalesce(c."phone", '') || ' ' ||
            coalesce(c."summary", '') || ' ' ||
            coalesce(c."skills", '') || ' ' ||
            coalesce(c."education", '') || ' ' ||
            coalesce(c."experience", '') || ' ' ||
            coalesce(c."projects", '')
          ),
          websearch_to_tsquery('simple', ${query})
        )::double precision AS "rank",
        'cv' AS "resultType"
      FROM "CV" c
      LEFT JOIN "Position" p ON c."positionId" = p."id"
      WHERE
        c."status" = 'PUBLISHED'
        AND to_tsvector(
          'simple',
          coalesce(c."fullName", '') || ' ' ||
          coalesce(c."email", '') || ' ' ||
          coalesce(c."phone", '') || ' ' ||
          coalesce(c."summary", '') || ' ' ||
          coalesce(c."skills", '') || ' ' ||
          coalesce(c."education", '') || ' ' ||
          coalesce(c."experience", '') || ' ' ||
          coalesce(c."projects", '')
        ) @@ websearch_to_tsquery('simple', ${query})
      ORDER BY
        "rank" DESC,
        c."updatedAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    }

    // ADMIN: return all matching CVs
    return prisma.$queryRaw`
    SELECT
      c."id",
      c."fullName",
      c."email",
      c."phone",
      c."summary",
      c."skills",
      c."education",
      c."experience",
      c."projects",
      c."status",
      c."userId",
      c."positionId",
      c."createdAt",
      c."updatedAt",
      p."title" AS "positionTitle",
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(c."fullName", '') || ' ' ||
          coalesce(c."email", '') || ' ' ||
          coalesce(c."phone", '') || ' ' ||
          coalesce(c."summary", '') || ' ' ||
          coalesce(c."skills", '') || ' ' ||
          coalesce(c."education", '') || ' ' ||
          coalesce(c."experience", '') || ' ' ||
          coalesce(c."projects", '')
        ),
        websearch_to_tsquery('simple', ${query})
      )::double precision AS "rank",
      'cv' AS "resultType"
    FROM "CV" c
    LEFT JOIN "Position" p ON c."positionId" = p."id"
    WHERE
      to_tsvector(
        'simple',
        coalesce(c."fullName", '') || ' ' ||
        coalesce(c."email", '') || ' ' ||
        coalesce(c."phone", '') || ' ' ||
        coalesce(c."summary", '') || ' ' ||
        coalesce(c."skills", '') || ' ' ||
        coalesce(c."education", '') || ' ' ||
        coalesce(c."experience", '') || ' ' ||
        coalesce(c."projects", '')
      ) @@ websearch_to_tsquery('simple', ${query})
    ORDER BY
      "rank" DESC,
      c."updatedAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
};

/**
 * Search discussions using PostgreSQL full-text search
 */
const searchDiscussions = async ({ query, limit, offset }) => {
    return prisma.$queryRaw`
    SELECT
      d."id",
      d."content",
      d."userId",
      d."positionId",
      d."createdAt",
      d."updatedAt",
      u."firstName" AS "authorFirstName",
      u."lastName" AS "authorLastName",
      p."title" AS "positionTitle",
      ts_rank(
        to_tsvector(
          'simple',
          coalesce(d."content", '')
        ),
        websearch_to_tsquery('simple', ${query})
      )::double precision AS "rank",
      'discussion' AS "resultType"
    FROM "Discussion" d
    LEFT JOIN "User" u ON d."userId" = u."id"
    LEFT JOIN "Position" p ON d."positionId" = p."id"
    WHERE
      to_tsvector(
        'simple',
        coalesce(d."content", '')
      ) @@ websearch_to_tsquery('simple', ${query})
    ORDER BY
      "rank" DESC,
      d."updatedAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
};

/**
 * Helper to safely parse a positive integer from a query parameter
 */
const getPositiveInteger = (value, fallback, maximum = null) => {
    if (typeof value !== "string" || value.trim() === "") {
        return fallback;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return fallback;
    }

    if (maximum !== null && parsedValue > maximum) {
        return maximum;
    }

    return parsedValue;
};

/**
 * Build the response structure with consistent result arrays
 */
const buildResponse = ({
    query,
    type,
    page,
    limit,
    positions = [],
    attributes = [],
    projects = [],
    cvs = [],
    discussions = [],
}) => {
    const counts = {
        positions: positions.length,
        attributes: attributes.length,
        projects: projects.length,
        cvs: cvs.length,
        discussions: discussions.length,
        totalReturned:
            positions.length +
            attributes.length +
            projects.length +
            cvs.length +
            discussions.length,
    };

    return {
        success: true,
        data: {
            query,
            type,
            page,
            limit,
            counts,
            results: {
                positions,
                attributes,
                projects,
                cvs,
                discussions,
            },
        },
    };
};

/**
 * Main search controller
 */
const search = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.toUpperCase() || "";

        // Validate user role
        if (!["CANDIDATE", "RECRUITER", "ADMIN"].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to use search.",
            });
        }

        // Validate query parameter
        const rawQuery = req.query.q;
        if (typeof rawQuery !== "string") {
            return res.status(400).json({
                success: false,
                message: "Search query must contain at least 2 characters.",
            });
        }

        const q = rawQuery.trim();
        if (q.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must contain at least 2 characters.",
            });
        }
        if (q.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Search query cannot exceed 100 characters.",
            });
        }

        // Validate type parameter
        const validTypes = [
            "all",
            "positions",
            "attributes",
            "projects",
            "cvs",
            "discussions",
        ];
        let type = "all";
        const rawType = req.query.type;

        if (rawType !== undefined) {
            if (typeof rawType !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid search type.",
                });
            }

            type = rawType.trim().toLowerCase();

            if (type === "" || !validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid search type.",
                });
            }
        }

        // Parse page and limit with strict integer validation
        const page = getPositiveInteger(req.query.page, 1);
        const limit = getPositiveInteger(req.query.limit, 10, 20);
        const offset = (page - 1) * limit;

        const searchOptions = {
            query: q,
            userId,
            userRole,
            limit,
            offset,
        };

        // Execute search based on type
        if (type === "all") {
            const [positions, attributes, projects, cvs, discussions] =
                await Promise.all([
                    searchPositions(searchOptions),
                    searchAttributes(searchOptions),
                    searchProjects(searchOptions),
                    searchCVs(searchOptions),
                    searchDiscussions(searchOptions),
                ]);

            return res.status(200).json(
                buildResponse({
                    query: q,
                    type,
                    page,
                    limit,
                    positions,
                    attributes,
                    projects,
                    cvs,
                    discussions,
                })
            );
        }

        if (type === "positions") {
            const positions = await searchPositions(searchOptions);
            return res.status(200).json(
                buildResponse({
                    query: q,
                    type,
                    page,
                    limit,
                    positions,
                })
            );
        }

        if (type === "attributes") {
            const attributes = await searchAttributes(searchOptions);
            return res.status(200).json(
                buildResponse({
                    query: q,
                    type,
                    page,
                    limit,
                    attributes,
                })
            );
        }

        if (type === "projects") {
            const projects = await searchProjects(searchOptions);
            return res.status(200).json(
                buildResponse({
                    query: q,
                    type,
                    page,
                    limit,
                    projects,
                })
            );
        }

        if (type === "cvs") {
            const cvs = await searchCVs(searchOptions);
            return res.status(200).json(
                buildResponse({
                    query: q,
                    type,
                    page,
                    limit,
                    cvs,
                })
            );
        }

        if (type === "discussions") {
            const discussions = await searchDiscussions(searchOptions);
            return res.status(200).json(
                buildResponse({
                    query: q,
                    type,
                    page,
                    limit,
                    discussions,
                })
            );
        }

        // Fallback (should never reach here due to validation)
        return res.status(400).json({
            success: false,
            message: "Invalid search type.",
        });
    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to perform search. Please try again.",
        });
    }
};

module.exports = {
    search,
};