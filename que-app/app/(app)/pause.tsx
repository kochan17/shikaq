import { useState } from 'react';
import { BrandSpinner } from '../../components/BrandSpinner';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useAuth } from '../../components/AuthProvider';
import { updateProfile } from '../../lib/supabase/queries';

type PauseOption = {
  label: string;
  days: number;
};

const PAUSE_OPTIONS: PauseOption[] = [
  { label: '1週間', days: 7 },
  { label: '2週間', days: 14 },
  { label: '1ヶ月', days: 30 },
];

function daysRemaining(pausedUntil: string | null): number {
  if (pausedUntil === null) return 0;
  const until = new Date(pausedUntil);
  const now = new Date();
  const diffMs = until.getTime() - now.getTime();
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
}

function isPaused(pausedUntil: string | null): boolean {
  if (pausedUntil === null) return false;
  return new Date(pausedUntil) > new Date();
}

export default function PauseScreen(): React.ReactElement {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const currentlyPaused = isPaused(profile?.paused_until ?? null);
  const remaining = daysRemaining(profile?.paused_until ?? null);

  async function handlePause(days: number): Promise<void> {
    if (user === null) return;
    setBusy(true);
    setError(null);
    try {
      const until = new Date();
      until.setDate(until.getDate() + days);
      await updateProfile(user.id, { paused_until: until.toISOString() });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '一時停止に失敗しました');
    } finally {
      setBusy(false);
    }
  }

  async function handleResume(): Promise<void> {
    if (user === null) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(user.id, { paused_until: null });
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '再開に失敗しました');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-systemGroupedBackground"
      contentContainerStyle={{ padding: 32 }}
    >
      {/* Header */}
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center gap-2 mb-6"
      >
        <MaterialIcon name="arrow_back_ios" size={18} className="text-systemBlue" />
        <Text className="text-[17px] text-systemBlue">戻る</Text>
      </Pressable>

      <Text className="text-[28px] font-semibold text-label tracking-tight mb-1">
        学習の一時停止
      </Text>
      <Text className="text-[15px] text-secondaryLabel mb-8">
        試験前の追い込みや休息期間に。停止中もデータは保持されます。
      </Text>

      {currentlyPaused && (
        <View className="bg-systemOrange/10 rounded-2xl hairline-border p-5 mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcon name="pause_circle" size={18} className="text-systemOrange" />
            <Text className="text-[16px] font-semibold text-label">一時停止中</Text>
          </View>
          <Text className="text-[14px] text-secondaryLabel mb-4">
            {remaining > 0 ? `あと${remaining}日で自動再開されます` : '本日再開予定'}
          </Text>
          <Pressable
            onPress={() => void handleResume()}
            disabled={busy}
            className="bg-systemBlue rounded-full py-3 items-center"
          >
            {busy ? (
              <BrandSpinner variant="white" size={20} />
            ) : (
              <Text className="text-[16px] font-semibold text-white">今すぐ再開する</Text>
            )}
          </Pressable>
        </View>
      )}

      <View className="bg-systemBackground rounded-2xl hairline-border p-5 mb-4">
        <Text className="text-[16px] font-semibold text-label mb-4">
          {currentlyPaused ? '停止期間を変更する' : '停止期間を選ぶ'}
        </Text>

        <View className="gap-3">
          {PAUSE_OPTIONS.map((option) => (
            <Pressable
              key={option.days}
              onPress={() => setSelected(option.days)}
              className={`flex-row items-center justify-between p-4 rounded-xl hairline-border ${
                selected === option.days
                  ? 'bg-systemBlue/10 border-systemBlue/30'
                  : 'bg-secondarySystemBackground'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcon
                  name="calendar_month"
                  size={20}
                  className={selected === option.days ? 'text-systemBlue' : 'text-secondaryLabel'}
                />
                <Text
                  className={`text-[16px] font-medium ${
                    selected === option.days ? 'text-systemBlue' : 'text-label'
                  }`}
                >
                  {option.label}
                </Text>
              </View>
              {selected === option.days && (
                <MaterialIcon name="check_circle" fill size={20} className="text-systemBlue" />
              )}
            </Pressable>
          ))}
        </View>

        {selected !== null && (
          <Pressable
            onPress={() => void handlePause(selected)}
            disabled={busy}
            className="bg-systemOrange rounded-full py-3 items-center mt-5"
          >
            {busy ? (
              <BrandSpinner variant="white" size={20} />
            ) : (
              <Text className="text-[16px] font-semibold text-white">
                {PAUSE_OPTIONS.find((o) => o.days === selected)?.label ?? ''}一時停止する
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {error !== null && (
        <Text className="text-[13px] text-systemRed text-center">{error}</Text>
      )}

      <View className="bg-systemBackground rounded-2xl hairline-border p-5 mt-4">
        <View className="flex-row items-center gap-2 mb-2">
          <MaterialIcon name="info" size={16} className="text-secondaryLabel" />
          <Text className="text-[14px] font-semibold text-label">停止中の動作</Text>
        </View>
        <View className="gap-2">
          {[
            'ストリークカウントは停止されます',
            '学習記録・問題履歴はそのまま保持',
            '期間終了後、自動的に再開されます',
          ].map((item) => (
            <View key={item} className="flex-row items-start gap-2">
              <Text className="text-[13px] text-secondaryLabel">•</Text>
              <Text className="text-[13px] text-secondaryLabel flex-1">{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
