// server/src/services/positionEligibility.service.js

// --- Internal Helpers ---

const isMissingValue = (value) => {
    return (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    );
};

const normalizeText = (value) => {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).trim().toLowerCase();
};

const parseBoolean = (value) => {
    if (value === true) {
        return { valid: true, value: true };
    }
    if (value === false) {
        return { valid: true, value: false };
    }
    if (typeof value !== "string") {
        return { valid: false, value: null };
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
        return { valid: true, value: true };
    }
    if (normalized === "false") {
        return { valid: true, value: false };
    }
    return { valid: false, value: null };
};

const parseFiniteNumber = (value) => {
    if (typeof value !== "string" && typeof value !== "number") {
        return { valid: false, value: null };
    }
    const normalized = typeof value === "string" ? value.trim() : value;
    if (normalized === "") {
        return { valid: false, value: null };
    }
    const number = Number(normalized);
    if (!Number.isFinite(number)) {
        return { valid: false, value: null };
    }
    return { valid: true, value: number };
};

const parseDateOnly = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        return { valid: false, value: null };
    }
    const normalized = value.trim();
    const [year, month, day] = normalized.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return { valid: false, value: null };
    }
    return { valid: true, value: date.getTime() };
};

// --- evaluateRule ---

const evaluateRule = (rule, candidateValue) => {
    // Basic validation
    if (!rule || !rule.attribute) {
        return {
            passed: false,
            reason: "INVALID_RULE",
            ruleId: rule?.id || null,
            attributeId: rule?.attributeId || null,
            attributeName: null,
            attributeType: null,
            operator: rule?.operator || null,
            expectedValue: rule?.value || null,
            actualValue: candidateValue ?? null,
        };
    }

    const { id, attributeId, operator, value: expectedValue, attribute } = rule;
    const {name, type } = attribute;

    // Missing candidate value
    if (isMissingValue(candidateValue)) {
        return {
            passed: false,
            reason: "MISSING_CANDIDATE_VALUE",
            ruleId: id,
            attributeId: attributeId,
            attributeName: name,
            attributeType: type,
            operator: operator,
            expectedValue: expectedValue ?? null,
            actualValue: null,
        };
    }

    // Unsupported attribute types
    if (type === "IMAGE" || type === "PERIOD") {
        return {
            passed: false,
            reason: "UNSUPPORTED_ATTRIBUTE_TYPE",
            ruleId: id,
            attributeId: attributeId,
            attributeName: name,
            attributeType: type,
            operator: operator,
            expectedValue: expectedValue ?? null,
            actualValue: candidateValue,
        };
    }

    // --- STRING and TEXT ---
    if (type === "STRING" || type === "TEXT") {
        if (isMissingValue(expectedValue)) {
            return {
                passed: false,
                reason: "INVALID_RULE_VALUE",
                ruleId: id,
                attributeId: attributeId,
                attributeName: name,
                attributeType: type,
                operator: operator,
                expectedValue: expectedValue ?? null,
                actualValue: candidateValue,
            };
        }
        const actual = normalizeText(candidateValue);
        const expected = normalizeText(expectedValue);
        let passed = false;
        switch (operator) {
            case "EQUALS":
                passed = actual === expected;
                break;
            case "NOT_EQUALS":
                passed = actual !== expected;
                break;
            case "CONTAINS":
                passed = actual.includes(expected);
                break;
            case "NOT_CONTAINS":
                passed = !actual.includes(expected);
                break;
            default:
                return {
                    passed: false,
                    reason: "UNSUPPORTED_OPERATOR",
                    ruleId: id,
                    attributeId: attributeId,
                    attributeName: name,
                    attributeType: type,
                    operator: operator,
                    expectedValue: expectedValue,
                    actualValue: candidateValue,
                };
        }
        return {
            passed,
            reason: passed ? "RULE_PASSED" : "RULE_FAILED",
            ruleId: id,
            attributeId: attributeId,
            attributeName: name,
            attributeType: type,
            operator: operator,
            expectedValue: expectedValue,
            actualValue: candidateValue,
        };
    }

    // --- DROPDOWN ---
    if (type === "DROPDOWN") {
        if (isMissingValue(expectedValue)) {
            return {
                passed: false,
                reason: "INVALID_RULE_VALUE",
                ruleId: id,
                attributeId: attributeId,
                attributeName: name,
                attributeType: type,
                operator: operator,
                expectedValue: expectedValue ?? null,
                actualValue: candidateValue,
            };
        }
        const actual = normalizeText(candidateValue);
        const expected = normalizeText(expectedValue);
        let passed = false;
        switch (operator) {
            case "EQUALS":
                passed = actual === expected;
                break;
            case "NOT_EQUALS":
                passed = actual !== expected;
                break;
            default:
                return {
                    passed: false,
                    reason: "UNSUPPORTED_OPERATOR",
                    ruleId: id,
                    attributeId: attributeId,
                    attributeName: name,
                    attributeType: type,
                    operator: operator,
                    expectedValue: expectedValue,
                    actualValue: candidateValue,
                };
        }
        return {
            passed,
            reason: passed ? "RULE_PASSED" : "RULE_FAILED",
            ruleId: id,
            attributeId: attributeId,
            attributeName: name,
            attributeType: type,
            operator: operator,
            expectedValue: expectedValue,
            actualValue: candidateValue,
        };
    }

    // --- NUMERIC ---
    if (type === "NUMERIC") {
        const actualResult = parseFiniteNumber(candidateValue);
        if (!actualResult.valid) {
            return {
                passed: false,
                reason: "INVALID_CANDIDATE_VALUE",
                ruleId: id,
                attributeId: attributeId,
                attributeName: name,
                attributeType: type,
                operator: operator,
                expectedValue: expectedValue ?? null,
                actualValue: candidateValue,
            };
        }
        const expectedResult = parseFiniteNumber(expectedValue);
        if (!expectedResult.valid) {
            return {
                passed: false,
                reason: "INVALID_RULE_VALUE",
                ruleId: id,
                attributeId: attributeId,
                attributeName: name,
                attributeType: type,
                operator: operator,
                expectedValue: expectedValue ?? null,
                actualValue: candidateValue,
            };
        }
        const actual = actualResult.value;
        const expected = expectedResult.value;
        let passed = false;
        switch (operator) {
            case "EQUALS":
                passed = actual === expected;
                break;
            case "NOT_EQUALS":
                passed = actual !== expected;
                break;
            case "GREATER_THAN":
                passed = actual > expected;
                break;
            case "GREATER_THAN_OR_EQUAL":
                passed = actual >= expected;
                break;
            case "LESS_THAN":
                passed = actual < expected;
                break;
            case "LESS_THAN_OR_EQUAL":
                passed = actual <= expected;
                break;
            default:
                return {
                    passed: false,
                    reason: "UNSUPPORTED_OPERATOR",
                    ruleId: id,
                    attributeId: attributeId,
                    attributeName: name,
                    attributeType: type,
                    operator: operator,
                    expectedValue: expectedValue,
                    actualValue: candidateValue,
                };
        }
        return {
            passed,
            reason: passed ? "RULE_PASSED" : "RULE_FAILED",
            ruleId: id,
            attributeId: attributeId,
            attributeName: name,
            attributeType: type,
            operator: operator,
            expectedValue: expectedValue,
            actualValue: candidateValue,
        };
    }

    // --- DATE ---
    if (type === "DATE") {
        const actualResult = parseDateOnly(candidateValue);
        if (!actualResult.valid) {
            return {
                passed: false,
                reason: "INVALID_CANDIDATE_VALUE",
                ruleId: id,
                attributeId: attributeId,
                attributeName: name,
                attributeType: type,
                operator: operator,
                expectedValue: expectedValue ?? null,
                actualValue: candidateValue,
            };
        }
        const expectedResult = parseDateOnly(expectedValue);
        if (!expectedResult.valid) {
            return {
                passed: false,
                reason: "INVALID_RULE_VALUE",
                ruleId: id,
                attributeId: attributeId,
                attributeName: name,
                attributeType: type,
                operator: operator,
                expectedValue: expectedValue ?? null,
                actualValue: candidateValue,
            };
        }
        const actual = actualResult.value;
        const expected = expectedResult.value;
        let passed = false;
        switch (operator) {
            case "EQUALS":
                passed = actual === expected;
                break;
            case "NOT_EQUALS":
                passed = actual !== expected;
                break;
            case "BEFORE":
                passed = actual < expected;
                break;
            case "ON_OR_BEFORE":
                passed = actual <= expected;
                break;
            case "AFTER":
                passed = actual > expected;
                break;
            case "ON_OR_AFTER":
                passed = actual >= expected;
                break;
            default:
                return {
                    passed: false,
                    reason: "UNSUPPORTED_OPERATOR",
                    ruleId: id,
                    attributeId: attributeId,
                    attributeName: name,
                    attributeType: type,
                    operator: operator,
                    expectedValue: expectedValue,
                    actualValue: candidateValue,
                };
        }
        return {
            passed,
            reason: passed ? "RULE_PASSED" : "RULE_FAILED",
            ruleId: id,
            attributeId: attributeId,
            attributeName: name,
            attributeType: type,
            operator: operator,
            expectedValue: expectedValue,
            actualValue: candidateValue,
        };
    }

    // --- BOOLEAN ---
    if (type === "BOOLEAN") {
        const actualResult = parseBoolean(candidateValue);
        if (!actualResult.valid) {
            return {
                passed: false,
                reason: "INVALID_CANDIDATE_VALUE",
                ruleId: id,
                attributeId: attributeId,
                attributeName: name,
                attributeType: type,
                operator: operator,
                expectedValue: null,
                actualValue: candidateValue,
            };
        }
        const actual = actualResult.value;
        let passed = false;
        switch (operator) {
            case "IS_TRUE":
                passed = actual === true;
                break;
            case "IS_FALSE":
                passed = actual === false;
                break;
            default:
                return {
                    passed: false,
                    reason: "UNSUPPORTED_OPERATOR",
                    ruleId: id,
                    attributeId: attributeId,
                    attributeName: name,
                    attributeType: type,
                    operator: operator,
                    expectedValue: null,
                    actualValue: candidateValue,
                };
        }
        return {
            passed,
            reason: passed ? "RULE_PASSED" : "RULE_FAILED",
            ruleId: id,
            attributeId: attributeId,
            attributeName: name,
            attributeType: type,
            operator: operator,
            expectedValue: null,
            actualValue: candidateValue,
        };
    }

    // Unknown attribute type — fail closed
    return {
        passed: false,
        reason: "UNSUPPORTED_ATTRIBUTE_TYPE",
        ruleId: id,
        attributeId: attributeId,
        attributeName: name,
        attributeType: type,
        operator: operator,
        expectedValue: expectedValue ?? null,
        actualValue: candidateValue,
    };
};

