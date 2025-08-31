const router = require("express").Router();
const Movie = require("../models/Movie");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const { fetchMovieDetails, fetchTvShowDetails, fetchSeasonDetails, TMDB_IMAGE_BASE_URL } = require("../utils/tmdbApi");


/** Helper: recompute show-level totals from seasons present on the doc */
function recomputeShowAggregatesFromDoc(showDoc) {
  const seasons = Array.isArray(showDoc.seasons) ? showDoc.seasons : [];
  const totalEpisodes = seasons.reduce((acc, s) => acc + (s.episodeCount || 0), 0);
  const totalDuration = seasons.reduce((acc, s) => acc + (s.duration || 0), 0);
  showDoc.totalEpisodes = totalEpisodes;
  showDoc.duration = totalDuration;       // keep using `duration` as canonical total minutes
  showDoc.totalDuration = totalDuration;  // keep this in sync if your schema uses it
}

/** Helper: build a single season block from TMDb season details */
function buildSeasonBlock(seasonData, tvData, status) {
  const fallbackEpRuntime = Array.isArray(tvData.episode_run_time) && tvData.episode_run_time.length > 0
    ? tvData.episode_run_time[0]
    : 0;

  const episodes = (seasonData.episodes || []).map((ep) => {
    const duration = ep.runtime || fallbackEpRuntime || 0;
    return {
      episodeNumber: ep.episode_number,
      name: ep.name,
      duration,
      overview: ep.overview,
      airDate: ep.air_date ? new Date(ep.air_date) : null,
      rating: ep.vote_average || 0,
    };
  });

  const seasonDuration = episodes.reduce((acc, e) => acc + (e.duration || 0), 0);

  return {
    seasonNumber: seasonData.season_number,
    title: seasonData.name || `Season ${seasonData.season_number}`,
    overview: seasonData.overview,
    episodeCount: episodes.length,
    duration: seasonDuration,
    posterPath: seasonData.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${seasonData.poster_path}`
      : null,
    status: status || "planned",
    voteAverage: seasonData.vote_average || 0, // store TMDb season rating
    episodes,
  };
}

router.post(
  "/",
  auth,
  [
    check("tmdbId", "TMDB ID is required").notEmpty().isString(),
    check("contentType", "Content type is required").isIn(["movie", "tv"]),
    check("status", "Invalid status").optional().isIn(["planned", "watching", "completed"]),
    check("rating", "Rating must be between 0 and 10").optional().isFloat({ min: 0, max: 10 }),
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

    const { status, favorite, tmdbId, contentType, seasonNumber } = req.body;

    try {
      if (contentType === "movie") {
        // ----- Handle Movie -----
        const tmdbData = await fetchMovieDetails(tmdbId);

        const existing = await Movie.findOne({
          user: req.user.id,
          tmdbId,
          contentType: "movie",
        });
        if (existing) {
          return res.status(400).json({ msg: "This movie is already in your watchlist." });
        }

        const newMovie = new Movie({
          user: req.user.id,
          tmdbId,
          contentType,
          status: status || "planned",
          rating: tmdbData.vote_average || 0, // TMDb rating saved to parent `rating`
          favorite: favorite || false,
          completedDate: status === "completed" ? new Date() : null,
          title: tmdbData.title,
          genre: tmdbData.genres ? tmdbData.genres.map((g) => g.name) : [],
          posterPath: tmdbData.poster_path
            ? `${TMDB_IMAGE_BASE_URL}${tmdbData.poster_path}`
            : null,
          releaseDate: tmdbData.release_date,
          language: tmdbData.original_language,
          duration: tmdbData.runtime || 0, // minutes
        });

        const saved = await newMovie.save();
        return res.status(201).json(saved);
      }

      // ----- Handle TV -----
      if (contentType === "tv") {
        if (seasonNumber === undefined || seasonNumber === null) {
          return res.status(400).json({ msg: "Season number is required for TV shows" });
        }

        const tvData = await fetchTvShowDetails(tmdbId);

        // Prevent duplicate shows
        let existingShow = await Movie.findOne({
          user: req.user.id,
          tmdbId,
          contentType: "tv",
        });

        // CASE A: Placeholder add (seasonNumber === 0) => create the show without Specials
        if (!existingShow && Number(seasonNumber) === 0) {
          const totalEpisodesFromTMDB =
            (tvData.seasons || []).reduce((acc, s) => acc + (s.episode_count || 0), 0) || 0;

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
            // Official TMDb show rating saved on parent:
            rating: tvData.vote_average || 0,
            // Durations start at 0 when no concrete season is tracked yet:
            duration: 0,
            totalDuration: 0,
            totalEpisodes: totalEpisodesFromTMDB, // metadata from TMDb
            episodeDuration:
              (Array.isArray(tvData.episode_run_time) && tvData.episode_run_time[0]) || 0,
            seasons: [],
            status: status || "planned",
            favorite: !!favorite,
          });

          const savedShow = await newShow.save();
          return res.status(201).json(savedShow);
        }

        // CASE B: Add a concrete season (> 0) or when show already exists
        const seasonNum = Number(seasonNumber);
        if (seasonNum === 0) {
          // If show already exists and they try to add 0 again, no-op
          return res.status(200).json(existingShow);
        }

        // Fetch that specific season
        const seasonData = await fetchSeasonDetails(tmdbId, seasonNum);
        const seasonBlock = buildSeasonBlock(seasonData, tvData, status);

        if (existingShow) {
          // Ensure the season doesn't already exist
          const already = (existingShow.seasons || []).find(
            (s) => Number(s.seasonNumber) === seasonNum
          );
          if (already) {
            return res.status(400).json({ msg: "This season is already in your watchlist." });
          }

          // Push new season and recompute totals from what's on the doc
          existingShow.seasons.push({
            ...seasonBlock,
            // Keep poster fallback to parent if needed
            posterPath:
              seasonBlock.posterPath || existingShow.posterPath || null,
          });

          // Update show-level metadata from TMDb
          existingShow.title = tvData.name || existingShow.title;
          existingShow.genre = tvData.genres ? tvData.genres.map((g) => g.name) : existingShow.genre;
          existingShow.inProduction = tvData.in_production;
          existingShow.totalSeasons = tvData.number_of_seasons;
          existingShow.language = tvData.original_language || existingShow.language;
          // Critical: use official TMDb show rating
          existingShow.rating = tvData.vote_average || 0;

          // Recompute duration & totals **from seasons present on the doc**
          recomputeShowAggregatesFromDoc(existingShow);

          await existingShow.save();
          return res.status(201).json(existingShow);
        } else {
          // Create new show with the single season
          const totalEpisodesFromTMDB =
            (tvData.seasons || []).reduce((acc, s) => acc + (s.episode_count || 0), 0) || 0;

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
            // Save TMDb official show rating on parent:
            rating: tvData.vote_average || 0,
            seasons: [
              {
                ...seasonBlock,
                posterPath:
                  seasonBlock.posterPath ||
                  (tvData.poster_path ? `${TMDB_IMAGE_BASE_URL}${tvData.poster_path}` : null),
              },
            ],
            status: status || "planned",
            favorite: !!favorite,
            totalEpisodes: totalEpisodesFromTMDB, // metadata
            episodeDuration:
              (Array.isArray(tvData.episode_run_time) && tvData.episode_run_time[0]) || 0,
          });

          // Derive totals from the season(s) we store on the doc
          recomputeShowAggregatesFromDoc(newShow);

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


// UPDATE MOVIE STATUS
router.put("/:id", auth, async (req, res) => {
  const { status } = req.body;

  try {
    let item = await Movie.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Not found" });

    if (item.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    if (item.contentType === "movie") {
      if (status) {
        item.status = status;
        item.completedDate = status === "completed" ? new Date() : null;
      }
    } else {
      return res.status(400).json({ msg: "Use season route for TV shows" });
    }

    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// TOGGLE FAVORITE (works for both movies & TV shows)
router.put("/:id/favorite", auth, async (req, res) => {
  try {
    let item = await Movie.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Not found" });

    if (item.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    item.favorite = !item.favorite;
    await item.save();

    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// UPDATE OR CREATE SEASON STATUS
router.put("/:id/season/:seasonNumber", auth, async (req, res) => {
  const { status } = req.body;

  try {
    const show = await Movie.findById(req.params.id);
    if (!show || show.contentType !== "tv")
      return res.status(404).json({ msg: "TV show not found" });

    if (show.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    // Find season by number
    let season = show.seasons.find(
      (s) => s.seasonNumber === parseInt(req.params.seasonNumber)
    );

    // If season not found, create it
    if (!season) {
      season = {
        seasonNumber: parseInt(req.params.seasonNumber),
        status: status || "planned",
        episodes: [],
      };
      show.seasons.push(season);
    } else {
      // Otherwise update status
      season.status = status;
      season.completedDate = status === "completed" ? new Date() : null;
    }

    // Update parent show status dynamically
    const allCompleted =
      show.seasons.length > 0 &&
      show.seasons.every((s) => s.status === "completed");
    const anyWatching = show.seasons.some((s) => s.status === "watching");

    if (allCompleted) {
      show.status = "completed";
      show.completedDate = new Date();
    } else if (anyWatching) {
      show.status = "watching";
      show.completedDate = null;
    } else {
      show.status = "planned";
      show.completedDate = null;
    }

    await show.save();
    res.json(show);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});




// @route   GET api/movies
// @desc    Get all watchlist movies/tv shows for a user (with filters)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { contentType, status, favorite, sort } = req.query;

    let filter = { user: req.user.id };

    if (contentType) filter.contentType = contentType;
    if (status) filter.status = status;
    if (favorite) filter.favorite = favorite === "true";

    // Default sorting by created date
    let sortOption = { createdAt: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "title") sortOption = { title: 1 };

    let items = await Movie.find(filter).sort(sortOption);

    // Post-process TV shows' parent status dynamically
    items = items.map((item) => {
      if (item.contentType === "tv" && item.seasons && item.seasons.length > 0) {
        const allCompleted = item.seasons.every((s) => s.status === "completed");
        const anyWatching = item.seasons.some((s) => s.status === "watching");

        if (allCompleted) item.status = "completed";
        else if (anyWatching) item.status = "watching";
        else item.status = "planned";
      }
      return item;
    });

    res.json(items);
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

module.exports = router;