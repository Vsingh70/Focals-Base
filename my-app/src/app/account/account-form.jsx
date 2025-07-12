'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect, useRouter } from "next/navigation";

export default function AccountForm({ user }) {
  const router = useRouter();
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [fullname, setFullname] = useState(null)
  const [username, setUsername] = useState(null)
  const [website, setWebsite] = useState(null)
  const [avatar_url, setAvatarUrl] = useState(null)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`id, full_name, username, website, avatar_url`)
        .eq('id', user?.id)
        .single()
      if (error && status !== 406) throw error
      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert('Error loading user data!')
      redirect('/login')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile({ username, website, avatar_url }) {
    try {
      setLoading(true)
      const { error } = await supabase.from('profiles').upsert({
        id: user?.id,
        full_name: fullname,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      alert('Profile updated!')
    } catch (error) {
      alert('Error updating the data!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 72,
        fontFamily: "var(--font-geist-sans), sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--card-bg)",
          padding: "40px 32px",
          borderRadius: 16,
          border: "1.5px solid var(--border)",
          boxShadow: "0 1px 4px rgba(16,30,54,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch"
        }}
      >
        <header style={{
          width: "100%",
          marginBottom: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start"
        }}>
          <form action="/auth/signout" method="post" style={{ alignSelf: "flex-end" }}>
            <button
              type="submit"
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 18px",
                fontWeight: 500,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "none",
                transition: "background 0.2s",
                marginTop: 8
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#7b5e5e")}
              onMouseOut={e => (e.currentTarget.style.background = "var(--primary)")}
            >
              Sign out
            </button>
          </form>
        </header>
        <form
          className="form-widget"
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
          onSubmit={e => {
            e.preventDefault();
            updateProfile({ fullname, username, website, avatar_url });
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="email" style={{ fontWeight: 500, marginBottom: 4, color: "var(--text)" }}>Email</label>
            <input
              id="email"
              type="text"
              value={user?.email}
              disabled
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: "1.05rem",
                background: "var(--bg)",
                color: "#888",
                outline: "none"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="fullName" style={{ fontWeight: 500, marginBottom: 4, color: "var(--text)" }}>Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullname || ''}
              onChange={(e) => setFullname(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: "1.05rem",
                outline: "none",
                transition: "border 0.2s"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="username" style={{ fontWeight: 500, marginBottom: 4, color: "var(--text)" }}>Username</label>
            <input
              id="username"
              type="text"
              value={username || ''}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: "1.05rem",
                outline: "none",
                transition: "border 0.2s"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="website" style={{ fontWeight: 500, marginBottom: 4, color: "var(--text)" }}>Website</label>
            <input
              id="website"
              type="url"
              value={website || ''}
              onChange={(e) => setWebsite(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: "1.05rem",
                outline: "none",
                transition: "border 0.2s"
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 18,
              padding: "13px 0",
              borderRadius: 8,
              background: "var(--primary)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1.1rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              width: "100%",
              boxShadow: "none"
            }}
            onMouseOver={e => (e.currentTarget.style.background = "#7b5e5e")}
            onMouseOut={e => (e.currentTarget.style.background = "var(--primary)")}
          >
            {loading ? 'Loading ...' : 'Update'}
          </button>
        </form>
      </div>
    </div>
  )
}