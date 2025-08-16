// src/services/tmdb.js
import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const getTrendingMovies = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/trending/movie/week`, {
      params: { api_key: API_KEY },
    });
    return data.results || [];
  } catch (error) {
    console.error("Error fetching trending movies:", error); 
    return [];
  }
};

export const getTrendingTVShows = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/trending/tv/week`, {
      params: { api_key: API_KEY },
    });
    return data.results || [];
  } catch (error) {
    console.error("Error fetching trending TV shows:", error);
    return [];
  }
};

export const searchMovies = async (query) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query
      }
    });
    return data.results;
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
};

export const searchTVShows = async (query) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/search/tv`, {
      params: {
        api_key: API_KEY,
        query: query
      }
    });
    return data.results;
  } catch (error) {
    console.error("Error searching TV shows:", error);
    return [];
  }
};

export const fetchMovieDetails = async (movieId) => {
    const { data } = await axios.get(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
    return data;
};

export const fetchTvShowDetails = async (tvId) => { // Renamed parameter to tvId for clarity
    try {
        const { data } = await axios.get(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US`);
        return data;
    } catch (error) {
        console.error("Error fetching TV show details:", error);
        throw error; // Re-throw to allow component to catch and handle
    }
};