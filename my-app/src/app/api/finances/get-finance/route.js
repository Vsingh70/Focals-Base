import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return Response.json({ data: null, error: 'User not found' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .eq('user', user.id)
      .order('created_at', { ascending: false });

    
    if (error) {
      console.error('Error fetching finances:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}