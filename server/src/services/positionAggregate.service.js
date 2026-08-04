const {
    evaluatePositionEligibility,
} = require("./positionEligibility.service");

const SUPPORTED_FREQUENCY_TYPES = new Set([
    "STRING",
    "TEXT",
    "DROPDOWN",
]);

const UNSUPPORTED_AGGREGATE_TYPES = new Set([
    "IMAGE",
    "DATE",
    "PERIOD",
]);

const isMissingValue = (value) => {
    return (
        value === null ||
        value === undefined ||
        (
            typeof value === "string" &&
            value.trim() === ""
        )
    );
};

const parseFiniteNumber = (value) => {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return null;
    }

    const normalizedValue =
        typeof value === "string"
            ? value.trim()
            : value;

    if (normalizedValue === "") {
        return null;
    }

    const parsedValue = Number(
        normalizedValue
    );

    if (!Number.isFinite(parsedValue)) {
        return null;
    }

    return parsedValue;
};

const parseBoolean = (value) => {
    if (value === true) {
        return true;
    }

    if (value === false) {
        return false;
    }

    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue =
        value.trim().toLowerCase();

    if (normalizedValue === "true") {
        return true;
    }

    if (normalizedValue === "false") {
        return false;
    }

    return null;
};

const roundNumber = (value) => {
    return Number(value.toFixed(4));
};

const aggregateNumericValues = (values) => {
    const validValues = values
        .map(parseFiniteNumber)
        .filter((value) => value !== null);

    if (validValues.length === 0) {
        return {
            status: "SUPPORTED",
            count: 0,
            missingOrInvalidCount:
                values.length,
            average: null,
            minimum: null,
            maximum: null,
        };
    }

    const total = validValues.reduce(
        (sum, value) => sum + value,
        0
    );

    return {
        status: "SUPPORTED",
        count: validValues.length,
        missingOrInvalidCount:
            values.length -
            validValues.length,
        average: roundNumber(
            total / validValues.length
        ),
        minimum: Math.min(...validValues),
        maximum: Math.max(...validValues),
    };
};

const aggregateBooleanValues = (values) => {
    let trueCount = 0;
    let falseCount = 0;
    let invalidCount = 0;

    for (const value of values) {
        const parsedValue =
            parseBoolean(value);

        if (parsedValue === true) {
            trueCount += 1;
        } else if (
            parsedValue === false
        ) {
            falseCount += 1;
        } else {
            invalidCount += 1;
        }
    }

    return {
        status: "SUPPORTED",
        count: trueCount + falseCount,
        missingOrInvalidCount:
            invalidCount,
        trueCount,
        falseCount,
    };
};

const aggregateFrequencyValues = (
    values
) => {
    const frequencyMap = new Map();
    let missingCount = 0;

    for (const value of values) {
        if (isMissingValue(value)) {
            missingCount += 1;
            continue;
        }

        const displayValue =
            String(value)
                .trim()
                .replace(/\s+/g, " ");

        const normalizedValue =
            displayValue.toLowerCase();

        const current =
            frequencyMap.get(
                normalizedValue
            );

        if (current) {
            current.count += 1;
        } else {
            frequencyMap.set(
                normalizedValue,
                {
                    value: displayValue,
                    count: 1,
                }
            );
        }
    }

    const popularValues = [
        ...frequencyMap.values(),
    ].sort((first, second) => {
        if (
            second.count !== first.count
        ) {
            return (
                second.count -
                first.count
            );
        }

        return first.value.localeCompare(
            second.value
        );
    });

    const count = popularValues.reduce(
        (sum, item) =>
            sum + item.count,
        0
    );

    return {
        status: "SUPPORTED",
        count,
        missingOrInvalidCount:
            missingCount,
        popularValues,
    };
};

const aggregateValuesByType = (
    attributeType,
    values
) => {
    if (attributeType === "NUMERIC") {
        return aggregateNumericValues(
            values
        );
    }

    if (attributeType === "BOOLEAN") {
        return aggregateBooleanValues(
            values
        );
    }

    if (
        SUPPORTED_FREQUENCY_TYPES.has(
            attributeType
        )
    ) {
        return aggregateFrequencyValues(
            values
        );
    }

    if (
        UNSUPPORTED_AGGREGATE_TYPES.has(
            attributeType
        )
    ) {
        return {
            status: "UNSUPPORTED",
            count: 0,
            missingOrInvalidCount:
                values.length,
            reason:
                "This Attribute type is not aggregated.",
        };
    }

    return {
        status: "UNSUPPORTED",
        count: 0,
        missingOrInvalidCount:
            values.length,
        reason:
            "Unknown Attribute type.",
    };
};

