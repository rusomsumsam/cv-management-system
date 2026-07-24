const express = require("express");
const router = express.Router();

const {
    search,
} = require("../controllers/search.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.get(
    "/",
    authMiddleware,
    search
);

module.exports = router;