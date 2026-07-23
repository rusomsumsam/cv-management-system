const router = require("express").Router();

const {
    createAttribute,
    getAttributes,
    getAttributeById,
    updateAttribute,
    deleteAttribute,
} = require("../controllers/attribute.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

router.post(
    "/",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    createAttribute
);

router.get(
    "/",
    authMiddleware,
    getAttributes
);

router.get(
    "/:id",
    authMiddleware,
    getAttributeById
);

router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    updateAttribute
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    deleteAttribute
);

module.exports = router;