const groupUserAttributesByCandidate = (
    userAttributes
) => {
    const groupedAttributes = new Map();

    for (const userAttribute of userAttributes) {
        const currentAttributes =
            groupedAttributes.get(
                userAttribute.userId
            ) || [];

        currentAttributes.push({
            attributeId:
                userAttribute.attributeId,
            value:
                userAttribute.value,
        });

        groupedAttributes.set(
            userAttribute.userId,
            currentAttributes
        );
    }

    return groupedAttributes;
};

const createAttributeValueMap = (
    userAttributes
) => {
    return new Map(
        userAttributes.map(
            (userAttribute) => [
                userAttribute.attributeId,
                userAttribute.value,
            ]
        )
    );
};

const getPositionAggregateResults = async (
    client,
    positionId
) => {
    if (!client) {
        throw new Error(
            "Prisma client is required."
        );
    }

    if (
        typeof positionId !== "string" ||
        !positionId.trim()
    ) {
        throw new Error(
            "Position ID is required."
        );
    }

    const normalizedPositionId =
        positionId.trim();

    const position =
        await client.position.findUnique({
            where: {
                id: normalizedPositionId,
            },
            select: {
                id: true,
                title: true,
                company: true,
                location: true,
                department: true,
                isActive: true,
                accessType: true,
                accessRuleLogic: true,
                accessRules: {
                    select: {
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
                positionAttributes: {
                    select: {
                        id: true,
                        attributeId: true,
                        createdAt: true,
                        attribute: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                                type: true,
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
                cvs: {
                    where: {
                        status: "PUBLISHED",
                    },
                    select: {
                        userId: true,
                    },
                },
            },
        });

    if (!position) {
        return null;
    }

    const publishedCandidateIds = [
        ...new Set(
            position.cvs
                .map((cv) => cv.userId)
                .filter(Boolean)
        ),
    ];

    const accessRuleAttributeIds =
        position.accessRules
            .map(
                (rule) =>
                    rule.attributeId
            )
            .filter(Boolean);

    const aggregateAttributeIds =
        position.positionAttributes
            .map(
                (positionAttribute) =>
                    positionAttribute.attributeId
            )
            .filter(Boolean);

    const requiredAttributeIds = [
        ...new Set([
            ...accessRuleAttributeIds,
            ...aggregateAttributeIds,
        ]),
    ];

    let userAttributes = [];

    if (
        publishedCandidateIds.length > 0 &&
        requiredAttributeIds.length > 0
    ) {
        userAttributes =
            await client.userAttribute.findMany({
                where: {
                    userId: {
                        in: publishedCandidateIds,
                    },
                    attributeId: {
                        in: requiredAttributeIds,
                    },
                },
                select: {
                    userId: true,
                    attributeId: true,
                    value: true,
                },
            });
    }

    const userAttributesByCandidate =
        groupUserAttributesByCandidate(
            userAttributes
        );

    const eligibleCandidateIds = [];

    for (
        const candidateId
        of publishedCandidateIds
    ) {
        const candidateAttributes =
            userAttributesByCandidate.get(
                candidateId
            ) || [];

        const eligibility =
            evaluatePositionEligibility(
                position,
                candidateAttributes
            );

        if (eligibility.eligible === true) {
            eligibleCandidateIds.push(
                candidateId
            );
        }
    }

    const aggregateResults =
        position.positionAttributes.map(
            (positionAttribute) => {
                const values =
                    eligibleCandidateIds.map(
                        (candidateId) => {
                            const candidateAttributes =
                                userAttributesByCandidate.get(
                                    candidateId
                                ) || [];

                            const attributeValueMap =
                                createAttributeValueMap(
                                    candidateAttributes
                                );

                            return (
                                attributeValueMap.get(
                                    positionAttribute
                                        .attributeId
                                ) ?? null
                            );
                        }
                    );

                return {
                    positionAttributeId:
                        positionAttribute.id,
                    attribute: {
                        id:
                            positionAttribute
                                .attribute.id,
                        name:
                            positionAttribute
                                .attribute.name,
                        category:
                            positionAttribute
                                .attribute.category,
                        type:
                            positionAttribute
                                .attribute.type,
                    },
                    result:
                        aggregateValuesByType(
                            positionAttribute
                                .attribute.type,
                            values
                        ),
                };
            }
        );

    return {
        position: {
            id: position.id,
            title: position.title,
            company: position.company,
            location: position.location,
            department:
                position.department,
            isActive: position.isActive,
            accessType:
                position.accessType,
            accessRuleLogic:
                position.accessRuleLogic,
        },
        publishedCandidateCount:
            publishedCandidateIds.length,
        eligibleCandidateCount:
            eligibleCandidateIds.length,
        excludedCandidateCount:
            publishedCandidateIds.length -
            eligibleCandidateIds.length,
        aggregateResults,
    };
};

module.exports = {
    aggregateValuesByType,
    getPositionAggregateResults,
};