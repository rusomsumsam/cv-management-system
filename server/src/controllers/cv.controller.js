// server/src/controllers/cv.controller.js
const { Prisma, PrismaClient } = require("@prisma/client");
const {
    evaluatePositionEligibility,
    loadAndEvaluatePositionEligibility,
} = require("../services/positionEligibility.service");
const {
    loadFilteredProfileProjects,
} = require("../services/projectFiltering.service");

const prisma = new PrismaClient();

/**
 * Get authenticated role safely
 */
const getRequestRole = (req) => req.user?.role?.toUpperCase() || "";

/**
 * Check if role is supported
 */
const isSupportedRole = (role) =>
    ["CANDIDATE", "RECRUITER", "ADMIN"].includes(role);

/**
 * Normalize optional string field
 */
const normalizeOptionalString = (value) => {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== "string") {
        return null;
    }
    const trimmedValue = value.trim();
    return trimmedValue || null;
};

/**
 * Validate optional string input type
 */
const isValidOptionalStringInput = (value) => {
    return value === undefined || value === null || typeof value === "string";
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate and normalize ID parameter
 */
const getValidId = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
};

/**
 * Missing value detection
 */
const isMissingValue = (value) => {
    return (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    );
};

/**
 * Safe request body extraction
 */
const getRequestBody = (req) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return {};
    }
    return req.body;
};

/**
 * Handle server errors safely
 */
const handleServerError = (res, operation, error) => {
    console.error(`CV ${operation} error:`, error.message);
    return res.status(500).json({
        success: false,
        message: `Failed to ${operation} CV. Please try again.`,
    });
};

/**
 * Controlled application error for expected transaction failures
 */
class CVRequestError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.name = "CVRequestError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Position eligibility select for in-memory evaluation
 */
const positionEligibilitySelect = {
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
};

/**
 * Apply authoritative user identity over legacy CV fields
 */
const applyAuthoritativeCVIdentity = (cv) => {
    if (!cv || typeof cv !== "object" || Array.isArray(cv)) {
        return cv;
    }

    const firstName =
        typeof cv.user?.firstName === "string"
            ? cv.user.firstName.trim()
            : "";

    const lastName =
        typeof cv.user?.lastName === "string"
            ? cv.user.lastName.trim()
            : "";

    const profileFullName =
        [firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim();

    const fallbackFullName =
        typeof cv.fullName === "string"
            ? cv.fullName.trim()
            : "";

    const profileEmail =
        typeof cv.user?.email === "string"
            ? cv.user.email.trim().toLowerCase()
            : "";

    const fallbackEmail =
        typeof cv.email === "string"
            ? cv.email.trim().toLowerCase()
            : "";

    return {
        ...cv,
        fullName: profileFullName || fallbackFullName,
        email: profileEmail || fallbackEmail,
    };
};

/**
 * Dynamic selection for CV list items (Admin)
 */
const getAdminCVListSelect = () => ({
    id: true,
    fullName: true,
    email: true,
    phone: true,
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    status: true,
    userId: true,
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
        },
    },
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            email: true,
        },
    },
    _count: {
        select: {
            likes: true,
        },
    },
});

/**
 * Recruiter-specific CV list select with eligibility data
 */
const getRecruiterCVListSelect = (currentUserId) => ({
    id: true,
    fullName: true,
    email: true,
    phone: true,
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    status: true,
    userId: true,
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
            accessRules: positionEligibilitySelect.accessRules,
        },
    },
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            email: true,
        },
    },
    _count: {
        select: {
            likes: true,
        },
    },
    likes: {
        where: {
            userId: currentUserId,
        },
        select: {
            id: true,
        },
        take: 1,
    },
});

/**
 * Candidate-specific CV list select with eligibility data
 */
const getCandidateCVListSelect = () => ({
    id: true,
    fullName: true,
    email: true,
    phone: true,
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    status: true,
    userId: true,
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
            accessRules: positionEligibilitySelect.accessRules,
        },
    },
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            email: true,
        },
    },
    _count: {
        select: {
            likes: true,
        },
    },
});

