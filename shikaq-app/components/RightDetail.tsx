import { View, Text } from 'react-native';
import { MaterialIcon } from './MaterialIcon';
import { RingPair } from './RingPair';
import { DailyRing } from './DailyRing';
import { AnimatedNumber } from './AnimatedNumber';
import { useDailyActivity } from '../lib/hooks/useDailyActivity';
import { useAudioActivity } from '../lib/hooks/useAudioActivity';
import { useStreakState } from '../lib/hooks/useStreakState';
import { useAuth } from './AuthProvider';
import { useCalmMode } from '../lib/hooks/useCalmMode';

interface AgendaItem {
  time: string;
  label: string;
  state: 'done' | 'active' | 'upcoming';
}

// 22:00 音声解説は Phase 2 で実装。現在は非マウント。
const AGENDA: AgendaItem[] = [
  { time: '7:30', label: '朝の Warm up (3問)', state: 'done' },
  { time: '12:00', label: '昼休みの Practice (5問)', state: 'upcoming' },
];

interface RightDetailProps {
  certSlug?: string | null;
}

export function RightDetail({ certSlug = null }: RightDetailProps): React.ReactElement {
  const { user } = useAuth();
  const activity = useDailyActivity(user?.id ?? null);
  const streak = useStreakState(user?.id ?? null);
  const { isCalm } = useCalmMode();

  const remaining = Math.max(activity.totalGoal - activity.totalDone, 0);
  const isComplete = activity.completed || remaining === 0;

  const streakLabel = streak.currentStreak === 0
    ? null
    : `${streak.currentStreak}日続いています`;

  return (
    <View className="w-[300px] h-full bg-systemBackground flex-shrink-0 z-20 border-l border-black/10 flex-col p-6">
      <Text className="text-[22px] font-semibold mb-6 text-label">今日のゴール</Text>

      {/* Daily Ring — central, large */}
      <View className="items-center mb-3">
        <DailyRing
          size={160}
          strokeWidth={12}
          progress={activity.progress}
          current={activity.totalDone}
          total={activity.totalGoal}
          certSlug={certSlug}
        />
        <View className="mt-3 bg-secondarySystemBackground px-4 py-2 rounded-full">
          <Text className="text-[13px] font-medium text-label">
            {isComplete ? '今日の問題 達成！' : `あと${remaining}問`}
          </Text>
        </View>
      </View>

      {/* Recall / Learn breakdown */}
      <View className="flex-row justify-center gap-6 mb-6">
        <View className="items-center">
          <Text className="text-[11px] text-secondaryLabel mb-0.5">Recall</Text>
          <Text className="text-[15px] font-semibold text-label">
            {activity.recallCount}
            <Text className="text-[12px] text-secondaryLabel font-normal"> / {activity.recallGoal}</Text>
          </Text>
        </View>
        <View className="w-px bg-black/10" />
        <View className="items-center">
          <Text className="text-[11px] text-secondaryLabel mb-0.5">Learn</Text>
          <Text className="text-[15px] font-semibold text-label">
            {activity.learnCount}
            <Text className="text-[12px] text-secondaryLabel font-normal"> / {activity.learnGoal}</Text>
          </Text>
        </View>
      </View>

      {/* Agenda */}
      <Text className="text-[16px] font-semibold mb-4 text-label">アジェンダ</Text>
      <View className="relative pl-1 flex-1">
        <View className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-black/5" />
        {AGENDA.map((item) => (
          <View
            key={item.time}
            className={`flex-row gap-4 mb-6 ${item.state === 'done' ? 'opacity-50' : ''}`}
          >
            {item.state === 'done' && (
              <View className="w-4 h-4 rounded-full bg-systemGreen border-2 border-white items-center justify-center">
                <MaterialIcon name="check" size={10} className="text-white" />
              </View>
            )}
            {item.state === 'active' && (
              <View className="w-4 h-4 rounded-full bg-systemBlue border-2 border-white" />
            )}
            {item.state === 'upcoming' && (
              <View className="w-4 h-4 rounded-full bg-black/10 border-2 border-white" />
            )}
            <View>
              <Text
                className={`text-[13px] font-medium mb-0.5 ${
                  item.state === 'active' ? 'text-systemBlue' : 'text-secondaryLabel'
                }`}
              >
                {item.time}
              </Text>
              <Text
                className={`text-[16px] ${item.state === 'active' ? 'font-semibold text-label' : 'text-label'}`}
              >
                {item.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Streak — quiet, caption size, aspirational */}
      {streakLabel !== null && (
        <View className="flex-row items-center gap-1.5 pt-4 border-t border-black/5">
          <MaterialIcon name="local_fire_department" fill size={14} className="text-systemOrange" />
          {isCalm ? (
            <Text className="text-[12px] text-secondaryLabel">{streakLabel}</Text>
          ) : (
            <View className="flex-row items-center">
              <AnimatedNumber
                value={streak.currentStreak}
                fontSize={12}
                fontWeight="400"
                color="rgba(60,60,67,0.6)"
                suffix="日続いています"
                suffixFontSize={12}
                suffixColor="rgba(60,60,67,0.6)"
                duration={300}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
