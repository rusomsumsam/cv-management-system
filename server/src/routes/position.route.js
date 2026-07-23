const router = require("express").Router();

const {
    createPosition,
    getPositions,
    getPositionById,
    updatePosition,
    deletePosition,
} = require("../controllers/position.controller");


const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

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