/**
 * Dynamic selection for CV details (without positionAttributes)
 */
const getCVDetailSelect = (role, currentUserId) => {
    const select = {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        summary: true,
        skills: true,
        education: true,
        experience: true,
        projects: true,
        status: true,
        userId: true,
        positionId: true,
        createdAt: true,
        updatedAt: true,
        position: {
            select: {
                id: true,
                title: true,
                description: true,
                company: true,
                location: true,
                department: true,
                deadline: true,
                isActive: true,
            },
        },
        user: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                location: true,
            },
        },
        _count: {
            select: {
                likes: true,
            },
        },
    };

    if (role === "RECRUITER" && currentUserId) {
        select.likes = {
            where: {
                userId: currentUserId,
            },
            select: {
                id: true,
            },
            take: 1,
        };
    }

    return select;
};

/**
 * Dynamic selection for CV details with PositionAttributes
 */
const getCVDetailWithPositionAttributesSelect = (role, currentUserId) => {
    const detailSelect = getCVDetailSelect(role, currentUserId);

    return {
        ...detailSelect,
        position: {
            select: {
                ...detailSelect.position.select,
                positionAttributes: {
                    select: {
                        id: true,
                        attributeId: true,
                        attribute: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                                type: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        },
    };
};

/**
 * Static mutation selection (without recruiter like state)
 */
const cvMutationSelect = getCVDetailSelect("", "");

/**
 * Create a new CV
 */
const createCV = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    if (role !== "CANDIDATE") {
        return res.status(403).json({
            success: false,
            message: "Only Candidates can create CVs through this endpoint.",
        });
    }

    const body = getRequestBody(req);

    const { positionId } = body;

    if (typeof positionId !== "string" || positionId.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Position is required.",
        });
    }

    const normalizedPositionId = positionId.trim();

    try {
        const newCV = await prisma.$transaction(async (tx) => {
            // 1. Evaluate Position eligibility
            const eligibilityResult = await loadAndEvaluatePositionEligibility(
                tx,
                normalizedPositionId,
                req.user.id
            );

            if (
                !eligibilityResult.position ||
                eligibilityResult.eligibility?.eligible !== true
            ) {
                throw new CVRequestError(404, "Position not found.");
            }

            // 2. Load Position and Position Attributes for CV generation
            const position = await tx.position.findUnique({
                where: { id: normalizedPositionId },
                select: {
                    id: true,
                    isActive: true,
                    positionAttributes: {
                        select: {
                            attributeId: true,
                        },
                    },
                },
            });

            // Defensive check - should never fail after eligibility passed, but safe
            if (!position) {
                throw new CVRequestError(404, "Position not found.");
            }

            if (!position.isActive) {
                throw new CVRequestError(404, "Position not found.");
            }

            // 3. Check for existing CV
            const existingCV = await tx.cV.findUnique({
                where: {
                    userId_positionId: {
                        userId: req.user.id,
                        positionId: normalizedPositionId,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (existingCV) {
                throw new CVRequestError(
                    409,
                    "A CV already exists for this position."
                );
            }

            // 4. Ensure all Position Attributes have UserAttribute records
            const positionAttributeIds = position.positionAttributes.map(
                (item) => item.attributeId
            );

            let missingAttributeIds = [];

            if (positionAttributeIds.length > 0) {
                const existingUserAttributes = await tx.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: positionAttributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                    },
                });

                const existingAttributeIds = new Set(
                    existingUserAttributes.map((item) => item.attributeId)
                );

                missingAttributeIds = positionAttributeIds.filter(
                    (attributeId) => !existingAttributeIds.has(attributeId)
                );
            }

            if (missingAttributeIds.length > 0) {
                await tx.userAttribute.createMany({
                    data: missingAttributeIds.map((attributeId) => ({
                        userId: req.user.id,
                        attributeId,
                        value: null,
                    })),
                    skipDuplicates: true,
                });
            }

            // 5. Load authoritative Candidate Profile
            const candidateProfile = await tx.user.findUnique({
                where: {
                    id: req.user.id,
                },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            });

            if (!candidateProfile) {
                throw new CVRequestError(404, "Candidate profile not found.");
            }

            const profileFullName = [
                typeof candidateProfile.firstName === "string"
                    ? candidateProfile.firstName.trim()
                    : "",
                typeof candidateProfile.lastName === "string"
                    ? candidateProfile.lastName.trim()
                    : "",
            ]
                .filter(Boolean)
                .join(" ")
                .trim();

            const profileEmail =
                typeof candidateProfile.email === "string"
                    ? candidateProfile.email.trim().toLowerCase()
                    : "";

            if (!profileFullName) {
                throw new CVRequestError(
                    409,
                    "Complete your Profile name before creating a CV."
                );
            }

            if (!profileEmail || !isValidEmail(profileEmail)) {
                throw new CVRequestError(
                    409,
                    "Complete a valid Profile email before creating a CV."
                );
            }

            // 6. Create the Draft CV
            const createdCV = await tx.cV.create({
                data: {
                    fullName: profileFullName,
                    email: profileEmail,
                    phone: null,
                    summary: null,
                    skills: null,
                    education: null,
                    experience: null,
                    projects: null,
                    userId: req.user.id,
                    positionId: normalizedPositionId,
                    status: "DRAFT",
                },
                select: cvMutationSelect,
            });

            return createdCV;
        });

        return res.status(201).json({
            success: true,
            data: applyAuthoritativeCVIdentity(newCV),
        });
    } catch (error) {
        if (error instanceof CVRequestError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                ...(error.details || {}),
            });
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                success: false,
                message: "A CV already exists for this position.",
            });
        }

        return handleServerError(res, "create", error);
    }
};

