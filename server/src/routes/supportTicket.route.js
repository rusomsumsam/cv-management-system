const router = require("express").Router();

const {
    createSupportTicket,
} = require("../controllers/supportTicket.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/",
    authMiddleware,
    createSupportTicket
);

module.exports = router;