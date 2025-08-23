import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Bollywood = Hindi language, India origin
export const getTrendingBollywood = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/discover/movie`, {
      params: {
        api_key: API_KEY,
        with_original_language: "hi",
        region: "IN",
        sort_by: "popularity.desc",
        include_adult: false,
        page: 1,
        'with_release_type': '3|2', // Theatrical + Digital
        'release_date.lte': new Date().toISOString().slice(0, 10)
      }
    });
    return data.results || [];
  } catch (error) {
    console.error("Error fetching trending Bollywood movies:", error);
    return [];
  }
};

export const getUpcomingBollywood = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/movie/upcoming`, {
      params: {
        api_key: API_KEY,
        region: "IN",
        language: "hi-IN",
        page: 1
      }
    });
    // Filter for Hindi language
    return (data.results || []).filter(m => m.original_language === "hi");
  } catch (error) {
    console.error("Error fetching upcoming Bollywood movies:", error);
    return [];
  }
};

// Upcoming Hollywood (US, English)
export const getUpcomingHollywood = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/movie/upcoming`, {
      params: {
        api_key: API_KEY,
        region: "US",
        language: "en-US",
        page: 1
      }
    });
    // Filter for English language
    return (data.results || []).filter(m => m.original_language === "en");
  } catch (error) {
    console.error("Error fetching upcoming Hollywood movies:", error);
    return [];
  }
};