/**
 * Get all CVs (role-based filtering)
 */
const getCVs = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    // Candidate branch: eligibility-aware listing
    if (role === "CANDIDATE") {
        try {
            // 1. Load Candidate's CVs with eligibility data
            const candidateCVs = await prisma.cV.findMany({
                where: {
                    userId: req.user.id,
                    position: {
                        isActive: true,
                    },
                },
                select: getCandidateCVListSelect(),
                orderBy: [
                    { updatedAt: "desc" },
                    { createdAt: "desc" },
                ],
            });

            // 2. Collect unique rule attribute IDs across all positions
            const ruleAttributeIds = [
                ...new Set(
                    candidateCVs.flatMap((cv) => {
                        const rules = Array.isArray(cv.position?.accessRules)
                            ? cv.position.accessRules
                            : [];
                        return rules.map((rule) => rule.attributeId).filter(Boolean);
                    })
                ),
            ];

            // 3. Load Candidate's relevant UserAttributes in one query
            let candidateUserAttributes = [];
            if (ruleAttributeIds.length > 0) {
                candidateUserAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: req.user.id,
                        attributeId: {
                            in: ruleAttributeIds,
                        },
                    },
                    select: {
                        attributeId: true,
                        value: true,
                    },
                });
            }

            // 4. Evaluate each Position in memory and filter eligible CVs
            const visibleCandidateCVs = candidateCVs
                .map((cv) => {
                    const eligibility = evaluatePositionEligibility(
                        cv.position,
                        candidateUserAttributes
                    );
                    const { accessRules, ...cleanPosition } = cv.position;
                    return {
                        cv: {
                            ...cv,
                            position: cleanPosition,
                        },
                        eligible: eligibility.eligible,
                    };
                })
                .filter((item) => item.eligible)
                .map((item) => applyAuthoritativeCVIdentity(item.cv));

            return res.status(200).json({
                success: true,
                data: visibleCandidateCVs,
            });
        } catch (error) {
            return handleServerError(res, "load", error);
        }
    }

    // Recruiter branch: eligibility-aware listing
    if (role === "RECRUITER") {
        try {
            // 1. Load Recruiter's visible Published CVs with eligibility data
            const recruiterCVs = await prisma.cV.findMany({
                where: {
                    status: "PUBLISHED",
                    position: {
                        isActive: true,
                    },
                },
                select: getRecruiterCVListSelect(req.user.id),
                orderBy: [
                    { updatedAt: "desc" },
                    { createdAt: "desc" },
                ],
            });

            // 2. Collect unique Candidate IDs
            const candidateUserIds = [
                ...new Set(
                    recruiterCVs.map((cv) => cv.userId).filter(Boolean)
                ),
            ];

            // 3. Collect unique rule attribute IDs across all positions
            const ruleAttributeIds = [
                ...new Set(
                    recruiterCVs.flatMap((cv) => {
                        const rules = Array.isArray(cv.position?.accessRules)
                            ? cv.position.accessRules
                            : [];
                        return rules.map((rule) => rule.attributeId).filter(Boolean);
                    })
                ),
            ];

            // 4. Load all relevant Candidate UserAttributes in one bulk query
            let eligibilityUserAttributes = [];
            if (candidateUserIds.length > 0 && ruleAttributeIds.length > 0) {
                eligibilityUserAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: {
                            in: candidateUserIds,
                        },
                        attributeId: {
                            in: ruleAttributeIds,
                        },
                    },
                    select: {
                        userId: true,
                        attributeId: true,
                        value: true,
                    },
                });
            }

            // 5. Group UserAttributes by Candidate ID
            const userAttributesByCandidate = new Map();
            for (const ua of eligibilityUserAttributes) {
                const current = userAttributesByCandidate.get(ua.userId) || [];
                current.push({
                    attributeId: ua.attributeId,
                    value: ua.value,
                });
                userAttributesByCandidate.set(ua.userId, current);
            }

            // 6. Evaluate each CV's Position using its Candidate's attributes
            const visibleRecruiterCVs = recruiterCVs
                .map((cv) => {
                    const candidateAttributes = userAttributesByCandidate.get(cv.userId) || [];
                    const eligibility = evaluatePositionEligibility(
                        cv.position,
                        candidateAttributes
                    );

                    const { accessRules, ...cleanPosition } = cv.position;
                    const { likes, ...cleanCV } = cv;

                    return {
                        cv: {
                            ...cleanCV,
                            position: cleanPosition,
                            likedByCurrentUser: Array.isArray(likes) && likes.length > 0,
                        },
                        eligible: eligibility.eligible === true,
                    };
                })
                .filter((item) => item.eligible)
                .map((item) => applyAuthoritativeCVIdentity(item.cv));

            return res.status(200).json({
                success: true,
                data: visibleRecruiterCVs,
            });
        } catch (error) {
            return handleServerError(res, "load", error);
        }
    }

    // Admin branch: no eligibility filtering
    try {
        const cvs = await prisma.cV.findMany({
            select: getAdminCVListSelect(),
            orderBy: [
                { updatedAt: "desc" },
                { createdAt: "desc" },
            ],
        });

        return res.status(200).json({
            success: true,
            data: cvs.map(applyAuthoritativeCVIdentity),
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

/**
 * Get a single CV by ID (role-based authorization)
 */
const getCVById = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    const id = getValidId(req.params.id);
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "CV ID is required.",
        });
    }

    try {
        // Candidate branch: eligibility-aware detail view
        if (role === "CANDIDATE") {
            // 1. Minimal owned-CV lookup to check ownership and get positionId
            const candidateCV = await prisma.cV.findFirst({
                where: {
                    id,
                    userId: req.user.id,
                    position: {
                        isActive: true,
                    },
                },
                select: {
                    id: true,
                    positionId: true,
                },
            });

            if (!candidateCV) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found.",
                });
            }

            // 2. Evaluate current Position eligibility
            const eligibilityResult = await loadAndEvaluatePositionEligibility(
                prisma,
                candidateCV.positionId,
                req.user.id
            );

            if (
                !eligibilityResult.position ||
                eligibilityResult.eligibility?.eligible !== true
            ) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found.",
                });
            }

            // 3. Load full CV details
            const cv = await prisma.cV.findFirst({
                where: {
                    id,
                    userId: req.user.id,
                    position: {
                        isActive: true,
                    },
                },
                select: getCVDetailWithPositionAttributesSelect(role, req.user.id),
            });

            if (!cv) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found.",
                });
            }

            // 4. Build dynamic attributes and profile projects (preserved)
            const attributeIds =
                cv.position.positionAttributes?.map(
                    (positionAttribute) => positionAttribute.attributeId
                ) || [];

            let userAttributes = [];
            if (attributeIds.length > 0) {
                userAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: cv.userId,
                        attributeId: {
                            in: attributeIds,
                        },
                    },
                    select: {
                        id: true,
                        attributeId: true,
                        value: true,
                        updatedAt: true,
                    },
                });
            }

            const userAttributeMap = new Map(
                userAttributes.map((userAttribute) => [
                    userAttribute.attributeId,
                    userAttribute,
                ])
            );

            const dynamicAttributes = cv.position.positionAttributes.map(
                (positionAttribute) => {
                    const userAttribute = userAttributeMap.get(
                        positionAttribute.attributeId
                    );

                    const value = userAttribute?.value ?? null;

                    return {
                        positionAttributeId: positionAttribute.id,
                        attributeId: positionAttribute.attributeId,
                        name: positionAttribute.attribute.name,
                        category: positionAttribute.attribute.category,
                        type: positionAttribute.attribute.type,
                        userAttributeId: userAttribute?.id || null,
                        value,
                        isMissing: isMissingValue(value),
                    };
                }
            );

            // 5. Load filtered Profile Projects with period and tags
            const profileProjects = await loadFilteredProfileProjects(
                prisma,
                cv.userId,
                cv.positionId
            );

            const { positionAttributes, ...cleanPosition } = cv.position;

            const responseData = {
                ...cv,
                position: cleanPosition,
                attributes: dynamicAttributes,
                profileProjects,
            };

            return res.status(200).json({
                success: true,
                data: applyAuthoritativeCVIdentity(responseData),
            });
        }

        // Recruiter branch: eligibility-aware detail view
        if (role === "RECRUITER") {
            // 1. Minimal lookup to check Published status and get Candidate ID
            const recruiterCV = await prisma.cV.findFirst({
                where: {
                    id,
                    status: "PUBLISHED",
                    position: {
                        isActive: true,
                    },
                },
                select: {
                    id: true,
                    userId: true,
                    positionId: true,
                },
            });

            if (!recruiterCV) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found.",
                });
            }

            // 2. Evaluate Candidate's current Position eligibility
            const eligibilityResult = await loadAndEvaluatePositionEligibility(
                prisma,
                recruiterCV.positionId,
                recruiterCV.userId
            );

            if (
                !eligibilityResult.position ||
                eligibilityResult.eligibility?.eligible !== true
            ) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found.",
                });
            }

            // 3. Load full CV details
            const cv = await prisma.cV.findFirst({
                where: {
                    id,
                    status: "PUBLISHED",
                    position: {
                        isActive: true,
                    },
                },
                select: getCVDetailWithPositionAttributesSelect(role, req.user.id),
            });

            if (!cv) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found.",
                });
            }

            // 4. Build dynamic attributes and profile projects (preserved)
            const attributeIds =
                cv.position.positionAttributes?.map(
                    (positionAttribute) => positionAttribute.attributeId
                ) || [];

            let userAttributes = [];
            if (attributeIds.length > 0) {
                userAttributes = await prisma.userAttribute.findMany({
                    where: {
                        userId: cv.userId,
                        attributeId: {
                            in: attributeIds,
                        },
                    },
                    select: {
                        id: true,
                        attributeId: true,
                        value: true,
                        updatedAt: true,
                    },
                });
            }

            const userAttributeMap = new Map(
                userAttributes.map((userAttribute) => [
                    userAttribute.attributeId,
                    userAttribute,
                ])
            );

            const dynamicAttributes = cv.position.positionAttributes.map(
                (positionAttribute) => {
                    const userAttribute = userAttributeMap.get(
                        positionAttribute.attributeId
                    );

                    const value = userAttribute?.value ?? null;

                    return {
                        positionAttributeId: positionAttribute.id,
                        attributeId: positionAttribute.attributeId,
                        name: positionAttribute.attribute.name,
                        category: positionAttribute.attribute.category,
                        type: positionAttribute.attribute.type,
                        userAttributeId: userAttribute?.id || null,
                        value,
                        isMissing: isMissingValue(value),
                    };
                }
            );

            // 5. Load filtered Profile Projects with period and tags
            const profileProjects = await loadFilteredProfileProjects(
                prisma,
                cv.userId,
                cv.positionId
            );

            const { positionAttributes, ...cleanPosition } = cv.position;
            const { likes: currentUserLikes, ...cvWithoutCurrentUserLikes } = cv;

            const responseData = {
                ...cvWithoutCurrentUserLikes,
                position: cleanPosition,
                attributes: dynamicAttributes,
                profileProjects,
                likedByCurrentUser:
                    Array.isArray(currentUserLikes) && currentUserLikes.length > 0,
            };

            return res.status(200).json({
                success: true,
                data: applyAuthoritativeCVIdentity(responseData),
            });
        }

        // Admin branch: no eligibility filtering
        const cv = await prisma.cV.findFirst({
            where: { id },
            select: getCVDetailWithPositionAttributesSelect(role, req.user.id),
        });

        if (!cv) {
            return res.status(404).json({
                success: false,
                message: "CV not found.",
            });
        }

        const attributeIds =
            cv.position.positionAttributes?.map(
                (positionAttribute) => positionAttribute.attributeId
            ) || [];

        let userAttributes = [];
        if (attributeIds.length > 0) {
            userAttributes = await prisma.userAttribute.findMany({
                where: {
                    userId: cv.userId,
                    attributeId: {
                        in: attributeIds,
                    },
                },
                select: {
                    id: true,
                    attributeId: true,
                    value: true,
                    updatedAt: true,
                },
            });
        }

        const userAttributeMap = new Map(
            userAttributes.map((userAttribute) => [
                userAttribute.attributeId,
                userAttribute,
            ])
        );

        const dynamicAttributes = cv.position.positionAttributes.map(
            (positionAttribute) => {
                const userAttribute = userAttributeMap.get(
                    positionAttribute.attributeId
                );

                const value = userAttribute?.value ?? null;

                return {
                    positionAttributeId: positionAttribute.id,
                    attributeId: positionAttribute.attributeId,
                    name: positionAttribute.attribute.name,
                    category: positionAttribute.attribute.category,
                    type: positionAttribute.attribute.type,
                    userAttributeId: userAttribute?.id || null,
                    value,
                    isMissing: isMissingValue(value),
                };
            }
        );

        // Load filtered Profile Projects with period and tags
        const profileProjects = await loadFilteredProfileProjects(
            prisma,
            cv.userId,
            cv.positionId
        );

        const { positionAttributes, ...cleanPosition } = cv.position;
        const { likes: currentUserLikes, ...cvWithoutCurrentUserLikes } = cv;

        const responseData = {
            ...cvWithoutCurrentUserLikes,
            position: cleanPosition,
            attributes: dynamicAttributes,
            profileProjects,
        };

        return res.status(200).json({
            success: true,
            data: applyAuthoritativeCVIdentity(responseData),
        });
    } catch (error) {
        return handleServerError(res, "load", error);
    }
};

