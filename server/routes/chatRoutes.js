const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const auth = require("../middleware/auth");
const { fetchMovieDetails, fetchTvShowDetails } = require("../utils/tmdbApi");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// TMDB config
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Helper: search TMDB by title
async function searchTMDB(title) {
  try {
    // First check movies
    let res = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
    );
    if (res.data.results && res.data.results.length > 0) {
      return { type: "movie", id: res.data.results[0].id };
    }

    // If not found in movies, check TV
    res = await axios.get(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
    );
    if (res.data.results && res.data.results.length > 0) {
      return { type: "tv", id: res.data.results[0].id };
    }

    return null; // nothing found
  } catch (err) {
    console.error("TMDB search error:", err.message);
    return null;
  }
}

router.post("/", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const extractionPrompt = `
      Extract the exact movie or TV show title from this user message: "${message}".
      If no title, reply only with "null".
    `;
    const extractionResult = await model.generateContent(extractionPrompt);
    const extractedTitle = extractionResult.response.text().trim().replace(/["']/g, "");

    let tmdbContext = null;

    if (extractedTitle && extractedTitle.toLowerCase() !== "null") {
      const tmdbSearch = await searchTMDB(extractedTitle);

      if (tmdbSearch) {
        if (tmdbSearch.type === "movie") {
          tmdbContext = await fetchMovieDetails(tmdbSearch.id);
        } else if (tmdbSearch.type === "tv") {
          tmdbContext = await fetchTvShowDetails(tmdbSearch.id);
        }
      }
    }

    const prompt = `
    You are WatchWise, a friendly and witty movie assistant.  

    Your replies must follow these rules:
    - Always polished, confident, conversational.  
    - Recommend 2–4 movies or shows.  
    - Each recommendation = one short sentence (max 20 words).  
    - Always wrap movie/show titles in **double asterisks** so they appear bold in Markdown.  
    - No lists, no categories, no clarifying questions.  
    - Keep everything in 1–2 smooth sentences, never a long lecture.  

    User asked: ${message}  

    Here is some context if relevant:  
    ${tmdbContext ? JSON.stringify(tmdbContext) : "No extra context"}  
    `;

    const result = await model.generateContent(prompt);
    const botReply = result.response.text() || "Sorry, I couldn’t generate a reply.";

    res.json({ reply: botReply });
  } catch (error) {
    console.error("Chatbot error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong with chatbot" });
  }
});

module.exports = router;
