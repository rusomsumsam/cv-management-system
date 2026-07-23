const router = require("express").Router();

const authRoutes = require("./auth.route");
const positionRoutes = require("./position.route");

router.get("/", (req, res) => {
    res.send("CV Management System API Running");
});

router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
    });
});

router.use("/auth", authRoutes);
router.use("/positions", positionRoutes);

module.exports = router;