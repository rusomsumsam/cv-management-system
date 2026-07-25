const { Prisma, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// --- Helpers ---

const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

const isManagementRole = (role) => ["RECRUITER", "ADMIN"].includes(role);

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

const findManageablePosition = async (client, positionId, role, userId) => {
    const where =
        role === "RECRUITER"
            ? {
                id: positionId,
                userId,
            }
            : {
                id: positionId,
            };

    return client.position.findFirst({
        where,
        select: {
            id: true,
            title: true,
            userId: true,
            accessType: true,
            accessRuleLogic: true,
            isActive: true,
        },
    });
};

const SUPPORTED_OPERATORS = [
    "EQUALS",
    "NOT_EQUALS",
    "CONTAINS",
    "NOT_CONTAINS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "BEFORE",
    "ON_OR_BEFORE",
    "AFTER",
    "ON_OR_AFTER",
    "IS_TRUE",
    "IS_FALSE",
];

const NO_VALUE_OPERATORS = ["IS_TRUE", "IS_FALSE"];

const OPERATORS_BY_ATTRIBUTE_TYPE = {
    STRING: ["EQUALS", "NOT_EQUALS", "CONTAINS", "NOT_CONTAINS"],
    TEXT: ["EQUALS", "NOT_EQUALS", "CONTAINS", "NOT_CONTAINS"],
    DROPDOWN: ["EQUALS", "NOT_EQUALS"],
    NUMERIC: [
        "EQUALS",
        "NOT_EQUALS",
        "GREATER_THAN",
        "GREATER_THAN_OR_EQUAL",
        "LESS_THAN",
        "LESS_THAN_OR_EQUAL",
    ],
    DATE: [
        "EQUALS",
        "NOT_EQUALS",
        "BEFORE",
        "ON_OR_BEFORE",
        "AFTER",
        "ON_OR_AFTER",
    ],
    BOOLEAN: ["IS_TRUE", "IS_FALSE"],
    PERIOD: [],
    IMAGE: [],
};

const normalizeOperator = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim().toUpperCase();
};


const validateRuleValue = (attributeType, operator, rawValue) => {
    if (NO_VALUE_OPERATORS.includes(operator)) {
        return { valid: true, value: null };
    }

    if (typeof rawValue !== "string") {
        return {
            valid: false,
            message: "A comparison value is required for this operator.",
        };
    }

    const value = rawValue.trim();

    if (!value) {
        return {
            valid: false,
            message: "A comparison value is required for this operator.",
        };
    }

    if (attributeType === "NUMERIC") {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return {
                valid: false,
                message: "Enter a valid numeric comparison value.",
            };
        }
        return { valid: true, value: String(numericValue) };
    }

    if (attributeType === "DATE") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return {
                valid: false,
                message: "Enter a valid date in YYYY-MM-DD format.",
            };
        }
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (
            date.getUTCFullYear() !== year ||
            date.getUTCMonth() !== month - 1 ||
            date.getUTCDate() !== day
        ) {
            return {
                valid: false,
                message: "Enter a valid calendar date.",
            };
        }
        return { valid: true, value };
    }

    return { valid: true, value };
};

const accessRuleSelect = {
    id: true,
    positionId: true,
    attributeId: true,
    operator: true,
    value: true,
    createdAt: true,
    updatedAt: true,
    attribute: {
        select: {
            id: true,
            name: true,
            category: true,
            type: true,
        },
    },
};

const handleServerError = (res, operation, error) => {
    console.error(`Position Access Rule ${operation} error:`, error.message);
    return res.status(500).json({
        success: false,
        message: `Failed to ${operation} Position Access Rule. Please try again.`,
    });
};

// --- Controllers ---

const getPositionAccessRules = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isManagementRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage Position Access Rules.",
            });
        }

        const positionId = getValidId(req.params.positionId);
        if (!positionId) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const position = await findManageablePosition(
            prisma,
            positionId,
            role,
            req.user.id
        );

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        const rules = await prisma.positionAccessRule.findMany({
            where: {
                positionId,
            },
            select: accessRuleSelect,
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });

        return res.status(200).json({
            success: true,
            data: {
                position: {
                    id: position.id,
                    title: position.title,
                    isActive: position.isActive,
                    accessType: position.accessType,
                    accessRuleLogic: position.accessRuleLogic,
                },
                rules,
            },
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

const updatePositionAccessSettings = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isManagementRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage Position Access Rules.",
            });
        }

        const positionId = getValidId(req.params.positionId);
        if (!positionId) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const position = await findManageablePosition(
            prisma,
            positionId,
            role,
            req.user.id
        );

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        const body = getRequestBody(req);
        const { accessType, accessRuleLogic } = body;

        const updateData = {};

        if (accessType !== undefined) {
            if (accessType !== "PUBLIC" && accessType !== "RESTRICTED") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid access type. Must be PUBLIC or RESTRICTED.",
                });
            }
            updateData.accessType = accessType;
        }

        if (accessRuleLogic !== undefined) {
            if (accessRuleLogic !== "ALL" && accessRuleLogic !== "ANY") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid access rule logic. Must be ALL or ANY.",
                });
            }
            updateData.accessRuleLogic = accessRuleLogic;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid Access Rule settings were provided.",
            });
        }

        let updatedPosition;

        try {
            updatedPosition = await prisma.position.update({
                where: {
                    id: position.id,
                },
                data: updateData,
                select: {
                    id: true,
                    title: true,
                    isActive: true,
                    accessType: true,
                    accessRuleLogic: true,
                },
            });
        } catch (updateError) {
            if (
                updateError instanceof Prisma.PrismaClientKnownRequestError &&
                updateError.code === "P2025"
            ) {
                return res.status(404).json({
                    success: false,
                    message: "Position not found.",
                });
            }

            throw updateError;
        }

        return res.status(200).json({
            success: true,
            message: "Position Access Rule settings updated successfully.",
            data: updatedPosition,
        });
    } catch (error) {
        return handleServerError(res, "update settings", error);
    }
};

