const router = require("express").Router();
const { getPublicHome } = require("../controllers/publicHome.controller");

router.get("/", getPublicHome);

module.exports = router;