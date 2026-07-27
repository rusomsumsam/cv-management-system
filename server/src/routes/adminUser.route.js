// server/src/routes/adminUser.route.js
const express = require("express");
const router = express.Router();

const {
    getUsers,
    updateUserRoles,
    updateUserBlockStatus,
    deleteUsers,
} = require("../controllers/adminUser.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

// Apply authentication and Admin authorization to all routes
router.use(authMiddleware);
router.use(authorizeRoles("ADMIN"));

// Admin user management endpoints
router.get("/", getUsers);
router.patch("/roles", updateUserRoles);
router.patch("/block-status", updateUserBlockStatus);
router.delete("/", deleteUsers);

module.exports = router;