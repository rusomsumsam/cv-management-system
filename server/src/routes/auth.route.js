// server/src/routes/auth.route.js
const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
} = require("../controllers/auth.controller");

const {
    startGoogleOAuth,
    handleGoogleCallback,
    startGitHubOAuth,
    handleGitHubCallback,
} = require("../controllers/oauth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

// Local authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/me", authMiddleware, getCurrentUser);

// OAuth routes - public, no auth middleware
router.get("/google", startGoogleOAuth);
router.get("/google/callback", handleGoogleCallback);

router.get("/github", startGitHubOAuth);
router.get("/github/callback", handleGitHubCallback);

// Role test routes
const authorizeRoles = require("../middlewares/authorize.middleware");

router.get(
    "/admin",
    authMiddleware,
    authorizeRoles("ADMIN"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Admin",
        });
    }
);

router.get(
    "/recruiter",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Recruiter",
        });
    }
);

module.exports = router;