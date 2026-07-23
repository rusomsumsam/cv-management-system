const router = require("express").Router();

const {
    createCV,
    getCVs,
    getCVById,
    updateCV,
    deleteCV,
} = require("../controllers/cv.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/",
    authMiddleware,
    createCV
);

router.get(
    "/",
    authMiddleware,
    getCVs
);

router.get(
    "/:id",
    authMiddleware,
    getCVById
);

router.patch(
    "/:id",
    authMiddleware,
    updateCV
);

router.delete(
    "/:id",
    authMiddleware,
    deleteCV
);

module.exports = router;