// --- evaluatePositionEligibility ---

const evaluatePositionEligibility = (position, userAttributes) => {
    // Position missing
    if (!position) {
        return {
            eligible: false,
            reason: "POSITION_NOT_FOUND",
            accessType: null,
            accessRuleLogic: null,
            totalRules: 0,
            passedRules: 0,
            failedRules: 0,
            ruleResults: [],
        };
    }

    // Inactive position
    if (position.isActive !== true) {
        return {
            eligible: false,
            reason: "POSITION_INACTIVE",
            accessType: position.accessType,
            accessRuleLogic: position.accessRuleLogic,
            totalRules: 0,
            passedRules: 0,
            failedRules: 0,
            ruleResults: [],
        };
    }

    // Public position
    if (position.accessType === "PUBLIC") {
        return {
            eligible: true,
            reason: "PUBLIC_POSITION",
            accessType: position.accessType,
            accessRuleLogic: position.accessRuleLogic,
            totalRules: 0,
            passedRules: 0,
            failedRules: 0,
            ruleResults: [],
        };
    }

    // Invalid access type
    if (position.accessType !== "RESTRICTED") {
        return {
            eligible: false,
            reason: "INVALID_ACCESS_TYPE",
            accessType: position.accessType,
            accessRuleLogic: position.accessRuleLogic,
            totalRules: 0,
            passedRules: 0,
            failedRules: 0,
            ruleResults: [],
        };
    }

    // Restricted without rules
    const rules = Array.isArray(position.accessRules)
        ? position.accessRules
        : [];
    if (rules.length === 0) {
        return {
            eligible: false,
            reason: "RESTRICTED_WITHOUT_RULES",
            accessType: position.accessType,
            accessRuleLogic: position.accessRuleLogic,
            totalRules: 0,
            passedRules: 0,
            failedRules: 0,
            ruleResults: [],
        };
    }

    // Build attribute value map
    const attributeValueMap = new Map();
    if (Array.isArray(userAttributes)) {
        for (const attr of userAttributes) {
            if (attr.attributeId && attr.value !== undefined) {
                attributeValueMap.set(attr.attributeId, attr.value);
            }
        }
    }

    // Evaluate all rules
    const ruleResults = [];
    for (const rule of rules) {
        const candidateValue = attributeValueMap.get(rule.attributeId) ?? null;
        const result = evaluateRule(rule, candidateValue);
        ruleResults.push(result);
    }

    const totalRules = ruleResults.length;
    const passedRules = ruleResults.filter((r) => r.passed).length;
    const failedRules = totalRules - passedRules;

    // Invalid logic
    if (position.accessRuleLogic !== "ALL" && position.accessRuleLogic !== "ANY") {
        return {
            eligible: false,
            reason: "INVALID_RULE_LOGIC",
            accessType: position.accessType,
            accessRuleLogic: position.accessRuleLogic,
            totalRules,
            passedRules,
            failedRules,
            ruleResults,
        };
    }

    let eligible = false;
    let reason = "";

    if (position.accessRuleLogic === "ALL") {
        eligible = ruleResults.every((r) => r.passed);
        reason = eligible ? "ALL_RULES_PASSED" : "ONE_OR_MORE_RULES_FAILED";
    } else if (position.accessRuleLogic === "ANY") {
        eligible = ruleResults.some((r) => r.passed);
        reason = eligible ? "AT_LEAST_ONE_RULE_PASSED" : "ALL_RULES_FAILED";
    }

    return {
        eligible,
        reason,
        accessType: position.accessType,
        accessRuleLogic: position.accessRuleLogic,
        totalRules,
        passedRules,
        failedRules,
        ruleResults,
    };
};

