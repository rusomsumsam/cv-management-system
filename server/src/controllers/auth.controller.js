// server/src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getRequestBody = (req) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return {};
    }
    return req.body;
};

const normalizeName = (name, field) => {
    if (typeof name !== "string") {
        throw new Error(`${field} is required.`);
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        throw new Error(`${field} is required.`);
    }
    if (/[\x00-\x1F\x7F]/.test(trimmed)) {
        throw new Error(`${field} contains invalid characters.`);
    }
    const normalized = trimmed.replace(/\s+/g, " ");
    if (normalized.length < MIN_NAME_LENGTH) {
        throw new Error(`${field} is required.`);
    }
    if (normalized.length > MAX_NAME_LENGTH) {
        throw new Error(`${field} cannot exceed ${MAX_NAME_LENGTH} characters.`);
    }
    return normalized;
};

const normalizeEmail = (email) => {
    if (typeof email !== "string") {
        throw new Error("Email is required.");
    }
    const trimmed = email.trim();
    if (trimmed.length === 0) {
        throw new Error("Email is required.");
    }
    const lowercased = trimmed.toLowerCase();
    if (lowercased.length > MAX_EMAIL_LENGTH) {
        throw new Error(`Email cannot exceed ${MAX_EMAIL_LENGTH} characters.`);
    }
    if (!EMAIL_PATTERN.test(lowercased)) {
        throw new Error("Please enter a valid email address.");
    }
    return lowercased;
};

const validatePassword = (password, isLogin = false) => {
    if (typeof password !== "string") {
        if (isLogin) {
            throw new Error("Invalid email or password.");
        }
        throw new Error("Password is required.");
    }
    if (isLogin) {
        if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
            throw new Error("Invalid email or password.");
        }
        return password;
    }
    if (password.length === 0) {
        throw new Error("Password is required.");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        throw new Error(`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`);
    }
    return password;
};

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (typeof secret !== "string" || !secret.trim()) {
        throw new Error("JWT_SECRET is not configured.");
    }
    return secret;
};

const createToken = (user) => {
    const secret = getJwtSecret();
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        secret,
        {
            expiresIn: "7d",
        }
    );
};

const getCookieOptions = (maxAge = null) => {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    };
    if (maxAge !== null) {
        options.maxAge = maxAge;
    }
    return options;
};

const handleServerError = (res, operation, error) => {
    console.error(`Authentication ${operation} error:`, error.message);
    return res.status(500).json({
        success: false,
        message: "Authentication service is temporarily unavailable. Please try again.",
    });
};

const registerUser = async (req, res) => {
    try {
        const body = getRequestBody(req);
        const { firstName, lastName, email, password } = body;

        let normalizedFirstName;
        let normalizedLastName;
        let normalizedEmail;
        let validatedPassword;

        try {
            normalizedFirstName = normalizeName(firstName, "First name");
            normalizedLastName = normalizeName(lastName, "Last name");
            normalizedEmail = normalizeEmail(email);
            validatedPassword = validatePassword(password, false);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
            select: {
                id: true,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(validatedPassword, 10);

        let user;
        try {
            user = await prisma.user.create({
                data: {
                    firstName: normalizedFirstName,
                    lastName: normalizedLastName,
                    email: normalizedEmail,
                    password: hashedPassword,
                    role: "CANDIDATE",
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists.",
                });
            }
            throw error;
        }

        const token = createToken(user);
        res.cookie("token", token, getCookieOptions(COOKIE_MAX_AGE));

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return handleServerError(res, "registration", error);
    }
};

const loginUser = async (req, res) => {
    try {
        const body = getRequestBody(req);
        const { email, password } = body;

        let normalizedEmail;
        let validatedPassword;

        try {
            normalizedEmail = normalizeEmail(email);
            validatedPassword = validatePassword(password, true);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const isPasswordValid = await bcrypt.compare(validatedPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = createToken(user);
        res.cookie("token", token, getCookieOptions(COOKIE_MAX_AGE));

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return handleServerError(res, "login", error);
    }
};

const getCurrentUser = async (req, res) => {
    try {
        if (!req.user || typeof req.user.id !== "string" || req.user.id.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const user = await prisma.user.findUnique({
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
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            res.clearCookie("token", getCookieOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is no longer valid.",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profilePhoto: user.profilePhoto,
                location: user.location,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        return handleServerError(res, "get current user", error);
    }
};

const logoutUser = (req, res) => {
    res.clearCookie("token", getCookieOptions());
    return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
};

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
};