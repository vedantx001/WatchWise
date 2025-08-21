// src/components/SearchResults.jsx

import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  searchMovies,
  searchTVShows,
  discoverMoviesByGenres,
  discoverTVByGenres,
} from "../services/tmdb";
import "../styles/search.css";
import fallbackPoster from "../assets/fallback_poster2.png";

export default function SearchResults() {
  const { query } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const IMG_URL = "https://image.tmdb.org/t/p/w200";

  // Reset to page 1 when query or filters change
  useEffect(() => {
    setPage(1);
  }, [query, location.search]);

  // Smooth scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const movieGenres = params.get("movieGenres");
        const tvGenres = params.get("tvGenres");

        // Genre-based discovery
        if (movieGenres || tvGenres) {
          let movieResults = { results: [], totalPages: 1, page: 1 };
          let tvResults = { results: [], totalPages: 1, page: 1 };

          if (movieGenres) {
            movieResults = await discoverMoviesByGenres(movieGenres, page);
          }
          if (tvGenres) {
            tvResults = await discoverTVByGenres(tvGenres, page);
          }

          const combined = [
            ...movieResults.results.map((item) => ({
              ...item,
              media_type: "movie",
            })),
            ...tvResults.results.map((item) => ({ ...item, media_type: "tv" })),
          ];

          // Keep only items with posters; fallback available if you prefer to show all
          const filtered = combined.filter((item) => item.poster_path);
          // Sort by latest release date (release_date for movies, first_air_date for TV)
          const sorted = filtered.sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date || 0);
            const dateB = new Date(b.release_date || b.first_air_date || 0);
            return dateB - dateA;
          });
          setResults(sorted);
          setTotalPages(Math.max(movieResults.totalPages, tvResults.totalPages));
          return;
        }

        // Text search (movies + tv)
        if (query) {
          const movies = await searchMovies(query, page);
          const tvShows = await searchTVShows(query, page);

          const combined = [
            ...movies.results.map((item) => ({
              ...item,
              media_type: "movie",
            })),
            ...tvShows.results.map((item) => ({ ...item, media_type: "tv" })),
          ];

          const filtered = combined.filter((item) => item.poster_path);
          // Sort by latest release date (release_date for movies, first_air_date for TV)
          const sorted = filtered.sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date || 0);
            const dateB = new Date(b.release_date || b.first_air_date || 0);
            return dateB - dateA;
          });
          setResults(sorted);
          setTotalPages(Math.max(movies.totalPages, tvShows.totalPages));
        } else {
          setResults([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, location.search, page]);

  const handleCardClick = (item) => {
    navigate(`/details/${item.media_type}/${item.id}`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxButtons = 7;
    let start = Math.max(1, page - 3);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <nav className="custom-pagination" aria-label="Pagination">
        <button
          className="page-btn"
          onClick={() => setPage(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          «
        </button>
        <button
          className="page-btn"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {start > 1 && (
          <>
            <button className="page-btn" onClick={() => setPage(1)}>
              1
            </button>
            {start > 2 && <span className="dots">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            className={`page-btn ${p === page ? "is-active" : ""}`}
            onClick={() => setPage(p)}
            disabled={p === page}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="dots">…</span>}
            <button className="page-btn" onClick={() => setPage(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        <button
          className="page-btn"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          className="page-btn"
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >
          »
        </button>
      </nav>
    );
  };

  const params = new URLSearchParams(location.search);
  const movieGenres = params.get("movieGenres");
  const tvGenres = params.get("tvGenres");

  return (
    <div className="search-results">
      {movieGenres || tvGenres ? (
        <h2>Results by Genre</h2>
      ) : (
        <h2>Results for "{decodeURIComponent(query || "")}"</h2>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="empty-state">
          {query || movieGenres || tvGenres ? (
            <p>No results found.</p>
          ) : (
            <p>Start typing to search for movies or TV shows!</p>
          )}
        </div>
      )}

      <div className="results-grid">
        {results.map((item) => (
          <div
            key={`${item.media_type}-${item.id}`}
            className="result-card"
            onClick={() => handleCardClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCardClick(item)}
          >
            <img
              src={item.poster_path ? `${IMG_URL}${item.poster_path}` : fallbackPoster}
              alt={item.title || item.name}
              loading="lazy"
            />
            <p>{item.title || item.name}</p>
            <span className="type-tag">
              {item.media_type === "movie" ? "Movie" : "TV Show"}
            </span>
            <span className="rating">
              {(item.vote_average ?? 0).toFixed(1)} / 10
            </span>
          </div>
        ))}
      </div>

      {/* Pagination only at the bottom */}
      {renderPagination()}
    </div>
  );
}