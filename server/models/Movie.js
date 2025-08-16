const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true, // Add trim to remove whitespace
    },
    // Changed genre to an array of strings
    genre: {
      type: [String], // Now an array of strings
      default: [],
    },
    duration: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["planned", "watching", "completed"],
      default: "planned",
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    completedDate: {
      type: Date,
    },
    // --- NEW FIELDS ADDED ---
    posterPath: {
      type: String,
      default: null, // Can be null if no poster is available
    },
    tmdbId: {
      type: String, // Store as string to handle potentially large numbers or different formats
      required: false, // Not strictly required if adding manually without TMDB ID
      // Consider making this unique per user + contentType in Day 2 for preventing duplicates
    },
    contentType: {
      type: String,
      enum: ["movie", "tv"], // Crucial to distinguish between movies and TV shows
      required: false, // Will be required when adding from TMDB
    },
    // --- END NEW FIELDS ---
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", MovieSchema);