const createPositionAccessRule = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isManagementRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage Position Access Rules.",
            });
        }

        const positionId = getValidId(req.params.positionId);
        if (!positionId) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const position = await findManageablePosition(
            prisma,
            positionId,
            role,
            req.user.id
        );

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        const body = getRequestBody(req);
        const { attributeId, operator, value } = body;

        if (!attributeId || typeof attributeId !== "string" || !attributeId.trim()) {
            return res.status(400).json({
                success: false,
                message: "Attribute ID is required.",
            });
        }
        const normalizedAttributeId = attributeId.trim();

        const normalizedOperator = normalizeOperator(operator);
        if (!SUPPORTED_OPERATORS.includes(normalizedOperator)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Access Rule operator.",
            });
        }

        const positionAttribute = await prisma.positionAttribute.findUnique({
            where: {
                positionId_attributeId: {
                    positionId,
                    attributeId: normalizedAttributeId,
                },
            },
            select: {
                id: true,
                attribute: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        type: true,
                    },
                },
            },
        });

        if (!positionAttribute) {
            return res.status(400).json({
                success: false,
                message: "The selected Attribute is not assigned to this Position.",
            });
        }

        const attributeType = positionAttribute.attribute.type;

        if (!OPERATORS_BY_ATTRIBUTE_TYPE[attributeType]) {
            return res.status(400).json({
                success: false,
                message: "This Attribute type does not support Access Rules.",
            });
        }

        if (!OPERATORS_BY_ATTRIBUTE_TYPE[attributeType].includes(normalizedOperator)) {
            return res.status(400).json({
                success: false,
                message: "The selected operator is not supported for this Attribute type.",
            });
        }

        const validatedValue = validateRuleValue(attributeType, normalizedOperator, value);
        if (!validatedValue.valid) {
            return res.status(400).json({
                success: false,
                message: validatedValue.message,
            });
        }

        try {
            const rule = await prisma.positionAccessRule.create({
                data: {
                    positionId,
                    attributeId: normalizedAttributeId,
                    operator: normalizedOperator,
                    value: validatedValue.value,
                },
                select: accessRuleSelect,
            });

            return res.status(201).json({
                success: true,
                message: "Position Access Rule created successfully.",
                data: rule,
            });
        } catch (createError) {
            if (
                createError instanceof Prisma.PrismaClientKnownRequestError &&
                createError.code === "P2002"
            ) {
                return res.status(409).json({
                    success: false,
                    message: "An Access Rule already exists for this Attribute.",
                });
            }
            throw createError;
        }
    } catch (error) {
        return handleServerError(res, "create", error);
    }
};

