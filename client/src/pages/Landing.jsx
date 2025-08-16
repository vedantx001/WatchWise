import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

function Landing() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 text-white">
      <h1 className="text-5xl font-bold mb-4">🎬 WatchWise</h1>
      <p className="text-lg mb-6">Track your movies & series, analyze stats, and discover trends!</p>
      <div className="mb-6 w-full max-w-md">
        <SearchBar />
      </div>
      <div className="flex gap-4">
        <Link to="/login" className="bg-red-600 px-6 py-2 rounded hover:bg-red-700">Login</Link>
        <Link to="/signup" className="bg-gray-700 px-6 py-2 rounded hover:bg-gray-800">Signup</Link>
        <Link to="/trending" className="bg-yellow-400 text-black rounded px-4 py-2 hover:bg-yellow-600">Trending</Link>
      </div>
    </div>
  );
}

export default Landing;
