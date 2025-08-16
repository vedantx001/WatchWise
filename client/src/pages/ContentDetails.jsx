// src/components/ContentDetails.jsx (previously MovieDetails.jsx)

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// Import both movie and TV show detail fetchers
import { fetchMovieDetails, fetchTvShowDetails } from "../services/tmdb"; 
import fallbackPoster from "../assets/fallback_poster2.png";
import api from "../api";
import "../styles/moviedetails.css"; // Keep CSS file name, or rename it if preferred

// A simple component for displaying the rating as a circle
const RatingCircle = ({ percentage = 0, score = 0}) => {
    const [isHovered, setIsHovered] = useState(false); 

    // Ensure props are valid numbers before doing calculations
    const validPercentage = typeof percentage === 'number' ? percentage : 0;
    const validScore = typeof score === 'number' ? score : 0;

    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (validPercentage / 100) * circumference;

    return (
        <div 
            className="rating-circle-container" // Container for positioning
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isHovered && (
                <div className="rating-tooltip-above">
                    {validScore.toFixed(1)}/10 Rating
                </div>
            )}
            <div className="rating-circle">
                <svg width="60" height="60">
                    <circle
                        className="circle-bg"
                        cx="30"
                        cy="30"
                        r={radius}
                    />
                    <circle
                        className="circle-progress"
                        cx="30"
                        cy="30"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <span className="rating-text transition-all">
                    {`${Math.round(validPercentage)}%`}
                </span>
            </div>
        </div>
    );
};


// Renamed from MovieDetails to ContentDetails
export default function ContentDetails() {
    // We now expect 'type' (movie or tv) and 'id' from the URL
    const { type, id } = useParams(); 
    const [content, setContent] = useState(null); // Renamed movie to content state

    useEffect(() => {
        const loadContent = async () => {
            try {
                let data;
                if (type === 'movie') {
                    data = await fetchMovieDetails(id);
                } else if (type === 'tv') {
                    data = await fetchTvShowDetails(id);
                } else {
                    console.error("Unknown content type:", type);
                    // Optionally redirect or show an error message for unknown types
                    return; 
                }
                setContent(data);
            } catch (err) {
                console.error(`Failed to fetch ${type} details:`, err);
                // Set content to null or an error state to show a "not found" message
                setContent(null); 
            }
        };
        loadContent();
    }, [id, type]); // Important: dependency array includes both id and type

    const handleAddToWatchlist = async () => {
        if (!content) {
            alert("Content not loaded yet. Please wait.");
            return;
        }

        // Determine properties based on content type for watchlist
        const itemTitle = content.title || content.name; // 'title' for movies, 'name' for TV shows
        const itemGenre = content.genres?.map((g) => g.name).join(", ") || "";
        
        // For TV shows, use the first episode's run time, or 0 if not available
        const itemDuration = type === 'movie' 
                            ? (Number(content.runtime) || 0) 
                            : (content.episode_run_time && content.episode_run_time.length > 0 ? content.episode_run_time[0] : 0);

        try {
            const token = localStorage.getItem("token");
            await api.post(
                "/movies", // Your backend endpoint. Consider renaming it to '/watchlist' or similar for clarity
                {
                    title: itemTitle,
                    genre: itemGenre,
                    duration: itemDuration,
                    status: "planned", // Default status for adding
                    rating: content.vote_average || 0,
                    posterPath: content.poster_path
                        ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
                        : fallbackPoster,
                    tmdbId: content.id, // Important for uniqueness and linking back to TMDB
                    contentType: type, // Store content type (movie/tv) for backend processing
                },
                {
                    headers: { "x-auth-token": token },
                }
            );
            alert(`${itemTitle} added to watchlist!`);
        } catch (err) {
            console.error(err);
            // More user-friendly error message, e.g., if already added
            alert("Failed to add content to watchlist. It might already be there or you're not logged in.");
        }
    };

    if (!content) { 
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <p>Loading content details...</p>
            </div>
        );
    }

    // Dynamic data for rendering based on content type
    const backdropUrl = content.backdrop_path
        ? `https://image.tmdb.org/t/p/original${content.backdrop_path}`
        : '';

    const voteAverageAsNumber = Number(content.vote_average);
    const displayTitle = content.title || content.name;
    const displayTagline = content.tagline || ''; // Tagline is usually movie-specific, will be empty for TV if not present
    const displayOverview = content.overview || "No overview available.";
    const displayReleaseDate = content.release_date || content.first_air_date; // 'release_date' for movies, 'first_air_date' for TV

    return (
        <div 
            className="backdrop-container min-h-screen"
            style={{ backgroundImage: `url(${backdropUrl})` }}
        >
            <div className="backdrop-overlay">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="relative glass-card rounded-xl shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Poster Image (Column 1) */}
                        <div className="md:col-span-1 flex justify-center">
                            <img
                                src={
                                    content.poster_path
                                        ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
                                        : fallbackPoster
                                }
                                alt={`Poster of ${displayTitle}`}
                                className="rounded-lg shadow-xl w-64 md:w-full object-cover"
                            />
                        </div>

                        {/* Content Details (Column 2) */}
                        <div className="md:col-span-2 flex flex-col">
                            <h1 className="text-4xl md:text-5xl font-bold text-white">
                                {displayTitle}
                            </h1>
                            {displayTagline && ( // Only render tagline if it exists
                                <p className="text-gray-300 italic text-lg mt-1">
                                    "{displayTagline}"
                                </p>
                            )}
                            
                            {/* Genres */}
                            <div className="flex flex-wrap gap-2 my-4">
                                {content.genres?.map((g) => (
                                    <span key={g.id} className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        {g.name}
                                    </span>
                                ))}
                            </div>

                            {/* Stats: Rating, Duration/Run Time */}
                            <div className="flex items-center gap-6 my-4">
                                {voteAverageAsNumber > 0 && 
                                    <RatingCircle 
                                        percentage={voteAverageAsNumber * 10} 
                                        score={voteAverageAsNumber} 
                                    />
                                }
                                <div className="text-gray-200">
                                    <p className="font-semibold">{type === 'movie' ? 'Duration' : 'Avg. Episode Run Time'}</p>
                                    <p>
                                        {type === 'movie' 
                                            ? `${content.runtime || 'N/A'} min` 
                                            : `${content.episode_run_time && content.episode_run_time.length > 0 ? content.episode_run_time[0] : 'N/A'} min`}
                                    </p>
                                </div>
                                <div className="text-gray-200">
                                    <p className="font-semibold">{type === 'movie' ? 'Released' : 'First Air Date'}</p>
                                    <p>
                                        {displayReleaseDate 
                                            ? new Date(displayReleaseDate).getFullYear() 
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Overview */}
                            <div className="mt-4">
                                <h2 className="text-2xl font-semibold mb-2">Synopsis</h2>
                                <p className="text-gray-200 text-base leading-relaxed">
                                    {displayOverview}
                                </p>
                            </div>
                            
                            {/* Action Button */}
                            <div className="mt-auto pt-6">
                                <button
                                    onClick={handleAddToWatchlist}
                                    className="w-full md:w-auto bg-red-600 text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-300 ease-in-out"
                                >
                                    Add to Watchlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}