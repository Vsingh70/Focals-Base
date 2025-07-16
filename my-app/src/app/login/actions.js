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
  redirect('/')
}

export async function signup(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  // Proceed with signup - Supabase will handle duplicate email checking
  
  // First, check if email already exists in profiles table
  const { data: emailExists, error: checkError } = await supabase
    .rpc('email_exists', { check_email: email })

  if (checkError) {
    console.log('Email check error:', checkError)
    redirect('/signup?error=database-error')
  }

  if (emailExists) {
    redirect('/signup?error=email-taken')
  }
  
  const data = {
    email: email,
    password: password,
    options: {
      emailRedirectTo: '/account'
    }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)


  if (error) {
    console.log('Signup error:', error);
    redirect('/signup?error=' + encodeURIComponent(error.message));
  }

  redirect('/signup?success=1');
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  console.log('Logging in with Google...');
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (data.url) {
    redirect(data.url);
  }

  if (error) {
    console.log('OAuth error:', error);
    redirect('/error');
  }
}