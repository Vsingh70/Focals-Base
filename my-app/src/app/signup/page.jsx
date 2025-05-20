"use client";
import { signup } from '../login/actions';
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ...existing code...
export default function SignupPage() {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showPopup = searchParams.get("success") === "1";
  const error = searchParams.get("error");

  let errorMessage = null;
  if (error === "weak-password") {
    errorMessage = "Password is too weak. Please use a stronger password.";
  } else if (error === "invalid-email") {
    errorMessage = "Email is invalid. Please enter a valid email address.";
  }

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
          action={signup}
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
            Focals Base Sign Up
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
          {showPopup && (
            <div style={{
              color: "#0070f3",
              background: "#e0e7ff",
              borderRadius: "12px",
              padding: "12px",
              marginBottom: "8px",
              textAlign: "center",
              fontWeight: 500,
              fontSize: "1rem"
            }}>
              Please check your email to confirm email
            </div>
          )}
          {errorMessage && (
            <div style={{
              color: "#b91c1c",
              background: "#fee2e2",
              borderRadius: "12px",
              padding: "12px",
              marginBottom: "8px",
              textAlign: "center",
              fontWeight: 500,
              fontSize: "1rem"
            }}>
              {errorMessage}
            </div>
          )}
          <button
            type="submit"
            style={{
              padding: "14px 0",
              borderRadius: "50px",
              border: "none",
              background: hovered ? "#005bb5" : "#0070f3",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "background 0.2s",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            Sign up
          </button>
          <button
            type="button"
            style={{
              padding: "14px 0",
              borderRadius: "50px",
              border: "1.5px solid #0070f3",
              background: "#fff",
              color: "#005bb5",
              fontWeight: "bold",
              fontSize: "1.1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "background 0.2s, color 0.2s",
            }}
            onClick={() => router.push("/login")}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
// ...existing code...
