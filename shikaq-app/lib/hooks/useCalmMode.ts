import { useAuth } from '../../components/AuthProvider';

export interface CalmModeState {
  isCalm: boolean;
  daysRemaining: number | null;
}

function isCalmModeActiveLocal(profile: {
  calm_mode: boolean;
  calm_mode_until: string | null;
}): boolean {
  if (profile.calm_mode) return true;
  if (profile.calm_mode_until === null) return false;
  return new Date(profile.calm_mode_until) > new Date();
}

function daysUntilEndsLocal(profile: {
  calm_mode: boolean;
  calm_mode_until: string | null;
}): number | null {
  if (profile.calm_mode_until === null) return null;
  const until = new Date(profile.calm_mode_until);
  const now = new Date();
  if (until <= now) return null;
  return Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function useCalmMode(): CalmModeState {
  const { profile } = useAuth();

  if (profile === null) {
    return { isCalm: false, daysRemaining: null };
  }

  return {
    isCalm: isCalmModeActiveLocal(profile),
    daysRemaining: daysUntilEndsLocal(profile),
  };
}
