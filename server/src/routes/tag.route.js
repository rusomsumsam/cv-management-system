// server/src/routes/tag.route.js
const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");
const { getTags } = require("../controllers/tag.controller");

router.get(
    "/",
    authMiddleware,
    authorizeRoles("CANDIDATE", "RECRUITER", "ADMIN"),
    getTags
);

module.exports = router;