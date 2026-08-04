const {
    PrismaClient,
} = require("@prisma/client");

const {
    validatePositionApiToken,
} = require("../services/positionApiToken.service");

const {
    getPositionAggregateResults,
} = require("../services/positionAggregate.service");

const prisma = new PrismaClient();

const extractBearerToken = (
    authorizationHeader
) => {
    if (
        typeof authorizationHeader !==
        "string"
    ) {
        return "";
    }

    const normalizedHeader =
        authorizationHeader.trim();

    if (!normalizedHeader) {
        return "";
    }

    const match =
        normalizedHeader.match(
            /^Bearer\s+(\S+)$/i
        );

    if (!match) {
        return "";
    }

    return match[1].trim();
};

const getPositionIntegrationResults = async (
    req,
    res
) => {
    try {
        const rawToken =
            extractBearerToken(
                req.headers.authorization
            );

        if (!rawToken) {
            return res.status(401).json({
                success: false,
                message:
                    "A valid Position API Token is required.",
            });
        }

        const validationResult =
            await validatePositionApiToken(
                prisma,
                rawToken
            );

        if (!validationResult) {
            return res.status(401).json({
                success: false,
                message:
                    "The Position API Token is invalid or no longer active.",
            });
        }

        const aggregateData =
            await getPositionAggregateResults(
                prisma,
                validationResult.position.id
            );

        if (!aggregateData) {
            return res.status(404).json({
                success: false,
                message:
                    "The Position linked to this API Token was not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Position aggregate results loaded successfully.",
            data: {
                position:
                    aggregateData.position,
                candidateSummary: {
                    publishedCandidateCount:
                        aggregateData
                            .publishedCandidateCount,
                    eligibleCandidateCount:
                        aggregateData
                            .eligibleCandidateCount,
                    excludedCandidateCount:
                        aggregateData
                            .excludedCandidateCount,
                },
                aggregateResults:
                    aggregateData
                        .aggregateResults,
                token: {
                    createdAt:
                        validationResult
                            .tokenRecord
                            .createdAt,
                    updatedAt:
                        validationResult
                            .tokenRecord
                            .updatedAt,
                },
                generatedAt:
                    new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error(
            "Position Integration request error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to process the Position integration request.",
        });
    }
};

module.exports = {
    extractBearerToken,
    getPositionIntegrationResults,
};
