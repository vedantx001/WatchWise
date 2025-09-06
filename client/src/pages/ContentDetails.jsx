import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMovieDetails, fetchTvShowDetails } from "../services/tmdb";
import fallbackPoster from "../assets/fallback_poster2.png";
import api from "../api";
import "../styles/moviedetails.css";

/* Small pills for metadata */
const InfoPill = ({ label, value, icon }) => (
  <div className="info-pill">
    <div className="flex items-center gap-2">
      {icon ? <span className="opacity-80">{icon}</span> : null}
      <span className="label">{label}</span>
    </div>
    <div className="value mt-1">{value}</div>
  </div>
);

/* rating */
const PremiumRating = ({ rating = 0 }) => {
  const normalizedRating = Math.min(10, Math.max(0, rating));
  const percentage = (normalizedRating / 10) * 100;
  const bars = 10;

  const getGradeInfo = () => {
    if (percentage >= 85) return { grade: 'S', label: 'Exceptional', class: 'rating-exceptional' };
    if (percentage >= 75) return { grade: 'A', label: 'Excellent', class: 'rating-excellent' };
    if (percentage >= 65) return { grade: 'B', label: 'Good', class: 'rating-good' };
    if (percentage >= 50) return { grade: 'C', label: 'Average', class: 'rating-average' };
    return { grade: 'D', label: 'Below', class: 'rating-below' };
  };

  const gradeInfo = getGradeInfo();

  return (
    <div className={`premium-rating ${gradeInfo.class}`}>
      <div className="rating-header">
        <div className="rating-grade-circle">
          <span className="grade-letter">{gradeInfo.grade}</span>
        </div>
        <div className="rating-info">
          <div className="rating-label">{gradeInfo.label}</div>
          <div className="rating-score">
            <span className="score-value">{normalizedRating.toFixed(1)}</span>
            <span className="score-divider">/</span>
            <span className="score-max">10</span>
          </div>
        </div>
      </div>
      <div className="rating-bars">
        {[...Array(bars)].map((_, i) => {
          const isActive = i < Math.round(normalizedRating);
          const isPartial = i === Math.floor(normalizedRating) && normalizedRating % 1 !== 0;
          return (
            <div
              key={i}
              className={`rating-bar ${isActive ? 'active' : ''}`}
              style={{
                animationDelay: `${i * 0.05}s`,
                opacity: isPartial ? normalizedRating % 1 : undefined
              }}
            >
              <div className="bar-fill"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatRuntime = (m) => {
  if (!m || m <= 0) return "N/A";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h ? `${h} h ` : ""}${min} m`;
};

export default function ContentDetails() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [watchDoc, setWatchDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (message, type = 'success', duration = 2800) => {
    setToast({ message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), duration);
  };

  const isMovie = type === "movie";
  const isTv = type === "tv";

  const year = useMemo(() => {
    const d =
      (isMovie ? show?.release_date : show?.first_air_date) ||
      (show?.air_date ?? "");
    return d ? new Date(d).getFullYear() : "N/A";
  }, [show, isMovie]);

  const runtime = useMemo(() => {
    if (!show) return "N/A";
    return isMovie
      ? formatRuntime(show.runtime)
      : show.episode_run_time?.length
        ? formatRuntime(show.episode_run_time[0])
        : "N/A";
  }, [show, isMovie]);

  const genres = useMemo(() => {
    if (!show) return "Unknown";
    const g = (show.genres || []).map((g) => g.name);
    return g.length > 0 ? g.slice(0, 2).join(", ") : "Unknown";
  }, [show]);

  const fetchWatchDocByTmdb = async (tmdbType, tmdbId) => {
    const headers = { headers: { "x-auth-token": localStorage.getItem("token") || "" } };
    try {
      const res = await api.get(`/movies/by-tmdb/${tmdbType}/${tmdbId}`, headers);
      if (res && res.data) return res.data;
    } catch (err) {
      const status = err?.response?.status;
      if (status && status !== 404 && status !== 400) {
        console.warn("GET /movies/by-tmdb failed:", err);
      }
    }
    try {
      const resAll = await api.get("/movies", headers);
      if (resAll && Array.isArray(resAll.data)) {
        const found = resAll.data.find(
          (m) =>
            String(m.tmdbId) === String(tmdbId) &&
            (m.contentType || "movie") === (tmdbType || "movie")
        );
        return found || null;
      }
    } catch (err2) {
      console.warn("Fallback GET /movies failed:", err2);
    }

    return null;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const details = isMovie ? await fetchMovieDetails(id) : await fetchTvShowDetails(id);
        if (!mounted) return;
        setShow(details);
        const doc = await fetchWatchDocByTmdb(type, id);
        if (!mounted) return;
        setWatchDoc(doc || null);
      } catch (err) {
        console.error("ContentDetails load error:", err);
        if (mounted) {
          setShow(null);
          setWatchDoc(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-current border-r-transparent" style={{ borderColor: "var(--color-accent)", borderRightColor: "transparent" }}></div>
          <p className="mt-4" style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );

  if (!show)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--color-text-secondary)" }}>Not found.</p>
      </div>
    );

  const poster = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : fallbackPoster;
  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : "";

  const rating = show.vote_average || 0;
  const title = isMovie ? show.title : show.name;

  const currentStatus = watchDoc?.status || "planned";
  const addToWatchlist = async (statusOverride = "planned") => {
    if (adding) return;
    setAdding(true);
    try {
      const payload = {
        title,
        tmdbId: String(show.id),
        contentType: isMovie ? "movie" : "tv",
        status: statusOverride,
        rating: show.vote_average || 0,
        posterPath: poster,
      };

      if (isTv && payload.contentType === "tv") {
        payload.seasonNumber = 0;
      }

      const res = await api.post("/movies", payload, {
        headers: { "x-auth-token": localStorage.getItem("token") || "" },
      });
      setWatchDoc(res.data || null);
  showToast(isMovie ? "Movie added to watchlist" : "Added to watchlist", 'success');
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.errors?.[0]?.msg ||
        err.message ||
        "Unknown";
  showToast(`Failed to add: ${msg}`, 'error');
    } finally {
      setAdding(false);
    }
  };

  const setStatus = async (status) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      if (!watchDoc) {
        await addToWatchlist(status);
        return;
      }

      const res = await api.put(
        `/movies/${watchDoc._id}`,
        { status },
        { headers: { "x-auth-token": localStorage.getItem("token") || "" } }
      );
      setWatchDoc(res.data || watchDoc);
    } catch (err) {
      console.error("Failed to update status:", err);
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.errors?.[0]?.msg ||
        err.message ||
        "Unknown";
  showToast(`Failed to update: ${msg}`, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const DesktopHero = (
    <div
      className="backdrop-container hidden md:block"
      style={{ backgroundImage: `url(${backdropUrl})` }}
    >
      <div className="backdrop-overlay">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="glass-card p-8 md:p-10">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 md:col-span-4 lg:col-span-4 flex justify-center">
                <img
                  src={poster}
                  alt={title}
                  className="poster-image w-full max-w-sm object-cover"
                  loading="lazy"
                />
              </div>

              <div className="col-span-12 md:col-span-8 lg:col-span-8 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="animated-title text-5xl font-black">{title}</h1>
                  {rating > 0 ? (
                    <div className="shrink-0">
                      <PremiumRating rating={rating} />
                    </div>
                  ) : null}
                </div>

                {show.tagline ? (
                  <p className="italic mt-3 text-lg" style={{ color: "var(--color-text-secondary)" }}>"{show.tagline}"</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-4 mt-6" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="font-bold text-lg">{year}</span>
                  {isMovie && (
                    <>
                      <span className="opacity-60">•</span>
                      <span className="font-semibold">{runtime}</span>
                    </>
                  )}
                  {isTv && show.number_of_seasons ? (
                    <>
                      <span className="opacity-60">•</span>
                      <span className="font-semibold">
                        {show.number_of_seasons} season
                        {show.number_of_seasons > 1 ? "s" : ""}
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 my-6">
                  {(show.genres || []).map((g) => (
                    <span
                      key={g.id || g.name}
                      className="genre-tag"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                <div className="synopsis-card">
                  <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Overview</h2>
                  <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {show.overview || "No overview available."}
                  </p>
                </div>

                {isTv ? (
                  <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
                      Seasons
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {(show.seasons || [])
                        .filter((s) => s.season_number !== 0)
                        .map((s, index) => (
                          <button
                            key={s.id || s.season_number}
                            onClick={() =>
                              navigate(
                                `/details/tv/${show.id}/season/${s.season_number}`
                              )
                            }
                            className="season-card text-center w-30 h-20"
                            style={{ cursor: "pointer", animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="font-bold" style={{ color: "var(--color-text-primary)" }}>
                              Season {s.season_number}
                            </div>
                            <div className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                              {s.episode_count} episodes
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : null}

                {/* ACTIONS — for movies only show full status controls; for TV only allow initial add */}
                <div className="mt-auto pt-8 flex flex-wrap gap-4">
                  {isMovie ? (
                    !watchDoc ? (
                      <>
                        <button
                          onClick={() => navigate(`/trailer/movie/${id}`)}
                          className="btn-secondary"
                          title="Play trailer"
                        >
                          ▶ Play Trailer
                        </button>
                      <button
                        onClick={() => addToWatchlist("planned")}
                        className="btn-primary"
                        disabled={adding}
                      >
                        {adding ? "Adding..." : "➕ Add to Watchlist"}
                      </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/trailer/movie/${id}`)}
                          className="btn-secondary"
                          title="Play trailer"
                        >
                          ▶ Play Trailer
                        </button>
                        {currentStatus !== "watching" && (
                          <button
                            onClick={() => setStatus("watching")}
                            className="btn-primary"
                            disabled={updatingStatus}
                          >
                            ▶️ Start Watching
                          </button>
                        )}
                        {currentStatus !== "completed" && (
                          <button
                            onClick={() => setStatus("completed")}
                            className="btn-secondary"
                            disabled={updatingStatus}
                          >
                            ✅ Finish Watching
                          </button>
                        )}
                        {currentStatus !== "planned" && (
                          <button
                            onClick={() => setStatus("planned")}
                            className="btn-ghost"
                            disabled={updatingStatus}
                          >
                            📝 Mark Planned
                          </button>
                        )}
                      </>
                    )
                  ) : (
                    // TV show: only show Add button if not yet in watchlist; no status controls here
                    !watchDoc && (
                      <button
                        onClick={() => addToWatchlist("planned")}
                        className="btn-primary"
                        disabled={adding}
                      >
                        {adding ? "Adding..." : "➕ Add to Watchlist"}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cast carousel (if available from details call) */}
          {show?.credits?.cast?.length ? (
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
                Top billed cast
              </h3>
              <div className="horizontal-scroll">
                {show.credits.cast.slice(0, 12).map((c, index) => {
                  const img = c.profile_path
                    ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                    : null;
                  return (
                    <div
                      key={`${c.credit_id || c.id}-${c.cast_id || c.order}`}
                      className="cast-card w-44"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="h-60 overflow-hidden" style={{ background: "var(--color-background-secondary)" }}>
                        {img ? (
                          <img
                            src={img}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-bold line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                          {c.character || "—"}
                        </div>
                        <div className="text-xs opacity-80 mt-1" style={{ color: "var(--color-text-secondary)" }}>{c.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  // Mobile view (cards + pills + sticky CTA)
  const MobileView = (
    <div className="md:hidden px-4 py-6">
      {/* Mobile header with go back arrow (mirrors SeasonDetails) */}
      <div className="flex items-center justify-between text-white mb-5">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-full bg-white/10 cursor-pointer"
          aria-label="Go back"
        >
          ←
        </button>
        <div className="text-lg font-semibold">
          {isMovie ? "Movie details" : "Show details"}
        </div>
        {/* spacer to balance flex */}
        <div className="opacity-0">.</div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <img
            src={poster}
            alt={title}
            className="poster-image w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="col-span-5 flex flex-col gap-3">
          <InfoPill
            label={isTv ? "Episodes" : "Duration"}
            value={
              isTv
                ? show.number_of_episodes ?? "—"
                : runtime !== "N/A"
                  ? runtime
                  : "—"
            }
            icon={isTv ? "📺" : "⏱️"}
          />
          <InfoPill label="Genre" value={genres} icon="🎭" />
          <InfoPill
            label="Avg. rate"
            value={show.vote_average ? show.vote_average.toFixed(2) + " / 10" : "—"}
            icon="⭐"
          />
        </div>
      </div>

      <div className="mt-6">
        <h1 className="animated-title text-3xl font-black">{title}</h1>
        <div className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          {isTv ? "TV Show" : "Movie"} • {year}{isMovie && ` • ${runtime}`}
        </div>

        {/* Quick status chip + inline actions: only for movies */}
        {isMovie && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => navigate(`/trailer/movie/${id}`)}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "var(--color-background-secondary)" }}
              title="Play trailer"
            >
              ▶
            </button>
            {!watchDoc ? (
              <button
                onClick={() => addToWatchlist("planned")}
                disabled={adding}
                className="btn-primary text-sm"
              >
                {adding ? "Adding..." : "To Watch"}
              </button>
            ) : (
              <>
                <span className="px-4 py-2 rounded-full font-bold text-sm" style={{ background: "var(--color-accent)", color: "white" }}>
                  {currentStatus === "planned"
                    ? "To Watch"
                    : currentStatus === "watching"
                      ? "In Progress"
                      : "Completed"}
                </span>
                {currentStatus !== "watching" && (
                  <button
                    onClick={() => setStatus("watching")}
                    disabled={updatingStatus}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ background: "var(--color-background-secondary)" }}
                    title="Start watching"
                  >
                    ⏯️
                  </button>
                )}
                {currentStatus !== "completed" && (
                  <button
                    onClick={() => setStatus("completed")}
                    disabled={updatingStatus}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ background: "var(--color-background-secondary)" }}
                    title="Finish watching"
                  >
                    ✅
                  </button>
                )}
                {currentStatus !== "planned" && (
                  <button
                    onClick={() => setStatus("planned")}
                    disabled={updatingStatus}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ background: "var(--color-background-secondary)" }}
                    title="Mark planned"
                  >
                    ↩️
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="synopsis-card">
        <h3 className="text-xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Overview</h3>
        <p style={{ color: "var(--color-text-secondary)" }}>{show.overview || "No overview available."}</p>
      </div>

      {isTv ? (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Seasons</h3>
          <div className="horizontal-scroll">
            {(show.seasons || [])
              .filter((s) => s.season_number !== 0)
              .map((s, index) => (
                <button
                  key={s.id || s.season_number}
                  onClick={() =>
                    navigate(`/details/tv/${show.id}/season/${s.season_number}`)
                  }
                  className="season-card min-w-[140px] h-18 text-center cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="font-bold" style={{ color: "var(--color-text-primary)" }}>Season {s.season_number}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{s.episode_count} episodes</div>
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {show?.credits?.cast?.length ? (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Main actors</h3>
          <div className="horizontal-scroll">
            {show.credits.cast.slice(0, 15).map((c, index) => {
              const img = c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null;
              return (
                <div
                  key={`${c.credit_id || c.id}-${c.cast_id || c.order}`}
                  className="cast-card w-36"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="h-48 overflow-hidden" style={{ background: "var(--color-background-secondary)" }}>
                    {img ? (
                      <img src={img} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--color-text-secondary)" }}>No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-bold line-clamp-2" style={{ color: "var(--color-text-primary)" }}>{c.character || "—"}</div>
                    <div className="text-xs opacity-80 mt-1" style={{ color: "var(--color-text-secondary)" }}>{c.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  // Sticky CTA (mobile only) moved outside scroll container for immediate visibility
  const StickyCTA = (
    <>
      {isMovie && (
        watchDoc ? (
          currentStatus === "planned" ? (
            <button
              className="sticky-cta secondary cursor-pointer md:hidden"
              onClick={() => setStatus("watching")}
              disabled={updatingStatus}
            >
              👀 Start watching
            </button>
          ) : currentStatus === "watching" ? (
            <button
              className="sticky-cta cursor-pointer md:hidden"
              onClick={() => setStatus("completed")}
              disabled={updatingStatus}
            >
              ⏱️ Finish watching
            </button>
          ) : null
        ) : (
          <button
            className="sticky-cta secondary cursor-pointer md:hidden"
            onClick={() => addToWatchlist("planned")}
            disabled={adding || updatingStatus}
          >
            ➕ Add to watchlist
          </button>
        )
      )}
    </>
  );

  // Render both desktop & mobile blocks
  return (
    <>
      {DesktopHero}
      <div
        className="md:hidden min-h-screen"
        style={{
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="backdrop-overlay">
          <div className="max-w-3xl mx-auto">{MobileView}</div>
        </div>
      </div>
  {StickyCTA}
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`} role="status" aria-live="polite">
            <span className="toast-dot" aria-hidden="true" />
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}