/**
 * Update a CV (role-based authorization)
 */
const updateCV = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    const id = getValidId(req.params.id);
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "CV ID is required.",
        });
    }

    const body = getRequestBody(req);

    try {
        if (role === "RECRUITER") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this CV.",
            });
        }

        let where = { id };

        if (role === "CANDIDATE") {
            where = {
                id,
                userId: req.user.id,
                position: {
                    isActive: true,
                },
            };
        }
        // ADMIN: where = { id }

        const existingCV = await prisma.cV.findFirst({
            where,
            select: {
                id: true,
                userId: true,
                status: true,
                positionId: true,
            },
        });

        if (!existingCV) {
            return res.status(404).json({
                success: false,
                message: "CV not found.",
            });
        }

        // Candidate eligibility precheck for all updates (including publish)
        if (role === "CANDIDATE") {
            const eligibilityResult = await loadAndEvaluatePositionEligibility(
                prisma,
                existingCV.positionId,
                req.user.id
            );

            if (
                !eligibilityResult.position ||
                eligibilityResult.eligibility?.eligible !== true
            ) {
                return res.status(404).json({
                    success: false,
                    message: "CV not found.",
                });
            }
        }

        const updateData = {};

        const {
            fullName,
            email,
            phone,
            summary,
            skills,
            education,
            experience,
            projects,
            status,
        } = body;

        if (Object.prototype.hasOwnProperty.call(body, "fullName")) {
            if (typeof fullName !== "string" || fullName.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "Full name is required.",
                });
            }
            updateData.fullName = fullName.trim();
        }

        if (Object.prototype.hasOwnProperty.call(body, "email")) {
            if (typeof email !== "string" || email.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "Email is required.",
                });
            }
            if (!isValidEmail(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid email address.",
                });
            }
            updateData.email = email.trim();
        }

        if (Object.prototype.hasOwnProperty.call(body, "phone")) {
            if (!isValidOptionalStringInput(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid phone format.",
                });
            }
            updateData.phone = normalizeOptionalString(phone);
        }

        if (Object.prototype.hasOwnProperty.call(body, "summary")) {
            if (!isValidOptionalStringInput(summary)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid summary format.",
                });
            }
            updateData.summary = normalizeOptionalString(summary);
        }

        if (Object.prototype.hasOwnProperty.call(body, "skills")) {
            if (!isValidOptionalStringInput(skills)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid skills format.",
                });
            }
            updateData.skills = normalizeOptionalString(skills);
        }

        if (Object.prototype.hasOwnProperty.call(body, "education")) {
            if (!isValidOptionalStringInput(education)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid education format.",
                });
            }
            updateData.education = normalizeOptionalString(education);
        }

        if (Object.prototype.hasOwnProperty.call(body, "experience")) {
            if (!isValidOptionalStringInput(experience)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid experience format.",
                });
            }
            updateData.experience = normalizeOptionalString(experience);
        }

        if (Object.prototype.hasOwnProperty.call(body, "projects")) {
            if (!isValidOptionalStringInput(projects)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid projects format.",
                });
            }
            updateData.projects = normalizeOptionalString(projects);
        }

        if (Object.prototype.hasOwnProperty.call(body, "status")) {
            if (typeof status !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid CV status.",
                });
            }
            const normalizedStatus = status.trim().toUpperCase();
            if (!["DRAFT", "PUBLISHED"].includes(normalizedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid CV status.",
                });
            }

            // Only PUBLISHED requires completeness validation in a transaction
            if (normalizedStatus === "PUBLISHED") {
                try {
                    const updatedCV = await prisma.$transaction(async (tx) => {
                        // Reload the CV within the transaction (role-aware)
                        let txWhere = { id };
                        if (role === "CANDIDATE") {
                            txWhere = {
                                id,
                                userId: req.user.id,
                                position: {
                                    isActive: true,
                                },
                            };
                        }
                        // ADMIN: txWhere = { id }

                        const txCV = await tx.cV.findFirst({
                            where: txWhere,
                            select: {
                                id: true,
                                userId: true,
                                positionId: true,
                            },
                        });

                        if (!txCV) {
                            throw new CVRequestError(404, "CV not found.");
                        }

                        // Candidate eligibility recheck inside transaction
                        if (role === "CANDIDATE") {
                            const eligibilityResult = await loadAndEvaluatePositionEligibility(
                                tx,
                                txCV.positionId,
                                req.user.id
                            );

                            if (
                                !eligibilityResult.position ||
                                eligibilityResult.eligibility?.eligible !== true
                            ) {
                                throw new CVRequestError(404, "CV not found.");
                            }
                        }

                        // Load all PositionAttributes for this CV's Position
                        const positionAttributes = await tx.positionAttribute.findMany({
                            where: {
                                positionId: txCV.positionId,
                            },
                            select: {
                                attributeId: true,
                            },
                        });

                        const attributeIds = positionAttributes.map((pa) => pa.attributeId);

                        let userAttributes = [];
                        if (attributeIds.length > 0) {
                            userAttributes = await tx.userAttribute.findMany({
                                where: {
                                    userId: txCV.userId,
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

                        const userAttributeMap = new Map(
                            userAttributes.map((ua) => [ua.attributeId, ua])
                        );

                        const missingAttributeIds = attributeIds.filter((attrId) => {
                            const ua = userAttributeMap.get(attrId);
                            return !ua || isMissingValue(ua.value);
                        });

                        if (missingAttributeIds.length > 0) {
                            throw new CVRequestError(
                                409,
                                "Complete all required position attributes before publishing this CV.",
                                {
                                    missingAttributeIds,
                                }
                            );
                        }

                        // Apply all updates atomically
                        const finalUpdateData = {
                            ...updateData,
                            status: normalizedStatus,
                        };

                        const updated = await tx.cV.update({
                            where: { id: txCV.id },
                            data: finalUpdateData,
                            select: cvMutationSelect,
                        });

                        return updated;
                    });

                    return res.status(200).json({
                        success: true,
                        data: applyAuthoritativeCVIdentity(updatedCV),
                    });
                } catch (txError) {
                    if (txError instanceof CVRequestError) {
                        return res.status(txError.statusCode).json({
                            success: false,
                            message: txError.message,
                            ...(txError.details || {}),
                        });
                    }
                    throw txError;
                }
            }

            // DRAFT or no status change: update outside transaction
            updateData.status = normalizedStatus;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid CV fields were provided.",
            });
        }

        // Non-publish or already processed status update
        const updatedCV = await prisma.cV.update({
            where: { id: existingCV.id },
            data: updateData,
            select: cvMutationSelect,
        });

        return res.status(200).json({
            success: true,
            data: applyAuthoritativeCVIdentity(updatedCV),
        });
    } catch (error) {
        if (error instanceof CVRequestError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                ...(error.details || {}),
            });
        }
        return handleServerError(res, "update", error);
    }
};

