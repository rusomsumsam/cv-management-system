const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    getCurrentUser,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get(
    "/me",
    authMiddleware,
    getCurrentUser
);

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