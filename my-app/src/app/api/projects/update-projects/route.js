import { createClient } from '@/utils/supabase/server';

export async function PATCH(request) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return Response.json({ data: null, error: 'User not found' }, { status: 401 });
  }

  // Expecting { key: "y", visible: true/false }
  const { key, visible } = await request.json();
  if (!key || typeof visible !== "boolean") {
    return Response.json({ data: null, error: 'Missing key or visible value' }, { status: 400 });
  }

  // Fetch all projects for this user
  const { data: projects, error: fetchError } = await supabase
    .from('projects')
    .select('id, fields')
    .eq('user', user.id);

  if (fetchError) {
    return Response.json({ data: null, error: fetchError.message }, { status: 400 });
  }

  // Prepare updates for projects where fields[key] exists
  const updates = [];
  for (const project of projects) {
    if (project.fields && project.fields[key]) {
      const newFields = { ...project.fields, [key]: { ...project.fields[key], visible } };
      updates.push({ id: project.id, fields: newFields });
    }
  }

  // Update each project (can be optimized with upsert or batch if needed)
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('projects')
      .update({ fields: update.fields })
      .eq('id', update.id)
      .eq('user', user.id);
    if (updateError) {
      return Response.json({ data: null, error: updateError.message }, { status: 400 });
    }
  }

  return Response.json({ data: updates.map(u => u.id), error: null }, { status: 200 });
}