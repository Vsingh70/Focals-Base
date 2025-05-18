"use client";
import { login, signup } from './actions'
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [hovered, setHovered] = useState({ login: false, signup: false });
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px"
      }}>
        <form
          style={{
            background: "#fff",
            padding: "40px 32px",
            borderRadius: "32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            minWidth: "340px",
            gap: "24px"
          }}
        >
          <h2 style={{
            textAlign: "center",
            marginBottom: "8px",
            color: "#0070f3",
            fontWeight: 700,
            fontSize: "2rem",
            letterSpacing: "1px"
          }}>
            Focals Base Login
          </h2>
          <label htmlFor="email" style={{ fontWeight: 500, color: "#333" }}>Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            style={{
              border: "1.5px solid #cbd5e1",
              borderRadius: "50px",
              padding: "14px 22px",
              fontSize: "1.1rem",
              outline: "none",
              marginBottom: "8px",
              transition: "border 0.2s",
            }}
          />
          <label htmlFor="password" style={{ fontWeight: 500, color: "#333" }}>Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            style={{
              border: "1.5px solid #cbd5e1",
              borderRadius: "50px",
              padding: "14px 22px",
              fontSize: "1.1rem",
              outline: "none",
              marginBottom: "8px",
              transition: "border 0.2s",
            }}
          />
          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            <button
              type="submit"
              formAction={login}
              style={{
                flex: 1,
                padding: "14px 0",
                borderRadius: "50px",
                border: "none",
                background: hovered.login ? "#005bb5" : "#0070f3",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1.1rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "background 0.2s",
              }}
              onMouseEnter={() => setHovered(h => ({ ...h, login: true }))}
              onMouseLeave={() => setHovered(h => ({ ...h, login: false }))}
            >
              Log in
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "14px 0",
                borderRadius: "50px",
                border: "1.5px solid #0070f3",
                background: hovered.signup ? "#005bb5" : "#fff",
                color: hovered.signup ? "#fff" : "#005bb5",
                fontWeight: "bold",
                fontSize: "1.1rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={() => setHovered(h => ({ ...h, signup: true }))}
              onMouseLeave={() => setHovered(h => ({ ...h, signup: false }))}
               onClick={() => router.push("/signup")}
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}