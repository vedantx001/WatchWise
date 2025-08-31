const router = require("express").Router();
const Movie = require("../models/Movie");
const auth = require("../middleware/auth");

router.get("/stats", auth, async (req, res) => {
  const { contentType, period = "overall" } = req.query;
  if(!contentType) {
    return res.status(400).json({ error: "contentType query parameter is required" });
  }

  console.log("Incoming stats request:", req.query);

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

      const top10 = [...movies]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)
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
          watchTime: totalWatchTime,
        },
        dailyActivity,
        top5,
        top10,
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
            .map(s => {
            // compute avg rating from episodes
            const episodeRatings = (s.episodes || []).map(e => e.rating).filter(r => typeof r === 'number');
            const seasonRating = episodeRatings.length > 0
                ? episodeRatings.reduce((a, b) => a + b, 0) / episodeRatings.length
                : 0;

            return {
                ...s.toObject(),
                showId: show._id,
                showTitle: show.title,
                showGenres: Array.isArray(show.genre) ? show.genre : (show.genre ? [show.genre] : []),
                seasonRating,
            };
            })
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
          watchTime: totalWatchTime,
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