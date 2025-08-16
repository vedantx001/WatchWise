import { useEffect, useState } from "react";
import api from "../api";

function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [filter, setFilter] = useState("all");


  useEffect(() => {
    api.get("/movies").then((res) => setMovies(res.data));
  }, []);

  const addMovie = async (e) => {
    e.preventDefault();
    const res = await api.post("/movies", { title, genre, duration });
    setMovies([res.data, ...movies]);
    setTitle("");
    setGenre("");
    setDuration("");
  };

  const markCompleted = async (id) => {
    const res = await api.put(`/movies/${id}`, { status: "completed" });
    setMovies(movies.map((m) => (m._id === id ? res.data : m)));
  };

  const filteredMovies = movies.filter((m) =>
    filter === "all" ? true : m.status === filter
  );

  const rateMovie = async (id, newRating) => {
    const res = await api.put(`/movies/${id}`, { rating: newRating });
    setMovies(movies.map((m) => (m._id === id ? res.data : m)));
  };

  const deleteMovie = async (id) => {
    await api.delete(`/movies/${id}`);
    setMovies(movies.filter((m) => m._id !== id));
  };

  const toggleFavorite = async (id) => {
    const res = await api.put(`/movies/${id}/favorite`);
    setMovies(movies.map((m) => (m._id === id ? res.data : m)));
    console.log("clicked");
  };

  const trendingMovies = [...movies]
  .filter((m) => m.rating >= 8)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 5);

  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl mb-4">🎬 Your Watchlist</h2>
      {/* Form to Add movie*/}
      <form onSubmit={addMovie} className="flex gap-2 mb-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="p-2 text-red" />
        <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre" className="p-2 text-red" />
        <input value={duration} type="number" onChange={(e) => setDuration(e.target.value)} placeholder="Duration(min)" className="p-2 text-red w-32" />
        <button className="bg-red-600 px-4 py-2 rounded">Add</button>
      </form>

      {/* Filter Buttons*/}
      <div className="flex gap-4 mb-4">
        {["all", "planned", "watching", "completed"].map((f) => (
        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded ${filter === f ? "bg-red-600" : "bg-gray-700"}`}>
          {f}
        </button>
        ))}
      </div>

      {/* Movie List*/}
      <ul>
        {filteredMovies.map((m) => (
          <li key={m._id} className="border-b py-2 flex justify-between items-center">
            <div>
              <div className="h-32 bg-gray-700 flex items-center justify-center text-xl">🎬</div>
              <h3 className="font-bold mt-2">
                <button onClick={() => toggleFavorite(m._id)} className={`${m.favorite ? "text-yellow-400" : "text-white-400"} cursor-pointer`}>
                  ⭐
                </button>
                {m.title}
              </h3>
              <p className="text-sm text-gray-400">{m.genre || "Unknown"} • {m.duration} min</p>
              <p className="text-xs text-gray-500">Status: {m.status}</p>
    
              {/* Rating Input */}
              <div className="mt-1">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={m.rating}
                  onChange={(e) => rateMovie(m._id, e.target.value)}
                  className="w-16 text-center rounded text-red"
                />{" "}
              <span className="text-sm text-gray-400">/10</span>
              </div>
            </div>

            <div className="flex gap-2">
              {m.status !== "completed" && (
                <button
                  onClick={() => markCompleted(m._id)}
                  className="text-green-400 hover:text-green-600 text-sm"
                >
                  Mark Completed
                </button>
              )}
              <button
                onClick={() => deleteMovie(m._id)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <h3 className="text-xl mb-4">🔥 Trending Movies (Your Top 5)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {trendingMovies.map((m) => (
            <div key={m._id} className="bg-gray-800 p-3 rounded">
              <h4 className="font-bold">{m.title}</h4>
              <p>⭐ {m.rating}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Watchlist;
