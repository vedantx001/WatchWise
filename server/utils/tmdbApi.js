const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Export the image base URL for use in routes
exports.TMDB_IMAGE_BASE_URL = TMDB_IMAGE_BASE_URL;

exports.fetchMovieDetails = async (movieId) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
        return data;
    } catch (error) {
        console.error("Error fetching movie details:", error);
        throw error;
    }
};

exports.fetchTvShowDetails = async (tvId) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US`);
        return data;
    } catch (error) {
        console.error("Error fetching TV show details:", error);
        throw error;
    }
};

exports.fetchSeasonDetails = async (tvId, seasonNumber) => {
    try {
        const url = `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`;
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Error fetching TMDB TV season details for TV ID ${tvId}, season ${seasonNumber}:`, error.message);
        throw new Error(`Failed to fetch season details from TMDB for TV ID ${tvId}, season ${seasonNumber}`);
    }
};

// --- Videos endpoints ---
exports.fetchMovieVideos = async (movieId) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
        return Array.isArray(data.results) ? data.results : [];
    } catch (error) {
        console.error("Error fetching movie videos:", error.message);
        throw new Error("Failed to fetch movie videos from TMDB");
    }
};

exports.fetchTvVideos = async (tvId) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/tv/${tvId}/videos?api_key=${API_KEY}&language=en-US`);
        return Array.isArray(data.results) ? data.results : [];
    } catch (error) {
        console.error("Error fetching TV videos:", error.message);
        throw new Error("Failed to fetch TV videos from TMDB");
    }
};

exports.fetchSeasonVideos = async (tvId, seasonNumber) => {
    try {
        const { data } = await axios.get(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}/videos?api_key=${API_KEY}&language=en-US`);
        return Array.isArray(data.results) ? data.results : [];
    } catch (error) {
        console.error("Error fetching season videos:", error.message);
        throw new Error("Failed to fetch season videos from TMDB");
    }
};