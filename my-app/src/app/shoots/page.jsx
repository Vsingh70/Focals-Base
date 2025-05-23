'use client'
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ShootsPage() {
  const [shoots, setShoots] = useState([]);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    edited: true,
    notEdited: true,
    paid: true,
    notPaid: true,
    categories: [],
  });
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryDropdown, setCategoryDropdown] = useState(false);
  const router = useRouter();
  const filterRef = useRef();

  // Get all unique categories from shoots
  const allCategories = Array.from(
    new Set(shoots.map(s => s.genre).filter(Boolean))
  );

  // Filtered categories for autocomplete
  const filteredCategories = allCategories.filter(
    c =>
      c &&
      c.toLowerCase().includes(categoryInput.toLowerCase()) &&
      !filters.categories.includes(c)
  );

  useEffect(() => {
    const fetchShoots = async () => {
      const res = await fetch('/api/shoots/get-shoots');
      const { data, error } = await res.json();
      if (error) setError(error);
      else setShoots(data || []);
    };
    fetchShoots();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
        setCategoryDropdown(false);
      }
    }
    if (showFilters || categoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters, categoryDropdown]);

  // Filtering logic
  const filteredShoots = shoots.filter(shoot => {
    const isEdited = !!shoot.edited_and_returned;
    const isPaid = !!shoot.paid;
    const matchesCategory =
      filters.categories.length === 0 ||
      (shoot.genre && filters.categories.includes(shoot.genre));
    return (
      ((isEdited && filters.edited) || (!isEdited && filters.notEdited)) &&
      ((isPaid && filters.paid) || (!isPaid && filters.notPaid)) &&
      matchesCategory
    );
  });

  // Add category to filter
  const addCategory = (cat) => {
    setFilters(f => ({
      ...f,
      categories: [...f.categories, cat]
    }));
    setCategoryInput("");
    setCategoryDropdown(false);
  };

  // Remove category from filter
  const removeCategory = (cat) => {
    setFilters(f => ({
      ...f,
      categories: f.categories.filter(c => c !== cat)
    }));
  };

  return (
    <div style={{ padding: "40px 0", minHeight: "100vh", background: "#f8fafc", position: "relative" }}>
      {/* Back to Home button */}
      <button
        type="button"
        onClick={() => router.push("/")}
        style={{
          position: "absolute",
          top: 32,
          left: 32,
          background: hovered === "home" ? "#005bb5" : "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontWeight: "bold",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          transition: "background 0.2s",
          zIndex: 10,
        }}
        onMouseOver={() => setHovered("home")}
        onMouseOut={() => setHovered(null)}
      >
        ← Back to Home
      </button>

      {/* Filter Dropdown Button */}
      <div style={{
        position: "absolute",
        top: 32,
        right: 32,
        zIndex: 20,
      }} ref={filterRef}>
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          style={{
            background: "#fff",
            color: "#0070f3",
            border: "2px solid #0070f3",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          Filters &#x25BC;
        </button>
        {showFilters && (
          <div style={{
            position: "absolute",
            top: "110%",
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            padding: "20px 24px",
            minWidth: 240,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 30,
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={filters.edited}
                onChange={() => setFilters(f => ({ ...f, edited: !f.edited }))}
              />
              Edited
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={filters.notEdited}
                onChange={() => setFilters(f => ({ ...f, notEdited: !f.notEdited }))}
              />
              Not Edited
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={filters.paid}
                onChange={() => setFilters(f => ({ ...f, paid: !f.paid }))}
              />
              Paid
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={filters.notPaid}
                onChange={() => setFilters(f => ({ ...f, notPaid: !f.notPaid }))}
              />
              Not Paid
            </label>
            {/* Category Filter */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>Category</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {filters.categories.map(cat => (
                  <span key={cat} style={{
                    background: "#e6f0fa",
                    color: "#0070f3",
                    borderRadius: 12,
                    padding: "2px 10px",
                    fontSize: "0.95em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0070f3",
                        fontWeight: "bold",
                        cursor: "pointer",
                        marginLeft: 2,
                        fontSize: "1em",
                        lineHeight: 1,
                      }}
                      aria-label={`Remove ${cat}`}
                    >×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add category"
                value={categoryInput}
                onChange={e => {
                  setCategoryInput(e.target.value);
                  setCategoryDropdown(true);
                }}
                onFocus={() => setCategoryDropdown(true)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  fontSize: "1em",
                  marginBottom: 0,
                }}
              />
              {categoryDropdown && filteredCategories.length > 0 && (
                <div style={{
                  position: "absolute",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  marginTop: 2,
                  zIndex: 40,
                  width: "calc(100% - 2px)",
                  maxHeight: 120,
                  overflowY: "auto",
                }}>
                  {filteredCategories.map(cat => (
                    <div
                      key={cat}
                      onClick={() => addCategory(cat)}
                      style={{
                        padding: "6px 10px",
                        cursor: "pointer",
                        color: "#0070f3",
                        background: "#fff",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: "1em",
                      }}
                      onMouseDown={e => e.preventDefault()}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Centered header */}
      <header style={{
        marginBottom: "32px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#0070f3", margin: 0 }}>Shoots</h1>
      </header>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignItems: "center",
        padding: "0 40px",
      }}>
        {filteredShoots && filteredShoots.length > 0 ? (
          filteredShoots.map((shoot, idx) => (
            <Link
              key={shoot.id || idx}
              href={`/shoots/${shoot.id}`}
              style={{
                width: "100%",
                minHeight: "64px",
                borderRadius: "24px",
                background: hovered === idx ? "#e6f0fa" : "#fff",
                boxShadow: hovered === idx
                  ? "0 4px 16px rgba(0,112,243,0.15)"
                  : "0 2px 12px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 32px",
                textDecoration: "none",
                border: hovered === idx ? "2px solid #005bb5" : "2px solid #0070f3",
                transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                color: "#222",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
              onMouseOver={() => setHovered(idx)}
              onMouseOut={() => setHovered(null)}
            >
              <span style={{ fontWeight: "bold", color: "#0070f3", fontSize: "1.1rem" }}>
                {shoot.client || "No Client"}
              </span>
              <span style={{ color: "#333", fontSize: "1rem" }}>
                {shoot.date
                  ? new Date(shoot.date).toLocaleDateString() +
                    " " +
                    new Date(shoot.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "No Date"}
              </span>
              <span style={{ color: "#555", fontSize: "1rem" }}>
                {shoot.genre || "No Genre"}
              </span>
              <span style={{
                color: shoot.edited_and_returned ? "#4eb300" : "#b91c1c",
                fontWeight: "bold",
                fontSize: "1rem",
                marginLeft: 16,
                minWidth: 90,
                textAlign: "center"
              }}>
                {shoot.edited_and_returned ? "Edited" : "Not Edited"}
              </span>
            </Link>
          ))
        ) : (
          <p>No shoots found.</p>
        )}
      </div>
    </div>
  );
}