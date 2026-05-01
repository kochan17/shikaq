import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

export interface AppleSignInResult {
  user: User | null;
  error: Error | null;
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (Platform.OS === 'ios') {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (cred.identityToken === null) {
        return { user: null, error: new Error('Apple sign in: identityToken が取得できませんでした') };
      }
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: cred.identityToken,
      });
      return { user: data.user, error };
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        'code' in e &&
        (e as Error & { code: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return { user: null, error: null };
      }
      return {
        user: null,
        error: e instanceof Error ? e : new Error('Apple sign in に失敗しました'),
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options:
        typeof window !== 'undefined' ? { redirectTo: `${window.location.origin}/` } : {},
    });
    return { user: null, error };
  }
}

export function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return Promise.resolve(true);
  return AppleAuthentication.isAvailableAsync();
}
