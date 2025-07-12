"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
      {/* Header: show Focals Base if not logged in, show email if logged in */}
      <header
        style={{
          width: "100%",
          padding: "24px 40px 16px 40px",
          background: "var(--card-bg)",
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
        {!user ? (
          <h1 style={{
            margin: 0,
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--primary)",
            letterSpacing: "1px"
          }}>
            Focals Base
          </h1>
        ) : (
          <div />
        )}
        {user && (
          <div style={{ fontWeight: 500, color: "var(--text)", fontSize: "1.1rem" }}>
            {user.email}
          </div>
        )}
      </header>

      {/* Sidebar only for logged-in users */}
      {user && <Sidebar />}

      {/* Main content */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          paddingTop: "120px",
          marginLeft: user ? "240px" : "0", // match sidebar width
          transition: "margin-left 0.2s",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: 16,
            boxShadow: "0 2px 12px rgba(16,30,54,0.06)",
            padding: "48px 36px",
            minWidth: 340,
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: user ? 0 : 48,
          }}
        >
          {!user ? (
            <>
              <p style={{ fontSize: "1.2rem", marginBottom: "32px", color: "var(--text)" }}>
                Please log in to continue.
              </p>
              <button
                style={{
                  padding: "16px 48px",
                  borderRadius: "30px",
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  transition: "background 0.2s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#5e4747")}
                onMouseOut={e => (e.currentTarget.style.background = "var(--primary)")}
                onClick={handleLogin}
              >
                Login
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "1.2rem", marginBottom: "32px", color: "var(--text)" }}>
                Welcome back!
              </p>
              <button
                style={{
                  padding: "16px 48px",
                  borderRadius: "30px",
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  transition: "background 0.2s",
                  marginTop: "10px",
                  marginBottom: "10px",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#5e4747")}
                onMouseOut={e => (e.currentTarget.style.background = "var(--primary)")}
                onClick={handleAccountAccess}
              >
                Account
              </button>
              <button
                style={{
                  padding: "16px 48px",
                  borderRadius: "30px",
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  transition: "background 0.2s",
                  marginTop: "10px",
                  marginBottom: "10px",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#5e4747")}
                onMouseOut={e => (e.currentTarget.style.background = "var(--primary)")}
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}