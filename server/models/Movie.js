const mongoose = require("mongoose");

// Watched Episode Schema (for tracking progress)
const WatchedEpisodeSchema = new mongoose.Schema({
  season: { type: Number, required: true },
  episode: { type: Number, required: true },
  watchedAt: { type: Date, default: Date.now }, // when the episode was watched
});

const EpisodeSchema = new mongoose.Schema({
  episodeNumber: { type: Number, required: true },
  duration: { type: Number, default: 0 }, // in minutes
  name: { type: String, default: "" },
  overview: { type: String, default: "" },
  airDate: { type: Date },
  rating: { type: Number, default: 0 },
});

const SeasonSchema = new mongoose.Schema({
  seasonNumber: { type: Number, required: true },
  episodeCount: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // total season duration (minutes)
  episodes: [EpisodeSchema],

  status: {
    type: String,
    enum: ["planned", "watching", "completed"],
    default: "planned",
  },
  completedDate: { type: Date },

  // Useful display fields
  posterPath: { type: String, default: null },
  overview: { type: String, default: "" },
  airDate: { type: Date },
  rating: { type: Number, default: 0 },
});

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
      trim: true,
    },
    genre: {
      type: [String],
      default: [],
    },
    duration: {
      type: Number, // For movies (minutes)
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
    posterPath: {
      type: String,
      default: null,
    },
    tmdbId: {
      type: String,
      required: false,
    },
    contentType: {
      type: String,
      enum: ["movie", "tv"],
      required: false,
    },
    releaseDate: { type: Date }, // release date (movie) or firstAirDate (tv)
    language: { type: String, default: "en" }, // original language

    //Episode tracking
    lastWatchedEpisode: {
      season: { type: Number, default: null },
      episode: { type: Number, default: null },
    },
    watchedEpisodes: [WatchedEpisodeSchema],

    // TV Show meta
    inProduction: { type: Boolean, default: false },
    totalSeasons: { type: Number, default: 0 },
    totalEpisodes: { type: Number, default: 0 },
    episodeDuration: { type: Number, default: 0 }, // avg duration per episode
    seasons: [SeasonSchema],
    totalDuration: { type: Number, default: 0 }, // in minutes (all episodes)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", MovieSchema);