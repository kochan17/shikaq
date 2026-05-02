import { supabase } from '../supabase/client';
import type { Tables } from '../../types/database';

type Profile = Tables<'profiles'>;

export function isCalmModeActive(profile: Profile): boolean {
  if (profile.calm_mode) return true;
  if (profile.calm_mode_until === null) return false;
  const until = new Date(profile.calm_mode_until);
  return until > new Date();
}

export function daysUntilCalmModeEnds(profile: Profile): number | null {
  if (!profile.calm_mode && profile.calm_mode_until === null) return null;
  if (profile.calm_mode_until === null) return null;
  const until = new Date(profile.calm_mode_until);
  const now = new Date();
  if (until <= now) return null;
  const diffMs = until.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface ToggleCalmModeOptions {
  userId: string;
  enabled: boolean;
  until?: Date;
}

export async function toggleCalmMode({
  userId,
  enabled,
  until,
}: ToggleCalmModeOptions): Promise<void> {
  const update: { calm_mode: boolean; calm_mode_until: string | null } = {
    calm_mode: enabled,
    calm_mode_until: until !== undefined ? until.toISOString() : null,
  };

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId);

  if (error !== null) {
    throw new Error(error.message);
  }
}
