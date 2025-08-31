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
    <form className="search-bar" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Search movies or TV shows..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}
