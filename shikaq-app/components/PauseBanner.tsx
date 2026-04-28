import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcon } from './MaterialIcon';
import { useAuth } from './AuthProvider';

function daysRemaining(pausedUntil: string): number {
  const until = new Date(pausedUntil);
  const now = new Date();
  const diffMs = until.getTime() - now.getTime();
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
}

function isPaused(pausedUntil: string | null): boolean {
  if (pausedUntil === null) return false;
  return new Date(pausedUntil) > new Date();
}

export function PauseBanner(): React.ReactElement | null {
  const { profile } = useAuth();
  const router = useRouter();

  if (profile === null || !isPaused(profile.paused_until)) {
    return null;
  }

  const days = daysRemaining(profile.paused_until as string);

  return (
    <View className="mx-8 mt-4 bg-systemOrange/10 rounded-2xl hairline-border px-5 py-3 flex-row items-center gap-3">
      <MaterialIcon name="pause_circle" size={18} className="text-systemOrange" />
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-label">
          学習を一時停止中
        </Text>
        <Text className="text-[12px] text-secondaryLabel">
          {days > 0 ? `あと${days}日で再開` : '本日再開予定'}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push('/pause' as never)}
        className="px-3 py-1.5 bg-systemOrange/15 rounded-full"
      >
        <Text className="text-[13px] font-semibold text-systemOrange">管理</Text>
      </Pressable>
    </View>
  );
}
