'use client'
import styles from './account.module.css'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from "next/navigation";
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

      const {data1, error2} = await supabase
        .from('shoots')
        .select('*')
        .eq('user', user?.id)
        .order('date', {ascending: false})
        .order('time', {ascending: false})
        .limit(5);
      console.log(user?.id)
      console.log(data1)
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        console.log(data.id)
        setFullname(data.full_name)
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert('Error loading user data!')
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
    <div>
      <header className={styles.accountHeader}>
        {<h1 >Hello {fullname}</h1>}
        
        <form action="/auth/signout" method="post" className={styles.signoutform}>
          <button className={styles.signoutbutton} type="submit">
            Sign out
          </button>
        </form>
      </header>
      <div>

        <div className="form-widget">
          <div className={styles.accountElement}>
            <label htmlFor="email">Email</label>
            <input id="email" type="text" value={user?.email} disabled />
          </div>
          <div className={styles.accountElement}>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullname || ''}
              onChange={(e) => setFullname(e.target.value)}
              />
          </div>
          <div className={styles.accountElement}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username || ''}
              onChange={(e) => setUsername(e.target.value)}
              />
          </div>
          <div className={styles.accountElement}>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              value={website || ''}
              onChange={(e) => setWebsite(e.target.value)}
              />
          </div>

          <div>
            <button
              className={styles.updatebutton}
              onClick={() => updateProfile({ fullname, username, website, avatar_url })}
              disabled={loading}
              >
              {loading ? 'Loading ...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
      <button onClick={() => router.push("/account/shoots")}>Shoots</button>
    </div>
  )
}