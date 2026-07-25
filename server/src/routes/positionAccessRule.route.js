const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");
const {
    getPositionAccessRules,
    updatePositionAccessSettings,
    createPositionAccessRule,
    updatePositionAccessRule,
    deletePositionAccessRule,
} = require("../controllers/positionAccessRule.controller");

router.get(
    "/:positionId/access-rules",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    getPositionAccessRules
);

router.patch(
    "/:positionId/access-settings",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    updatePositionAccessSettings
);

router.post(
    "/:positionId/access-rules",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    createPositionAccessRule
);

router.patch(
    "/:positionId/access-rules/:ruleId",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    updatePositionAccessRule
);

router.delete(
    "/:positionId/access-rules/:ruleId",
    authMiddleware,
    authorizeRoles("RECRUITER", "ADMIN"),
    deletePositionAccessRule
);

module.exports = router;