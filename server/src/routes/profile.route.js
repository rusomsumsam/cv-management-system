const router = require("express").Router();

const {
    getProfile,
    updateProfile,
} = require("../controllers/profile.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.get(
    "/",
    authMiddleware,
    getProfile
);

router.patch(
    "/",
    authMiddleware,
    updateProfile
);

module.exports = router;