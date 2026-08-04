const {
    PrismaClient,
} = require("@prisma/client");

const {
    generateOrRegeneratePositionApiToken,
} = require("../services/positionApiToken.service");

const prisma = new PrismaClient();

const getValidId = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
};

const generatePositionApiToken = async (
    req,
    res
) => {
    try {
        if (
            !req.user?.id ||
            typeof req.user.id !== "string" ||
            !req.user.id.trim()
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const positionId = getValidId(
            req.params.id
        );

        if (!positionId) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const result =
            await generateOrRegeneratePositionApiToken(
                prisma,
                {
                    positionId,
                    createdById:
                        req.user.id.trim(),
                }
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Position API Token generated successfully. Copy and store it securely because it will not be shown again.",
            data: {
                token: result.token,
                position: result.position,
                createdAt:
                    result.tokenRecord.createdAt,
                updatedAt:
                    result.tokenRecord.updatedAt,
            },
        });
    } catch (error) {
        console.error(
            "Position API Token generation error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate the Position API Token. Please try again.",
        });
    }
};

module.exports = {
    generatePositionApiToken,
};