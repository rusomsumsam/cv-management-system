const router = require("express").Router();

const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
} = require("../controllers/project.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");

// All Project routes are restricted to Candidates only
router.post(
    "/",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    createProject
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    getProjects
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    getProjectById
);

router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    updateProject
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("CANDIDATE"),
    deleteProject
);

module.exports = router;