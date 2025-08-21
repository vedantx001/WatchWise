// src/components/SearchResults.jsx
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { searchMovies, searchTVShows, discoverMoviesByGenres, discoverTVByGenres } from "../services/tmdb";
import "../styles/search.css";
import fallbackPoster from "../assets/fallback_poster2.png";
import { useNavigate } from "react-router-dom"; 

export default function SearchResults() {
  const { query } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const IMG_URL = "https://image.tmdb.org/t/p/w200";

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(location.search);
      const movieGenres = params.get('movieGenres');
      const tvGenres = params.get('tvGenres');
      // If genre search
      if (movieGenres || tvGenres) {
        let movieResults = [];
        let tvResults = [];
        if (movieGenres) {
          movieResults = await discoverMoviesByGenres(movieGenres);
        }
        if (tvGenres) {
          tvResults = await discoverTVByGenres(tvGenres);
        }
        const combined = [
          ...movieResults.map((item) => ({ ...item, media_type: "movie" })),
          ...tvResults.map((item) => ({ ...item, media_type: "tv" })),
        ];
        const filtered = combined.filter(item => item.poster_path);
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        setResults(shuffled);
        return;
      }
      // Otherwise, normal text search
      if (query) {
        const movies = await searchMovies(query);
        const tvShows = await searchTVShows(query);
        const combined = [
          ...movies.map((item) => ({ ...item, media_type: "movie" })),
          ...tvShows.map((item) => ({ ...item, media_type: "tv" })),
        ];
        const filtered = combined.filter(item => item.poster_path);
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        setResults(shuffled);
      }
    };
    fetchData();
  }, [query, location.search]);

  const handleCardClick = (item) => {
    navigate(`/details/${item.media_type}/${item.id}`);
  };

  return (
    <div className="search-results">
      {/* Show heading based on search type */}
      {(() => {
        const params = new URLSearchParams(location.search);
        const movieGenres = params.get('movieGenres');
        const tvGenres = params.get('tvGenres');
        if (movieGenres || tvGenres) {
          return <h2>Results by Genre</h2>;
        }
        return <h2>Results for "{decodeURIComponent(query || '')}"</h2>;
      })()}


      {/* Add conditional rendering for no results or loading */}
      {(() => {
        const params = new URLSearchParams(location.search);
        const movieGenres = params.get('movieGenres');
        const tvGenres = params.get('tvGenres');
        if (results.length === 0) {
          if (query || movieGenres || tvGenres) {
            return <p>No results found.</p>;
          } else {
            return <p>Start typing to search for movies or TV shows!</p>;
          }
        }
        return null;
      })()}

      <div className="results-grid">
        {results.map((item) => (
          <div
            key={`${item.media_type}-${item.id}`}
            className="result-card"
            onClick={() => handleCardClick(item)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={
                item.poster_path
                  ? `${IMG_URL}${item.poster_path}`
                  : fallbackPoster
              }
              alt={item.title || item.name}
            />
            <p>{item.title || item.name}</p>
            <span className="type-tag">
              {item.media_type === "movie" ? "Movie" : "TV Show"}
            </span>
            <span className="rating">
              {item.vote_average?.toFixed(1) || "N/A"} / 10
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}