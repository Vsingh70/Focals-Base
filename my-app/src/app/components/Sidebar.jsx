'use client'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/account', label: 'Account' },
  { href: '/shoots', label: 'Shoots' },
  { href: '/gear', label: 'Gear' },
];

const ICON_HOVER_BG = "rgba(123,94,94,0.08)";

const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [iconHover, setIconHover] = useState(false);
  const [userId, setUserId] = useState(null);
  const [theme, setTheme] = useState("system");
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme')
          .eq('id', user.id)
          .single();
        if (profile?.theme) {
          setTheme(profile.theme);
        }
      }
    });
  }, []);

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    if (userId) {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('id', userId);
    }
  };

  useEffect(() => {
    let applied = theme;
    if (theme === "system") {
      applied = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${applied}`);
  }, [theme]);


  return (
    <>
      <button
        id="hamburger-btn"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setIconHover(true)}
        onMouseLeave={() => setIconHover(false)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 1000,
          background: iconHover ? ICON_HOVER_BG : "var(--card-bg)",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          color: "var(--primary)",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        {open ? (
          <span style={{
            fontSize: 32,
            color: "var(--primary)",
            lineHeight: 1,
            fontWeight: 700,
            userSelect: "none",
          }}>×</span>
        ) : (
          <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{
                width: 28,
                height: 3,
                background: "var(--primary)",
                borderRadius: 2,
                transition: "all 0.2s ease"
              }} />
            ))}
          </span>
        )}
      </button>
      
      <aside 
        id="sidebar" 
        style={{
          width: "240px",
          height: "100vh",
          background: "var(--card-bg)",
          borderRight: "1.5px solid var(--border)",
          boxShadow: open ? "0 1px 16px rgba(16,30,54,0.10)" : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "32px 0 24px 0",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
          transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
          transform: open ? "translateX(0)" : "translateX(-260px)",
          overflow: "hidden",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--primary)",
            textDecoration: "none",
            letterSpacing: "1px",
            userSelect: "none",
            transition: "color 0.15s",
            marginLeft: 70,
            marginTop: -10,
            cursor: "pointer"
          }}
        >
          Focals Base
        </Link>
        
        <div style={{ height: 60 }} />
        
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {navLinks.map(link => (
              <li key={link.href} style={{ margin: "8px 0" }}>
                <Link
                  href={link.href}
                  style={{
                    display: "block",
                    color: pathname === link.href ? "#fff" : "var(--text)",
                    background: pathname === link.href ? "var(--primary)" : "transparent",
                    fontWeight: 500,
                    fontSize: "1.08rem",
                    padding: "12px 28px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    margin: "0 16px",
                    transition: "background 0.15s, color 0.15s",
                    cursor: "pointer",
                    letterSpacing: 0.2,
                  }}
                  onMouseOver={e => {
                    if (pathname !== link.href) {
                      e.currentTarget.style.background = ICON_HOVER_BG;
                    }
                  }}
                  onMouseOut={e => {
                    if (pathname !== link.href) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div style={{
          marginTop: "auto",
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <span style={{ 
            fontSize: "0.95rem", 
            fontWeight: 500, 
            marginBottom: 4, 
            color: "var(--text)" 
          }}>
            Theme
          </span>
          <div style={{ 
            display: "flex", 
            gap: 8
          }}>
            {["light", "dark", "system"].map(themeOption => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption)}
                style={{
                  flex: 1,
                  background: theme === themeOption ? "var(--primary)" : "transparent",
                  color: theme === themeOption ? "#fff" : "var(--text)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 0",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "background 0.15s, color 0.15s",
                  minHeight: "36px",
                  textTransform: "capitalize"
                }}
              >
                {themeOption}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;