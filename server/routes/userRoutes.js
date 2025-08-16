const express = require("express");
const auth = require("../middleware/auth.js");
const User = require("../models/User.js");

const router = express.Router();

// Get logged-in user's profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;