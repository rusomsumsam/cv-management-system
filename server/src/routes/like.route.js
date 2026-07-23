const router = require("express").Router();

const {
    createLike,
    getLikes,
    deleteLike,
} = require("../controllers/like.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/",
    authMiddleware,
    createLike
);

router.get(
    "/",
    authMiddleware,
    getLikes
);

router.delete(
    "/:id",
    authMiddleware,
    deleteLike
);

module.exports = router;