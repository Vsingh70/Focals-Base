import { createClient } from '@/utils/supabase/server';

export async function POST() {
    try {
        const supabase = await createClient();

        // Insert a new row with all default values
        const { data, error } = await supabase
            .from('forms')
            .insert([{}])
            .select()
            .single();

        if (error) {
            return Response.json({ data: null, error: error.message }, { status: 400 });
        }

        return Response.json({ data, error: null }, { status: 201 });
    } catch (error) {
        return Response.json({ data: null, error: error.message }, { status: 500 });
    }
}