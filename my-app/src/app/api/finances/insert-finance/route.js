import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return Response.json({ data: null, error: 'User not found' }, { status: 401 });
    }
    
    const body = await request.json();
    const { fields, type } = body;

    if (!fields || !type) {
      return NextResponse.json({ error: 'Fields and type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('finances')
      .insert([{ 
        fields: fields,
        type: type,
        user: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting finance:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}