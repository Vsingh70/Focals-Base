"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "./components/Sidebar"; // Add this import if you want to use the Sidebar

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    // Check auth state on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleAccountAccess = async () => {
    router.push("/account");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", position: "relative" }}>
      {/* Top bar with title and username */}
      <header
        style={{
          width: "100%",
          padding: "24px 40px 16px 40px",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 10,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "#0070f3", letterSpacing: "1px" }}>
          Foscal Base
        </h1>
        {user && (
          <div style={{ fontWeight: 500, color: "#333", fontSize: "1.1rem" }}>
            {user.email}
          </div>
        )}
      </header>

      {/* Sidebar only for logged-in users */}
      {user && (
        <Sidebar />
      )}

      {/* Main content */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          paddingTop: "120px",
          marginLeft: user ? "200px" : "0", // shift content if sidebar is present
          transition: "margin-left 0.2s",
        }}
      >
        {!user ? (
          <>
            <p style={{ fontSize: "1.2rem", marginBottom: "32px", color: "#444" }}>
              Please log in to continue.
            </p>
            <button
              style={{
                padding: "16px 48px",
                borderRadius: "30px",
                border: "none",
                background: "#0070f3",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1.2rem",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                transition: "background 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#005bb5")}
              onMouseOut={e => (e.currentTarget.style.background = "#0070f3")}
              onClick={handleLogin}
            >
              Login
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: "1.2rem", marginBottom: "32px", color: "#444" }}>
              Welcome back!
            </p>
            <button
              style={{
                padding: "16px 48px",
                borderRadius: "30px",
                border: "none",
                background: "#0070f3",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1.2rem",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                transition: "background 0.2s",
                marginTop: "10px",
                marginBottom: "10px",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#005bb5")}
              onMouseOut={e => (e.currentTarget.style.background = "#0070f3")}
              onClick={handleAccountAccess}
            >
              Account
            </button>
            <button
              style={{
                padding: "16px 48px",
                borderRadius: "30px",
                border: "none",
                background: "#0070f3",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1.2rem",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                transition: "background 0.2s",
                marginTop: "10px",
                marginBottom: "10px",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#005bb5")}
              onMouseOut={e => (e.currentTarget.style.background = "#0070f3")}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </main>
    </div>
  );
}