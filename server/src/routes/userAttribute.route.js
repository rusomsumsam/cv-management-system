const router = require("express").Router();

const {
    createUserAttribute,
    getUserAttributes,
    getUserAttributeById,
    updateUserAttribute,
    deleteUserAttribute,
} = require("../controllers/userAttribute.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

// All UserAttribute routes are restricted to Candidates only
router.post(
    "/",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    createUserAttribute
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    getUserAttributes
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    getUserAttributeById
);

router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    updateUserAttribute
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    deleteUserAttribute
);

module.exports = router;