const { PrismaClient } = require("@prisma/client");
const {
    createSalesforceAccountWithContact,
} = require("../services/salesforce.service");

const prisma = new PrismaClient();

// --- Helpers ---

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);

        return (
            parsedUrl.protocol === "http:" ||
            parsedUrl.protocol === "https:"
        );
    } catch {
        return false;
    }
};

const normalizeOptionalString = (value) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue || null;
};

const getRequestBody = (req) => {
    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
    ) {
        return {};
    }

    return req.body;
};

const normalizeRequiredText = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value.trim();

    return normalizedValue || null;
};

// --- Controllers ---

const getProfile = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const profile = await prisma.user.findUnique({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true,
                location: true,
                role: true,

                userAttributes: {
                    select: {
                        id: true,
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
                    },
                    orderBy: {
                        updatedAt: "desc",
                    },
                },

                projects: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },

                cvs: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        position: {
                            select: {
                                id: true,
                                title: true,
                                company: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },

                createdAt: true,
                updatedAt: true,
            },
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error(
            "Failed to load profile:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load profile.",
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const {
            firstName,
            lastName,
            location,
            profilePhoto,
        } = req.body;

        const updateData = {};

        if (firstName !== undefined) {
            if (
                typeof firstName !== "string" ||
                !firstName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "First name cannot be empty.",
                });
            }

            updateData.firstName =
                firstName.trim();
        }

        if (lastName !== undefined) {
            if (
                typeof lastName !== "string" ||
                !lastName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Last name cannot be empty.",
                });
            }

            updateData.lastName =
                lastName.trim();
        }

        if (location !== undefined) {
            const normalizedLocation =
                normalizeOptionalString(location);

            if (
                normalizedLocation === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid location format.",
                });
            }

            updateData.location =
                normalizedLocation;
        }

        if (profilePhoto !== undefined) {
            const normalizedProfilePhoto =
                normalizeOptionalString(
                    profilePhoto
                );

            if (
                normalizedProfilePhoto === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid profile photo URL.",
                });
            }

            if (
                normalizedProfilePhoto !== null &&
                !isValidHttpUrl(
                    normalizedProfilePhoto
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid profile photo URL.",
                });
            }

            updateData.profilePhoto =
                normalizedProfilePhoto;
        }

        if (
            Object.keys(updateData).length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No valid fields were provided for update.",
            });
        }

        const updatedProfile =
            await prisma.user.update({
                where: {
                    id: req.user.id,
                },
                data: updateData,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profilePhoto: true,
                    location: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        return res.status(200).json({
            success: true,
            data: updatedProfile,
        });
    } catch (error) {
        console.error(
            "Failed to update profile:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
        });
    }
};

const addCurrentProfileToSalesforce = async (
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

        const body = getRequestBody(req);

        const accountName =
            normalizeRequiredText(
                body.accountName
            );

        const phone =
            normalizeRequiredText(body.phone);

        const jobTitle =
            normalizeRequiredText(
                body.jobTitle
            );

        const notes =
            body.notes === undefined
                ? null
                : normalizeOptionalString(
                    body.notes
                );

        if (!accountName) {
            return res.status(400).json({
                success: false,
                message:
                    "Account name is required.",
            });
        }

        if (accountName.length > 255) {
            return res.status(400).json({
                success: false,
                message:
                    "Account name must not exceed 255 characters.",
            });
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required.",
            });
        }

        if (phone.length > 40) {
            return res.status(400).json({
                success: false,
                message:
                    "Phone number must not exceed 40 characters.",
            });
        }

        if (!jobTitle) {
            return res.status(400).json({
                success: false,
                message:
                    "Job title is required.",
            });
        }

        if (jobTitle.length > 128) {
            return res.status(400).json({
                success: false,
                message:
                    "Job title must not exceed 128 characters.",
            });
        }

        if (notes === undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notes format.",
            });
        }

        if (
            notes !== null &&
            notes.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Notes must not exceed 2000 characters.",
            });
        }

        const profile =
            await prisma.user.findUnique({
                where: {
                    id: req.user.id.trim(),
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    location: true,
                    role: true,
                    isBlocked: true,
                },
            });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found.",
            });
        }

        if (profile.isBlocked) {
            return res.status(403).json({
                success: false,
                message:
                    "This account has been blocked. Please contact an administrator.",
            });
        }

        if (
            typeof profile.lastName !==
            "string" ||
            !profile.lastName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A last name is required before adding the Profile to Salesforce.",
            });
        }

        if (
            typeof profile.email !== "string" ||
            !profile.email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid Profile email is required.",
            });
        }

        const normalizedRole =
            typeof profile.role === "string"
                ? profile.role
                    .trim()
                    .toUpperCase()
                : "";

        if (
            ![
                "CANDIDATE",
                "RECRUITER",
                "ADMIN",
            ].includes(normalizedRole)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to perform this action.",
            });
        }

        let salesforceResult;

        try {
            salesforceResult =
                await createSalesforceAccountWithContact(
                    {
                        accountName,
                        firstName:
                            typeof profile.firstName ===
                                "string"
                                ? profile.firstName.trim()
                                : "",
                        lastName:
                            profile.lastName.trim(),
                        email:
                            profile.email
                                .trim()
                                .toLowerCase(),
                        phone,
                        jobTitle,
                        location:
                            typeof profile.location ===
                                "string"
                                ? profile.location.trim()
                                : "",
                        notes,
                        sourceUserId:
                            profile.id,
                        sourceUserRole:
                            normalizedRole,
                    }
                );
        } catch (error) {
            console.error(
                "Salesforce Profile integration error:",
                error.message
            );

            return res.status(502).json({
                success: false,
                message:
                    "Failed to add the Profile to Salesforce. Please try again.",
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Profile added to Salesforce successfully.",
            data: salesforceResult,
        });
    } catch (error) {
        console.error(
            "Salesforce Profile request error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to process the Salesforce request.",
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    addCurrentProfileToSalesforce,
};