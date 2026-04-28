import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from './client';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

export interface SignUpMetadata {
  display_name?: string;
  marketing_opt_in?: boolean;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: SignUpMetadata
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: metadata !== undefined ? { data: metadata } : undefined,
  });
  return { user: data.user, session: data.session, error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
