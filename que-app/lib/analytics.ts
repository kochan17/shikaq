/*
 * Plausible Analytics — Web only, cookieless
 *
 * セットアップ (ユーザー作業):
 *   1. https://plausible.io で以下の 2 サイトを登録:
 *      - que.app.vercel.app  (Expo Web)
 *      - que.app             (que-site)
 *   2. 各環境変数を設定:
 *      - que.app/.env: EXPO_PUBLIC_PLAUSIBLE_DOMAIN=que.app.vercel.app
 *      - que-site/.env: PUBLIC_PLAUSIBLE_DOMAIN=que.app
 *   3. 月 10K pageview を超える前に Self-host または有料プランへの移行を検討。
 *
 * イベント命名規約: <screen>_<action>
 *   例: today_open, practice_complete, lesson_start, quiz_answer
 */

import { Platform } from 'react-native';

const DOMAIN =
  typeof process !== 'undefined'
    ? (process.env['EXPO_PUBLIC_PLAUSIBLE_DOMAIN'] ?? '')
    : '';

const SCRIPT_SRC = 'https://plausible.io/js/script.js';

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number> },
    ) => void;
  }
}

export function initPlausible(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  if (DOMAIN.length === 0) return;

  if (document.querySelector(`script[data-domain="${DOMAIN}"]`) !== null) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.setAttribute('data-domain', DOMAIN);
  document.head.appendChild(script);
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number>,
): void {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  if (DOMAIN.length === 0) return;

  window.plausible?.(name, props !== undefined ? { props } : undefined);
}
