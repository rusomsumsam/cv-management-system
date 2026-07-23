const router = require("express").Router();

const {
    createDiscussion,
    getDiscussions,
    getDiscussionById,
    deleteDiscussion,
} = require("../controllers/discussion.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/",
    authMiddleware,
    createDiscussion
);

router.get(
    "/",
    authMiddleware,
    getDiscussions
);

router.get(
    "/:id",
    authMiddleware,
    getDiscussionById
);

router.delete(
    "/:id",
    authMiddleware,
    deleteDiscussion
);

module.exports = router;