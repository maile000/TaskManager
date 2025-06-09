require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const taskRoutes = require("./routes/taskRoutes");
const avatarRoutes = require("./routes/avatarRoute");
const commentRoutes = require("./routes/commentRoute");
const streaktRoutes = require("./routes/streakRoute");
const levelRoutes = require("./routes/levelRoute");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL-Datenbank verbinden
const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "postgres",
  database: process.env.POSTGRES_DB || "karen",
  password: process.env.POSTGRES_PASSWORD || "test",
  port: process.env.POSTGRES_PORT || 5432,
});

app.locals.pool = pool;

app.use("/api", authRoutes);
app.use("/api", teamRoutes);
app.use("/api", taskRoutes);
app.use("/api", avatarRoutes);
app.use("/api", commentRoutes);
app.use("/api", streaktRoutes);
app.use("/api", levelRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
