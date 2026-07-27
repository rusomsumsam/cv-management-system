// server/src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (typeof secret !== "string" || !secret.trim()) {
        throw new Error("JWT_SECRET is not configured.");
    }
    return secret;
};

const getCookieClearOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
});

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (typeof token !== "string" || token.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        let secret;
        try {
            secret = getJwtSecret();
        } catch (error) {
            console.error("Authentication middleware error:", error.message);
            return res.status(500).json({
                success: false,
                message: "Authentication service is temporarily unavailable.",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        if (typeof decoded !== "object" || decoded === null) {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        const decodedId = decoded.id;
        if (typeof decodedId !== "string" || decodedId.trim() === "") {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        // Query database for current user state
        let dbUser;
        try {
            dbUser = await prisma.user.findUnique({
                where: {
                    id: decodedId.trim(),
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isBlocked: true,
                },
            });
        } catch (error) {
            console.error("Authentication middleware database error:", error.message);
            return res.status(500).json({
                success: false,
                message: "Authentication service is temporarily unavailable.",
            });
        }

        if (!dbUser) {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is no longer valid.",
            });
        }

        if (dbUser.isBlocked) {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(403).json({
                success: false,
                message: "This account has been blocked. Please contact an administrator.",
            });
        }

        if (typeof dbUser.email !== "string" || !dbUser.email.trim()) {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        if (typeof dbUser.role !== "string" || !dbUser.role.trim()) {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        const normalizedEmail = dbUser.email.trim().toLowerCase();
        const normalizedRole = dbUser.role.trim().toUpperCase();

        if (!["CANDIDATE", "RECRUITER", "ADMIN"].includes(normalizedRole)) {
            res.clearCookie("token", getCookieClearOptions());
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        req.user = {
            id: dbUser.id,
            email: normalizedEmail,
            role: normalizedRole,
        };

        return next();
    } catch (error) {
        console.error("Authentication middleware error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Authentication service is temporarily unavailable.",
        });
    }
};

module.exports = authMiddleware;