const router = require("express").Router();
const Movie = require("../models/Movie");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const mongoose = require('mongoose');
const { fetchMovieDetails, fetchTvShowDetails, fetchSeasonDetails, TMDB_IMAGE_BASE_URL } = require("../utils/tmdbApi");


router.post(
  "/",
  auth,
  [
    // Validation for new movie/tv show
    check("title", "Title is required").not().isEmpty(),
    check("duration", "Duration must be a number").optional().isNumeric(),
    check("rating", "Rating must be between 0 and 10").optional().isFloat({ min: 0, max: 10 }),
    check("status", "Invalid status").optional().isIn(["planned", "watching", "completed"]),
    check("contentType", "Content type must be 'movie' or 'tv'").optional().isIn(["movie", "tv"]),
    // If tmdbId is provided, it must be a string and contentType must also be present
    check("tmdbId", "TMDB ID is required for TMDB content").not().isEmpty().isString(),
    check("contentType", "Content type is required if TMDB ID is provided").isIn(["movie", "tv"]),
    check("seasonNumber")
      .if((value, { req }) => req.body.contentType === "tv")
      .isInt({ min: 0 })
      .withMessage("seasonNumber must be an integer >= 0"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }


    const { title, genre, duration, status, rating, posterPath, tmdbId, contentType, favorite, seasonNumber } = req.body;

  try {
    if (contentType === "movie") {
        // ----- Handle Movie -----
        const tmdbData = await fetchMovieDetails(tmdbId);

        // Prevent duplicate movies
        const existing = await Movie.findOne({
          user: req.user.id,
          tmdbId,
          contentType: "movie",
        });
        if (existing) {
          return res
            .status(400)
            .json({ msg: "This movie is already in your watchlist." });
        }

        const newMovie = new Movie({
          user: req.user.id,
          tmdbId,
          contentType: "movie",
          status: status || "planned",
          rating: rating || 0,
          favorite: favorite || false,
          completedDate: status === "completed" ? new Date() : null,
          title: tmdbData.title,
          genre: tmdbData.genres ? tmdbData.genres.map((g) => g.name) : [],
          posterPath: tmdbData.poster_path
            ? `${TMDB_IMAGE_BASE_URL}${tmdbData.poster_path}`
            : null,
          releaseDate: tmdbData.release_date,
          language: tmdbData.original_language,
          duration: tmdbData.runtime || 0,
        });

        const saved = await newMovie.save();
        return res.status(201).json(saved);
      } else if (contentType === "tv") {
        // ----- Handle TV SEASON -----
        if (!seasonNumber && seasonNumber !== 0) {
          return res
            .status(400)
            .json({ msg: "Season number is required for TV shows" });
        }

        const tvData = await fetchTvShowDetails(tmdbId);
        const seasonData = await fetchSeasonDetails(tmdbId, seasonNumber);

        // See if the show already exists in user’s watchlist
        let existingShow = await Movie.findOne({
          user: req.user.id,
          tmdbId,
          contentType: "tv",
        });

        if (existingShow) {
          // If season already exists, prevent duplicates
          const alreadyAdded = existingShow.seasons.find(
            (s) => s.seasonNumber === seasonNumber
          );
          if (alreadyAdded) {
            return res
              .status(400)
              .json({ msg: "This season is already in your watchlist." });
          }

          // Otherwise add the season
          existingShow.seasons.push({
            seasonNumber,
            title: seasonData.name || `Season ${seasonNumber}`,
            overview: seasonData.overview,
            episodeCount: seasonData.episodes.length,
            posterPath: seasonData.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${seasonData.poster_path}`
              : existingShow.posterPath,
            status: status || "planned",
            episodes: seasonData.episodes.map((ep) => ({
              episodeNumber: ep.episode_number,
              name: ep.name,
              duration:
                ep.runtime || tvData.episode_run_time?.[0] || 0,
              overview: ep.overview,
            })),
          });

          await existingShow.save();
          return res.status(201).json(existingShow);
        } else {
          // Create new show entry with first selected season
          const newShow = new Movie({
            user: req.user.id,
            tmdbId,
            contentType: "tv",
            title: tvData.name,
            genre: tvData.genres ? tvData.genres.map((g) => g.name) : [],
            posterPath: tvData.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${tvData.poster_path}`
              : null,
            releaseDate: tvData.first_air_date,
            language: tvData.original_language,
            totalSeasons: tvData.number_of_seasons,
            inProduction: tvData.in_production,
            seasons: [
              {
                seasonNumber,
                title: seasonData.name || `Season ${seasonNumber}`,
                overview: seasonData.overview,
                episodeCount: seasonData.episodes.length,
                posterPath: seasonData.poster_path
                  ? `${TMDB_IMAGE_BASE_URL}${seasonData.poster_path}`
                  : null,
                status: status || "planned",
                episodes: seasonData.episodes.map((ep) => ({
                  episodeNumber: ep.episode_number,
                  name: ep.name,
                  duration:
                    ep.runtime || tvData.episode_run_time?.[0] || 0,
                  overview: ep.overview,
                })),
              },
            ],
          });

          const savedShow = await newShow.save();
          return res.status(201).json(savedShow);
        }
      }
    } catch (err) {
  console.error("POST /api/movies error:", err);
  res.status(500).send("Server error: " + err.message);
    }
  }
);

