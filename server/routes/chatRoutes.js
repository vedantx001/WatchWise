const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const { fetchMovieDetails, fetchTvShowDetails } = require("../utils/tmdbApi");

dotenv.config();
const router = express.Router();

// TMDB config
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "qwen/qwen3-next-80b-a3b-instruct:free";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const GENRE_ID_MAP = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  sciencefiction: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

function detectGenreIdsFromMessage(message) {
  if (!message) return [];

  const normalized = message.toLowerCase().replace(/[^a-z\s]/g, "");
  const compact = normalized.replace(/\s+/g, "");
  const ids = [];

  Object.entries(GENRE_ID_MAP).forEach(([genreKey, genreId]) => {
    if (normalized.includes(genreKey) || compact.includes(genreKey)) {
      ids.push(genreId);
    }
  });

  return ids;
}

function messageRequestsLatest(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return ["latest", "new", "recent", "newest"].some((keyword) => lower.includes(keyword));
}

async function fetchTmdbMovieRecommendations(userMessage) {
  if (!TMDB_API_KEY) return [];

  const today = new Date().toISOString().split("T")[0];
  const genreIds = detectGenreIdsFromMessage(userMessage);
  const wantsLatest = messageRequestsLatest(userMessage);

  const params = {
    api_key: TMDB_API_KEY,
    language: "en-US",
    include_adult: false,
    include_video: false,
    page: 1,
    sort_by: wantsLatest ? "release_date.desc" : "popularity.desc",
    "vote_count.gte": 120,
    "primary_release_date.lte": today,
  };

  if (wantsLatest) {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 2);
    params["primary_release_date.gte"] = since.toISOString().split("T")[0];
  }

  if (genreIds.length > 0) {
    params.with_genres = genreIds.join(",");
  }

  try {
    const { data } = await axios.get(`${TMDB_BASE_URL}/discover/movie`, { params });
    return (data.results || []).slice(0, 4);
  } catch (error) {
    console.error("TMDB discover fallback error:", error.response?.data || error.message);
    return [];
  }
}

function formatTmdbFallbackReply(items) {
  if (!items.length) {
    return "I couldn’t fetch live suggestions right now, but try **Shutter Island**, **Gone Girl**, or **Prisoners**.";
  }

  return items
    .slice(0, 3)
    .map((item) => {
      const year = item.release_date ? new Date(item.release_date).getFullYear() : "recent";
      return `Try **${item.title}** (${year}) for a sharp, high-tension watch.`;
    })
    .join(" ");
}

async function callOpenRouter(messages) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
}

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

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let botReply = "";

    const extractionPrompt = `
      Extract the exact movie or TV show title from this user message: "${message}".
      If no title, reply only with "null".
    `;
    let tmdbContext = null;

    try {
      const extractionResult = await callOpenRouter([
        { role: "user", content: extractionPrompt },
      ]);
      const extractedTitle = extractionResult.replace(/["']/g, "");

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

      botReply =
        (await callOpenRouter([{ role: "user", content: prompt }])) ||
        "Sorry, I couldn’t generate a reply.";
    } catch (aiError) {
      console.error("OpenRouter error, using TMDB fallback:", aiError.response?.data || aiError.message);
    }

    if (!botReply) {
      const tmdbFallback = await fetchTmdbMovieRecommendations(message);
      botReply = formatTmdbFallbackReply(tmdbFallback);
    }

    res.json({ reply: botReply });
  } catch (error) {
    console.error("Chatbot error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong with chatbot" });
  }
});

module.exports = router;
