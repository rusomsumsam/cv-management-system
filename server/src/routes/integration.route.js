const router =
    require("express").Router();

const {
    getPositionIntegrationResults,
} = require(
    "../controllers/positionIntegration.controller"
);

router.get(
    "/position-results",
    getPositionIntegrationResults
);

module.exports = router;