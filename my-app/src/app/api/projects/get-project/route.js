import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get user info
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!user || userError) {
            return Response.json({ data: null, error: 'User not found' }, { status: 401 });
        }

        // Select both id and fields
        const { data, error } = await supabase
            .from('projects')
            .select('id, fields')
            .eq('user', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return Response.json({ data: null, error: error.message }, { status: 500 });
        }

        // Return array of objects with id and fields
        return Response.json({ data, error: null }, { status: 200 });

    } catch (error) {
        return Response.json({ data: null, error: error.message }, { status: 500 });
    }
}