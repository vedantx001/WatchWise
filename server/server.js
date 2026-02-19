const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes.js");
const auth = require("./middleware/auth");
const userRoutes = require("./routes/userRoutes.js");
const movieRoutes = require("./routes/movieRoutes.js");
const statsRoutes = require("./routes/stats.js");
const chatRoutes = require("./routes/chatRoutes.js");
const trailerRoutes = require("./routes/trailerRoutes.js");

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

app.get("/api/protected", auth, (req, res) => {
  res.json({ msg: `Welcome User ${req.user.id}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));