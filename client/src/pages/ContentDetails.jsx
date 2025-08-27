import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMovieDetails, fetchTvShowDetails } from "../services/tmdb";
import fallbackPoster from "../assets/fallback_poster2.png";
import api from "../api";
import "../styles/moviedetails.css";

/** Small pills for metadata */
const InfoPill = ({ label, value, icon }) => (
  <div className="info-pill text-white">
    <div className="flex items-center gap-2">
      {icon ? <span className="opacity-80">{icon}</span> : null}
      <span className="label">{label}</span>
    </div>
    <div className="value mt-1">{value}</div>
  </div>
);

/** Circular rating */
const RatingCircle = ({ percentage = 0, size = 60 }) => {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
  return (
    <div
      className="rating-circle"
      style={{ width: size, height: size, "--progress-color": color }}
    >
      <svg width={size} height={size}>
        <circle className="circle-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="circle-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="rating-text">{pct}%</span>
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
  const { type, id } = useParams(); // type = "movie" | "tv"
  const navigate = useNavigate();

  const [show, setShow] = useState(null); // TMDB details
  const [watchDoc, setWatchDoc] = useState(null); // canonical server doc (if present)
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  // Helper: find canonical watchlist doc by tmdb via two methods:
  // 1) preferred: GET /movies/by-tmdb/:type/:id
  // 2) fallback: GET /movies and find matching tmdbId + contentType
  const fetchWatchDocByTmdb = async (tmdbType, tmdbId) => {
    const headers = { headers: { "x-auth-token": localStorage.getItem("token") || "" } };

    // 1) try canonical endpoint first
    try {
      const res = await api.get(`/movies/by-tmdb/${tmdbType}/${tmdbId}`, headers);
      // server should return a doc object if exists
      if (res && res.data) return res.data;
    } catch (err) {
      // fall through to fallback
      const status = err?.response?.status;
      // if 404 or 400, just fallback; else still fallback but console.warn
      if (status && status !== 404 && status !== 400) {
        console.warn("GET /movies/by-tmdb failed:", err);
      }
    }

    // 2) fallback - fetch user watchlist and find a match
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

  // on mount: load TMDB details and canonical watch doc (if any)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // 1. fetch TMDB details
        const details = isMovie ? await fetchMovieDetails(id) : await fetchTvShowDetails(id);
        if (!mounted) return;
        setShow(details);

        // 2. fetch canonical watch doc by tmdb id (robust: tries canonical endpoint, else fallback)
        const doc = await fetchWatchDocByTmdb(type, id);
        if (!mounted) return;

        // set doc (null if not present)
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
      <div className="flex items-center justify-center text-white">
        Loading...
      </div>
    );

  if (!show)
    return (
      <div className="flex items-center justify-center text-white">
        Not found.
      </div>
    );

  const poster = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : fallbackPoster;
  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : "";

  const votePct = Math.round((show.vote_average || 0) * 10);
  const title = isMovie ? show.title : show.name;

  // derive current status (if watchDoc present) — default to "planned" if nothing exists
  const currentStatus = watchDoc?.status || "planned";

  // Create canonical doc (POST /movies). Accept a status override.
  // For movies, server expects contentType: "movie" and tmdbId set.
  // For tv, server's POST requires a seasonNumber in your backend; we avoid auto-adding TV seasons here.
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

      // For TV, server expects seasonNumber — to avoid backend validation error,
      // default to seasonNumber 0 only when contentType is tv and caller requested add.
      // (If you prefer different behavior for TV adds, adjust accordingly.)
      if (isTv && payload.contentType === "tv") {
        // use 0 as a neutral placeholder season so the server will create a doc for the show
        payload.seasonNumber = 0;
      }

      const res = await api.post("/movies", payload, {
        headers: { "x-auth-token": localStorage.getItem("token") || "" },
      });

      // server should return the created (or updated) doc
      setWatchDoc(res.data || null);
      // small confirmation (can be removed if you don't want alerts)
      // alert(`${title} added to watchlist!`);
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.errors?.[0]?.msg ||
        err.message ||
        "Unknown";
      alert(`Failed to add: ${msg}`);
    } finally {
      setAdding(false);
    }
  };

  // Update status on canonical doc
  // For movie-level action: PUT /movies/:docId { status }
  // For tv show-level action: PUT /movies/:docId { status } (season-level uses /season/:seasonNumber and is handled in SeasonDetails)
  const setStatus = async (status) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      // If there's no doc yet, create with requested status
      if (!watchDoc) {
        await addToWatchlist(status);
        // addToWatchlist sets watchDoc from server; return early
        return;
      }

      const res = await api.put(
        `/movies/${watchDoc._id}`,
        { status },
        { headers: { "x-auth-token": localStorage.getItem("token") || "" } }
      );
      // server returns updated doc -> update local state immediately
      setWatchDoc(res.data || watchDoc);
    } catch (err) {
      console.error("Failed to update status:", err);
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.errors?.[0]?.msg ||
        err.message ||
        "Unknown";
      alert(`Failed to update: ${msg}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Desktop hero view
  const DesktopHero = (
    <div
      className="backdrop-container hidden md:block"
      style={{ backgroundImage: `url(${backdropUrl})` }}
    >
      <div className="backdrop-overlay">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="glass-card p-6 md:p-8 grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4 lg:col-span-3 flex justify-center">
              <img
                src={poster}
                alt={title}
                className="rounded-lg shadow-xl w-72 md:w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-bold text-white">{title}</h1>
                {votePct > 0 ? (
                  <div className="shrink-0">
                    <RatingCircle percentage={votePct} />
                  </div>
                ) : null}
              </div>

              {show.tagline ? (
                <p className="text-gray-300 italic mt-2">{show.tagline}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 mt-4 text-gray-200">
                <span className="font-semibold">{year}</span>
                <span className="opacity-60">•</span>
                <span>{runtime}</span>
                {isTv && show.number_of_seasons ? (
                  <>
                    <span className="opacity-60">•</span>
                    <span>
                      {show.number_of_seasons} season
                      {show.number_of_seasons > 1 ? "s" : ""}
                    </span>
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 my-4">
                {(show.genres || []).map((g) => (
                  <span
                    key={g.id || g.name}
                    className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-semibold mb-2">Synopsis</h2>
                <p className="text-gray-200">
                  {show.overview || "No overview available."}
                </p>
              </div>

              {isTv ? (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    Seasons
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(show.seasons || [])
                      .filter((s) => s.season_number !== 0)
                      .map((s) => (
                        <button
                          key={s.id || s.season_number}
                          onClick={() =>
                            navigate(
                              `/details/tv/${show.id}/season/${s.season_number}`
                            )
                          }
                          className="text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                          style={{ cursor: "pointer" }}
                        >
                          <div className="font-semibold">
                            Season {s.season_number}
                          </div>
                          <div className="text-xs opacity-80">
                            {s.episode_count} episodes
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* ACTIONS — movie + tv follow same canonical doc logic */}
              <div className="mt-auto pt-6 flex flex-wrap gap-3">
                {!watchDoc ? (
                  <button
                    onClick={() => addToWatchlist("planned")}
                    className="bg-red-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    disabled={adding}
                  >
                    {adding ? "Adding..." : "Add to Watchlist"}
                  </button>
                ) : (
                  <>
                    {currentStatus !== "watching" && (
                      <button
                        onClick={() => setStatus("watching")}
                        className="bg-purple-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        disabled={updatingStatus}
                      >
                        Start Watching
                      </button>
                    )}
                    {currentStatus !== "completed" && (
                      <button
                        onClick={() => setStatus("completed")}
                        className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        disabled={updatingStatus}
                      >
                        Finish Watching
                      </button>
                    )}
                    {currentStatus !== "planned" && (
                      <button
                        onClick={() => setStatus("planned")}
                        className="bg-gray-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        disabled={updatingStatus}
                      >
                        Mark Planned
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() =>
                    window.open(
                      `https://www.justwatch.com/search?q=${encodeURIComponent(
                        title
                      )}`,
                      "_blank"
                    )
                  }
                  className="bg-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition cursor-pointer"
                >
                  Where to watch?
                </button>
              </div>
            </div>
          </div>

          {/* Cast carousel (if available from details call) */}
          {show?.credits?.cast?.length ? (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3 text-white">
                Top billed cast
              </h3>
              <div className="horizontal-scroll scrollbar-hide">
                {show.credits.cast.slice(0, 12).map((c) => {
                  const img = c.profile_path
                    ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                    : null;
                  return (
                    <div
                      key={`${c.credit_id || c.id}-${c.cast_id || c.order}`}
                      className="w-40 bg-white/10 rounded-xl overflow-hidden"
                    >
                      <div className="h-56 bg-white/10">
                        {img ? (
                          <img
                            src={img}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-white">
                        <div className="font-semibold line-clamp-2">
                          {c.character || "—"}
                        </div>
                        <div className="text-xs opacity-80 mt-1">{c.name}</div>
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
    <div className="md:hidden px-4 py-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7">
          <img
            src={poster}
            alt={title}
            className="rounded-2xl shadow-xl w-full object-cover"
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
            icon={isTv ? "🎞️" : "⏱️"}
          />
          <InfoPill label="Genre" value={genres} icon="⚗️" />
          <InfoPill
            label="Avg. rate"
            value={show.vote_average ? show.vote_average.toFixed(2) + " / 10" : "—"}
            icon="⭐"
          />
        </div>
      </div>

      <div className="mt-5 text-white">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <div className="text-gray-300 mt-1">
          {isTv ? "TV Show" : "Movie"} • {year} • {runtime}
        </div>

        {/* Quick status chip + inline actions (matches SeasonDetails mobile UX) */}
        <div className="mt-3 flex items-center gap-3">
          {!watchDoc ? (
            <button
              onClick={() => addToWatchlist("planned")}
              disabled={adding}
              className="bg-red-600 text-black font-bold px-5 py-2 rounded-full shadow disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {adding ? "Adding..." : "To Watch"}
            </button>
          ) : (
            <>
              <span className="px-4 py-2 rounded-full font-semibold bg-blue-500 text-black">
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
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white cursor-pointer"
                  title="Start watching"
                >
                  ⏯️
                </button>
              )}
              {currentStatus !== "completed" && (
                <button
                  onClick={() => setStatus("completed")}
                  disabled={updatingStatus}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white cursor-pointer"
                  title="Finish watching"
                >
                  ✅
                </button>
              )}
              {currentStatus !== "planned" && (
                <button
                  onClick={() => setStatus("planned")}
                  disabled={updatingStatus}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white cursor-pointer"
                  title="Mark planned"
                >
                  ↩️
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() =>
            window.open(`https://www.justwatch.com/search?q=${encodeURIComponent(title)}`, "_blank")
          }
          className="px-4 py-3 rounded-full border border-white/30 text-white cursor-pointer"
        >
          Where to watch?
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2 text-white">Overview</h3>
        <p className="text-gray-200">{show.overview || "No overview available."}</p>
      </div>

      {isTv ? (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3 text-white">Seasons</h3>
          <div className="horizontal-scroll scrollbar-hide">
            {(show.seasons || [])
              .filter((s) => s.season_number !== 0)
              .map((s) => (
                <button
                  key={s.id || s.season_number}
                  onClick={() =>
                    navigate(`/details/tv/${show.id}/season/${s.season_number}`)
                  }
                  className="px-4 py-3 mr-1 rounded-2xl bg-white/10 text-white hover:bg-white/20 min-w-[120px] text-left cursor-pointer"
                >
                  <div className="font-semibold">Season {s.season_number}</div>
                  <div className="text-xs opacity-80">{s.episode_count} episodes</div>
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {show?.credits?.cast?.length ? (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3 text-white">Main actors</h3>
          <div className="horizontal-scroll scrollbar-hide">
            {show.credits.cast.slice(0, 15).map((c) => {
              const img = c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null;
              return (
                <div
                  key={`${c.credit_id || c.id}-${c.cast_id || c.order}`}
                  className="w-36 bg-white/10 rounded-xl overflow-hidden"
                >
                  <div className="h-48 bg-white/10">
                    {img ? (
                      <img src={img} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white/60">No image</div>
                    )}
                  </div>
                  <div className="p-3 text-white">
                    <div className="font-semibold line-clamp-2">{c.character || "—"}</div>
                    <div className="text-xs opacity-80 mt-1">{c.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Sticky CTA matches SeasonDetails */}
      {watchDoc ? (
        currentStatus === "planned" ? (
          <button
            className="sticky-cta secondary cursor-pointer"
            onClick={() => setStatus("watching")}
            disabled={updatingStatus}
          >
            👀 Start watching
          </button>
        ) : currentStatus === "watching" ? (
          <button
            className="sticky-cta cursor-pointer"
            onClick={() => setStatus("completed")}
            disabled={updatingStatus}
          >
            ⏱️ Finish watching
          </button>
        ) : null
      ) : (
        <button
          className="sticky-cta secondary cursor-pointer"
          onClick={() => addToWatchlist("planned")}
          disabled={adding || updatingStatus}
        >
          ➕ Add to watchlist
        </button>
      )}
    </div>
  );

  // Render both desktop & mobile blocks
  return (
    <>
      {DesktopHero}
      <div
        className="md:hidden"
        style={{
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
        }}
      >
        <div className="backdrop-overlay">
          <div className="max-w-3xl mx-auto">{MobileView}</div>
        </div>
      </div>
    </>
  );
}
