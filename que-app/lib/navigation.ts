import type { ScreenKey } from '../components/Sidebar';

const SCREEN_TO_PATH: Record<ScreenKey, string> = {
  today: '/',
  learn: '/learn',
  practice: '/practice',
  'ai-qa': '/ai-qa',
  audio: '/audio',
  bookmarks: '/bookmarks',
  summary: '/summary',
  playground: '/playground',
  admin: '/admin',
  profile: '/profile',
  search: '/search',
  notifications: '/notifications',
};

export function screenToPath(key: ScreenKey): string {
  return SCREEN_TO_PATH[key];
}

export function pathToScreen(pathname: string): ScreenKey {
  const trimmed = pathname.replace(/\/$/, '') || '/';
  for (const [key, value] of Object.entries(SCREEN_TO_PATH)) {
    if (value === trimmed) return key as ScreenKey;
  }
  return 'today';
}
