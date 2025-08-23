import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TrailerPlayer() {
  const { type, id } = useParams();
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrailer = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
        const endpoint = type === 'movie'
          ? `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`
          : `https://api.themoviedb.org/3/tv/${id}/videos?api_key=${API_KEY}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        const trailer = (data.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) {
          setTrailerKey(trailer.key);
        } else {
          setError('No trailer found for this title.');
        }
      } catch (err) {
        setError('Failed to fetch trailer.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrailer();
  }, [type, id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/40 transition"
      >
        ← Back
      </button>
      {loading && <p>Loading trailer…</p>}
      {error && <p>{error}</p>}
      {trailerKey && (
        <div className="w-full max-w-2xl aspect-video mt-8">
          <iframe
            title="Trailer"
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ borderRadius: 16, width: '100%', height: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
