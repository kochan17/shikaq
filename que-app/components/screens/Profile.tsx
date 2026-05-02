import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Linking, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcon } from '../MaterialIcon';
import {
  fetchSubscription,
  startBillingPortal,
  type SubscriptionState,
} from '../../lib/supabase/queries';
import { useAuth } from '../AuthProvider';
import { signOut } from '../../lib/supabase/auth';
import { toggleCalmMode } from '../../lib/gamification/calmMode';
import { scheduleMorningReminder, cancelMorningReminder } from '../../lib/notifications';

const NOTIFICATIONS_ENABLED_KEY = 'que_notifications_enabled';

export function Profile(): React.ReactElement {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [calmMode, setCalmMode] = useState(profile?.calm_mode ?? false);
  const [calmBusy, setCalmBusy] = useState(false);

  // localStorage からトグル状態を初期化 (native: AsyncStorage 相当は localStorage で代替、web のみ)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      if (stored !== null) {
        setNotificationsEnabled(stored === 'true');
      }
    }
  }, []);

  // profile が更新されたら calm_mode を同期
  useEffect(() => {
    if (profile !== null) {
      setCalmMode(profile.calm_mode);
    }
  }, [profile]);

  useEffect(() => {
    if (user === null) return;
    fetchSubscription(user.id)
      .then(setSub)
      .catch(() => {
        // silent
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleNotificationsToggle(value: boolean): Promise<void> {
    setNotificationsEnabled(value);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(value));
    }
    if (value) {
      await scheduleMorningReminder();
    } else {
      await cancelMorningReminder();
    }
  }

  async function handleCalmModeToggle(value: boolean): Promise<void> {
    if (user === null) return;
    setCalmBusy(true);
    try {
      await toggleCalmMode({ userId: user.id, enabled: value });
      setCalmMode(value);
    } catch {
      // silent: UI は元に戻す
      setCalmMode(!value);
    } finally {
      setCalmBusy(false);
    }
  }

  async function openPortal(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const url = await startBillingPortal();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-systemGroupedBackground" contentContainerStyle={{ padding: 32 }}>
      <Text className="text-[28px] font-semibold text-label tracking-tight mb-2">プロフィール</Text>
      <Text className="text-[13px] text-secondaryLabel mb-6">アカウント情報と契約状況</Text>

      {/* Account card */}
      <View className="bg-systemBackground rounded-2xl hairline-border p-6 mb-4">
        <View className="flex-row items-center gap-4 mb-4">
          <View className="w-16 h-16 rounded-full bg-secondarySystemBackground hairline-border" />
          <View className="flex-1">
            <Text className="text-[18px] font-semibold text-label">
              {profile?.display_name ?? user?.email ?? 'ユーザー'}
            </Text>
            <Text className="text-[13px] text-secondaryLabel">{user?.email ?? '-'}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-black/5 pt-4">
          <Text className="text-[14px] text-secondaryLabel">ロール</Text>
          <View
            className={`px-2 py-0.5 rounded-full ${
              profile?.role === 'admin' ? 'bg-systemBlue/10' : 'bg-secondarySystemBackground'
            }`}
          >
            <Text
              className={`text-[12px] font-semibold ${
                profile?.role === 'admin' ? 'text-systemBlue' : 'text-secondaryLabel'
              }`}
            >
              {profile?.role ?? 'user'}
            </Text>
          </View>
        </View>
      </View>

      {/* Subscription card */}
      <View className="bg-systemBackground rounded-2xl hairline-border p-6 mb-4">
        <Text className="text-[16px] font-semibold text-label mb-3">サブスクリプション</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[14px] text-secondaryLabel">プラン</Text>
              <Text className="text-[14px] font-semibold text-label">
                {sub?.is_premium === true ? 'Que プレミアム' : 'フリープラン'}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[14px] text-secondaryLabel">ステータス</Text>
              <Text
                className={`text-[14px] font-semibold ${
                  sub?.is_premium === true ? 'text-systemGreen' : 'text-secondaryLabel'
                }`}
              >
                {sub?.status ?? '-'}
              </Text>
            </View>
            {sub?.current_period_end !== null && sub?.current_period_end !== undefined && (
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[14px] text-secondaryLabel">次回更新日</Text>
                <Text className="text-[14px] text-label">
                  {new Date(sub.current_period_end).toLocaleDateString('ja-JP')}
                </Text>
              </View>
            )}
            {sub?.is_premium === true ? (
              <Pressable
                onPress={() => void openPortal()}
                disabled={busy}
                className="bg-secondarySystemBackground rounded-full py-2.5 items-center mt-4"
              >
                <Text className="text-[14px] font-semibold text-label">
                  {busy ? '読み込み中…' : 'プラン管理（解約・支払い情報・領収書）'}
                </Text>
              </Pressable>
            ) : (
              <Text className="text-[12px] text-secondaryLabel mt-2">
                サイドバーの「プランを確認」からプレミアムにアップグレードできます
              </Text>
            )}
            {error !== null && <Text className="text-[12px] text-systemRed mt-2">{error}</Text>}
          </>
        )}
      </View>

      {/* 学習設定 */}
      <View className="bg-systemBackground rounded-2xl hairline-border p-6 mb-4">
        <Text className="text-[16px] font-semibold text-label mb-3">学習設定</Text>

        {/* 通知 */}
        <View className="flex-row items-center justify-between py-3 border-b border-black/5">
          <View className="flex-row items-center gap-3 flex-1">
            <MaterialIcon name="notifications" size={20} className="text-secondaryLabel" />
            <View className="flex-1">
              <Text className="text-[14px] text-label">朝の学習リマインダー</Text>
              <Text className="text-[12px] text-secondaryLabel">毎朝 7:30 に今日の問題をお知らせ</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(v) => { void handleNotificationsToggle(v); }}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Calm Mode */}
        <View className="flex-row items-center justify-between py-3 border-b border-black/5">
          <View className="flex-row items-center gap-3 flex-1">
            <MaterialIcon name="spa" size={20} className="text-secondaryLabel" />
            <View className="flex-1">
              <Text className="text-[14px] text-label">Calm Mode</Text>
              <Text className="text-[12px] text-secondaryLabel">アニメーション・ストリーク表示・通知をオフ</Text>
            </View>
          </View>
          <Switch
            value={calmMode}
            disabled={calmBusy}
            onValueChange={(v) => { void handleCalmModeToggle(v); }}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 学習を一時停止 (Phase 2 プレースホルダー) */}
        <Pressable className="flex-row items-center gap-3 py-3 opacity-40" disabled>
          <MaterialIcon name="pause_circle" size={20} className="text-secondaryLabel" />
          <View className="flex-1">
            <Text className="text-[14px] text-label">学習を一時停止</Text>
            <Text className="text-[12px] text-secondaryLabel">近日公開予定</Text>
          </View>
          <MaterialIcon name="chevron_right" size={20} className="text-tertiaryLabel" />
        </Pressable>
      </View>

      {/* Danger zone */}
      <View className="bg-systemBackground rounded-2xl hairline-border p-6 mb-4">
        <Text className="text-[16px] font-semibold text-label mb-3">アカウント</Text>
        <Pressable
          onPress={() => {
            void signOut();
          }}
          className="flex-row items-center gap-3 py-3"
        >
          <MaterialIcon name="logout" size={20} className="text-systemRed" />
          <Text className="text-[14px] font-semibold text-systemRed">ログアウト</Text>
        </Pressable>
      </View>

      {/* Legal links */}
      <View className="gap-1 pb-4">
        <Pressable
          onPress={() => router.push('/legal/terms' as never)}
          className="flex-row items-center justify-between py-3 px-2"
        >
          <Text className="text-[13px] text-secondaryLabel">利用規約</Text>
          <MaterialIcon name="chevron_right" size={16} className="text-tertiaryLabel" />
        </Pressable>
        <Pressable
          onPress={() => router.push('/legal/privacy' as never)}
          className="flex-row items-center justify-between py-3 px-2"
        >
          <Text className="text-[13px] text-secondaryLabel">プライバシーポリシー</Text>
          <MaterialIcon name="chevron_right" size={16} className="text-tertiaryLabel" />
        </Pressable>
        <Pressable
          onPress={() => router.push('/legal/tokushoho' as never)}
          className="flex-row items-center justify-between py-3 px-2"
        >
          <Text className="text-[13px] text-secondaryLabel">特定商取引法に基づく表示</Text>
          <MaterialIcon name="chevron_right" size={16} className="text-tertiaryLabel" />
        </Pressable>
      </View>
    </ScrollView>
  );
}
