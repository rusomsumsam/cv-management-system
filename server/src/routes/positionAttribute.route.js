const router = require("express").Router();

const {
    createPositionAttribute,
    getPositionAttributes,
    getPositionAttributeById,
    deletePositionAttribute,
} = require("../controllers/positionAttribute.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

router.post(
    "/",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    createPositionAttribute
);

router.get(
    "/",
    authMiddleware,
    getPositionAttributes
);

router.get(
    "/:id",
    authMiddleware,
    getPositionAttributeById
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    deletePositionAttribute
);

module.exports = router;