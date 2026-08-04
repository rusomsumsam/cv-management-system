const {
    createHash,
    randomBytes,
} = require("node:crypto");

const POSITION_TOKEN_PREFIX = "cvms_pos_";
const POSITION_TOKEN_RANDOM_BYTES = 32;

const getValidId = (value, fieldName) => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new Error(`${fieldName} is required.`);
    }

    return value.trim();
};

const createRawPositionApiToken = () => {
    const randomPart = randomBytes(
        POSITION_TOKEN_RANDOM_BYTES
    ).toString("base64url");

    return `${POSITION_TOKEN_PREFIX}${randomPart}`;
};

const hashPositionApiToken = (rawToken) => {
    if (
        typeof rawToken !== "string" ||
        !rawToken.trim()
    ) {
        throw new Error(
            "A valid Position API Token is required."
        );
    }

    return createHash("sha256")
        .update(rawToken.trim(), "utf8")
        .digest("hex");
};

const generateOrRegeneratePositionApiToken =
    async (
        client,
        {
            positionId,
            createdById,
        }
    ) => {
        if (!client) {
            throw new Error(
                "Prisma client is required."
            );
        }

        const normalizedPositionId =
            getValidId(
                positionId,
                "Position ID"
            );

        const normalizedCreatedById =
            getValidId(
                createdById,
                "Creator User ID"
            );

        const position =
            await client.position.findUnique({
                where: {
                    id: normalizedPositionId,
                },
                select: {
                    id: true,
                    title: true,
                },
            });

        if (!position) {
            return null;
        }

        const rawToken =
            createRawPositionApiToken();

        const tokenHash =
            hashPositionApiToken(rawToken);

        const savedToken =
            await client.positionApiToken.upsert({
                where: {
                    positionId:
                        normalizedPositionId,
                },
                create: {
                    positionId:
                        normalizedPositionId,
                    tokenHash,
                    createdById:
                        normalizedCreatedById,
                },
                update: {
                    tokenHash,
                    createdById:
                        normalizedCreatedById,
                },
                select: {
                    id: true,
                    positionId: true,
                    createdById: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        return {
            token: rawToken,
            tokenRecord: savedToken,
            position: {
                id: position.id,
                title: position.title,
            },
        };
    };

const validatePositionApiToken = async (
    client,
    rawToken
) => {
    if (!client) {
        throw new Error(
            "Prisma client is required."
        );
    }

    if (
        typeof rawToken !== "string" ||
        !rawToken.trim() ||
        !rawToken.trim().startsWith(
            POSITION_TOKEN_PREFIX
        )
    ) {
        return null;
    }

    const tokenHash =
        hashPositionApiToken(rawToken);

    const tokenRecord =
        await client.positionApiToken.findUnique({
            where: {
                tokenHash,
            },
            select: {
                id: true,
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
                        accessType: true,
                        accessRuleLogic: true,
                    },
                },
            },
        });

    if (
        !tokenRecord ||
        !tokenRecord.position
    ) {
        return null;
    }

    return {
        tokenRecord: {
            id: tokenRecord.id,
            positionId:
                tokenRecord.positionId,
            createdAt:
                tokenRecord.createdAt,
            updatedAt:
                tokenRecord.updatedAt,
        },
        position:
            tokenRecord.position,
    };
};

module.exports = {
    createRawPositionApiToken,
    hashPositionApiToken,
    generateOrRegeneratePositionApiToken,
    validatePositionApiToken,
};
