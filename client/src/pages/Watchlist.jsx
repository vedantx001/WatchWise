import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import SearchBar from "../components/SearchBar";
import fallbackPoster from "../assets/fallback_poster2.png";

function Watchlist() {
  const [items, setItems] = useState([]);
  const [movieFilter, setMovieFilter] = useState("all");
  const [tvFilter, setTvFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("movies");

  // helper to always build poster url
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
    api.get("/movies").then(async (res) => {
      const withPosters = res.data.map(withPosterUrl);
      if (isMounted) setItems(withPosters);
    });
    return () => {
      isMounted = false;
    };
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

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 24, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
    exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } },
  };

  // Filters
  const filteredMovies = items.filter(
    (m) =>
      m.contentType === "movie" &&
      (movieFilter === "all" ? true : m.status === movieFilter)
  );
  const filteredTV = items.filter(
    (m) =>
      m.contentType === "tv" &&
      (tvFilter === "all" ? true : m.status === tvFilter)
  );

  // Renderer
  const renderSection = (title, filter, setFilter, data) => (
    <section className="mb-16">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <h3 className="text-3xl font-extrabold bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-transparent">
          {title}
        </h3>
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
            const labelMap = {
              all: "All",
              planned: "📝 Planned",
              watching: "⏳ Watching",
              completed: "✅ Completed",
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 sm:px-5 py-2 rounded-full font-semibold transition duration-200 focus:outline-none ${
                  active
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/60"
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
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
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
                <div
                  className="relative h-60"
                  style={{ background: "var(--color-background-primary)" }}
                >
                  <img
                    src={m.posterUrl || fallbackPoster}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={(e) => {
                      const target = e.target;
                      target.onerror = null;
                      target.src = fallbackPoster;
                    }}
                  />

                  {/* Favorite heart */}
                  <motion.button
                    onClick={() => toggleFavorite(m._id)}
                    whileTap={{ scale: 0.85, rotate: -8 }}
                    animate={
                      m.favorite
                        ? { scale: [1, 1.3, 1], rotate: [0, -10, 0] }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{ duration: 0.35 }}
                    title={m.favorite ? "Unfavorite" : "Favorite"}
                    aria-label={m.favorite ? "Unfavorite" : "Favorite"}
                    className={`absolute top-3 right-3 text-3xl drop-shadow ${
                      m.favorite
                        ? "text-red-500"
                        : "text-gray-300 hover:text-red-400"
                    }`}
                  >
                    {m.favorite ? "♥" : "♡"}
                  </motion.button>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col flex-grow">
                  <h4
                    className="text-lg sm:text-xl font-bold mb-1.5 line-clamp-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {m.title}
                  </h4>
                  <p
                    className="text-xs mb-4"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Added on {new Date(m.createdAt).toLocaleDateString()}
                  </p>

                  {/* Status Controls */}
                  <AnimatePresence mode="wait">
                    {m.status === "planned" && (
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
                    {m.status === "watching" && (
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
                    {m.status === "completed" && (
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
                      borderColor: "var(--color-accent)"
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center text-gray-500 text-xl py-10"
          >
            No items here yet. 🚀
          </motion.p>
        )}
      </motion.div>
    </section>
  );

  return (
    <div
      className="relative min-h-screen p-6 sm:p-10 bg-[var(--color-background-primary)] dark:bg-[var(--color-background-primary)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]"
    >
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-16 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-[30rem] w-[30rem] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      {/* Main header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-10"
      >
        <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-transparent">
          🎬 Your Watchlist
        </h2>
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

      {/* Section switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-full bg-gray-800/60 p-1 ring-1 ring-white/10 backdrop-blur">
          <button
            onClick={() => setActiveSection("movies")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeSection === "movies"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow"
                : "text-gray-300 hover:text-white hover:bg-gray-700/60"
            }`}
            aria-label="Show Movies"
          >
            🎥 Movies
          </button>
          <button
            onClick={() => setActiveSection("tv")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeSection === "tv"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow"
                : "text-gray-300 hover:text-white hover:bg-gray-700/60"
            }`}
            aria-label="Show TV Shows"
          >
            📺 TV Shows
          </button>
        </div>
      </div>

      {/* Render active section */}
      {activeSection === "movies"
        ? renderSection("🎥 Movies", movieFilter, setMovieFilter, filteredMovies)
        : renderSection("📺 TV Shows", tvFilter, setTvFilter, filteredTV)}
    </div>
  );
}

export default Watchlist;
