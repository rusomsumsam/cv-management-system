const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const routes = require("./routes");

app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.FRONTEND_URL,
    ],
    credentials: true,
}));

app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

module.exports = app;
