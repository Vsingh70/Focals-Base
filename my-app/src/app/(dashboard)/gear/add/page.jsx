'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

function formatLabel(str) {
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const defaultGear = {
  name: "",
  price: "",
  purchased: false,
  links: [""],
};

export default function AddGearPage() {
  const router = useRouter();
  const [gear, setGear] = useState(defaultGear);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [backHover, setBackHover] = useState(false);

  // Handle changes for all fields except links
  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    } else if (e.target.name === "price") {
      value = value.replace(/[^0-9.]/g, "");
    }
    setGear({ ...gear, [e.target.name]: value });
  };

  // Handle changes for links array
  const handleLinkChange = (idx, value) => {
    const links = [...gear.links];
    links[idx] = value;
    setGear({ ...gear, links });
  };

  // Add a new link input
  const addLink = () => {
    setGear({ ...gear, links: [...gear.links, ""] });
  };

  // Remove a link input
  const removeLink = (idx) => {
    const links = gear.links.filter((_, i) => i !== idx);
    setGear({ ...gear, links: links.length ? links : [""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!gear.name || !gear.price) {
      setError("Name and Price are required.");
      return;
    }

    setSaving(true);

    // Prepare links: remove empty strings
    const links = (gear.links || []).map(l => l.trim()).filter(Boolean);

    // Prepare price as number
    const price = parseFloat(gear.price);

    const gearToSave = {
      ...gear,
      price,
      links,
    };

    const res = await fetch(`/api/gear/insert-gear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gearToSave),
    });
    const { data, error } = await res.json();
    setSaving(false);
    if (error) setError(error);
    else {
      router.push("/gear");
    }
  };

  return (
    <div style={{
      width: "100vw",
      minHeight: "100vh",
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 40,
    }}>
      <div style={{
        width: "90vw",
        maxWidth: 600,
        background: "#fff",
        padding: 48,
        borderRadius: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}>
        {/* Back Button with hover effect */}
        <button
          type="button"
          onClick={() => router.push("/gear")}
          style={{
            marginBottom: 32,
            background: backHover ? "#005bb5" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            alignSelf: "flex-start",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            transition: "background 0.2s",
          }}
          onMouseOver={() => setBackHover(true)}
          onMouseOut={() => setBackHover(false)}
        >
          ← Back to Gear
        </button>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {error && <div style={{ color: "red" }}>{error}</div>}
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontWeight: "bold", marginBottom: 6 }}>
              Name<span style={{ color: "red", marginLeft: 4 }}>*</span>
            </label>
            <input
              name="name"
              value={gear.name}
              onChange={handleChange}
              required
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #ccc",
                fontSize: "1.1rem",
              }}
              type="text"
            />
          </div>
          {/* Price */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontWeight: "bold", marginBottom: 6 }}>
              Price<span style={{ color: "red", marginLeft: 4 }}>*</span>
            </label>
            <input
              name="price"
              value={gear.price}
              onChange={handleChange}
              required
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #ccc",
                fontSize: "1.1rem",
              }}
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          {/* Purchased */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontWeight: "bold" }}>
              Purchased
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                name="purchased"
                checked={!!gear.purchased}
                onChange={handleChange}
                style={{ width: 40, height: 24 }}
              />
              <span>{gear.purchased ? "Yes" : "No"}</span>
            </label>
          </div>
          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontWeight: "bold", marginBottom: 6 }}>
              Links
            </label>
            {gear.links.map((link, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  value={link}
                  onChange={e => handleLinkChange(idx, e.target.value)}
                  placeholder={`Link ${idx + 1}`}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid #ccc",
                    fontSize: "1.1rem",
                  }}
                />
                {gear.links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    style={{
                      background: "#f87171",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLink}
              style={{
                marginTop: 4,
                background: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: "pointer",
                alignSelf: "flex-start"
              }}
            >
              + Add Link
            </button>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 24,
              padding: "16px 0",
              borderRadius: 10,
              background: "#0070f3",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.2rem",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
              width: 300,
              alignSelf: "center"
            }}
          >
            {saving ? "Saving..." : "Add Gear"}
          </button>
        </form>
      </div>
    </div>
  );
}