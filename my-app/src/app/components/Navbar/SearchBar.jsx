'use client';
import React, { useState, useEffect } from "react";

const SearchBar = ({ data = [], onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [windowWidth, setWindowWidth] = useState(1200); // Remove typeof window check
  const [isClient, setIsClient] = useState(false);

  // Handle window resize for responsiveness
  useEffect(() => {
    // Mark as client-side and set initial window width
    setIsClient(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Perform search when data changes (initial load)
  useEffect(() => {
    if (!query) {
      onSearchResults(data);
    } else {
      handleSearch(query);
    }
  }, [data]); // Only depend on data, not onSearchResults

  const handleSearch = (searchQuery) => {
    // If there is no query, return all data
    if (!searchQuery) {
      onSearchResults(data);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const results = data.filter(item =>
      Object.values(item.fields || {}).some(fieldObj =>
        fieldObj.value !== null &&
        String(fieldObj.value).toLowerCase().includes(lowerQuery)
      )
    );

    onSearchResults(results);
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    handleSearch(newQuery); // Call search immediately when query changes
  };

  // Responsive breakpoints - use server-safe defaults until client hydrates
  const isSmall = isClient ? windowWidth < 768 : false; // Default to large on server
  const isMedium = isClient ? (windowWidth >= 768 && windowWidth < 1200) : false;

  return (
    <span className="mr-50">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={handleInputChange}
        onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                e.currentTarget.style.transition = 'background 0.2s';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }}
        style={{
          width: '100%',
          padding: isSmall ? '6px 12px' : isMedium ? '8px 16px' : '10px 24px',
          border: '2px solid var(--border)',
          borderRadius: '8px',
          fontSize: isSmall ? '0.8rem' : isMedium ? '0.9rem' : '1rem',
          background: 'var(--button-bg)',
          color: 'var(--primary)',
          height: 'auto', // Let padding control height
          boxSizing: 'border-box'
        }}
      />
    </span>
  );
};

export default SearchBar;