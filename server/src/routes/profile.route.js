const router = require("express").Router();

const {
    getProfile,
    updateProfile,
    addCurrentProfileToSalesforce,
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

router.post(
    "/salesforce",
    authMiddleware,
    addCurrentProfileToSalesforce
);

module.exports = router;