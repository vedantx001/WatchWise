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
    // --- Validation ---
    check("tmdbId", "TMDB ID is required").notEmpty().isString(),
    check("contentType", "Content type is required").isIn(["movie", "tv"]),
    check("status", "Invalid status")
      .optional()
      .isIn(["planned", "watching", "completed"]),
    check("rating", "Rating must be between 0 and 10")
      .optional()
      .isFloat({ min: 0, max: 10 }),
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

    const {
      status,
      rating,
      favorite,
      tmdbId,
      contentType,
      seasonNumber,
    } = req.body;

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
          contentType,
          status: status || "planned",
          rating: tmdbData.vote_average || 0,
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
        if (seasonNumber === undefined || seasonNumber === null) {
          return res
            .status(400)
            .json({ msg: "Season number is required for TV shows" });
        }

        const tvData = await fetchTvShowDetails(tmdbId);
        const seasonData = await fetchSeasonDetails(tmdbId, seasonNumber);

        // Calculate totals
        const totalEpisodes =
          tvData.seasons?.reduce((acc, s) => acc + (s.episode_count || 0), 0) ||
          0;

        let allEpisodeDurations = [];
        if (tvData.seasons && Array.isArray(tvData.seasons)) {
          for (const s of tvData.seasons) {
            if (
              s.episode_count &&
              tvData.episode_run_time &&
              tvData.episode_run_time.length > 0
            ) {
              allEpisodeDurations.push(
                ...Array(s.episode_count).fill(tvData.episode_run_time[0])
              );
            }
          }
        }
        if (seasonData.episodes && Array.isArray(seasonData.episodes)) {
          for (const ep of seasonData.episodes) {
            if (ep.runtime) {
              allEpisodeDurations.push(ep.runtime);
            }
          }
        }

        const totalDuration = allEpisodeDurations.reduce(
          (acc, d) => acc + (d || 0),
          0
        );  

        // Season duration
        const seasonDuration =
          seasonData.episodes?.reduce(
            (acc, ep) =>
              acc + (ep.runtime || tvData.episode_run_time?.[0] || 0),
            0
          ) || 0;

        // Find existing show
        let existingShow = await Movie.findOne({
          user: req.user.id,
          tmdbId,
          contentType: "tv",
        });

        if (existingShow) {
          // Check if season already exists
          const alreadyAdded = existingShow.seasons.find(
            (s) => Number(s.seasonNumber) === Number(seasonNumber)
          );
          if (alreadyAdded) {
            return res
              .status(400)
              .json({ msg: "This season is already in your watchlist." });
          }

          // Add new season
          existingShow.seasons.push({
            seasonNumber,
            title: seasonData.name || `Season ${seasonNumber}`,
            overview: seasonData.overview,
            episodeCount: seasonData.episodes.length,
            duration: seasonDuration,
            posterPath: seasonData.poster_path
              ? `${TMDB_IMAGE_BASE_URL}${seasonData.poster_path}`
              : existingShow.posterPath,
            status: status || "planned",
            episodes: seasonData.episodes.map((ep) => ({
              episodeNumber: ep.episode_number,
              name: ep.name,
              duration: ep.runtime || tvData.episode_run_time?.[0] || 0,
              overview: ep.overview,
              airDate: ep.air_date ? new Date(ep.air_date) : null,
              rating: ep.vote_average || 0,
            })),
          });

          // Update show-level fields
          existingShow.duration = totalDuration;
          existingShow.tmdbRating = tvData.vote_average || 0;
          existingShow.inProduction = tvData.in_production;
          existingShow.totalEpisodes = totalEpisodes;
          existingShow.totalSeasons = tvData.number_of_seasons;

          await existingShow.save();
          return res.status(201).json(existingShow);

        } else {
          // Create new show
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
            duration: totalDuration,
            tmdbRating: tvData.vote_average || 0,
            totalEpisodes,
            seasons: [
              {
                seasonNumber,
                title: seasonData.name || `Season ${seasonNumber}`,
                overview: seasonData.overview,
                episodeCount: seasonData.episodes.length,
                duration: seasonDuration,
                posterPath: seasonData.poster_path
                  ? `${TMDB_IMAGE_BASE_URL}${seasonData.poster_path}`
                  : null,
                status: status || "planned",
                episodes: seasonData.episodes.map((ep) => ({
                  episodeNumber: ep.episode_number,
                  name: ep.name,
                  duration: ep.runtime || tvData.episode_run_time?.[0] || 0,
                  overview: ep.overview,
                  airDate: ep.air_date ? new Date(ep.air_date) : null,
                  rating: ep.vote_average || 0,
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

    // Update season status
    season.status = status;
    season.completedDate = status === "completed" ? new Date() : null;

    // 🔄 Update parent show status dynamically
    const allCompleted = show.seasons.every((s) => s.status === "completed");
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

// Helper function to format duration in minutes to "Xd Yh Zm"
const formatDuration = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0m";
  }
  const days = Math.floor(totalMinutes / 1440); // 60 * 24
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || result === "") result += `${minutes}m`;
  
  return result.trim();
};

// routes/movies.js (or wherever your stats route is defined)
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, period = "overall" } = req.query;

    if (!["movie", "tv"].includes(contentType)) {
      return res.status(400).json({ error: "contentType must be 'movie' or 'tv'" });
    }

    // --- Date Filtering Logic ---
    let dateFilter = {};
    const now = new Date();
    if (period === "thisYear") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      // FIXED: Use 'completedDate' instead of 'completedAt'
      dateFilter = { completedDate: { $gte: startOfYear } };
    } else if (period === "thisMonth") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // FIXED: Use 'completedDate' instead of 'completedAt'
      dateFilter = { completedDate: { $gte: startOfMonth } };
    }

    // =============================================
    // =========== MOVIES STATS LOGIC ==============
    // =============================================
    if (contentType === "movie") {
      const query = {
        user: userId,
        contentType: "movie", // <-- FIXED
        status: "completed",
        ...dateFilter,
      };
      
      const movies = await Movie.find(query);

      if (movies.length === 0) {
        return res.json({ stats: {}, dailyActivity: [], top5: [] });
      }

      const watchCount = movies.length;
      const totalRating = movies.reduce((sum, m) => sum + (m.rating || 0), 0);
      const avgRate = watchCount > 0 ? (totalRating / watchCount) : 0;
      // FIXED: Use 'duration' instead of 'runtime'
      const totalWatchTime = movies.reduce((sum, m) => sum + (m.duration || 0), 0);

      const bestMovie = movies.reduce((max, m) => (m.rating > max.rating ? m : max), movies[0]);
      const worstMovie = movies.reduce((min, m) => (m.rating < min.rating ? m : min), movies[0]);

      // FIXED: Use 'genre' instead of 'genres'
      const genreCounts = movies.flatMap(m => m.genre || []).reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});
      const favoriteGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b, null);

      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dailyActivityMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      movies.forEach(m => {
          // FIXED: Use 'completedDate' instead of 'completedAt'
          const day = weekdays[new Date(m.completedDate).getDay()];
          if(day) dailyActivityMap[day]++;
      });
      const dailyActivity = Object.entries(dailyActivityMap).map(([day, count]) => ({ day, count }));

      const top5 = [...movies]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)
        .map(m => ({ id: m._id, title: m.title, rating: m.rating, posterPath: m.posterPath }));

      return res.json({
        stats: {
          watchCount,
          avgRate: parseFloat(avgRate.toFixed(2)),
          bestRatedMovie: bestMovie.title,
          bestRate: bestMovie.rating,
          worstRatedMovie: worstMovie.title,
          worstRate: worstMovie.rating,
          favoriteGenre,
          watchTime: formatDuration(totalWatchTime),
        },
        dailyActivity,
        top5,
      });
    }

    // =============================================
    // ============ TV SERIES STATS LOGIC ==========
    // =============================================
    if (contentType === "tv") {
      const userShows = await Movie.find({ user: userId, contentType: "tv" });

      // Gather all completed seasons with their parent info
      const allCompletedSeasons = userShows.flatMap(show =>
        (show.seasons || [])
          .filter(s => s.status === 'completed')
          .map(s => ({
            ...s.toObject(),
            showId: show._id,
            showTitle: show.title,
            showGenres: Array.isArray(show.genre) ? show.genre : (show.genre ? [show.genre] : []),
            seasonRating: typeof s.voteAverage === 'number' ? s.voteAverage : null
          }))
      );

      // Filter by completedDate and period
      const filteredSeasons = allCompletedSeasons.filter(s => {
        if (!s.completedDate) return false;
        const completedDate = new Date(s.completedDate);
        if (period === 'thisYear') return completedDate >= new Date(now.getFullYear(), 0, 1);
        if (period === 'thisMonth') return completedDate >= new Date(now.getFullYear(), now.getMonth(), 1);
        return true;
      });

      if (filteredSeasons.length === 0) {
        return res.json({ stats: {}, dailyActivity: [], top5: [] });
      }

      // Watch count = completed seasons
      const watchCount = filteredSeasons.length;
      // Episodes watched = sum of episodeCount
      const totalEpisodes = filteredSeasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0);
      // Watch time = sum of durations
      const totalWatchTime = filteredSeasons.reduce((sum, s) => sum + (s.duration || 0), 0);

      // Group by showId for show-level stats
      const showStatsMap = new Map();
      filteredSeasons.forEach(season => {
        if (!showStatsMap.has(season.showId)) {
          showStatsMap.set(season.showId, {
            title: season.showTitle,
            genres: season.showGenres,
            ratings: [],
            seasonCount: 0,
          });
        }
        const show = showStatsMap.get(season.showId);
        if (typeof season.seasonRating === 'number') show.ratings.push(season.seasonRating);
        show.seasonCount++;
      });

      // Only count shows with at least one completed season
      const tvSeriesWatched = Array.from(showStatsMap.values()).filter(s => s.seasonCount > 0).length;

      // Calculate show averages
      const showAverages = Array.from(showStatsMap.values()).map(show => ({
        ...show,
        avgRating: show.ratings.length > 0 ? (show.ratings.reduce((a, b) => a + b, 0) / show.ratings.length) : 0,
      }));

      // Avg. rate = average across all completed seasons
      const totalSeasonRatings = filteredSeasons.reduce((sum, s) => sum + (typeof s.seasonRating === 'number' ? s.seasonRating : 0), 0);
      const avgRate = watchCount > 0 ? (totalSeasonRatings / watchCount) : 0;

      // Best/worst series by show average
      const bestSeries = showAverages.reduce((max, s) => (s.avgRating > max.avgRating ? s : max), showAverages[0]);
      const worstSeries = showAverages.reduce((min, s) => (s.avgRating < min.avgRating ? s : min), showAverages[0]);

      // Favorite genre: most-watched genre (single string)
      const genreCounts = showAverages.flatMap(s => s.genres || []).reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});
      const favoriteGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b, null);

      // Daily activity: count of seasons completed per weekday
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dailyActivityMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      filteredSeasons.forEach(s => {
        const day = weekdays[new Date(s.completedDate).getDay()];
        if(day) dailyActivityMap[day]++;
      });
      const dailyActivity = Object.entries(dailyActivityMap).map(([day, count]) => ({ day, count }));

      // Top 5/10: shows ranked by average rating of completed seasons
      const top5 = [...showAverages]
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5)
        .map(s => ({ title: s.title, rating: parseFloat(s.avgRating.toFixed(2)) }));
      const top10 = [...showAverages]
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 10)
        .map(s => ({ title: s.title, rating: parseFloat(s.avgRating.toFixed(2)) }));

      return res.json({
        stats: {
          watchCount,
          avgRate: parseFloat(avgRate.toFixed(2)),
          bestRatedTVSeries: bestSeries.title,
          bestRate: parseFloat(bestSeries.avgRating.toFixed(2)),
          worstRatedTVSeries: worstSeries.title,
          worstRate: parseFloat(worstSeries.avgRating.toFixed(2)),
          episodesWatched: totalEpisodes,
          tvSeriesWatched,
          favoriteGenre,
          watchTime: formatDuration(totalWatchTime),
        },
        dailyActivity,
        top5,
        top10,
      });
    }

  } catch (error) {
    console.error("Error in /stats route:", error);
    res.status(500).json({ error: "Server error occurred while fetching stats." });
  }
});


module.exports = router;