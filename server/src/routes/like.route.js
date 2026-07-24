const router = require("express").Router();

const {
    createLike,
    getLikes,
    deleteLike,
} = require("../controllers/like.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

// Like a Published CV (Recruiter only)
router.post(
    "/cvs/:cvId",
    authMiddleware,
    authorizeRoles("RECRUITER"),
    createLike
);

// Get authenticated Recruiter's own Likes (Recruiter only)
router.get(
    "/",
    authMiddleware,
    authorizeRoles("RECRUITER"),
    getLikes
);

// Unlike a Published CV (Recruiter only)
router.delete(
    "/cvs/:cvId",
    authMiddleware,
    authorizeRoles("RECRUITER"),
    deleteLike
);

module.exports = router;