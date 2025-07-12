import { createClient } from '@/utils/supabase/server';

export async function DELETE(request) {
    const id = request.nextUrl.searchParams.get('id');
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
        return Response.json({ data: null, error: 'User not found' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('links')
        .delete()
        .eq('id', id)
        .eq('user', user.id)
        .select()
        .single();

    if (error) {
        return Response.json({ data: null, error: error.message }, { status: 400 });
    }

    return Response.json({ data, error: null }, { status: 200 });
}