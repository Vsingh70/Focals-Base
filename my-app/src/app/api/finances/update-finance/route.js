import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { fields, type } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (!fields && !type) {
      return NextResponse.json({ error: 'At least fields or type must be provided' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return Response.json({ data: null, error: 'User not found' }, { status: 401 });
    }
    
    const updateData = {};
    if (fields) updateData.fields = fields;
    if (type) updateData.type = type;
    
    const { data, error } = await supabase
      .from('finances')
      .update(updateData)
      .eq('id', id)
      .eq('user', user.id)
      .select();

    if (error) {
      console.error('Error updating finance:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return Response.json({ data: null, error: 'User not found' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching finance:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}