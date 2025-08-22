// src/pages/ContentDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMovieDetails, fetchTvShowDetails } from "../services/tmdb";
import fallbackPoster from "../assets/fallback_poster2.png";
import api from "../api";
import "../styles/moviedetails.css";

const RatingCircle = ({ percentage = 0 }) => {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((percentage || 0) / 100) * circumference;

  return (
    <div className="rating-circle">
      <svg width="60" height="60">
        <circle className="circle-bg" cx="30" cy="30" r={radius} />
        <circle
          className="circle-progress"
          cx="30"
          cy="30"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="rating-text">{`${Math.round(percentage || 0)}%`}</span>
    </div>
  );
};

export default function ContentDetails() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (type === "movie") {
          const m = await fetchMovieDetails(id);
          setShow(m);
        } else if (type === "tv") {
          const tv = await fetchTvShowDetails(id);
          setShow(tv);
        }
      } catch (e) {
        console.error(e);
        setShow(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!show) return <div className="min-h-screen flex items-center justify-center text-white">Not found.</div>;

  const isMovie = type === "movie";
  const poster = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : fallbackPoster;
  const backdropUrl = show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : "";

  if (isMovie) {
    const vote = Number(show.vote_average || 0);
    return (
      <div className="backdrop-container min-h-screen" style={{ backgroundImage: `url(${backdropUrl})` }}>
        <div className="backdrop-overlay">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="glass-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 flex justify-center">
                <img src={poster} alt={show.title} className="rounded-lg shadow-xl w-64 md:w-full object-cover" />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <h1 className="text-4xl font-bold text-white">{show.title}</h1>
                <div className="flex flex-wrap gap-2 my-4">
                  {show.genres?.map(g => (
                    <span key={g.id} className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {g.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6 my-4">
                  {vote > 0 && <RatingCircle percentage={vote * 10} />}
                  <div className="text-gray-200">
                    <p className="font-semibold">Duration</p>
                    <p>{show.runtime || "N/A"} min</p>
                  </div>
                  <div className="text-gray-200">
                    <p className="font-semibold">Released</p>
                    <p>{show.release_date ? new Date(show.release_date).getFullYear() : "N/A"}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-2xl font-semibold mb-2">Synopsis</h2>
                  <p className="text-gray-200">{show.overview || "No overview available."}</p>
                </div>
                <div className="mt-auto pt-6">
                  <button
                    onClick={async () => {
                      try {
                        await api.post(
                          "/movies",
                          {
                            title: show.title,
                            tmdbId: String(show.id),
                            contentType: "movie",
                            status: "planned",
                            rating: show.vote_average || 0,
                          }
                        );
                        alert(`${show.title} added to watchlist!`);
                      } catch (err) {
                        const msg = err?.response?.data?.msg || err?.response?.data?.errors?.[0]?.msg || err.message;
                        alert(`Failed to add: ${msg}`);
                      }
                    }}
                    className="w-full md:w-auto bg-red-600 text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-red-700 transition"
                  >
                    Add to Watchlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TV overview + season picker
  return (
    <div className="backdrop-container min-h-screen" style={{ backgroundImage: `url(${backdropUrl})` }}>
      <div className="backdrop-overlay">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="glass-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex justify-center">
              <img src={poster} alt={show.name} className="rounded-lg shadow-xl w-64 md:w-full object-cover" />
            </div>
            <div className="md:col-span-2 flex flex-col">
              <h1 className="text-4xl font-bold text-white">{show.name}</h1>
              <div className="flex flex-wrap gap-2 my-4">
                {show.genres?.map(g => (
                  <span key={g.id} className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {g.name}
                  </span>
                ))}
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3 text-white">Seasons</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(show.seasons || []).filter(s => s.season_number !== 0).map(s => (
                    <button
                      key={s.id || s.season_number}
                      onClick={() => navigate(`/details/tv/${show.id}/season/${s.season_number}`)}
                      className="text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    >
                      <div className="font-semibold">Season {s.season_number}</div>
                      <div className="text-xs opacity-80">{s.episode_count} episodes</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
