// src/pages/Watchlist.jsx (or wherever it lives)
import { useEffect, useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import SearchBar from "../components/SearchBar";
import fallbackPoster from "../assets/fallback_poster2.png";
import { useNavigate } from "react-router-dom";

function Watchlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [movieFilter, setMovieFilter] = useState("all");
  const [tvFilter, setTvFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("movies");

  const withPosterUrl = (m) => {
    const isTmdbPath = m.posterPath && m.posterPath.startsWith("/");
    return {
      ...m,
      posterUrl: m.posterPath
        ? isTmdbPath
          ? `https://image.tmdb.org/t/p/w500${m.posterPath}`
          : m.posterPath
        : fallbackPoster,
    };
  };

  useEffect(() => {
    let isMounted = true;
    api.get("/movies").then((res) => {
      const withPosters = res.data.map(withPosterUrl);
      if (isMounted) setItems(withPosters);
    });
    return () => { isMounted = false; };
  }, []);

  const clearWatchlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire watchlist?")) return;
    await api.delete("/movies/clear");
    setItems([]);
  };

  const deleteItem = async (id) => {
    await api.delete(`/movies/${id}`);
    setItems((prev) => prev.filter((m) => m._id !== id));
  };

  const toggleFavorite = async (id) => {
    const res = await api.put(`/movies/${id}/favorite`);
    setItems((prev) => prev.map((m) => (m._id === id ? withPosterUrl(res.data) : m)));
  };

  const startWatching = async (id) => {
    const res = await api.put(`/movies/${id}`, { status: "watching" });
    setItems((prev) => prev.map((m) => (m._id === id ? withPosterUrl(res.data) : m)));
  };

  const completeWatching = async (id) => {
    const res = await api.put(`/movies/${id}`, { status: "completed" });
    setItems((prev) => prev.map((m) => (m._id === id ? withPosterUrl(res.data) : m)));
  };

  const cardVariants = {
    initial: { opacity: 0, y: 24, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } },
  };

  // Filters
  const filteredMovies = items.filter(
    (m) => m.contentType === "movie" && (movieFilter === "all" ? true : m.status === movieFilter)
  );

  // Group TV shows by tmdbId (one doc per show; seasons inside)
  const tvItems = items.filter((m) => m.contentType === "tv");
  const tvGrouped = tvItems.reduce((acc, item) => {
    acc[item.tmdbId] = acc[item.tmdbId] || [];
    acc[item.tmdbId].push(item);
    return acc;
  }, {});
  // In case you ever store multiple docs per show (shouldn't), flatten by newest
  const tvShows = Object.values(tvGrouped).map((arr) => arr.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))[0]);

  const tvFiltered = tvShows.filter((m) => {
    if (tvFilter === "all") return true;
    // Consider a show "watching/completed" if any season matches that status
    const has = (status) => (m.seasons || []).some((s) => s.status === status);
    return has(tvFilter);
  });

  const renderSeasonChips = (show) => {
    const seasons = show.seasons || [];
    if (!seasons.length) {
      return <p className="text-sm text-gray-400">No seasons added yet.</p>;
    }
    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {seasons.map((s) => (
          <button
            key={s.seasonNumber}
            onClick={() => navigate(`/details/tv/${show.tmdbId}/season/${s.seasonNumber}`)}
            className={`w-full text-left px-3 py-2 rounded-lg border transition 
              ${s.status === "completed" ? "border-green-500/60" :
                s.status === "watching" ? "border-yellow-500/60" : "border-white/10"} 
              hover:bg-white/5`}
            title={`Open Season ${s.seasonNumber}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Season {s.seasonNumber}</span>
              <span className="text-xs opacity-80">{s.episodeCount} eps</span>
            </div>
            <div className="text-xs mt-1 opacity-80">
              {s.status === "completed" ? "✅ Completed" : s.status === "watching" ? "⏳ Watching" : "📝 Planned"}
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderSection = (title, filter, setFilter, data, isTV = false) => (
    <section className="mb-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <h3 className="text-3xl font-extrabold bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-transparent">{title}</h3>
        <motion.span
          key={data.length + filter}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 15 }}
          className="px-4 py-2 rounded-full bg-gray-800/70 backdrop-blur ring-1 ring-white/10 text-lg font-bold shadow-md text-red-300"
        >
          {data.length} {data.length === 1 ? "Item" : "Items"}
        </motion.span>
      </motion.div>

      {/* Filters */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-1 rounded-full bg-gray-800/60 p-1 ring-1 ring-white/10 backdrop-blur">
          {["all", "planned", "watching", "completed"].map((f) => {
            const active = filter === f;
            const labelMap = { all: "All", planned: "📝 Planned", watching: "⏳ Watching", completed: "✅ Completed" };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 sm:px-5 py-2 rounded-full font-semibold transition duration-200 focus:outline-none ${
                  active ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow" : "text-gray-300 hover:text-white hover:bg-gray-700/60"
                }`}
                aria-pressed={active}
              >
                {labelMap[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.length > 0 ? (
          <AnimatePresence>
            {data.map((m) => (
              <motion.article
                layout
                key={m._id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative rounded-2xl backdrop-blur-sm border shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col"
                style={{
                  background: "var(--color-background-secondary)",
                  borderColor: "var(--color-accent)",
                  color: "var(--color-text-primary)",
                }}
              >
                {/* Poster */}
                <div className="relative h-60" style={{ background: "var(--color-background-primary)" }}>
                  <img
                    src={m.posterUrl || fallbackPoster}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={(e) => { e.target.onerror = null; e.target.src = fallbackPoster; }}
                  />
                  {/* Favorite */}
                  <motion.button
                    onClick={() => toggleFavorite(m._id)}
                    whileTap={{ scale: 0.85, rotate: -8 }}
                    animate={m.favorite ? { scale: [1, 1.3, 1], rotate: [0, -10, 0] } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.35 }}
                    title={m.favorite ? "Unfavorite" : "Favorite"}
                    aria-label={m.favorite ? "Unfavorite" : "Favorite"}
                    className={`absolute top-3 right-3 text-3xl drop-shadow ${m.favorite ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                  >
                    {m.favorite ? "♥" : "♡"}
                  </motion.button>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col flex-grow">
                  <h4 className="text-lg sm:text-xl font-bold mb-1.5 line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                    {m.title}
                  </h4>
                  <p className="text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>
                    Added on {new Date(m.createdAt).toLocaleDateString()}
                  </p>

                  {/* Status (Movies only) OR Seasons list (TV) */}
                  <AnimatePresence mode="wait">
                    {!isTV && m.status === "planned" && (
                      <motion.button
                        key="start"
                        onClick={() => startWatching(m._id)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md mb-3 transition"
                      >
                        🎬 Start Watching
                      </motion.button>
                    )}
                    {!isTV && m.status === "watching" && (
                      <motion.button
                        key="complete"
                        onClick={() => completeWatching(m._id)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md mb-3 transition"
                      >
                        ✅ Completed
                      </motion.button>
                    )}
                    {!isTV && m.status === "completed" && (
                      <motion.p
                        key="done"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="font-semibold mb-3"
                        style={{ color: "var(--color-accent)" }}
                      >
                        ✔ Completed
                      </motion.p>
                    )}
                    {isTV && (
                      <motion.div
                        key="seasons"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <p className="text-sm mb-2 opacity-80">Selected seasons:</p>
                        {renderSeasonChips(m)}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-grow" />

                  {/* Delete */}
                  <motion.button
                    onClick={() => deleteItem(m._id)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    aria-label="Delete item"
                    className="mt-auto px-4 py-2 rounded-lg text-sm font-semibold shadow-md ring-1"
                    style={{
                      background: "var(--color-accent)",
                      color: "var(--color-background-primary)",
                      borderColor: "var(--color-accent)",
                    }}
                  >
                    🗑 Delete
                  </motion.button>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 group-hover:ring-white/20 transition" />
              </motion.article>
            ))}
          </AnimatePresence>
        ) : (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center text-gray-500 text-xl py-10">
            No items here yet. 🚀
          </motion.p>
        )}
      </motion.div>
    </section>
  );

  return (
    <div className="relative min-h-screen p-6 sm:p-10 bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-16 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-[30rem] w-[30rem] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-10">
        <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-transparent">🎬 Your Watchlist</h2>
        <motion.button
          onClick={clearWatchlist}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Clear all watchlist"
          className="px-5 py-2 rounded-lg font-semibold tracking-wide text-white shadow-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 ring-1 ring-white/10"
        >
          🗑️ Clear All
        </motion.button>
      </motion.div>

      {/* Search */}
      <div className="m-auto w-full max-w-2xl mb-8">
        <SearchBar />
      </div>

      {/* Switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-full bg-gray-800/60 p-1 ring-1 ring-white/10 backdrop-blur">
          <button
            onClick={() => setActiveSection("movies")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeSection === "movies" ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow" : "text-gray-300 hover:text-white hover:bg-gray-700/60"}`}
            aria-label="Show Movies"
          >
            🎥 Movies
          </button>
          <button
            onClick={() => setActiveSection("tv")}
            className={`px-6 py-2 rounded-full font-semibold transition ${activeSection === "tv" ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow" : "text-gray-300 hover:text-white hover:bg-gray-700/60"}`}
            aria-label="Show TV Shows"
          >
            📺 TV Shows
          </button>
        </div>
      </div>

      {activeSection === "movies"
        ? renderSection("🎥 Movies", movieFilter, setMovieFilter, filteredMovies, false)
        : renderSection("📺 TV Shows", tvFilter, setTvFilter, tvFiltered, true)}
    </div>
  );
}

export default Watchlist;
