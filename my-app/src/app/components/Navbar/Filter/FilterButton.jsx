'use client';
import { useState, useEffect } from "react";
import FilterCard from "./FilterCard";

const FilterButton = ({ data = [], onFilteredDataChange, buttonText = "", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [booleanFields, setBooleanFields] = useState([]);
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState(data);
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

  // Extract boolean fields from the API data (from the first item's fields)
  useEffect(() => {
    if (data.length > 0) {
      const sampleItem = data[0];
      const boolFields = Object.entries(sampleItem.fields || {})
        .filter(([_, fieldObj]) => fieldObj.type === "boolean" && fieldObj.visible)
        .map(([fieldName]) => fieldName);
      setBooleanFields(boolFields);

      // initialize filters with "both" meaning no filtering
      const initialFilters = {};
      boolFields.forEach(field => {
        initialFilters[field] = "both";
      });
      setFilters(initialFilters);
    }
  }, [data]);

  // Update filtered data when filters change
  useEffect(() => {
    let filtered = data;
    Object.keys(filters).forEach(field => {
      const filterValue = filters[field];
      if (filterValue !== "both") {
        const required = filterValue === "true";
        filtered = filtered.filter(item =>
          item.fields &&
          item.fields[field] &&
          item.fields[field].type === "boolean" &&
          item.fields[field].visible === true &&
          item.fields[field].value === required
        );
      }
    });
    setFilteredData(filtered);
    if (onFilteredDataChange) onFilteredDataChange(filtered);
  }, [filters, data, onFilteredDataChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.filter-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Responsive breakpoints - use server-safe defaults until client hydrates
  const isSmall = isClient ? windowWidth < 768 : false; // Default to large on server
  const isMedium = isClient ? (windowWidth >= 768 && windowWidth < 1200) : false;

  const buttonStyle = {
    padding: isSmall ? '6px 12px' : isMedium ? '8px 16px' : '10px 24px',
    background: 'var(--button-bg)',
    color: 'var(--primary)',
    border: '2px solid var(--border)',
    borderRadius: '8px',
    fontWeight: 'semi-bold',
    fontSize: isSmall ? '0.8rem' : isMedium ? '0.9rem' : '1rem',
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap'
  };

  // Shortened text for small screens
  const displayText = isSmall ? 'Filter' : `Filter ${buttonText}`;

  return (
    <div className={`filter-container ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...buttonStyle,
          background: isOpen ? 'var(--button-bg-hover)' : 'var(--button-bg)',
        }}
        onMouseOver={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
        }}
        onMouseOut={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--button-bg)';
        }}
      >
        {displayText}
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: isSmall ? '0.6rem' : '0.8rem',
          marginLeft: '6px'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <FilterCard
          booleanFields={booleanFields}
          filters={filters}
          setFilters={setFilters}
        />
      )}
    </div>
  );
};

export default FilterButton;