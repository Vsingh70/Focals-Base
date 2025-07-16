
import { createClient } from '@/utils/supabase/server'
import AccountSettings from './AccountSettings'
import ThemeToggle from '../components/Themes/ThemeToggle'

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  

  return (
    <div>
      <AccountSettings user={user} />
    </div>

  );
}