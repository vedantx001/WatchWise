const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  fetchMovieVideos,
  fetchTvVideos,
  fetchSeasonVideos,
} = require("../utils/tmdbApi");

function pickBestYouTubeTrailer(videos) {
  if (!Array.isArray(videos)) return null;
  return (
    videos.find(v => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    videos.find(v => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find(v => v.site === "YouTube") ||
    null
  );
}

// GET /api/trailer/movie/:id -> { key, site, name } or 404
router.get("/movie/:id", auth, async (req, res) => {
  try {
    const vids = await fetchMovieVideos(req.params.id);
    const pick = pickBestYouTubeTrailer(vids);
    if (!pick) return res.status(404).json({ msg: "No trailer found" });
    res.json({ key: pick.key, site: pick.site, name: pick.name, type: pick.type });
  } catch (e) {
    console.error("/api/trailer/movie error:", e.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/trailer/tv/:id -> { key, site, name } or 404
router.get("/tv/:id", auth, async (req, res) => {
  try {
    const vids = await fetchTvVideos(req.params.id);
    const pick = pickBestYouTubeTrailer(vids);
    if (!pick) return res.status(404).json({ msg: "No trailer found" });
    res.json({ key: pick.key, site: pick.site, name: pick.name, type: pick.type });
  } catch (e) {
    console.error("/api/trailer/tv error:", e.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/trailer/tv/:id/season/:seasonNumber -> tries season then falls back to series
router.get("/tv/:id/season/:seasonNumber", auth, async (req, res) => {
  const { id, seasonNumber } = req.params;
  try {
    let vids = await fetchSeasonVideos(id, seasonNumber);
    let pick = pickBestYouTubeTrailer(vids);
    if (!pick) {
      vids = await fetchTvVideos(id);
      pick = pickBestYouTubeTrailer(vids);
    }
    if (!pick) return res.status(404).json({ msg: "No trailer found" });
    res.json({ key: pick.key, site: pick.site, name: pick.name, type: pick.type });
  } catch (e) {
    console.error("/api/trailer/tv/season error:", e.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
