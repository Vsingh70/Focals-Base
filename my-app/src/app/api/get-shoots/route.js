export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET handler for retrieving shoots data for the authenticated user
 * This endpoint fetches shoots from Supabase based on the current user's authentication
 */
export async function GET() {
  try {
    // Get the cookie store from Next.js headers
    const cookieStore = await cookies();
    
    // Retrieve the Supabase authentication token from cookies
    // This cookie name should match your Supabase project configuration
    const authCookie = cookieStore.get('sb-ytzzsjhqmtijrjzngfhv-auth-token')?.value;
    
    console.log(cookieStore.getAll())
    // Check if the authentication cookie exists
    if (!authCookie) {
      return new Response(
        JSON.stringify({ data: null, error: 'User not authenticated (no token)' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse the authentication cookie to extract session data
    let session;
    let accessToken;

    // Handle base64-encoded cookie format (common with Supabase)
    if (authCookie.startsWith('base64-')) {
      try {
        // Remove the "base64-" prefix and decode the cookie data
        const base64Data = authCookie.substring(7); // Remove "base64-" (7 characters)
        const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
        session = JSON.parse(decodedData);
        accessToken = session?.access_token;
      } catch (error) {
        // Return error if base64 decoding or JSON parsing fails
        return new Response(
          JSON.stringify({ data: null, error: 'Invalid session format' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      // Handle non-base64 cookie format (fallback)
      try {
        session = JSON.parse(authCookie);
        accessToken = session?.access_token;
      } catch (error) {
        // Return error if JSON parsing fails
        return new Response(
          JSON.stringify({ data: null, error: 'Invalid session format' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Verify that we successfully extracted an access token
    if (!accessToken) {
      return new Response(
        JSON.stringify({ data: null, error: 'User not authenticated (no token)' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with the extracted access token
    // This ensures all subsequent queries are authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Verify the user authentication by fetching user data
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Check if user retrieval was successful
    if (!user || userError) {
      return new Response(
        JSON.stringify({ 
          data: null, 
          error: userError?.message || 'Failed to retrieve user' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Query the shoots table for the authenticated user's data
    // This query respects Row Level Security (RLS) policies if enabled
    const { data, error } = await supabase
      .from('shoots')
      .select('*')
      .eq('user', user.id)
      .order('date', {ascending: false})
      .order('time', {ascending: false})
      .limit(5);

    // Handle database query errors
    if (error) {
      return new Response(
        JSON.stringify({ 
          data: null, 
          error: error.message || 'Database query failed' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    // Return successful response with shoots data
    return new Response(
      JSON.stringify({ data, error: null }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Handle any unexpected errors that occur during the request
    return new Response(
      JSON.stringify({ 
        data: null, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}