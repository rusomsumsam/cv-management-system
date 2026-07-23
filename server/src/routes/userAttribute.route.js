const router = require("express").Router();

const {
    createUserAttribute,
    getUserAttributes,
    getUserAttributeById,
    updateUserAttribute,
    deleteUserAttribute,
} = require("../controllers/userAttribute.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/",
    authMiddleware,
    createUserAttribute
);

router.get(
    "/",
    authMiddleware,
    getUserAttributes
);

router.get(
    "/:id",
    authMiddleware,
    getUserAttributeById
);

router.patch(
    "/:id",
    authMiddleware,
    updateUserAttribute
);

router.delete(
    "/:id",
    authMiddleware,
    deleteUserAttribute
);

module.exports = router;