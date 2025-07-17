import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow access to public routes without authentication
  const publicRoutes = [
    '/login',
    '/signup', 
    '/forgot-password',
    '/auth/callback',
    '/auth/confirm',
    '/auth/auth-code-error',
    '/error',
    '/_next', // Next.js assets
    '/favicon.ico',
    '/api/auth' // Auth-related API routes
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  // If it's a public route, just update the session and continue
  if (isPublicRoute) {
    return await updateSession(request)
  }

  // For protected routes, check authentication
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get the user session
  const { data: { user }, error } = await supabase.auth.getUser()

  // If no user is found, redirect to login
  if (!user || error) {
    const loginUrl = new URL('/login', request.url)
    // Optionally add a redirect parameter to return after login
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated, continue with the request
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}