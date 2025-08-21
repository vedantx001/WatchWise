import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import "../styles/search.css";

export default function SearchBar({ onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search/${encodeURIComponent(query)}`);
      if (onClose) onClose();
    }
  };

  return (
    <form className="search-bar flex items-center gap-2" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Search movies or TV shows..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1"
      />
      <button type="submit">Search</button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-200"
          aria-label="Close search"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}
