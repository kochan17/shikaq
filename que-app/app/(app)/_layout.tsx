import { useWindowDimensions, View } from 'react-native';
import { Redirect, Slot, useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { Sidebar } from '../../components/Sidebar';
import { BrandSpinner } from '../../components/BrandSpinner';
import { signOut } from '../../lib/supabase/auth';
import { screenToPath, pathToScreen } from '../../lib/navigation';
import { hasCompletedOnboarding } from '../../data/onboarding-questions';

export default function AppLayout(): React.ReactElement {
  const { user, profile, loading } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-systemBackground">
        <BrandSpinner size={40} />
      </View>
    );
  }

  if (user === null) {
    if (hasCompletedOnboarding()) {
      return <Redirect href="/login" />;
    }
    return <Redirect href="/onboarding" />;
  }

  if (width < 768) {
    return <Slot />;
  }

  const userName =
    (user.user_metadata?.display_name as string | undefined) ?? user.email ?? null;

  return (
    <View className="flex-row flex-1 overflow-hidden bg-systemGroupedBackground">
      <Sidebar
        activeScreen={pathToScreen(pathname)}
        onNavigate={(key) => router.push(screenToPath(key) as never)}
        onLogout={() => {
          void signOut();
        }}
        userName={userName}
        isAdmin={profile?.role === 'admin'}
      />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
