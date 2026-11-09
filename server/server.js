const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const authRoutes = require("./routes/authRoutes.js");
const auth = require("./middleware/auth");
const userRoutes = require("./routes/userRoutes.js");
const movieRoutes = require("./routes/movieRoutes.js");
const statsRoutes = require("./routes/stats.js");
const chatRoutes = require("./routes/chatRoutes.js");
const trailerRoutes = require("./routes/trailerRoutes.js");

const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();
const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api", statsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/trailer", trailerRoutes);

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => res.send("WatchWise Backend Running"));

/**
 * Health check & Keep-Alive endpoint:
 * Pings MongoDB directly to ensure the database connection stays active
 * and prevents MongoDB Atlas M0 cluster from pausing after prolonged inactivity.
 */
const handleHealthCheck = async (req, res) => {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let dbPingMs = null;

  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      dbStatus = "connected";
      dbPingMs = Date.now() - startTime;
    } else {
      const stateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
      dbStatus = stateMap[mongoose.connection.readyState] || "unknown";
    }

    const isHealthy = dbStatus === "connected";

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        pingMs: dbPingMs,
      },
    });
  } catch (err) {
    return res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: "error",
        error: err.message,
      },
    });
  }
};

app.get("/api/health", handleHealthCheck);
app.get("/health", handleHealthCheck);

app.get("/api/protected", auth, (req, res) => {
  res.json({ msg: `Welcome User ${req.user.id}` });
});

/**
 * Background Keep-Alive Service:
 * Automatically pings the public /api/health endpoint every 14 minutes
 * to keep Render web service awake (preventing 15-min inactivity spin-down)
 * and keeps MongoDB connection pool active and warm.
 */
function startKeepAlive() {
  // 1. Check for custom SERVER_URL
  // 2. Fall back to Render's built-in RENDER_EXTERNAL_URL (automatically provided by Render)
  // 3. Fall back to your known Render URL if explicitly enabled via KEEP_ALIVE=true
  const serverUrl =
    process.env.SERVER_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.KEEP_ALIVE === "true" ? "https://watchwise-z0y5.onrender.com" : null);

  if (!serverUrl) {
    console.log(
      "[KeepAlive] Inactive in local environment (neither SERVER_URL nor RENDER_EXTERNAL_URL is set).\n" +
      "             On Render, RENDER_EXTERNAL_URL is injected automatically, so it will activate on deploy."
    );
    return;
  }

  const pingUrl = `${serverUrl.replace(/\/+$/, "")}/api/health`;
  const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  console.log(`[KeepAlive] Service started. Target: ${pingUrl} (every 14 mins)`);

  const ping = async () => {
    try {
      const res = await axios.get(pingUrl, { timeout: 20000 });
      console.log(`[KeepAlive] Ping successful (${res.status}) at ${new Date().toLocaleTimeString()} - DB: ${res.data?.database?.status || "ok"}`);
    } catch (err) {
      console.warn(`[KeepAlive] Ping warning at ${new Date().toLocaleTimeString()}: ${err.message}`);
    }
  };

  // Wait 1 minute after startup for initial ping, then ping every 14 minutes
  setTimeout(() => {
    ping();
    setInterval(ping, INTERVAL_MS);
  }, 60 * 1000);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startKeepAlive();
});