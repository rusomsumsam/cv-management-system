const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const routes = require("./routes");


app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://cv-management-system-orpin.vercel.app",
        ],
        credentials: true,
    })
);


app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

module.exports = app;
