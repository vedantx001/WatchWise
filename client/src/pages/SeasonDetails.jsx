import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchSeasonDetails, fetchTvShowDetails } from "../services/tmdb";
import api from "../api";
import "../styles/moviedetails.css";
import fallbackPoster from "../assets/fallback_poster2.png";

const InfoPill = ({ label, value, icon }) => (
  <div className="info-pill text-white">
    <div className="flex items-center gap-2">
      {icon ? <span className="opacity-80">{icon}</span> : null}
      <span className="label">{label}</span>
    </div>
    <div className="value mt-1">{value}</div>
  </div>
);

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

export default function SeasonDetails() {
  const { id, seasonNumber } = useParams();
  const navigate = useNavigate();

  const [season, setSeason] = useState(null);
  const [show, setShow] = useState(null);

  const [watchDoc, setWatchDoc] = useState(null);
  const [adding, setAdding] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [watchedCount, setWatchedCount] = useState(0);
  useEffect(() => {
    let mounted = true;

    const withAuth = {
      headers: { "x-auth-token": localStorage.getItem("token") || "" },
    };

    const load = async () => {
      try {
        const [tvShow, sea] = await Promise.all([
          fetchTvShowDetails(id),
          fetchSeasonDetails(id, seasonNumber),
        ]);
        if (!mounted) return;
        setShow(tvShow);
        setSeason(sea);

        let doc = null;
        try {
          const res = await api.get(`/movies/by-tmdb/tv/${id}`, withAuth);
          if (!mounted) return;
          doc = res.data || null;
        } catch {
          try {
            const all = await api.get("/movies", withAuth);
            if (!mounted) return;
            const maybe = (all.data || []).find(
              (d) => d.contentType === "tv" && String(d.tmdbId) === String(id)
            );
            doc = maybe || null;
          } catch {
            doc = null;
          }
        }

        setWatchDoc(doc);
      } catch (err) {
        console.error("Failed to load season/show:", err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, seasonNumber]);

  const episodesCount = season?.episodes?.length || 0;

  const thisSeasonInDoc = useMemo(() => {
    if (!watchDoc) return null;
    const found = (watchDoc.seasons || []).find(
      (s) => s.seasonNumber === Number(seasonNumber)
    );
    return found || null;
  }, [watchDoc, seasonNumber]);

  useEffect(() => {
    setWatchedCount(thisSeasonInDoc?.watchedCount || 0);
  }, [thisSeasonInDoc, seasonNumber]);

  if (!season || !show) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const poster = season.poster_path
    ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
    : show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : fallbackPoster;

  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : "";

  const genres = (show.genres || []).map((g) => g.name);
  const ratingValue = season.vote_average || show.vote_average || 0;
  const episodeRuntime =
    season.episodes?.[0]?.runtime || (show.episode_run_time?.[0] ?? null);

  const currentStatus = thisSeasonInDoc?.status || "planned";

  const addSeasonToWatchlist = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const withAuth = {
        headers: { "x-auth-token": localStorage.getItem("token") || "" },
      };
      const payload = {
        tmdbId: String(show.id),
        contentType: "tv",
        seasonNumber: Number(seasonNumber),
        status: "planned",
      };
      const res = await api.post("/movies", payload, withAuth);
      setWatchDoc(res.data); // backend returns the whole show doc
      alert(`Season ${seasonNumber} added to watchlist!`);
    } catch (e) {
      const msg =
        e?.response?.data?.msg ||
        e?.response?.data?.errors?.[0]?.msg ||
        e.message;
      alert(`Failed to add: ${msg}`);
    } finally {
      setAdding(false);
    }
  };

  const setSeasonStatus = async (status) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const withAuth = {
        headers: { "x-auth-token": localStorage.getItem("token") || "" },
      };

      // If the show or season doesn't exist yet, create with requested status
      if (!watchDoc || !thisSeasonInDoc) {
        const payload = {
          tmdbId: String(show.id),
          contentType: "tv",
          seasonNumber: Number(seasonNumber),
          status,
        };
        const created = await api.post("/movies", payload, withAuth);
        setWatchDoc(created.data);
        return;
      }

      // Otherwise just update the season status
      const res = await api.put(
        `/movies/${watchDoc._id}/season/${seasonNumber}`,
        { status },
        withAuth
      );
      setWatchDoc(res.data);
    } catch (e) {
      const msg =
        e?.response?.data?.msg ||
        e?.response?.data?.errors?.[0]?.msg ||
        e.message;
      alert(`Failed to update: ${msg}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const decProgress = () => setWatchedCount((v) => Math.max(0, v - 1));
  const incProgress = () =>
    setWatchedCount((v) => Math.min(episodesCount, v + 1));
  const cast =
    season?.credits?.cast?.length
      ? season.credits.cast
      : show?.credits?.cast || [];
  const Desktop = (
    <div
      className="backdrop-container min-h-screen hidden md:block"
      style={{ backgroundImage: `url(${backdropUrl})` }}
    >
      <div className="backdrop-overlay">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="glass-card p-6 md:p-8 grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4 lg:col-span-3 flex justify-center">
              <img
                src={poster}
                alt={`${show.name} - Season ${seasonNumber}`}
                className="rounded-lg shadow-xl w-72 md:w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackPoster;
                }}
              />
            </div>
            <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-bold text-white">
                  {show.name} — Season {seasonNumber}
                </h1>
                {ratingValue > 0 && (
                  <div className="shrink-0">
                    <PremiumRating rating={ratingValue} />
                  </div>
                )}
              </div>

              <div className="text"></div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-gray-200">
                <span>{episodesCount} episodes</span>
                {genres.length ? (
                  <>
                    <span className="opacity-60">•</span>
                    <span>{genres.slice(0, 2).join(", ")}</span>
                  </>
                ) : null}
              </div>

              <div className="mt-5">
                <h2 className="text-2xl font-semibold mb-2">Overview</h2>
                <p className="text-gray-200">
                  {season.overview || "No overview available."}
                </p>
              </div>

              <div className="mt-auto pt-6 flex flex-wrap gap-3">
                {!thisSeasonInDoc ? (
                  <button
                    onClick={addSeasonToWatchlist}
                    className="bg-red-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    disabled={adding}
                  >
                    {adding ? "Adding..." : "Add Season to Watchlist"}
                  </button>
                ) : (
                  <>
                    {currentStatus !== "watching" && (
                      <button
                        onClick={() => setSeasonStatus("watching")}
                        className="bg-purple-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        disabled={updatingStatus}
                      >
                        Start Watching
                      </button>
                    )}
                    {currentStatus !== "completed" && (
                      <button
                        onClick={() => setSeasonStatus("completed")}
                        className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        disabled={updatingStatus}
                      >
                        Finish Watching
                      </button>
                    )}
                    {currentStatus !== "planned" && (
                      <button
                        onClick={() => setSeasonStatus("planned")}
                        className="bg-gray-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        disabled={updatingStatus}
                      >
                        Mark Planned
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {cast?.length ? (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3 text-white">
                Main actors
              </h3>
              <div className="horizontal-scroll scrollbar-hide">
                {cast.slice(0, 12).map((c) => {
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

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3 text-white">Episodes</h3>
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              {season.episodes?.map((ep) => {
                const open = expanded === ep.episode_number;
                return (
                  <div key={ep.id || ep.episode_number} className="episode-card">
                    <button
                      onClick={() =>
                        setExpanded((cur) =>
                          cur === ep.episode_number ? null : ep.episode_number
                        )
                      }
                      className="w-full flex items-center justify-between text-left text-white cursor-pointer"
                    >
                      <span className="font-semibold">
                        {ep.episode_number}. {ep.name || "Untitled"}
                      </span>
                      <span className="text-cyan-400">
                        {open ? "▲" : "▼"}
                      </span>
                    </button>
                    {open ? (
                      <div className="mt-3 text-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <div>⏱️ {formatRuntime(ep.runtime || episodeRuntime)}</div>
                          {ep.air_date ? (
                            <div className="opacity-80">
                              {new Date(ep.air_date).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>
                        {ep.overview ? <p className="mt-3">{ep.overview}</p> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Mobile = (
    <div
      className="md:hidden"
      style={{
        backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
      }}
    >
      <div className="backdrop-overlay">
        <div className="px-4 pt-4 pb-24 max-w-3xl mx-auto">
          <div className="flex items-center justify-between text-white">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 rounded-full bg-white/10 cursor-pointer"
              aria-label="Go back"
            >
              ←
            </button>
            <div className="text-lg font-semibold">Season details</div>
            <div className="opacity-0">.</div>
          </div>

          <div className="text"></div>
          <div className="grid grid-cols-12 gap-3 mt-4">
            <div className="col-span-7">
              <img
                src={poster}
                alt={`${show.name} - Season ${seasonNumber}`}
                className="rounded-2xl shadow-xl w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackPoster;
                }}
              />
            </div>
            <div className="col-span-5 flex flex-col gap-3">
              <InfoPill label="Episodes" value={episodesCount} icon="🎞️" />
              <InfoPill
                label="Genre"
                value={genres.slice(0, 2).join(", ") || "—"}
                icon="⚗️"
              />
              <InfoPill
                label="Avg. rate"
                value={
                  season.vote_average
                    ? `${season.vote_average.toFixed(2)} / 10`
                    : show.vote_average
                    ? `${show.vote_average.toFixed(2)} / 10`
                    : "—"
                }
                icon="⭐"
              />
            </div>
          </div>

          <div className="mt-6 text-white">
            <h1 className="text-3xl font-extrabold">{show.name}</h1>
            <div className="text-xl opacity-90 mt-1">Season {seasonNumber}</div>

            <div className="mt-3 flex items-center gap-3">
              {!thisSeasonInDoc ? (
                <button
                  onClick={addSeasonToWatchlist}
                  disabled={adding}
                  className="bg-blue-500 text-black font-bold px-5 py-2 rounded-full shadow disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
                      onClick={() => setSeasonStatus("watching")}
                      disabled={updatingStatus}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white cursor-pointer"
                      title="Start watching"
                    >
                      ⏯️
                    </button>
                  )}
                  {currentStatus !== "completed" && (
                    <button
                      onClick={() => setSeasonStatus("completed")}
                      disabled={updatingStatus}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white cursor-pointer"
                      title="Finish watching"
                    >
                      ✅
                    </button>
                  )}
                  {currentStatus !== "planned" && (
                    <button
                      onClick={() => setSeasonStatus("planned")}
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

          <div className="mt-6 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Overview</h3>
            </div>
            <p className="text-gray-200 mt-2">
              {season.overview || "No overview available."}
            </p>
          </div>

          {cast?.length ? (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-3 text-white">
                Main actors
              </h3>
              <div className="horizontal-scroll scrollbar-hide">
                {cast.slice(0, 15).map((c) => {
                  const img = c.profile_path
                    ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
                    : null;
                  return (
                    <div
                      key={`${c.credit_id || c.id}-${c.cast_id || c.order}`}
                      className="w-36 bg-white/10 rounded-xl overflow-hidden"
                    >
                      <div className="h-48 bg-white/10">
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

          <div className="mt-8 text-white">
            <h3 className="text-xl font-semibold">Episodes</h3>
            <div className="space-y-3 mt-3">
              {season.episodes?.map((ep) => {
                const open = expanded === ep.episode_number;
                return (
                  <div
                    key={ep.id || ep.episode_number}
                    className="episode-card"
                  >
                    <button
                      onClick={() =>
                        setExpanded((cur) =>
                          cur === ep.episode_number ? null : ep.episode_number
                        )
                      }
                      className="w-full flex items-center justify-between text-left text-white cursor-pointer"
                    >
                      <span className="font-semibold">
                        {ep.episode_number}. {ep.name || "Untitled"}
                      </span>
                      <span className="text-cyan-400">
                        {open ? "▲" : "▼"}
                      </span>
                    </button>
                    {open ? (
                      <div className="mt-3 text-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            ⏱️ {formatRuntime(ep.runtime || episodeRuntime)}
                          </div>
                          {ep.air_date ? (
                            <div className="opacity-80">
                              {new Date(ep.air_date).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>
                        {ep.overview ? (
                          <p className="mt-3">{ep.overview}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StickyCTA = (
    <>
      {thisSeasonInDoc ? (
        currentStatus === "planned" ? (
          <button
            className="sticky-cta secondary cursor-pointer md:hidden"
            onClick={() => setSeasonStatus("watching")}
            disabled={updatingStatus}
          >
            👀 Start watching
          </button>
        ) : currentStatus === "watching" ? (
          <button
            className="sticky-cta cursor-pointer md:hidden"
            onClick={() => setSeasonStatus("completed")}
            disabled={updatingStatus}
          >
            ⏱️ Finish watching
          </button>
        ) : null
      ) : (
        <button
          className="sticky-cta secondary cursor-pointer md:hidden"
          onClick={addSeasonToWatchlist}
          disabled={adding || updatingStatus}
        >
          ➕ Add season to watchlist
        </button>
      )}
    </>
  );

  return (
    <>
      {Desktop}
      {Mobile}
  {StickyCTA}
    </>
  );
}