const updatePositionAccessRule = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isManagementRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage Position Access Rules.",
            });
        }

        const positionId = getValidId(req.params.positionId);
        if (!positionId) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const ruleId = getValidId(req.params.ruleId);
        if (!ruleId) {
            return res.status(400).json({
                success: false,
                message: "Access Rule ID is required.",
            });
        }

        const position = await findManageablePosition(
            prisma,
            positionId,
            role,
            req.user.id
        );

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        const existingRule = await prisma.positionAccessRule.findFirst({
            where: {
                id: ruleId,
                positionId,
            },
            select: {
                id: true,
                attributeId: true,
                operator: true,
                value: true,
            },
        });

        if (!existingRule) {
            return res.status(404).json({
                success: false,
                message: "Access Rule not found.",
            });
        }

        const body = getRequestBody(req);
        const { attributeId, operator, value } = body;

        let hasChanges = false;

        let finalAttributeId = existingRule.attributeId;
        if (attributeId !== undefined) {
            if (typeof attributeId !== "string" || !attributeId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attribute ID.",
                });
            }
            finalAttributeId = attributeId.trim();
            hasChanges = true;
        }

        let finalOperator = existingRule.operator;
        if (operator !== undefined) {
            const normalizedOp = normalizeOperator(operator);
            if (!SUPPORTED_OPERATORS.includes(normalizedOp)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Access Rule operator.",
                });
            }
            finalOperator = normalizedOp;
            hasChanges = true;
        }

        if (!hasChanges && value === undefined) {
            return res.status(400).json({
                success: false,
                message: "No valid Access Rule fields were provided.",
            });
        }

        const positionAttribute = await prisma.positionAttribute.findUnique({
            where: {
                positionId_attributeId: {
                    positionId,
                    attributeId: finalAttributeId,
                },
            },
            select: {
                id: true,
                attribute: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        type: true,
                    },
                },
            },
        });

        if (!positionAttribute) {
            return res.status(400).json({
                success: false,
                message: "The selected Attribute is not assigned to this Position.",
            });
        }

        const attributeType = positionAttribute.attribute.type;

        if (!OPERATORS_BY_ATTRIBUTE_TYPE[attributeType]) {
            return res.status(400).json({
                success: false,
                message: "This Attribute type does not support Access Rules.",
            });
        }

        if (!OPERATORS_BY_ATTRIBUTE_TYPE[attributeType].includes(finalOperator)) {
            return res.status(400).json({
                success: false,
                message: "The selected operator is not supported for this Attribute type.",
            });
        }

        let finalValue = existingRule.value;
        if (value !== undefined) {
            const validatedValue = validateRuleValue(attributeType, finalOperator, value);
            if (!validatedValue.valid) {
                return res.status(400).json({
                    success: false,
                    message: validatedValue.message,
                });
            }
            finalValue = validatedValue.value;
        } else if (hasChanges && !NO_VALUE_OPERATORS.includes(finalOperator)) {
            const validatedValue = validateRuleValue(attributeType, finalOperator, existingRule.value);
            if (!validatedValue.valid) {
                return res.status(400).json({
                    success: false,
                    message: `The existing value is not compatible with the new operator or attribute. Please provide a compatible value.`,
                });
            }
            finalValue = validatedValue.value;
        } else if (NO_VALUE_OPERATORS.includes(finalOperator)) {
            finalValue = null;
        }

        try {
            const updatedRule = await prisma.positionAccessRule.update({
                where: {
                    id: existingRule.id,
                },
                data: {
                    attributeId: finalAttributeId,
                    operator: finalOperator,
                    value: finalValue,
                },
                select: accessRuleSelect,
            });

            return res.status(200).json({
                success: true,
                message: "Position Access Rule updated successfully.",
                data: updatedRule,
            });
        } catch (updateError) {
            if (
                updateError instanceof Prisma.PrismaClientKnownRequestError &&
                updateError.code === "P2002"
            ) {
                return res.status(409).json({
                    success: false,
                    message: "An Access Rule already exists for this Attribute.",
                });
            }
            if (
                updateError instanceof Prisma.PrismaClientKnownRequestError &&
                updateError.code === "P2025"
            ) {
                return res.status(404).json({
                    success: false,
                    message: "Access Rule not found.",
                });
            }
            throw updateError;
        }
    } catch (error) {
        return handleServerError(res, "update", error);
    }
};

const deletePositionAccessRule = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const role = getRequestRole(req);
        if (!isManagementRole(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage Position Access Rules.",
            });
        }

        const positionId = getValidId(req.params.positionId);
        if (!positionId) {
            return res.status(400).json({
                success: false,
                message: "Position ID is required.",
            });
        }

        const ruleId = getValidId(req.params.ruleId);
        if (!ruleId) {
            return res.status(400).json({
                success: false,
                message: "Access Rule ID is required.",
            });
        }

        const position = await findManageablePosition(
            prisma,
            positionId,
            role,
            req.user.id
        );

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found.",
            });
        }

        const existingRule = await prisma.positionAccessRule.findFirst({
            where: {
                id: ruleId,
                positionId,
            },
            select: {
                id: true,
            },
        });

        if (!existingRule) {
            return res.status(404).json({
                success: false,
                message: "Access Rule not found.",
            });
        }

        try {
            await prisma.positionAccessRule.delete({
                where: {
                    id: existingRule.id,
                },
            });

            return res.status(200).json({
                success: true,
                message: "Position Access Rule deleted successfully.",
            });
        } catch (deleteError) {
            if (
                deleteError instanceof Prisma.PrismaClientKnownRequestError &&
                deleteError.code === "P2025"
            ) {
                return res.status(404).json({
                    success: false,
                    message: "Access Rule not found.",
                });
            }
            throw deleteError;
        }
    } catch (error) {
        return handleServerError(res, "delete", error);
    }
};

module.exports = {
    getPositionAccessRules,
    updatePositionAccessSettings,
    createPositionAccessRule,
    updatePositionAccessRule,
    deletePositionAccessRule,
};