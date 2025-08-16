// src/components/SearchResults.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { searchMovies, searchTVShows } from "../services/tmdb";
import "../styles/search.css";
import fallbackPoster from "../assets/fallback_poster2.png";
import { useNavigate } from "react-router-dom"; 

export default function SearchResults() {
  const { query } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const IMG_URL = "https://image.tmdb.org/t/p/w200";

  useEffect(() => {
    const fetchData = async () => {
      // Add loading state here if you want to show a spinner/message
      // setLoading(true); 
      const movies = await searchMovies(query);
      const tvShows = await searchTVShows(query);

      // Tag and merge
      const combined = [
        ...movies.map((item) => ({ ...item, media_type: "movie" })),
        ...tvShows.map((item) => ({ ...item, media_type: "tv" })),
      ];

      // Filter out items without a poster path to avoid broken images
      const filtered = combined.filter(item => item.poster_path);

      // Shuffle so they're mixed (optional, keep if desired)
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      setResults(shuffled);
      // setLoading(false);
    };
    fetchData();
  }, [query]);

  // --- KEY CHANGE HERE ---
  const handleCardClick = (item) => {
    // Navigate to the generic /details/:type/:id route
    navigate(`/details/${item.media_type}/${item.id}`);
  };
  // -----------------------

  return (
    <div className="search-results">
      {/* Decode URI component for display, as query from useParams is encoded */}
      <h2>Results for "{decodeURIComponent(query || '')}"</h2> 

      {/* Add conditional rendering for no results or loading */}
      {results.length === 0 && !query && (
        <p>Start typing to search for movies or TV shows!</p>
      )}
      {results.length === 0 && query && (
        <p>No results found for "{decodeURIComponent(query)}".</p>
      )}

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
              alt={item.title || item.name} // Use title for movies, name for TV
            />
            <p>{item.title || item.name}</p> {/* Use title for movies, name for TV */}
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