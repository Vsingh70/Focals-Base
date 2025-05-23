import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      return Response.json({ data: null, error: 'User not found' }, { status: 401 });
    }

    // Query shoots for this user (RLS should enforce security)
    const { data, error } = await supabase
      .from('shoots')
      .select('*')
      .eq('user', user.id)
      .order('date', { ascending: true })

    if (error) {
      return Response.json({ data: null, error: error.message }, { status: 500 });
    }

    return Response.json({ data, error: null }, { status: 200 });
  } catch (error) {
    return Response.json({ data: null, error: error.message }, { status: 500 });
  }
}