/**
 * Delete a CV (role-based authorization)
 */
const deleteCV = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const role = getRequestRole(req);

    if (!isSupportedRole(role)) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to perform this action.",
        });
    }

    const id = getValidId(req.params.id);
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "CV ID is required.",
        });
    }

    try {
        if (role === "RECRUITER") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this CV.",
            });
        }

        let where = { id };

        if (role === "CANDIDATE") {
            where = {
                id,
                userId: req.user.id,
            };
        }
        // ADMIN: where = { id }

        const existingCV = await prisma.cV.findFirst({
            where,
            select: {
                id: true,
            },
        });

        if (!existingCV) {
            return res.status(404).json({
                success: false,
                message: "CV not found.",
            });
        }

        try {
            await prisma.cV.delete({
                where: { id: existingCV.id },
            });
        } catch (deleteError) {
            if (
                deleteError instanceof Prisma.PrismaClientKnownRequestError &&
                ["P2003", "P2014"].includes(deleteError.code)
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This CV cannot be deleted because related records still exist.",
                });
            }
            throw deleteError;
        }

        return res.status(200).json({
            success: true,
            message: "CV deleted successfully.",
        });
    } catch (error) {
        return handleServerError(res, "delete", error);
    }
};

module.exports = {
    createCV,
    getCVs,
    getCVById,
    updateCV,
    deleteCV,
};