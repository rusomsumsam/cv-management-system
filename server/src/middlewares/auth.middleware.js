// server/src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (typeof secret !== "string" || !secret.trim()) {
        throw new Error("JWT_SECRET is not configured.");
    }
    return secret;
};

const authMiddleware = (req, res, next) => {
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
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        if (typeof decoded !== "object" || decoded === null) {
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        const id = decoded.id;
        const email = decoded.email;
        const roleRaw = decoded.role;

        if (typeof id !== "string" || id.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }
        if (typeof email !== "string" || email.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }
        if (typeof roleRaw !== "string" || roleRaw.trim() === "") {
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        const role = roleRaw.toUpperCase();
        if (!["CANDIDATE", "RECRUITER", "ADMIN"].includes(role)) {
            return res.status(401).json({
                success: false,
                message: "Authentication is invalid or expired.",
            });
        }

        req.user = {
            id: id.trim(),
            email: email.trim().toLowerCase(),
            role: role,
        };

        next();
    } catch (error) {
        console.error("Authentication middleware error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Authentication service is temporarily unavailable.",
        });
    }
};

module.exports = authMiddleware;