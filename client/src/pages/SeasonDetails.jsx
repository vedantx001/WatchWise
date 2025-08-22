// src/pages/SeasonDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchSeasonDetails, fetchTvShowDetails } from "../services/tmdb";
import api from "../api";
import fallbackPoster from "../assets/fallback_poster2.png";

export default function SeasonDetails() {
  const { id, seasonNumber } = useParams();
  const [season, setSeason] = useState(null);
  const [show, setShow] = useState(null);
  const [watchDoc, setWatchDoc] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const tvShow = await fetchTvShowDetails(id);
        setShow(tvShow);
        const sea = await fetchSeasonDetails(id, seasonNumber);
        setSeason(sea);

        // fetch user's watch doc
        try {
          const res = await api.get(`/movies/by-tmdb/tv/${id}`, {
            headers: { "x-auth-token": localStorage.getItem("token") || "" }
          });
          setWatchDoc(res.data);
        } catch {
          setWatchDoc(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id, seasonNumber]);

  if (!season || !show) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  const poster = season.poster_path
    ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
    : show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : fallbackPoster;

  const inWatch = !!watchDoc;
  const thisSeasonInDoc = inWatch ? (watchDoc.seasons || []).find(s => s.seasonNumber === Number(seasonNumber)) : null;
  const currentStatus = thisSeasonInDoc?.status || "planned";

  const addSeasonToWatchlist = async () => {
    await api.post(
      "/movies",
      {
        title: `${show.name} - Season ${seasonNumber}`,
        tmdbId: String(show.id),
        contentType: "tv",
        status: "planned",
        seasonNumber: Number(seasonNumber),
        rating: season.vote_average || 0,
        posterPath: poster,
      },
      { headers: { "x-auth-token": localStorage.getItem("token") || "" } }
    );
    alert(`Season ${seasonNumber} added to watchlist!`);
    // Instead of refetching, update watchDoc locally
    const newSeasonEntry = {
      seasonNumber: Number(seasonNumber),
      status: "planned",
    };

    if (!watchDoc) {
      setWatchDoc({
        ...res.data,
        seasons: [newSeasonEntry],
      });
    } else {
      setWatchDoc({
        ...watchDoc,
        seasons: [...(watchDoc.seasons || []), newSeasonEntry],
      });
    }  
  };

  const setSeasonStatus = async (status) => {
    if (!watchDoc) return;
    const res = await api.put(`/movies/${watchDoc._id}/seasons/${seasonNumber}/status`,
      { status },
      { headers: { "x-auth-token": localStorage.getItem("token") || "" } }
    );
    setWatchDoc(res.data);
  };

  return (
    <div className="backdrop-container min-h-screen">
      <div className="backdrop-overlay p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 glass-card p-6 md:p-8">
          <div className="flex justify-center md:col-span-1">
            <img src={poster} alt={`${show.name} - Season ${seasonNumber}`} className="rounded-lg shadow-xl w-64 md:w-full object-cover" />
          </div>
          <div className="md:col-span-2 flex flex-col">
            <h1 className="text-3xl font-bold text-white">{show.name} — Season {seasonNumber}</h1>
            <p className="text-gray-200 my-3">{season.overview || "No overview available."}</p>

            <h2 className="text-xl font-semibold text-white mt-4">Episodes</h2>
            <div className="space-y-3 max-h-80 overflow-auto pr-1 mt-2">
              {season.episodes?.map(ep => (
                <div key={ep.episode_number} className="p-3 rounded-lg bg-white/10">
                  <div className="flex justify-between">
                    <span className="font-semibold">E{ep.episode_number}: {ep.name || "Untitled"}</span>
                    <span className="text-xs opacity-80">{ep.runtime ?? show.episode_run_time?.[0] ?? 0} min</span>
                  </div>
                  {ep.overview && <p className="text-sm mt-1 opacity-90">{ep.overview}</p>}
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 flex flex-wrap gap-3">
              {!thisSeasonInDoc ? (
                <button
                  onClick={addSeasonToWatchlist}
                  className="bg-red-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-red-700 transition"
                >
                  Add Season to Watchlist
                </button>
              ) : (
                <>
                  {currentStatus !== "watching" && (
                    <button
                      onClick={() => setSeasonStatus("watching")}
                      className="bg-purple-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-purple-700 transition"
                    >
                      🎬 Start Watching
                    </button>
                  )}
                  {currentStatus !== "completed" && (
                    <button
                      onClick={() => setSeasonStatus("completed")}
                      className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
                    >
                      ✅ Finish Watching
                    </button>
                  )}
                  {currentStatus !== "planned" && (
                    <button
                      onClick={() => setSeasonStatus("planned")}
                      className="bg-gray-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-800 transition"
                    >
                      ↩️ Mark Planned
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
