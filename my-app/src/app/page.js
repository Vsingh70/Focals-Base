"use client";
import { useState } from "react";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const handleLogin = () => setLoggedIn(true);
  const handleLogout = () => setLoggedIn(false);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Photography Managing App</h1>
      {loggedIn ? (
        <>
          <p>Welcome! You are logged in.</p>
          <button
            style={{
              padding: "12px 32px",
              borderRadius: "25px",
              border: "none",
              background: "#0070f3",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#005bb5")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#0070f3")}
            onClick={handleLogout}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <p>Please log in to continue.</p>
          <button
            style={{
              padding: "12px 32px",
              borderRadius: "25px",
              border: "none",
              background: "#0070f3",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#005bb5")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#0070f3")}
            onClick={handleLogin}
          >
            Login
          </button>
        </>
      )}
    </div>
  );
}