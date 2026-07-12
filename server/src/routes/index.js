const router = require("express").Router();

router.get("/", (req, res) => {
    res.send("CV Management System API Running");
});

router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
    });
});

module.exports = router;