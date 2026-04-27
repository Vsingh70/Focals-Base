import { createClient } from '@/lib/supabase/server';
import { Tour } from './Tour';
import type { TourId } from '@/lib/tour/ids';
import type { TourStep } from './types';

/**
 * Server component. Reads `profiles.tutorial_progress` for the current
 * user and renders the Tour client component only if this tour hasn't
 * been seen yet. Render this once per module page below the page content.
 */
export async function TourGate({
  tourId,
  steps,
  helpHref,
}: {
  tourId: TourId;
  steps: TourStep[];
  helpHref?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('tutorial_progress')
    .eq('id', user.id)
    .maybeSingle();

  const progress =
    profile?.tutorial_progress &&
    typeof profile.tutorial_progress === 'object' &&
    !Array.isArray(profile.tutorial_progress)
      ? (profile.tutorial_progress as Record<string, unknown>)
      : {};

  if (progress[tourId] === true) return null;

  return <Tour tourId={tourId} steps={steps} helpHref={helpHref} />;
}
