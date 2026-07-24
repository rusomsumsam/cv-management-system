const router = require("express").Router();

const {
    createCV,
    getCVs,
    getCVById,
    updateCV,
    deleteCV,
} = require("../controllers/cv.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

// Only Candidates can create CVs
router.post(
    "/",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    createCV
);

// All authenticated roles can list CVs (controller filters by role)
router.get(
    "/",
    authMiddleware,
    authorizeRoles("CANDIDATE", "RECRUITER", "ADMIN"),
    getCVs
);

// All authenticated roles can view CV details (controller enforces visibility)
router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE", "RECRUITER", "ADMIN"),
    getCVById
);

// Only Candidates and Admins can update CVs
router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE", "ADMIN"),
    updateCV
);

// Only Candidates and Admins can delete CVs
router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE", "ADMIN"),
    deleteCV
);

module.exports = router;