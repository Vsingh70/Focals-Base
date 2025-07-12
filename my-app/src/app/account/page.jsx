import AccountForm from './account-form'
import { createClient } from '@/utils/supabase/server'
import ThemeToggle from '../components/Themes/ThemeToggle'

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div>
      <ThemeToggle />
      <AccountForm user={user} />
    </div>

  );
}