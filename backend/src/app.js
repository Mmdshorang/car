const express = require("express");
const cors = require("cors");

const carRoutes = require("./routes/cars");
const lookupRoutes = require("./routes/lookup");
const authRoutes = require("./routes/auth");
const settingsRoutes = require("./routes/settings");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/lookup", lookupRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);

module.exports = app;
