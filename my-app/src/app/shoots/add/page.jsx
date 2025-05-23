'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

function toDatetimeLocal(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatLabel(str) {
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseContactInfoArray(info) {
  if (!info) return ["", "", ""];
  if (typeof info === "string") {
    try {
      const arr = JSON.parse(info);
      return Array.isArray(arr) ? arr.map(v => v ?? "") : ["", "", ""];
    } catch {
      return ["", "", ""];
    }
  }
  return Array.isArray(info) ? info.map(v => v ?? "") : ["", "", ""];
}

// Default shoot fields for a new shoot
const defaultShoot = {
  date: "",
  client: "",
  genre: "",
  location: "",
  contact_info: ["", "", ""],
  edit_link: "",
  client_mood_board_link: "",
  notes: "",
  pay: "",
  expenses: "",
  paid: false,
  edited_and_returned: false,
  // Add any other fields your table expects, with sensible defaults
};

export default function ShootDetailPage() {
  const router = useRouter();
  const [shoot, setShoot] = useState(defaultShoot);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [backHover, setBackHover] = useState(false);

  // Always keep contact info as an array for the UI
  const contactInfoArr = parseContactInfoArray(shoot.contact_info);

  // Handle changes for contact_info fields (email, phone, social)
  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    const idx = { email: 0, phone: 1, social: 2 }[name];
    const arr = [...contactInfoArr];
    arr[idx] = value;
    setShoot({
      ...shoot,
      contact_info: arr,
    });
  };

  // Handle changes for all other fields
  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    } else if (e.target.name === "date") {
      value = new Date(value).toISOString();
    }
    setShoot({ ...shoot, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!shoot.date || !shoot.client || !shoot.genre) {
      setError("Date, Client, and Genre are required.");
      return;
    }

    setSaving(true);

    // Convert empty strings to null for contact_info array
    const contactArr = (Array.isArray(shoot.contact_info) ? shoot.contact_info : parseContactInfoArray(shoot.contact_info))
      .map(v => v === "" ? null : v);

    // Convert empty strings to null for numeric fields
    const numericFields = ["pay", "expenses"];
    const shootToSave = { ...shoot, contact_info: contactArr };
    numericFields.forEach(field => {
      if (shootToSave[field] === "") shootToSave[field] = null;
      else if (shootToSave[field] != null) shootToSave[field] = parseFloat(shootToSave[field]);
    });

    const res = await fetch(`/api/shoots/insert-shoots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shootToSave),
    });
    const { data, error } = await res.json();
    setSaving(false);
    if (error) setError(error);
    else {
      router.push("/shoots");
    }
  };

  // --- FIELD SPLITTING LOGIC ---
  const leftFieldOrder = ["date", "client", "genre", "location"];
  const excludedFields = ["id", "created_at", "user", "contact_info"];
  const allFields = Object.entries(shoot).filter(
    ([key]) => !excludedFields.includes(key)
  );

  // Left fields: in specified order, only if present
  const leftFields = leftFieldOrder
    .map(field => allFields.find(([key]) => key === field))
    .filter(Boolean);

  // Right fields: all others not in leftFieldOrder
  const rightFields = allFields.filter(
    ([key]) => !leftFieldOrder.includes(key)
  );

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
        maxWidth: 1200,
        background: "#fff",
        padding: 48,
        borderRadius: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}>
        {/* Back Button with hover effect */}
        <button
          type="button"
          onClick={() => router.push("/shoots")}
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
          ← Back to Shoots
        </button>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {error && <div style={{ color: "red" }}>{error}</div>}
          <div style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {/* Left column */}
            <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 24 }}>
              {leftFields.map(([key, value]) => {
                if (key === "date") {
                  return (
                    <div key={key} style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ fontWeight: "bold", marginBottom: 6 }}>
                        {formatLabel(key)}<span style={{ color: "red", marginLeft: 4 }}>*</span>
                      </label>
                      <input
                        name={key}
                        value={toDatetimeLocal(value)}
                        onChange={handleChange}
                        required
                        style={{
                            padding: "12px 16px",
                            borderRadius: 10,
                            border: "1px solid #ccc",
                            fontSize: "1.1rem",
                        }}
                        type="datetime-local"
                      />
                    </div>
                  );
                }
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ fontWeight: "bold", marginBottom: 6 }}>
                      {formatLabel(key)}
                      {(key === "client" || key === "genre") && (
                        <span style={{ color: "red", marginLeft: 4 }}>*</span>
                      )}
                    </label>
                    <input
                      name={key}
                      value={value ?? ""}
                      onChange={handleChange}
                      required={key === "client" || key === "genre"}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid #ccc",
                        fontSize: "1.1rem",
                      }}
                      type="text"
                    />
                  </div>
                );
              })}
              {/* Contact Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 8 }}>
                <label style={{ fontWeight: "bold", marginBottom: 6 }}>Contact Info</label>
                <input
                  name="email"
                  placeholder="Email"
                  value={contactInfoArr[0]}
                  onChange={handleContactInfoChange}
                  style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ccc", fontSize: "1.1rem" }}
                  type="email"
                />
                <input
                  name="phone"
                  placeholder="Phone Number"
                  value={contactInfoArr[1]}
                  onChange={handleContactInfoChange}
                  style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ccc", fontSize: "1.1rem" }}
                  type="tel"
                />
                <input
                  name="social"
                  placeholder="Social Media Handle"
                  value={contactInfoArr[2]}
                  onChange={handleContactInfoChange}
                  style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ccc", fontSize: "1.1rem" }}
                  type="text"
                />
              </div>
            </div>
            {/* Right column */}
            <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 24 }}>
              {rightFields.map(([key, value]) => {
                if (key === "edited_and_returned" || key === "paid") {
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <label style={{ fontWeight: "bold" }}>
                        {formatLabel(key)}
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          name={key}
                          checked={!!value}
                          onChange={handleChange}
                          style={{ width: 40, height: 24 }}
                        />
                        <span>{value ? "Yes" : "No"}</span>
                      </label>
                    </div>
                  );
                }
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ fontWeight: "bold", marginBottom: 6 }}>
                      {formatLabel(key)}
                    </label>
                    <input
                      name={key}
                      value={value ?? ""}
                      onChange={handleChange}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid #ccc",
                        fontSize: "1.1rem",
                      }}
                      type="text"
                    />
                  </div>
                );
              })}
            </div>
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
            {saving ? "Saving..." : "Add Shoot"}
          </button>
        </form>
      </div>
    </div>
  );
}