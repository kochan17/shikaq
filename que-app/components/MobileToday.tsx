import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcon } from './MaterialIcon';
import { DailyRing } from './DailyRing';
import { useDailyActivity } from '../lib/hooks/useDailyActivity';
import { useStreakState } from '../lib/hooks/useStreakState';
import { useAuth } from './AuthProvider';
import type { ScreenKey } from './Sidebar';

interface ResumeMini {
  icon: string;
  title: string;
  tint: string;
  bgTint: string;
  pct: number;
}

const RESUME_MINI: ResumeMini[] = [
  { icon: 'dataset', title: 'データベースの基礎', tint: 'text-fe', bgTint: 'bg-fe/5', pct: 60 },
  { icon: 'lan', title: 'ネットワーク層', tint: 'text-itPassport', bgTint: 'bg-itPassport/5', pct: 30 },
  { icon: 'account_tree', title: 'アルゴリズム', tint: 'text-spi', bgTint: 'bg-spi/5', pct: 10 },
];

interface TabItem {
  icon: string;
  label: string;
  selected?: boolean;
}

const TABS: TabItem[] = [
  { icon: 'home', label: 'ホーム', selected: true },
  { icon: 'book_2', label: '学習' },
  { icon: 'edit_note', label: '演習' },
  { icon: 'auto_awesome', label: 'AI' },
  { icon: 'person', label: 'マイページ' },
];

interface MobileTodayProps {
  onNavigate?: (screen: ScreenKey) => void;
  certSlug?: string | null;
}

export function MobileToday({ onNavigate, certSlug = null }: MobileTodayProps = {}): React.ReactElement {
  const { user } = useAuth();
  const activity = useDailyActivity(user?.id ?? null);
  const streak = useStreakState(user?.id ?? null);

  const streakLabel = streak.currentStreak > 0 ? `${streak.currentStreak}日` : null;

  return (
    <View className="flex-1 bg-secondarySystemBackground">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8, gap: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row justify-between items-end pb-2 pt-2">
            <View>
              <Text className="text-[34px] font-semibold tracking-tight leading-tight text-label">
                ダッシュボード
              </Text>
              <Text className="text-[15px] text-secondaryLabel mt-1">今日も一歩ずつ</Text>
            </View>
            {streakLabel !== null && (
              <View className="flex-row items-center gap-1 bg-systemOrange/10 px-3 py-1.5 rounded-full">
                <MaterialIcon name="local_fire_department" fill size={14} className="text-systemOrange" />
                <Text className="text-[12px] font-semibold text-systemOrange">{streakLabel}</Text>
              </View>
            )}
          </View>

          {/* Today Hero Card — フルブリード */}
          <Pressable
            onPress={() => onNavigate?.('practice')}
            className="rounded-2xl overflow-hidden bg-fe/10 relative"
            style={{ minHeight: 180 }}
          >
            <View className="liquid-glass absolute inset-0" pointerEvents="none" />
            <View className="p-5 relative z-10" style={{ minHeight: 180 }}>
              {/* Streak badge top-right */}
              {streakLabel !== null && (
                <View className="absolute top-5 right-5 flex-row items-center gap-1">
                  <MaterialIcon name="local_fire_department" fill size={12} className="text-systemOrange" />
                  <Text className="text-[12px] font-medium text-systemOrange">{streakLabel}</Text>
                </View>
              )}

              <Text className="text-secondaryLabel text-[13px] font-medium mb-2">今日の問題</Text>
              <Text style={{ fontSize: 52, fontWeight: '700', color: '#000000', lineHeight: 56 }}>
                {activity.totalGoal}
              </Text>
              <Text className="text-[12px] text-secondaryLabel mt-1">
                Recall {activity.recallGoal} / Learn {activity.learnGoal}
              </Text>

              {/* Segment bar */}
              <View className="flex-row h-1.5 bg-black/10 rounded-full overflow-hidden mt-4">
                <View
                  className="h-full bg-systemBlue"
                  style={{
                    flex: activity.recallGoal === 0 ? 0 : Math.min(activity.recallCount / activity.recallGoal, 1) * activity.recallGoal,
                  }}
                />
                <View
                  className="h-full bg-systemTeal"
                  style={{
                    flex: activity.learnGoal === 0 ? 0 : Math.min(activity.learnCount / activity.learnGoal, 1) * activity.learnGoal,
                  }}
                />
                <View
                  style={{ flex: Math.max(activity.totalGoal - activity.totalDone, 0) }}
                />
              </View>

              <Pressable
                onPress={() => onNavigate?.('practice')}
                className="bg-systemBlue self-start px-5 py-2 rounded-full mt-5"
              >
                <Text className="text-white text-[15px] font-semibold">はじめる</Text>
              </Pressable>
            </View>
          </Pressable>

          {/* Daily Ring */}
          <View className="bg-systemBackground rounded hairline-border p-5 items-center">
            <DailyRing
              size={120}
              strokeWidth={10}
              progress={activity.progress}
              current={activity.totalDone}
              total={activity.totalGoal}
              certSlug={certSlug}
            />
            <Text className="text-[13px] text-secondaryLabel mt-3">
              {activity.totalDone === 0
                ? '今日の学習を始めましょう'
                : activity.completed
                ? '今日のゴール達成！'
                : `あと${activity.totalGoal - activity.totalDone}問`}
            </Text>
          </View>

          {/* 続きから */}
          <View>
            <View className="flex-row justify-between items-end mb-3">
              <Text className="text-[20px] font-semibold tracking-tight text-label">続きから</Text>
              <Pressable>
                <Text className="text-systemBlue text-[15px]">すべて</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingRight: 20 }}
            >
              {RESUME_MINI.map((card) => (
                <View key={card.title} className="w-[140px] gap-2">
                  <View
                    className={`h-[180px] bg-systemBackground rounded hairline-border p-3 justify-between overflow-hidden ${card.bgTint}`}
                  >
                    <View>
                      <MaterialIcon name={card.icon} fill size={24} className={`${card.tint} mb-1`} />
                      <Text className="text-[14px] font-medium leading-snug text-label">{card.title}</Text>
                    </View>
                  </View>
                  <View className="w-full bg-secondarySystemBackground h-1 rounded-full overflow-hidden">
                    <View className="bg-systemBlue h-full" style={{ width: `${card.pct}%` }} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* 簡易アジェンダ — 1行 */}
          <View className="bg-systemBackground rounded hairline-border px-4 py-3 flex-row items-center gap-3">
            <MaterialIcon name="calendar_today" size={18} className="text-secondaryLabel" />
            <Text className="text-[15px] text-label">12:00 昼休みの Practice（5問）</Text>
          </View>
        </ScrollView>

        {/* Bottom Tab Bar */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-8">
          <View className="liquid-glass rounded-full mx-2 border border-white/20 flex-row justify-around items-center px-4 py-3">
            {TABS.map((tab) => (
              <Pressable key={tab.label} className="items-center justify-center px-2">
                <MaterialIcon
                  name={tab.icon}
                  fill={Boolean(tab.selected)}
                  size={24}
                  className={tab.selected ? 'text-systemBlue' : 'text-secondaryLabel'}
                />
                <Text
                  className={`text-[10px] font-medium tracking-wide mt-1 ${
                    tab.selected ? 'text-systemBlue' : 'text-secondaryLabel'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
