import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '../components/AuthProvider';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (typeof SENTRY_DSN === 'string' && SENTRY_DSN.length > 0) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 0 : 0.1,
    environment: __DEV__ ? 'development' : 'production',
  });
}

const WEB_FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
];

function useWebFonts(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    WEB_FONT_URLS.forEach((href) => {
      if (document.querySelector(`link[href="${href}"]`) !== null) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);
}

function RootLayout(): React.ReactElement {
  useWebFonts();
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default typeof SENTRY_DSN === 'string' && SENTRY_DSN.length > 0
  ? Sentry.wrap(RootLayout)
  : RootLayout;
