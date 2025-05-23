import { createClient } from '@/utils/supabase/server';

export async function GET(request) {
  const id = request.nextUrl.searchParams.get('id');
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return Response.json({ data: null, error: 'User not found' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('shoots')
    .select('*')
    .eq('id', id)
    .eq('user', user.id)
    .single();

  if (error) {
    return Response.json({ data: null, error: error.message }, { status: 404 });
  }

  return Response.json({ data, error: null }, { status: 200 });
}

export async function PATCH(request) {
  const id = request.nextUrl.searchParams.get('id');
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return Response.json({ data: null, error: 'User not found' }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('shoots')
    .update(body)
    .eq('id', id)
    .eq('user', user.id)
    .select();

  if (error) {
    return Response.json({ data: null, error: error.message }, { status: 400 });
  }

  if (!data || data.length === 0) {
    return Response.json({ data: null, error: 'Shoot not found or not updated.' }, { status: 404 });
  }

  if (data.length > 1) {
    return Response.json({ data: null, error: 'Multiple shoots updated, which should not happen.' }, { status: 500 });
  }

  return Response.json({ data: data[0], error: null }, { status: 200 });
}