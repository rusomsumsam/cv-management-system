const router = require("express").Router();

const authRoutes = require("./auth.route");
const positionRoutes = require("./position.route");
const cvRoutes = require("./cv.route");
const attributeRoutes = require("./attribute.route");
const userAttributeRoutes = require("./userAttribute.route");
const positionAttributeRoutes = require("./positionAttribute.route");
const profileRoutes = require("./profile.route");
const projectRoutes = require("./project.route");
const discussionRoutes = require("./discussion.route");
const likeRoutes = require("./like.route");


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
router.use("/cvs", cvRoutes);
router.use("/attributes", attributeRoutes);
router.use("/user-attributes", userAttributeRoutes);
router.use("/position-attributes", positionAttributeRoutes);
router.use("/profile", profileRoutes);
router.use("/projects", projectRoutes);
router.use("/discussions", discussionRoutes);
router.use("/likes", likeRoutes);


module.exports = router;