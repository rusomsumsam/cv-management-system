const router = require("express").Router();

router.get("/", (req, res) => {
    res.send("CV Management System API Running");
});

module.exports = router;