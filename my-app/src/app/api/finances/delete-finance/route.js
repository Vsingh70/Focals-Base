import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return Response.json({ data: null, error: 'User not found' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('finances')
      .delete()
      .eq('id', id)
      .eq('user', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting finance:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}