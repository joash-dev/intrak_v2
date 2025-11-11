import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

const DebouncedSearch: React.FC<DebouncedSearchProps> = ({
  onSearch,
  placeholder = "Search...",
  delay = 300,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        setIsSearching(true);
        timeoutId = setTimeout(() => {
          onSearch(searchQuery);
          setIsSearching(false);
        }, delay);
      };
    })(),
    [onSearch, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          className={`h-4 w-4 text-gray-400 ${
            isSearching ? "animate-pulse" : ""
          }`}
        />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  );
};

export default DebouncedSearch;
