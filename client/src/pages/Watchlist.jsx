import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import api from "../api";
import SearchBar from "../components/SearchBar";
import fallbackPoster from "../assets/fallback_poster2.png";
import { useNavigate } from "react-router-dom";
import "../styles/watchlist.css";

function Watchlist() {
  const navigate = useNavigate();

  // Data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI State
  const [activeSection, setActiveSection] = useState("movies"); // "movies" | "tv"
  const [movieFilter, setMovieFilter] = useState("all"); // "all" | "planned" | "watching" | "completed"
  const [tvFilter, setTvFilter] = useState("all"); // "all" | "planned" | "watching" | "completed"

  // Mobile: expand/collapse TV show groups
  const [expandedShows, setExpandedShows] = useState(() => new Set());

  // Search modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState("movie"); // "movie" | "tv"
  const openSearch = (mode) => {
    setSearchMode(mode);
    setSearchOpen(true);
  };
  const closeSearch = () => setSearchOpen(false);

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

  // Load items
  useEffect(() => {
    reloadWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Central reload to sync list after any details-page update
  const reloadWatchlist = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    api
      .get("/movies")
      .then((res) => {
        if (!mounted) return;
        const withPosters = res.data.map(withPosterUrl);
        setItems(withPosters);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Failed to load your watchlist.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Actions
  const clearWatchlist = async () => {
    if (!window.confirm("Clear your entire watchlist? This cannot be undone.")) return;
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

  const startWatchingSeason = async (showId, seasonNumber) => {
    const res = await api.put(`/movies/${showId}/season/${seasonNumber}`, { status: "watching" });
    setItems((prev) => prev.map((m) => (m._id === showId ? withPosterUrl(res.data) : m)));
  };

  const completeSeason = async (showId, seasonNumber) => {
    const res = await api.put(`/movies/${showId}/season/${seasonNumber}`, { status: "completed" });
    setItems((prev) => prev.map((m) => (m._id === showId ? withPosterUrl(res.data) : m)));
  };

  // Helpers
  const movies = useMemo(() => items.filter((i) => i.contentType === "movie"), [items]);

  const filteredMovies = useMemo(
    () => movies.filter((m) => (movieFilter === "all" ? true : m.status === movieFilter)),
    [movies, movieFilter]
  );

  const tvItems = useMemo(() => items.filter((i) => i.contentType === "tv"), [items]);

  const tvShows = useMemo(() => {
    const grouped = tvItems.reduce((acc, item) => {
      acc[item.tmdbId] = acc[item.tmdbId] || [];
      acc[item.tmdbId].push(item);
      return acc;
    }, {});
    return Object.values(grouped).map((arr) =>
      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    );
  }, [tvItems]);

  const showHasStatus = (show, status) => (show.seasons || []).some((s) => s.status === status);

  const tvFiltered = useMemo(
    () => tvShows.filter((show) => (tvFilter === "all" ? true : showHasStatus(show, tvFilter))),
    [tvShows, tvFilter]
  );

  const showProgress = (show) => {
    const seasons = show.seasons || [];
    const total = seasons.length;
    const completed = seasons.filter((s) => s.status === "completed").length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const watching = seasons.some((s) => s.status === "watching");
    return { total, completed, percent, watching };
  };

  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const seasonDateText = (show, season) => {
    const base = season?.updatedAt || season?.createdAt || show?.updatedAt || show?.createdAt;
    const label =
      season?.status === "completed"
        ? "Finished"
        : season?.status === "watching"
        ? "Started"
        : "Added";
    return `${label} ${formatDate(base)}`;
  };

  // Animations and variants (desktop cards)
  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } },
  };

  const StatusPill = ({ status }) => {
    let text = "Planned";
    let cls =
      "bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-background-secondary)]";
    if (status === "watching") {
      text = "Watching";
      cls = "bg-transparent text-[var(--color-accent)] border border-[var(--color-accent)]";
    } else if (status === "completed") {
      text = "Completed";
      cls = "bg-[var(--color-accent)] text-white border border-[var(--color-accent)]";
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
        {text}
      </span>
    );
  };

  const SeasonChips = ({ show }) => {
    const seasons = show.seasons || [];
    if (!seasons.length) {
      return <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No seasons added yet.</p>;
    }
    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {seasons.map((s) => (
          <div
            key={s.seasonNumber}
            className={`w-full text-left px-3 py-2 rounded-xl border transition relative overflow-hidden hover:bg-opacity-80`}
            style={{
              background: "var(--color-background-secondary)",
              borderColor:
                s.status === "completed" || s.status === "watching"
                  ? "var(--color-accent)"
                  : "var(--color-background-secondary)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background:
                  "radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(127,127,127,0.1), transparent 40%)",
              }}
            />
            <div
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                e.currentTarget.style.setProperty("--mx", `${x}px`);
                e.currentTarget.style.setProperty("--my", `${y}px`);
              }}
              className="relative z-10"
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={() => navigate(`/details/tv/${show.tmdbId}/season/${s.seasonNumber}`)}
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Season {s.seasonNumber}
                </span>
                <span className="text-xs opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                  {s.episodeCount} eps
                </span>
              </div>
              <div className="text-xs mt-1 opacity-80 mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {s.status === "completed" ? " Completed" : s.status === "watching" ? "Watching" : "Planned"}
              </div>
              {/* On mobile, status changes are performed on the details page; keep quick actions for desktop only */}
              {s.status === "planned" && (
                <button
                  onClick={() => startWatchingSeason(show._id, s.seasonNumber)}
                  className="px-3 py-1 text-xs rounded font-semibold shadow mr-2 mb-1 wl-hide-on-mobile"
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                >
                  🎬 Start
                </button>
              )}
              {s.status === "watching" && (
                <button
                  onClick={() => completeSeason(show._id, s.seasonNumber)}
                  className="px-3 py-1 text-xs rounded font-semibold shadow mr-2 mb-1 wl-hide-on-mobile"
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ActionIcon = ({ title, onClick, children, danger = false }) => (
    <motion.button
      title={title}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -1 }}
      className="h-9 w-9 grid place-items-center rounded-full border shadow-md transition"
      style={{
        background: danger ? "transparent" : "var(--color-background-secondary)",
        color: danger ? "var(--color-accent)" : "var(--color-text-primary)",
        borderColor: danger ? "var(--color-accent)" : "var(--color-background-secondary)",
      }}
    >
      {children}
    </motion.button>
  );

  // DESKTOP card (unchanged)
  const MediaCard = ({ m, isTV = false }) => {
    const prog = isTV ? showProgress(m) : null;

    return (
      <motion.article
        layout
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover={{ y: -6, scale: 1.01 }}
        className="group relative rounded-3xl overflow-hidden backdrop-blur-sm border shadow-2xl transition-all"
        style={{
          background: "var(--color-background-secondary)",
          borderColor: "var(--color-background-secondary)",
          color: "var(--color-text-primary)",
        }}
      >
        {/* Poster */}
        <div className="relative h-64">
          <img
            src={m.posterUrl || fallbackPoster}
            alt={m.title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackPoster;
            }}
          />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <motion.button
              onClick={() => toggleFavorite(m._id)}
              whileTap={{ scale: 0.85, rotate: -8 }}
              animate={m.favorite ? { scale: [1, 1.25, 1], rotate: [0, -10, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.35 }}
              className="text-3xl drop-shadow"
              title={m.favorite ? "Unfavorite" : "Favorite"}
              aria-label={m.favorite ? "Unfavorite" : "Favorite"}
              style={{
                color: m.favorite ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              {m.favorite ? "♥" : "♡"}
            </motion.button>
          </div>

          {/* Gradient overlays */}
          <div
            className="absolute inset-x-0 bottom-0 h-24"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
          />
        </div>

        {/* Details */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-lg sm:text-xl font-bold leading-tight line-clamp-2">
              {m.title}
            </h4>
            {!isTV && <StatusPill status={m.status} />}
            {isTV && (
              <span className="text-xs opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                {prog.completed}/{prog.total} seasons
              </span>
            )}
          </div>
          <p className="text-xs opacity-70" style={{ color: "var(--color-text-secondary)" }}>
            Added on {new Date(m.createdAt).toLocaleDateString()}
          </p>

          {!isTV ? (
            <AnimatePresence mode="wait">
              {m.status === "planned" && (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 wl-hide-on-mobile"
                >
                  <button
                    onClick={() => startWatching(m._id)}
                    className="px-4 py-2 text-sm rounded-lg font-semibold shadow-md transition"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    Start Watching
                  </button>
                </motion.div>
              )}
              {m.status === "watching" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 wl-hide-on-mobile"
                >
                  <button
                    onClick={() => completeWatching(m._id)}
                    className="px-4 py-2 text-sm rounded-lg font-semibold shadow-md transition"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    Mark Completed
                  </button>
                </motion.div>
              )}
              {m.status === "completed" && (
                <motion.p
                  key="done"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="font-semibold wl-hide-on-mobile"
                  style={{ color: "var(--color-accent)" }}
                >
                  ✔ Completed
                </motion.p>
              )}
            </AnimatePresence>
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sm mb-2 opacity-80" style={{ color: "var(--color-text-secondary)" }}>
                Selected seasons:
              </p>
              <SeasonChips show={m} />
            </motion.div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <ActionIcon title="Delete" onClick={() => deleteItem(m._id)} danger>
              🗑
            </ActionIcon>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 rounded-3xl border transition"
          style={{ borderColor: "var(--color-background-secondary)" }}
        />
      </motion.article>
    );
  };

  const SkeletonCard = () => (
    <div
      className="rounded-3xl overflow-hidden border"
      style={{ borderColor: "var(--color-background-secondary)", background: "var(--color-background-secondary)" }}
    >
      <div className="h-64" style={{ background: "var(--color-background-secondary)" }} />
      <div className="p-5 space-y-3">
        <div className="h-5 rounded w-3/4" style={{ background: "var(--color-background-secondary)" }} />
        <div className="h-3 rounded w-1/2" style={{ background: "var(--color-background-secondary)" }} />
        <div className="h-9 rounded w-2/3" style={{ background: "var(--color-background-secondary)" }} />
        <div className="h-9 rounded w-24 ml-auto" style={{ background: "var(--color-background-secondary)" }} />
      </div>
    </div>
  );

  const Segmented = ({ value, onChange, options }) => (
    <div
      className="inline-flex items-center gap-1 rounded-full p-1 backdrop-blur"
      style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-background-secondary)" }}
    >
      {options.map(({ val, label }) => {
        const active = value === val;
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className="px-4 sm:px-5 py-2 rounded-full font-semibold transition duration-200 focus:outline-none"
            style={{
              background: active ? "var(--color-accent)" : "transparent",
              color: active ? "#fff" : "var(--color-text-secondary)",
            }}
            aria-pressed={active}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  // MOBILE TABS (All | Planned | Watching | Completed)
  const MobileStatusTabs = ({ value, onChange }) => {
    const options = [
      { val: "all", label: "All" },
      { val: "planned", label: "Planned" },
      { val: "watching", label: "Watching" },
      { val: "completed", label: "Completed" },
    ];
    return (
      <div className="wl-mobile-only">
        {options.map((opt) => {
          const active = value === opt.val;
          return (
            <button
              key={opt.val}
              className={`wl-tab-btn ${active ? "active" : ""}`}
              onClick={() => onChange(opt.val)}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
        <div className="wl-tabs-underline" />
      </div>
    );
  };

  // MOBILE MOVIE ROW
  const MobileMovieRow = ({ m }) => {
    return (
      <div className="wl-row-card">
        <img
          src={m.posterUrl || fallbackPoster}
          alt={m.title}
          className="wl-row-poster"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackPoster;
          }}
        />
        <div className="wl-row-content">
          <div className="wl-row-title">{m.title}</div>
          <div className="wl-row-meta">
            <span className={`wl-badge ${m.status}`}>
              {m.status === "planned"
                ? "Planned"
                : m.status === "watching"
                ? "Watching"
                : "Completed"}
            </span>
          </div>
          <div className="wl-row-sub">
            {m.status === "completed"
              ? `Finished ${formatDate(m.updatedAt || m.createdAt)}`
              : m.status === "watching"
              ? `Started ${formatDate(m.updatedAt || m.createdAt)}`
              : `Added ${formatDate(m.createdAt)}`}
          </div>
        </div>
        <button
          className="wl-chevron"
          aria-label="Open movie"
          onClick={() => navigate(`/details/movie/${m.tmdbId}`)}
        >
          ›
        </button>
      </div>
    );
  };

  // MOBILE TV SEASON ROW
  const MobileSeasonRow = ({ show, season }) => {
    const episodes = Number(season?.episodeCount) || 0;
    return (
      <div className="wl-row-card wl-row-nested">
        <img
          src={show.posterUrl || fallbackPoster}
          alt={show.title}
          className="wl-row-poster"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackPoster;
          }}
        />
        <div className="wl-row-content">
          <div className="wl-row-title underlined">Season {season.seasonNumber}</div>
          <div className="wl-row-meta">
            <span className="wl-badge info">{episodes} episodes</span>
          </div>
          <div className="wl-row-sub">{seasonDateText(show, season)}</div>
        </div>
        <button
          className="wl-chevron"
          aria-label="Open season"
          onClick={() => navigate(`/details/tv/${show.tmdbId}/season/${season.seasonNumber}`)}
        >
          ›
        </button>
      </div>
    );
  };

  // MOBILE TV SHOW GROUP (collapsible)
  const MobileTVShowGroup = ({ show, filter }) => {
    const key = show.tmdbId || show._id;
    const isOpen = expandedShows.has(key);
    const toggle = () => {
      setExpandedShows((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    const seasons = show.seasons || [];
    const filteredSeasons =
      filter === "all" ? seasons : seasons.filter((s) => s.status === filter);

    if (!filteredSeasons.length) return null;

    return (
      <div className="wl-show-group">
        <button className="wl-show-header" onClick={toggle} aria-expanded={isOpen}>
          <span className={`wl-caret ${isOpen ? "open" : ""}`}>▾</span>
          <span className="wl-show-title">{show.title}</span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="wl-show-body"
            >
              {filteredSeasons.map((s) => (
                <MobileSeasonRow key={s.seasonNumber} show={show} season={s} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Section = ({ title, data, isTV = false }) => (
    <section className="mb-16">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <h3 className="text-3xl font-extrabold" style={{ color: "var(--color-accent)" }}>
          {title}
        </h3>
        <motion.span
          key={data.length + (isTV ? tvFilter : movieFilter)}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 15 }}
          className="px-4 py-2 rounded-full text-lg font-bold shadow-md"
          style={{
            background: "var(--color-background-secondary)",
            border: "1px solid var(--color-background-secondary)",
            color: "var(--color-accent)",
          }}
        >
          {data.length} {data.length === 1 ? "Item" : "Items"}
        </motion.span>
      </motion.div>

      {/* Filters: keep desktop as-is; mobile shows compact tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="wl-hide-on-mobile">
          <Segmented
            value={isTV ? tvFilter : movieFilter}
            onChange={isTV ? setTvFilter : setMovieFilter}
            options={[
              { val: "all", label: "All" },
              { val: "planned", label: "📝 Planned" },
              { val: "watching", label: "⏳ Watching" },
              { val: "completed", label: "✅ Completed" },
            ]}
          />
        </div>
        <MobileStatusTabs value={isTV ? tvFilter : movieFilter} onChange={isTV ? setTvFilter : setMovieFilter} />
      </div>

      {/* Mobile list layout only */}
      <div className="wl-mobile-only">
        {!loading && data.length > 0 ? (
          isTV ? (
            <div className="wl-list">
              {data.map((show) => (
                <MobileTVShowGroup key={show._id} show={show} filter={tvFilter} />
              ))}
            </div>
          ) : (
            <div className="wl-list">
              {data.map((m) => (
                <MobileMovieRow key={m._id} m={m} />
              ))}
            </div>
          )
        ) : null}

        {!loading && data.length === 0 && (
          <div className="wl-empty">
            <div className="text-6xl mb-3">🪄</div>
            <p className="text-xl mb-2" style={{ color: "var(--color-text-primary)" }}>Nothing here yet</p>
            <p className="opacity-80 mb-6" style={{ color: "var(--color-text-secondary)" }}>
              Use the button below to add your first {isTV ? "show" : "movie"}.
            </p>
            <button
              onClick={() => openSearch(isTV ? "tv" : "movie")}
              className="px-4 py-2 rounded-lg font-semibold shadow-lg"
              style={{ background: "var(--color-accent)", color: "#fff", border: "1px solid var(--color-accent)" }}
            >
              {isTV ? "＋ Add TV Series" : "＋ Add movie"}
            </button>
          </div>
        )}

        {loading && (
          <div className="wl-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="wl-row-card wl-skeleton" key={i}>
                <div className="wl-row-poster skeleton" />
                <div className="wl-row-content">
                  <div className="wl-skel-line" />
                  <div className="wl-skel-line short" />
                  <div className="wl-skel-line tiny" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop grid layout — exactly as your original */}
      <div className="wl-hide-on-mobile">
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!loading && data.length > 0 ? (
            <AnimatePresence>
              {data.map((m) => (
                <MediaCard key={m._id} m={m} isTV={isTV} />
              ))}
            </AnimatePresence>
          ) : null}

          {!loading && data.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-16"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <div className="text-6xl mb-3">🪄</div>
              <p className="text-xl mb-2" style={{ color: "var(--color-text-primary)" }}>Nothing here yet</p>
              <p className="opacity-80 mb-6">Use the button below to add your first {isTV ? "show" : "movie"}.</p>
              <button
                onClick={() => openSearch(isTV ? "tv" : "movie")}
                className="px-4 py-2 rounded-lg font-semibold shadow-lg"
                style={{ background: "var(--color-accent)", color: "#fff", border: "1px solid var(--color-accent)" }}
              >
                {isTV ? "＋ Add TV Series" : "＋ Add movie"}
              </button>
            </motion.div>
          )}

          {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </motion.div>
      </div>
    </section>
  );

  const FloatingAddButton = ({ label, onClick }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="fixed bottom-6 right-6 z-40 px-5 sm:px-6 py-3 rounded-full shadow-xl font-semibold"
      style={{
        background: "var(--color-accent)",
        color: "#fff",
        border: "1px solid var(--color-accent)",
      }}
      aria-label={label}
    >
      {label}
    </motion.button>
  );

  const SearchModal = ({ open, mode, onClose }) => (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-2xl rounded-2xl p-4 sm:p-6 border shadow-2xl"
            style={{
              background: "var(--color-background-primary)",
              borderColor: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xl font-extrabold" style={{ color: "var(--color-accent)" }}>
                {mode === "tv" ? "Add TV Series" : "Add movie"}
              </h4>
              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-full border"
                style={{
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-primary)",
                  borderColor: "var(--color-background-secondary)",
                }}
                aria-label="Close search"
              >
                ✕
              </button>
            </div>
            {/* Reuse existing SearchBar component */}
            <SearchBar />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className="relative min-h-screen p-6 sm:p-10"
      style={{ background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}
    >
      {/* Ambient gradient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-16 h-96 w-96 rounded-full blur-3xl opacity-20" style={{ background: "var(--color-accent)" }} />
        <div className="absolute bottom-0 -left-24 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-20" style={{ background: "var(--color-accent)" }} />
        <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full blur-3xl opacity-10" style={{ background: "var(--color-accent)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center mb-10">
        <h2 className="text-4xl sm:text-5xl font-extrabold" style={{ color: "var(--color-accent)" }}>
          Your Watchlist
        </h2>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={clearWatchlist}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Clear all watchlist"
            className="px-5 py-2 rounded-lg font-semibold tracking-wide shadow-lg"
            style={{ background: "var(--color-accent)", color: "#fff", border: "1px solid var(--color-accent)" }}
          >
            🗑️ Clear All
          </motion.button>
        </div>
      </motion.div>

      {/* Switcher */}
      <div className="flex justify-center mb-10">
        <div
          className="inline-flex rounded-full p-1 backdrop-blur"
          style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-background-secondary)" }}
        >
          <button
            onClick={() => setActiveSection("movies")}
            className="px-6 py-2 rounded-full font-semibold transition"
            style={{
              background: activeSection === "movies" ? "var(--color-accent)" : "transparent",
              color: activeSection === "movies" ? "#fff" : "var(--color-text-secondary)",
            }}
            aria-label="Show Movies"
          >
            🎥 Movies
          </button>
          <button
            onClick={() => setActiveSection("tv")}
            className="px-6 py-2 rounded-full font-semibold transition"
            style={{
              background: activeSection === "tv" ? "var(--color-accent)" : "transparent",
              color: activeSection === "tv" ? "#fff" : "var(--color-text-secondary)",
            }}
            aria-label="Show TV Shows"
          >
            📺 TV Shows
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-xl"
          style={{
            background: "transparent",
            color: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
          }}
        >
          {error}
        </div>
      )}

      <LayoutGroup>
        {activeSection === "movies" ? (
          <Section title="🎥 Movies" data={filteredMovies} isTV={false} />
        ) : (
          <Section title="📺 TV Shows" data={tvFiltered} isTV={true} />
        )}
      </LayoutGroup>

      {/* Floating Add Button */}
      <FloatingAddButton
        label={activeSection === "movies" ? "＋ Add movie" : "＋ Add TV Series"}
        onClick={() => openSearch(activeSection === "movies" ? "movie" : "tv")}
      />

      {/* Search Modal */}
      <SearchModal open={searchOpen} mode={searchMode} onClose={closeSearch} />
    </div>
  );
}

export default Watchlist;
