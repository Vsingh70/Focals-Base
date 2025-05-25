'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/account')
}

export async function signup(formData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
    options: {
      emailRedirectTo: 'https://focalsbase-rh86jurbu-virajs-projects-e73ae1f2.vercel.app/account'
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error && error.code === 'weak_password') {
    console.log('Weak password');
    redirect('/signup?error=weak-password')
  }

  if (error) {
    console.log(error);
    redirect('/error')
  }

  //revalidatePath('/', 'layout')
  redirect('/signup?success=1')
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  console.log('Logging in with Google...');
  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/auth/callback', // Change to your redirect URL
    },
  });

  if (data.url) {
    redirect(data.url);
  }

  if (error) {
    console.log(error);
    redirect('/error');
  }

}