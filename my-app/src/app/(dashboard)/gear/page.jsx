'use client'
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GearPage() {
  const [gear, setGear] = useState([]);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [hoveredDelete, setHoveredDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    purchased: true,
    notPurchased: true,
  });
  const router = useRouter();
  const filterRef = useRef();

  useEffect(() => {
    const fetchGear = async () => {
      const res = await fetch('/api/gear/get-gear');
      const { data, error } = await res.json();
      if (error) setError(error);
      else setGear(data || []);
    };
    fetchGear();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  // Filtering logic
  const filteredGear = gear.filter(item => {
    const isPurchased = !!item.purchased;
    return (
      (isPurchased && filters.purchased) ||
      (!isPurchased && filters.notPurchased)
    );
  });

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gear item?")) return;
    const res = await fetch(`/api/gear/delete-gear?id=${id}`, { method: "DELETE" });
    const { error } = await res.json();
    if (!error) {
      setGear(g => g.filter(item => item.id !== id));
    } else {
      alert("Failed to delete gear: " + error);
    }
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

      {/* Add Gear and Filter Buttons */}
      <div
        style={{
          position: "absolute",
          top: 32,
          right: 32,
          display: "flex",
          gap: 16,
          zIndex: 20,
        }}
        ref={filterRef}
      >
        <button
          type="button"
          onClick={() => router.push("/gear/add")}
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
          onMouseOver={() => setHovered("add")}
          onMouseOut={() => setHovered(null)}
        >
          + Add Gear
        </button>
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
            minWidth: 200,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 30,
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={filters.purchased}
                onChange={() => setFilters(f => ({ ...f, purchased: !f.purchased }))}
              />
              Purchased
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={filters.notPurchased}
                onChange={() => setFilters(f => ({ ...f, notPurchased: !f.notPurchased }))}
              />
              Not Purchased
            </label>
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
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#0070f3", margin: 0 }}>Gear</h1>
      </header>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignItems: "center",
        padding: "0 40px",
      }}>
        {filteredGear && filteredGear.length > 0 ? (
          filteredGear.map((item, idx) => (
            <div
              key={item.id || idx}
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
                justifyContent: "flex-start",
                gap: 40,
                padding: "0 32px",
                border: hovered === idx ? "2px solid #005bb5" : "2px solid #0070f3",
                transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                color: "#222",
                cursor: "pointer",
                boxSizing: "border-box",
                position: "relative",
              }}
              onMouseOver={() => setHovered(idx)}
              onMouseOut={() => setHovered(null)}
            >
              <Link
                href={`/gear/${item.id}`}
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  gap: 40,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span style={{ flex: 2, fontWeight: "bold", color: "#0070f3", fontSize: "1.1rem", textAlign: "left" }}>
                  {item.name || "No Name"}
                </span>
                <span style={{ flex: 1, color: "#333", fontSize: "1rem", textAlign: "left" }}>
                  {item.price || "0.00"}
                </span>
                <span style={{
                  flex: 1,
                  color: item.purchased ? "#4eb300" : "#b91c1c",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  textAlign: "left"
                }}>
                  {item.purchased ? "Purchased" : "Not Purchased"}
                </span>
              </Link>
              <button
                onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    await handleDelete(item.id);
                }}
                style={{
                    marginLeft: 16,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: hoveredDelete === idx ? "#d1d5db" : "transparent", // darker circle
                    color: "#b91c1c",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s, color 0.2s",
                    boxShadow: hoveredDelete === idx ? "0 2px 8px rgba(185,28,28,0.15)" : "none",
                }}
                onMouseOver={() => setHoveredDelete(idx)}
                onMouseOut={() => setHoveredDelete(null)}
                title="Delete gear"
                aria-label="Delete gear"
                >
                ×
                </button>
            </div>
          ))
        ) : (
          <p>No gear found.</p>
        )}
      </div>
    </div>
  );
}