const router = require("express").Router();

const {
    createPosition,
    getPublicPositions,
    getPublicPositionById,
    getPositions,
    getPositionById,
    duplicatePosition,
    updatePosition,
    deletePosition,
} = require("../controllers/position.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

// Public routes (no authentication)
router.get(
    "/public",
    getPublicPositions
);

router.get(
    "/public/:id",
    getPublicPositionById
);

// Authenticated routes
router.post(
    "/",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    createPosition
);

router.get(
    "/",
    authMiddleware,
    getPositions
);

router.post(
    "/:id/duplicate",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    duplicatePosition
);

router.get(
    "/:id",
    authMiddleware,
    getPositionById
);

router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    updatePosition
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    deletePosition
);

module.exports = router;