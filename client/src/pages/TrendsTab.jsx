import React, { useEffect, useState } from "react";
import { getTrendingMovies, getTrendingTVShows } from "../services/tmdb";
import "../styles/trending.css";
import fallbackPoster from "../assets/fallback_poster2.png";
import { useNavigate } from "react-router-dom"; 

const Trending = () => {
  const [movies, setMovies] = useState([]);
  const [tvShows, setTVShows] = useState([]);
  const IMG_URL = "https://image.tmdb.org/t/p/w200";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const movieData = await getTrendingMovies();
      const tvData = await getTrendingTVShows();
      setMovies(movieData);
      setTVShows(tvData);
    };
    fetchData();
  }, []);

  // Merge & randomize
  const combinedTrends = [
    ...movies.map((item) => ({ ...item, media_type: "movie" })),
    ...tvShows.map((item) => ({ ...item, media_type: "tv" })),
  ].sort(() => Math.random() - 0.5);

  const handleCardClick = (item) => {
    // Navigate to the generic /details/:type/:id route
    navigate(`/details/${item.media_type}/${item.id}`);
  };

  return (
    <div className="trending-container">
      <h2 className="trending-title">Trending</h2>
      <div className="trending-grid">
        {combinedTrends.map((item) => (
          <div 
            key={item.id} 
            className="trending-card"
            onClick={() => handleCardClick(item)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={
                item.poster_path
                  ? `${IMG_URL}${item.poster_path}`
                  : fallbackPoster
              }
              className="trending-poster" 
            />
            <div className="trending-info">
              <h3 className="trending-name">{item.title || item.name}</h3>
              <div className="trending-meta">
                <span className="type-tag">
                  {item.media_type === "movie" ? "Movie" : "TV Show"}
                </span>
                <span className="rating">
                  {item.vote_average ? item.vote_average.toFixed(1) : "N/A"} / 10
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default Trending;
