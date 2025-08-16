const router = require("express").Router();
const Movie = require("../models/Movie");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator"); // New import
const mongoose = require('mongoose'); // New import for ObjectId

// @route   POST api/movies
// @desc    Add a movie/tv show to watchlist
// @access  Private
router.post(
  "/",
  auth,
  [
    // Validation for new movie/tv show
    check("title", "Title is required").not().isEmpty(),
    check("duration", "Duration must be a number").optional().isNumeric(),
    check("rating", "Rating must be between 0 and 10").optional().isInt({ min: 0, max: 10 }),
    check("status", "Invalid status").optional().isIn(["planned", "watching", "completed"]),
    check("contentType", "Content type must be 'movie' or 'tv'").optional().isIn(["movie", "tv"]),
    // If tmdbId is provided, it must be a string and contentType must also be present
    check("tmdbId", "TMDB ID is required for TMDB content").optional().isString().if(check("contentType").exists()),
    check("contentType", "Content type is required if TMDB ID is provided").optional().isString().if(check("tmdbId").exists()),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, genre, duration, status, rating, posterPath, tmdbId, contentType } = req.body;

    try {
      // Check for duplicate TMDB entry for the current user if tmdbId is provided
      if (tmdbId && contentType) {
        const existingMovie = await Movie.findOne({
          user: req.user.id,
          tmdbId,
          contentType,
        });
        if (existingMovie) {
          return res.status(400).json({ msg: "This content is already in your watchlist." });
        }
      }

      const newMovie = new Movie({
        user: req.user.id,
        title,
        // Ensure genre is stored as an array
        genre: Array.isArray(genre) ? genre : (genre ? genre.split(',').map(g => g.trim()) : []),
        duration: duration || 0, // Default to 0 if not provided or invalid
        status: status || "planned",
        rating: rating || 0,
        posterPath,
        tmdbId,
        contentType,
        completedDate: status === "completed" ? new Date() : null,
      });

      const movie = await newMovie.save();
      res.json(movie);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   PUT api/movies/:id
// @desc    Update a movie/tv show in watchlist
// @access  Private
router.put(
  "/:id",
  auth,
  [
    // Validation for update
    check("title", "Title cannot be empty").optional().not().isEmpty(),
    check("duration", "Duration must be a number").optional().isNumeric(),
    check("rating", "Rating must be between 0 and 10").optional().isInt({ min: 0, max: 10 }),
    check("status", "Invalid status").optional().isIn(["planned", "watching", "completed"]),
    check("favorite", "Favorite must be a boolean").optional().isBoolean(),
    // No need to validate tmdbId/contentType on update as they should be immutable
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, genre, duration, status, rating, favorite } = req.body;
    const updatedFields = {};

    if (title) updatedFields.title = title;
    // Handle genre update to ensure it remains an array
    if (genre !== undefined) {
        updatedFields.genre = Array.isArray(genre) ? genre : (genre ? genre.split(',').map(g => g.trim()) : []);
    }
    if (duration !== undefined) updatedFields.duration = duration;
    if (status) updatedFields.status = status;
    if (rating !== undefined) updatedFields.rating = rating;
    if (favorite !== undefined) updatedFields.favorite = favorite;

    // Set completedDate if status becomes 'completed'
    if (status === "completed") {
      updatedFields.completedDate = new Date();
    } else if (status && status !== "completed") {
      // If status changes from completed to something else, clear completedDate
      updatedFields.completedDate = null;
    }

    try {
      let movie = await Movie.findById(req.params.id);

      if (!movie) {
        return res.status(404).json({ msg: "Movie/TV show not found" });
      }

      // Ensure user owns the movie/tv show
      if (movie.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }

      movie = await Movie.findByIdAndUpdate(
        req.params.id,
        { $set: updatedFields },
        { new: true } // Return the updated document
      );

      res.json(movie);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "Movie/TV show not found" });
      }
      res.status(500).send("Server error");
    }
  }
);

// @route   PUT api/movies/:id/favorite
// @desc    Toggle favorite status of a movie/tv show
// @access  Private
router.put("/:id/favorite", auth, async (req, res) => {
  try {
    let movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ msg: "Movie/TV show not found" });
    }

    if (movie.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    movie.favorite = !movie.favorite; // Toggle the favorite status
    await movie.save();

    res.json(movie);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Movie/TV show not found" });
    }
    res.status(500).send("Server error");
  }
});


// @route   GET api/movies
// @desc    Get all watchlist movies/tv shows for a user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const movies = await Movie.find({ user: req.user.id }).sort({
      createdAt: -1,
    }); // Sort by most recent first
    res.json(movies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/movies/:id
// @desc    Delete a movie/tv show from watchlist
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ msg: "Movie/TV show not found" });
    }

    // Ensure user owns the movie/tv show
    if (movie.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await Movie.findByIdAndDelete(req.params.id); // Use findByIdAndDelete

    res.json({ msg: "Movie/TV show removed from watchlist" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Movie/TV show not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   GET api/movies/stats
// @desc    Get watchlist statistics for a user
// @access  Private
router.get("/stats", auth, async (req, res) => {
    try {
        // Ensure the user ID is a valid ObjectId for aggregation
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const stats = await Movie.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    totalMovies: { $sum: 1 },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                    },
                    totalDuration: { $sum: "$duration" }, // sum up duration
                    avgRating: { $avg: "$rating" },
                    highestRating: { $max: "$rating" },
                    lowestRating: { $min: "$rating" },
                    // For best/worst movie, we'll get an array and then pick the first one
                    bestMovieTitles: {
                        $push: {
                            $cond: [{ $eq: ["$rating", "$$ROOT.highestRating"] }, "$title", "$$REMOVE"],
                        },
                    },
                    worstMovieTitles: {
                        $push: {
                            $cond: [{ $eq: ["$rating", "$$ROOT.lowestRating"] }, "$title", "$$REMOVE"],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalMovies: 1,
                    completedCount: 1,
                    totalHours: { $round: [{ $divide: ["$totalDuration", 60] }, 1] }, // Convert minutes to hours, 1 decimal place
                    avgRating: { $round: ["$avgRating", 1] },
                    // Use $arrayElemAt to pick the first title if multiple movies share the same best/worst rating
                    best: { $arrayElemAt: ["$bestMovieTitles", 0] },
                    worst: { $arrayElemAt: ["$worstMovieTitles", 0] },
                },
            },
        ]);

        // Handle case where no movies exist for the user
        if (stats.length === 0) {
            return res.json({
                totalMovies: 0,
                completedCount: 0,
                totalHours: 0,
                avgRating: 0,
                best: "N/A",
                worst: "N/A",
            });
        }

        res.json(stats[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;