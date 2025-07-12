import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
    try {
        const supabase = await createClient();

        // Parse the JSON body
        const body = await request.json();
        // Expecting: { fields: { ...your fields object... } }
        const { fields } = body;

        if (!fields) {
            return Response.json({ data: null, error: "Missing fields data" }, { status: 400 });
        }

        // Insert the row with the fields JSONB
        const { data, error } = await supabase
            .from('links')
            .insert([{ fields }])
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