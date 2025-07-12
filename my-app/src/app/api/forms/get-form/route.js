import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get user info
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!user || userError) {
            return Response.json({ data: null, error: 'User not found' }, { status: 401 });
        }

        // Select all forms for this user
        const { data, error } = await supabase
            .from('forms')
            .select('id,fields')
            .eq('user', user.id);

        if (error) {
            return Response.json({ data: null, error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            // No form found for this user
            return Response.json({ data: null, error: 'Form not found', notFound: true }, { status: 200 });
        }

        // If multiple forms exist, return the first one (or handle as needed)
        return Response.json({ data: data[0], error: null }, { status: 200 });

    } catch (error) {
        return Response.json({ data: null, error: error.message }, { status: 500 });
    }
}