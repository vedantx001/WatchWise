// Discover movies by genre(s) with pagination
export const discoverMoviesByGenres = async (genreIds, page = 1) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/discover/movie`, {
      params: {
        api_key: API_KEY,
        with_genres: genreIds,
        sort_by: 'popularity.desc',
        include_adult: false,
        page
      }
    });
    return { results: data.results, totalPages: data.total_pages, page: data.page };
  } catch (error) {
    console.error("Error discovering movies by genres:", error);
    return { results: [], totalPages: 1, page: 1 };
  }
};

// Discover TV shows by genre(s) with pagination
export const discoverTVByGenres = async (genreIds, page = 1) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/discover/tv`, {
      params: {
        api_key: API_KEY,
        with_genres: genreIds,
        sort_by: 'popularity.desc',
        include_adult: false,
        page
      }
    });
    return { results: data.results, totalPages: data.total_pages, page: data.page };
  } catch (error) {
    console.error("Error discovering TV shows by genres:", error);
    return { results: [], totalPages: 1, page: 1 };
  }
};
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

export const searchMovies = async (query, page = 1) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query,
        page
      }
    });
    return { results: data.results, totalPages: data.total_pages, page: data.page };
  } catch (error) {
    console.error("Error searching movies:", error);
    return { results: [], totalPages: 1, page: 1 };
  }
};

export const searchTVShows = async (query, page = 1) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/search/tv`, {
      params: {
        api_key: API_KEY,
        query: query,
        page
      }
    });
    return { results: data.results, totalPages: data.total_pages, page: data.page };
  } catch (error) {
    console.error("Error searching TV shows:", error);
    return { results: [], totalPages: 1, page: 1 };
  }
};

export const fetchMovieDetails = async (movieId) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
      return data;
    } catch (error) {
        console.error("Error fetching movie details:", error);
        throw error;
    }
};

export const fetchTvShowDetails = async (tvId) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US`);
        return data;
    } catch (error) {
        console.error("Error fetching TV show details:", error);
        throw error;
    }
};

export const fetchSeasonDetails = async (tvId, seasonNumber) => {
    try {
        const url = `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`;
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Error fetching TMDB TV season details for TV ID ${tvId}, season ${seasonNumber}:`, error.message);
        throw new Error(`Failed to fetch season details from TMDB for TV ID ${tvId}, season ${seasonNumber}`);
    }
};