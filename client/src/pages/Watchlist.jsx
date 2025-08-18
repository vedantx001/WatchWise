import { useEffect, useState } from "react";
import api from "../api";
import SearchBar from "../components/SearchBar";

function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Fetches movies from the API when the component mounts
    api.get("/movies").then((res) => setMovies(res.data));
  }, []);

  const addMovie = async (e) => {
    e.preventDefault();
    // Adds a new movie to the watchlist via API
    const res = await api.post("/movies", { title, genre, duration: Number(duration) }); // Ensure duration is a number
    setMovies([res.data, ...movies]);
    // Clears input fields after adding
    setTitle("");
    setGenre("");
    setDuration("");
  };

  const markCompleted = async (id) => {
    // Updates movie status to 'completed'
    const res = await api.put(`/movies/${id}`, { status: "completed" });
    setMovies(movies.map((m) => (m._id === id ? res.data : m)));
  };

  // Filters movies based on the selected status
  const filteredMovies = movies.filter((m) =>
    filter === "all" ? true : m.status === filter
  );

  const rateMovie = async (id, newRating) => {
    // Updates the rating of a movie
    const res = await api.put(`/movies/${id}`, { rating: Number(newRating) }); // Ensure rating is a number
    setMovies(movies.map((m) => (m._id === id ? res.data : m)));
  };

  const deleteMovie = async (id) => {
    // Deletes a movie from the watchlist
    await api.delete(`/movies/${id}`);
    setMovies(movies.filter((m) => m._id !== id));
  };

  const toggleFavorite = async (id) => {
    // Toggles the favorite status of a movie
    const res = await api.put(`/movies/${id}/favorite`);
    setMovies(movies.map((m) => (m._id === id ? res.data : m)));
  };

  // Identifies and sorts the top 5 trending movies (rating >= 8)
  const trendingMovies = [...movies]
    .filter((m) => m.rating >= 8)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 sm:p-10">
      <h2 className="text-4xl font-extrabold text-center mb-10 text-red-500 animate-fade-in-down">
        🎬 Your Watchlist
      </h2>

      {/* Add movies */}
      <div className="m-auto w-full max-w-md">
          <SearchBar />
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center flex-wrap gap-3 mb-8">
        {["all", "planned", "watching", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full font-semibold transition duration-300 ease-in-out ${
              filter === f
                ? "bg-red-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <hr className="border-gray-700 my-8" />

      {/* Movie List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMovies.length > 0 ? (
          filteredMovies.map((m) => (
            <div
              key={m._id}
              className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative h-48 bg-gray-700 flex items-center justify-center text-5xl text-gray-400 border-b border-gray-700">
                🎬
                <button
                  onClick={() => toggleFavorite(m._id)}
                  className={`absolute top-3 right-3 text-4xl leading-none ${
                    m.favorite ? "text-yellow-400" : "text-gray-400 hover:text-yellow-300"
                  } transition-colors duration-200`}
                  title={m.favorite ? "Unfavorite" : "Favorite"}
                >
                  ⭐
                </button>
              </div>
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-2xl font-bold mb-2 text-white">
                  {m.title}
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  {m.genre || "Unknown Genre"} • {m.duration || "N/A"} min
                </p>
                <p className={`text-xs font-semibold px-2 py-1 rounded-full w-fit mb-3
                  ${m.status === "completed" ? "bg-green-600" : ""}
                  ${m.status === "watching" ? "bg-blue-600" : ""}
                  ${m.status === "planned" ? "bg-purple-600" : ""}`}
                >
                  Status: {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </p>

                {/* Rating Input */}
                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-700">
                  <span className="text-gray-400 text-sm">Your Rating:</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={m.rating !== undefined ? m.rating : ""}
                    onChange={(e) => rateMovie(m._id, e.target.value)}
                    className="w-20 text-center rounded-md bg-gray-700 text-white p-1 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Rate"
                  />
                  <span className="text-md text-gray-400">/10</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 bg-gray-700 border-t border-gray-600">
                {m.status !== "completed" && (
                  <button
                    onClick={() => markCompleted(m._id)}
                    className="text-green-400 hover:text-green-300 font-medium text-sm transition-colors duration-200"
                  >
                    Mark Completed
                  </button>
                )}
                <button
                  onClick={() => deleteMovie(m._id)}
                  className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 text-xl py-10">No movies to display in this filter. Add some! 🚀</p>
        )}
      </div>

      <hr className="border-gray-700 my-12" />

    </div>
  );
}

export default Watchlist;