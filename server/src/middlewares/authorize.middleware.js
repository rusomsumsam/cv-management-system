// server/src/middlewares/authorize.middleware.js
const authorizeRoles = (...roles) => {
    const allowedRoles = roles
        .filter((role) => typeof role === "string")
        .map((role) => role.toUpperCase())
        .filter((role) => ["CANDIDATE", "RECRUITER", "ADMIN"].includes(role));

    return (req, res, next) => {
        if (!req.user || typeof req.user.role !== "string") {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const userRole = req.user.role.toUpperCase();
        if (!["CANDIDATE", "RECRUITER", "ADMIN"].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource.",
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource.",
            });
        }

        next();
    };
};

module.exports = authorizeRoles;