// --- loadAndEvaluatePositionEligibility ---

const loadAndEvaluatePositionEligibility = async (client, positionId, candidateUserId) => {
    if (!client) {
        throw new Error("Prisma client is required.");
    }
    if (!positionId || typeof positionId !== "string" || !positionId.trim()) {
        throw new Error("Position ID is required.");
    }
    if (!candidateUserId || typeof candidateUserId !== "string" || !candidateUserId.trim()) {
        throw new Error("Candidate User ID is required.");
    }

    const trimmedPositionId = positionId.trim();
    const trimmedCandidateUserId = candidateUserId.trim();

    // Load position with access rules and their attributes
    const position = await client.position.findUnique({
        where: {
            id: trimmedPositionId,
        },
        select: {
            id: true,
            title: true,
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
        },
    });

    if (!position) {
        return {
            position: null,
            eligibility: {
                eligible: false,
                reason: "POSITION_NOT_FOUND",
                accessType: null,
                accessRuleLogic: null,
                totalRules: 0,
                passedRules: 0,
                failedRules: 0,
                ruleResults: [],
            },
        };
    }

    // Extract unique attribute IDs from rules
    const accessRules = Array.isArray(position.accessRules)
        ? position.accessRules
        : [];

    const attributeIds = [
        ...new Set(
            accessRules
                .map((rule) => rule.attributeId)
                .filter(Boolean)
        ),
    ];

    let userAttributes = [];

    if (attributeIds.length > 0) {
        userAttributes = await client.userAttribute.findMany({
            where: {
                userId: trimmedCandidateUserId,
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

    const eligibility = evaluatePositionEligibility(
        position,
        userAttributes
    );

    return {
        position: {
            id: position.id,
            title: position.title,
            isActive: position.isActive,
            accessType: position.accessType,
            accessRuleLogic: position.accessRuleLogic,
        },
        eligibility,
    };
};

module.exports = {
    evaluateRule,
    evaluatePositionEligibility,
    loadAndEvaluatePositionEligibility,
};