import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TrailerPlayer() {
  const { id, seasonNumber } = useParams();
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerSite, setTrailerSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isTv = Boolean(seasonNumber);

  // Close on Esc for desktop
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [navigate]);

  useEffect(() => {
    const fetchTrailer = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
        if (!API_KEY) throw new Error("Missing VITE_TMDB_API_KEY");

        const pickBest = (arr) => {
          if (!Array.isArray(arr)) return null;
          return (
            arr.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
            arr.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
            arr.find(v => v.site === 'YouTube' && v.type === 'Teaser' && v.official) ||
            arr.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
            arr.find(v => v.site === 'YouTube' && v.type === 'Clip') ||
            arr.find(v => v.site === 'YouTube') ||
            null
          );
        };

        // Helper to fetch videos with language fallback
        const fetchWithLangFallback = async (urlBase) => {
          const res1 = await fetch(`${urlBase}&language=en-US`);
          const data1 = await res1.json();
          let list = Array.isArray(data1.results) ? data1.results : [];
          if (!list.length) {
            const res2 = await fetch(urlBase);
            const data2 = await res2.json();
            list = Array.isArray(data2.results) ? data2.results : [];
          }
          return list;
        };

        if (!isTv) {
          // Movie
          const vids = await fetchWithLangFallback(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`);
          const pick = pickBest(vids);
          if (pick?.key) {
            setTrailerKey(pick.key);
            setTrailerSite(pick.site || 'YouTube');
          }
          else setError('No trailer found for this title.');
        } else {
          // TV Season -> try season then series
          const seasonVids = await fetchWithLangFallback(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}/videos?api_key=${API_KEY}`);
          let pick = pickBest(seasonVids);
          if (!pick) {
            const seriesVids = await fetchWithLangFallback(`https://api.themoviedb.org/3/tv/${id}/videos?api_key=${API_KEY}`);
            pick = pickBest(seriesVids);
          }
          if (pick?.key) {
            setTrailerKey(pick.key);
            setTrailerSite(pick.site || 'YouTube');
          }
          else setError('No trailer found for this title.');
        }
      } catch (err) {
        setError(err?.message || 'Failed to fetch trailer.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrailer();
  }, [id, seasonNumber, isTv]);

  const embedSrc = trailerKey
    ? trailerSite === 'Vimeo'
      ? `https://player.vimeo.com/video/${trailerKey}?autoplay=1`
      : `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`
    : null;

  return (
    <div className="fixed inset-0 z-[1200] bg-black text-white flex flex-col items-center justify-center">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 md:top-6 md:right-6 px-3 py-2 rounded-full hover:bg-red-800 transition cursor-pointer bg-red-600"
        aria-label="Close trailer"
        title="Close (Esc)"
      >
        ✕
      </button>
      {loading && <p>Loading trailer…</p>}
      {error && <p>{error}</p>}
      {embedSrc && (
        <div className="w-[92vw] md:w-[80vw] max-w-5xl aspect-video rounded-xl overflow-hidden shadow-xl">
          <iframe
            title="Trailer"
            width="100%"
            height="100%"
            src={embedSrc}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}
