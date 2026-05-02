import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../AuthProvider';
import { DailyRing } from '../DailyRing';
import { WeekHeatmap } from '../WeekHeatmap';
import { WeakSectionsCard } from '../WeakSectionsCard';
import { TrendsCard } from '../TrendsCard';
import { useSummaryData } from '../../lib/hooks/useSummaryData';
import { useStreakState } from '../../lib/hooks/useStreakState';
import { MaterialIcon } from '../MaterialIcon';

function StreakPanel({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  longestStreak: number;
}): React.ReactElement {
  return (
    <View className="bg-systemBackground rounded-2xl hairline-border p-5 flex-1">
      <View className="flex-row items-center gap-1.5 mb-3">
        <MaterialIcon name="local_fire_department" fill size={16} className="text-systemOrange" />
        <Text className="text-[13px] font-semibold text-label">ストリーク</Text>
      </View>
      <View className="items-center">
        <Text className="text-[32px] font-semibold text-systemBlue tracking-tight tabular-nums">
          {currentStreak}
        </Text>
        <Text className="text-[15px] text-secondaryLabel mt-0.5">日連続中</Text>
        <View className="mt-3 pt-3 border-t border-separator w-full items-center">
          <Text className="text-[17px] text-secondaryLabel">
            最長:{' '}
            <Text className="text-label font-semibold tabular-nums">{longestStreak}</Text> 日
          </Text>
        </View>
      </View>
    </View>
  );
}

interface RingHeroProps {
  todayAnswered: number;
  todayGoal: number;
  todayProgress: number;
}

function RingHero({ todayAnswered, todayGoal, todayProgress }: RingHeroProps): React.ReactElement {
  return (
    <View className="bg-systemBackground rounded-2xl hairline-border py-8 items-center">
      <DailyRing
        size={180}
        strokeWidth={16}
        progress={todayProgress}
        current={todayAnswered}
        total={todayGoal}
      />
      <View className="mt-4 items-center">
        <View className="flex-row items-baseline gap-1">
          <Text className="text-[28px] font-semibold text-label tabular-nums">
            {todayAnswered}
          </Text>
          <Text className="text-[15px] text-secondaryLabel">/ {todayGoal} 問</Text>
        </View>
        <Text className="text-[13px] text-tertiaryLabel mt-0.5">今日の達成</Text>
      </View>
    </View>
  );
}

// Tablet layout: 2-column grid
function TabletLayout({ children }: { children: React.ReactNode[] }): React.ReactElement {
  const [ringHero, heatmap, streakPanel, weakSections, trends] = children;
  return (
    <>
      {/* Top row: full width ring */}
      <View>{ringHero}</View>
      {/* Middle row: heatmap + streak */}
      <View className="flex-row gap-4">
        <View className="flex-1">{heatmap}</View>
        <View style={{ width: 180 }}>{streakPanel}</View>
      </View>
      {/* Bottom row: weak sections + trends */}
      <View className="flex-row gap-4">
        <View className="flex-1">{weakSections}</View>
        <View className="flex-1">{trends}</View>
      </View>
    </>
  );
}

// Mobile layout: single column
function MobileLayout({ children }: { children: React.ReactNode[] }): React.ReactElement {
  const [ringHero, heatmap, streakPanel, weakSections, trends] = children;
  return (
    <>
      {ringHero}
      {heatmap}
      {streakPanel}
      {weakSections}
      {trends}
    </>
  );
}

export function Summary(): React.ReactElement {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data, loading } = useSummaryData(user?.id ?? null);
  const streak = useStreakState(user?.id ?? null);

  const currentStreak = streak.currentStreak > 0 ? streak.currentStreak : data.currentStreak;
  const longestStreak = streak.longestStreak > 0 ? streak.longestStreak : data.longestStreak;

  const cards: React.ReactNode[] = [
    <RingHero
      key="ring"
      todayAnswered={data.todayAnswered}
      todayGoal={data.todayGoal}
      todayProgress={data.todayProgress}
    />,
    <WeekHeatmap key="heatmap" days={data.last7Days} />,
    <StreakPanel key="streak" currentStreak={currentStreak} longestStreak={longestStreak} />,
    <WeakSectionsCard key="weak" sections={data.weakSections} />,
    <TrendsCard key="trends" metrics={data.trends} />,
  ];

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      {/* Header */}
      <View className="px-8 pt-8 pb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-[28px] font-semibold text-label tracking-tight">学習サマリー</Text>
          <Text className="text-[13px] text-secondaryLabel mt-0.5">直近 7 日間</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 32,
          paddingBottom: 48,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator />
          </View>
        ) : isTablet ? (
          <TabletLayout>{cards}</TabletLayout>
        ) : (
          <MobileLayout>{cards}</MobileLayout>
        )}
      </ScrollView>
    </View>
  );
}
