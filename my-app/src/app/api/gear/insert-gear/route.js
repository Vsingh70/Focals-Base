import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  const id = request.nextUrl.searchParams.get('id');
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return Response.json({ data: null, error: 'User not found' }, { status: 401 });
  }

  const body = await request.json();

  const { user: _user, id: _id, ...safeBody } = body;

  const gearToInsert = {...safeBody, user: user.id };

  const { data, error } = await supabase
    .from('gear')
    .insert([gearToInsert])
    .select()
    .single();

    if (error) {
      console.log(error);
      return Response.json({ data: null, error: error.message }, { status: 400 });
    }

    return Response.json({ data, error: null }, { status: 200 });
}