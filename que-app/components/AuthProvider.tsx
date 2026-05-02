import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';

export interface ProfileSummary {
  id: string;
  display_name: string | null;
  role: 'user' | 'admin';
  calm_mode: boolean;
  calm_mode_until: string | null;
  paused_until: string | null;
  preferred_certification: string | null;
  morning_notification_enabled: boolean;
  evening_notification_enabled: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: ProfileSummary | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
});

const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';

const DEV_USER = {
  id: 'dev-user',
  email: 'dev@shikaq.local',
  user_metadata: { display_name: '和田 夏海' },
} as unknown as User;

const DEV_PROFILE: ProfileSummary = {
  id: 'dev-user',
  display_name: '和田 夏海',
  role: 'admin',
  calm_mode: false,
  calm_mode_until: null,
  paused_until: null,
  preferred_certification: 'ip',
  morning_notification_enabled: true,
  evening_notification_enabled: false,
};

async function loadProfile(userId: string): Promise<ProfileSummary | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, role, calm_mode, calm_mode_until, paused_until, preferred_certification, morning_notification_enabled, evening_notification_enabled')
    .eq('id', userId)
    .maybeSingle();
  if (data === null) return null;
  return {
    id: data.id,
    display_name: data.display_name,
    role: data.role === 'admin' ? 'admin' : 'user',
    calm_mode: data.calm_mode,
    calm_mode_until: data.calm_mode_until,
    paused_until: data.paused_until,
    preferred_certification: data.preferred_certification ?? null,
    morning_notification_enabled: data.morning_notification_enabled,
    evening_notification_enabled: data.evening_notification_enabled,
  };
}

export function AuthProvider({ children }: PropsWithChildren): React.ReactElement {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(DEV_BYPASS ? DEV_PROFILE : null);
  const [loading, setLoading] = useState<boolean>(!DEV_BYPASS);

  useEffect(() => {
    if (DEV_BYPASS) {
      return;
    }
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        if (data.session !== null) {
          const p = await loadProfile(data.session.user.id);
          if (mounted) setProfile(p);
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession === null) {
        setProfile(null);
      } else {
        const p = await loadProfile(nextSession.user.id);
        setProfile(p);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (DEV_BYPASS) {
    return (
      <AuthContext.Provider
        value={{ user: DEV_USER, session: null, profile: DEV_PROFILE, loading: false }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
