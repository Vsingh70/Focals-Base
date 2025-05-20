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
      emailRedirectTo: 'http://localhost:3000/account'
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error && error.code === 'invalid_email')  {
    console.log('Invalid email');
    redirect('/signup?error=invalid-email');
  }

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