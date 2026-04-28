import { View, Text, Pressable } from 'react-native';
import type { DailyActivityState } from '../lib/hooks/useDailyActivity';
import type { ScreenKey } from './Sidebar';
import { AnimatedNumber } from './AnimatedNumber';
import { useCalmMode } from '../lib/hooks/useCalmMode';

const CERT_TINT: Record<string, string> = {
  ip: '#64D2FF',
  fe: '#5E5CE6',
  spi: '#FFD60A',
  boki: '#FF375F',
};
const DEFAULT_TINT = '#007AFF';

interface TodayHeroCardProps {
  activity: DailyActivityState;
  certSlug?: string | null;
  onNavigate?: (screen: ScreenKey) => void;
}

export function TodayHeroCard({
  activity,
  certSlug = null,
  onNavigate,
}: TodayHeroCardProps): React.ReactElement {
  const tint = certSlug !== null ? (CERT_TINT[certSlug] ?? DEFAULT_TINT) : DEFAULT_TINT;
  const { recallCount, learnCount, recallGoal, learnGoal, totalGoal, totalDone } = activity;
  const { isCalm } = useCalmMode();

  const recallPct = recallGoal === 0 ? 0 : Math.min(recallCount / recallGoal, 1);
  const learnPct = learnGoal === 0 ? 0 : Math.min(learnCount / learnGoal, 1);

  return (
    <Pressable
      onPress={() => onNavigate?.('practice')}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: `${tint}18`, minHeight: 200 }}
    >
      {/* Liquid Glass tint overlay */}
      <View
        className="liquid-glass absolute inset-0"
        style={{ backgroundColor: `${tint}0A` }}
        pointerEvents="none"
      />

      <View className="p-8 flex-col justify-between flex-1" style={{ minHeight: 200 }}>
        {/* Eyebrow */}
        <View>
          <Text className="text-[13px] text-secondaryLabel font-medium mb-3">
            今日の問題
          </Text>

          {/* Main number roll-up */}
          {isCalm ? (
            <Text style={{ fontSize: 60, fontWeight: '700', color: '#000000', lineHeight: 66 }}>
              {totalGoal}
            </Text>
          ) : (
            <AnimatedNumber
              value={totalDone}
              fontSize={60}
              fontWeight="700"
              color="#000000"
              duration={300}
            />
          )}

          {/* Recall / Learn breakdown */}
          <Text className="text-[12px] text-secondaryLabel mt-1">
            Recall {recallGoal} / Learn {learnGoal}
          </Text>
        </View>

        {/* Segment progress bar */}
        <View className="mt-6">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-[12px] text-secondaryLabel">
              {totalDone} / {totalGoal}
            </Text>
          </View>
          <View className="h-2 w-full flex-row rounded-full overflow-hidden bg-black/10">
            {/* Recall segment */}
            <View
              className="h-full bg-systemBlue rounded-l-full"
              style={{ flex: recallPct * recallGoal }}
            />
            {/* Learn segment */}
            <View
              className="h-full bg-systemTeal"
              style={{ flex: learnPct * learnGoal }}
            />
            {/* Remaining */}
            <View
              className="h-full"
              style={{
                flex: Math.max(totalGoal - totalDone, 0),
                backgroundColor: 'transparent',
              }}
            />
          </View>
          <View className="flex-row mt-1.5 gap-4">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-systemBlue" />
              <Text className="text-[11px] text-secondaryLabel">Recall</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-systemTeal" />
              <Text className="text-[11px] text-secondaryLabel">Learn</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => onNavigate?.('practice')}
          className="bg-systemBlue self-start px-5 py-2 rounded-full mt-6"
        >
          <Text className="text-white text-[15px] font-semibold">はじめる</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