router.put("/:id", auth, async (req, res) => {
  const { status } = req.body;

  try {
    let item = await Movie.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Not found" });

    if (item.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    if (status) {
      item.status = status;
      item.completedDate = status === "completed" ? new Date() : null;
    }

    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

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

// UPDATE SEASON STATUS
router.put("/:id/season/:seasonNumber", auth, async (req, res) => {
  const { status } = req.body;
  try {
    const show = await Movie.findById(req.params.id);
    if (!show || show.contentType !== "tv")
      return res.status(404).json({ msg: "TV show not found" });

    if (show.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    const season = show.seasons.find(
      (s) => s.seasonNumber === parseInt(req.params.seasonNumber)
    );
    if (!season) return res.status(404).json({ msg: "Season not found" });

    season.status = status;
    if (status === "completed") season.completedDate = new Date();
    else season.completedDate = null;

    await show.save();
    res.json(show);
  } catch (err) {
    console.error(err.message);
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

// @route DELETE api/movies/clear
// @desc Delete every movie or tv from watchlist
// @access Private 

router.delete("/clear", auth, async (req, res) => {
  try {
    // Only delete movies belonging to the logged-in user
    const result = await Movie.deleteMany({ user: req.user.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: "No movies/TV shows to delete in your watchlist" });
    }

    res.json({ msg: "All movies/TV shows removed from your watchlist" });
  }
  catch {
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
// @desc    Get comprehensive watchlist statistics for a user, with filters
// @access  Private
// @params  contentType (optional): 'movie' or 'tv'. Defaults to all.
// @params  timeFilter (optional): 'overall', 'year', 'month'. Defaults to 'overall'.
router.get("/stats", auth, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const { contentType, timeFilter } = req.query; // Get filters from query parameters

        let matchStage = { user: userId }; // Start with user filter

        // Add content type filter if provided
        if (contentType && (contentType === 'movie' || contentType === 'tv')) {
            matchStage.contentType = contentType;
        }

        // Define time-based filtering for relevant stats (e.g., completed items)
        let completedDateMatch = {};
        if (timeFilter && timeFilter !== 'overall') {
            const now = new Date();
            let pastDate = new Date();

            if (timeFilter === 'year') {
                pastDate.setFullYear(now.getFullYear() - 1); // Last 365 days
            } else if (timeFilter === 'month') {
                pastDate.setMonth(now.getMonth() - 1); // Last 30 days
            }
            completedDateMatch = { completedDate: { $gte: pastDate.toISOString() } };
        }

        // --- Aggregation Pipeline ---
        const aggregationPipeline = [
            // Stage 1: Initial filter by user and content type
            { $match: matchStage },
            // Stage 2: Separate completed items by time filter for specific stats, and add dayOfWeek
            {
                $addFields: {
                    isCompletedFiltered: {
                        $and: [
                            { $eq: ["$status", "completed"] },
                            { $ne: ["$completedDate", null] },
                            Object.keys(completedDateMatch).length > 0 ? { $gte: ["$completedDate", completedDateMatch.completedDate.$gte] } : { $literal: true }
                        ]
                    },
                    dayOfWeek: {
                        $cond: {
                            if: { $and: [{ $ne: ["$completedDate", null] }, { $eq: ["$status", "completed"] }] },
                            then: { $dayOfWeek: { $toDate: "$completedDate" } }, // 1 (Sunday) to 7 (Saturday)
                            else: null
                        }
                    }
                }
            },
            // Stage 3: Group all documents to calculate overall stats and collect necessary data
            {
                $group: {
                    _id: null, // Group all into a single document
                    totalItems: { $sum: 1 }, // Count all items (movies + tv shows)
                    completedCount: {
                        $sum: { $cond: ["$isCompletedFiltered", 1, 0] }
                    },
                    totalDurationMinutes: {
                        $sum: { $cond: ["$isCompletedFiltered", "$duration", 0] }
                    },
                    avgRating: { $avg: "$rating" },
                    highestRating: { $max: "$rating" },
                    lowestRating: { $min: "$rating" },

                    // Collect all items for secondary calculations (best/worst, top rated)
                    allItems: { $push: "$$ROOT" },

                    // Collect genres from *completed and filtered* items for favorite genre calculation
                    allCompletedAndFilteredGenres: {
                        $push: {
                            $cond: ["$isCompletedFiltered", "$genre", "$$REMOVE"]
                        }
                    },
                    // Collect durations for daily activity (pre-filtered)
                    dailyActivityData: {
                        $push: {
                            $cond: [
                            "$isCompletedFiltered",
                            {
                                day: "$dayOfWeek",
                                count: 1 // both movie and tv = +1
                            },
                            "$$REMOVE"
                            ]
                        }
                    }
                },
            },
            // Stage 4: Post-processing for best/worst titles, favorite genre, top rated, and daily activity
            {
                $addFields: {
                    // Best/Worst Rated Titles: Filter allItems
                    bestRatedTitle: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$allItems",
                                            as: "item",
                                            cond: { $eq: ["$$item.rating", "$highestRating"] }
                                        }
                                    },
                                    as: "bestItem",
                                    in: "$$bestItem.title"
                                }
                            }, 0
                        ]
                    },
                    worstRatedTitle: {
                        $arrayElemAt: [
                            {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$allItems",
                                            as: "item",
                                            cond: { $eq: ["$$item.rating", "$lowestRating"] }
                                        }
                                    },
                                    as: "worstItem",
                                    in: "$$worstItem.title"
                                }
                            }, 0
                        ]
                    },

                    // Favorite Genre Calculation - REVISED
                    favoriteGenre: {
                        $cond: [
                            { $eq: [{ $size: "$allCompletedAndFilteredGenres" }, 0] },
                            "N/A",
                            {
                                $let: {
                                    vars: {
                                        // Flatten the array of arrays of genres
                                        flattenedGenres: {
                                            $reduce: {
                                                input: "$allCompletedAndFilteredGenres",
                                                initialValue: [],
                                                in: { $concatArrays: ["$$value", "$$this"] }
                                            }
                                        }
                                    },
                                    in: {
                                        $let: {
                                            vars: {
                                                // Count genre occurrences and create an array of { k: genreName, v: count }
                                                genreCountsArray: {
                                                    $map: {
                                                        input: { $setUnion: "$$flattenedGenres" }, // Get unique genres
                                                        as: "g",
                                                        in: {
                                                            k: "$$g",
                                                            v: {
                                                                $size: {
                                                                    $filter: {
                                                                        input: "$$flattenedGenres",
                                                                        as: "fg",
                                                                        cond: { $eq: ["$$fg", "$$g"] }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            },
                                            in: {
                                                // Find the genre with the maximum count
                                                $arrayElemAt: [
                                                    "$$genreCountsArray",
                                                    {
                                                        $indexOfArray: [
                                                            { $map: { input: "$$genreCountsArray", as: "gc", in: "$$gc.v" } },
                                                            { $max: { $map: { input: "$$genreCountsArray", as: "gc", in: "$$gc.v" } } }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    },

                    // Top Rated Items: Filter and sort allItems
                    topRatedItems: {
                        $slice: [
                            {
                                $sortArray: {
                                    input: {
                                        $filter: {
                                            input: "$allItems",
                                            as: "item",
                                            cond: { $gt: ["$$item.rating", 0] } // Only consider rated items
                                        }
                                    },
                                    sortBy: { rating: -1 }
                                }
                            },
                            10 // Get top 10
                        ]
                    },

                    // Daily Activity:
                    dailyActivity: {
                        $let: {
                            vars: {
                                weekdayNames: ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                            },
                            in: {
                                $map: {
                                    input: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                                    as: "dayName",
                                    in: {
                                        day: "$$dayName",
                                        count: {
                                            $sum: {
                                                $map: {
                                                    input: {
                                                        $filter: {
                                                            input: "$dailyActivityData",
                                                            as: "item",
                                                            cond: { $eq: [{ $arrayElemAt: ["$$weekdayNames", "$$item.day"] }, "$$dayName"] }
                                                        }
                                                    },
                                                    as: "filteredItem",
                                                    in: "$$filteredItem.count"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Stage 5: Project the final output structure
            {
                $project: {
                    _id: 0,
                    totalItems: 1,
                    completedCount: 1,
                    totalHours: { $round: [{ $divide: ["$totalDurationMinutes", 60] }, 1] },
                    avgRating: { $round: ["$avgRating", 1] },
                    highestRating: {
                        $cond: [
                            { $eq: ["$highestRating", null] }, // if no rating at all
                            null,
                            { $round: ["$highestRating", 1] } // otherwise round it
                        ]
                        },
                    lowestRating: {
                        $cond: [
                            { $eq: ["$lowestRating", null] }, // if no rating at all
                            null,
                            { $round: ["$lowestRating", 1] } // otherwise round it (can be 0 if real)
                        ]
                    },
                    best: "$bestRatedTitle",
                    worst: "$worstRatedTitle",
                    favoriteGenre: {
                        $cond: [
                            { $eq: ["$favoriteGenre", "N/A"] },
                            "N/A",
                            "$favoriteGenre.k"
                        ]
                    },
                    topRated: {
                        $map: { // Project only necessary fields for topRated items
                            input: "$topRatedItems",
                            as: "item",
                            in: {
                                _id: "$$item._id",
                                title: "$$item.title",
                                rating: "$$item.rating",
                                contentType: "$$item.contentType",
                                tmdbId: "$$item.tmdbId" // Ensure tmdbId is passed for frontend Link
                            }
                        }
                    },  
                    dailyActivity: 1
                }
            }
        ];

        const statsResult = await Movie.aggregate(aggregationPipeline);

        if (statsResult.length === 0 || statsResult[0].totalItems === 0) {
            // Return default zero stats if no items match the filters
            return res.json({
                totalItems: 0,
                completedCount: 0,
                totalHours: 0,
                avgRating: 0,
                highestRating: 0,
                lowestRating: 0,
                best: "N/A",
                worst: "N/A",
                favoriteGenre: "N/A",
                topRated: [],
                dailyActivity: [
                    { day: "Mon", count: 0 }, { day: "Tue", count: 0 }, { day: "Wed", count: 0 },
                    { day: "Thu", count: 0 }, { day: "Fri", count: 0 }, { day: "Sat", count: 0 }, { day: "Sun", count: 0 }
                ]
            });
        }

        res.json(statsResult[0]); // Send the first (and only) result document
    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
        res.status(500).send("Server error");
    }
});

router.get("/by-tmdb/:tmdbId", auth, async (req, res) => {
  try {
    const item = await Movie.findOne({
      user: req.user.id,
      tmdbId: req.params.tmdbId,
      contentType: "tv", // or "movie" depending on file
    });

    if (!item) return res.status(404).json({ msg: "Not found" });
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/movies/by-tmdb/:tmdbId
// @desc    Get a movie in watchlist by TMDB id
// @access  Private
router.get("/by-tmdb/:tmdbId", auth, async (req, res) => {
  try {
    const movie = await Movie.findOne({
      user: req.user.id,
      tmdbId: req.params.tmdbId,
      contentType: "movie",
    });

    if (!movie) {
      return res.status(404).json({ msg: "Movie not found" });
    }

    res.json(movie);
  } catch (err) {
    console.error("GET /by-tmdb/:tmdbId error:", err.message);
    res.status(500).send("Server error");
  }
});


module.exports = router;