import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { fetchWeeklyDailyBadges, type DayBadge } from '../lib/gamification/dailyBadge';

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'] as const;

interface WeeklyDailyBadgesProps {
  userId: string | null;
  certSlug?: string | null;
}

export function WeeklyDailyBadges({ userId, certSlug = null }: WeeklyDailyBadgesProps): React.ReactElement {
  const [badges, setBadges] = useState<DayBadge[]>([]);

  useEffect(() => {
    if (userId === null) return;
    fetchWeeklyDailyBadges(userId)
      .then(setBadges)
      .catch(() => {
        // silent: バッジ無しでも UI は出す
      });
  }, [userId]);

  // certSlug に応じたアクセントカラー（セマンティックトークンで）
  const accentClass = certSlug === 'fe'
    ? 'bg-fe'
    : certSlug === 'ip'
      ? 'bg-itPassport'
      : 'bg-systemBlue';

  return (
    <View className="flex-row items-center justify-center gap-3 py-2">
      {DAY_LABELS.map((label, index) => {
        const badge = badges[index];
        const completed = badge?.completed ?? false;
        const isToday = badge?.isToday ?? false;

        return (
          <View key={label} className="items-center gap-1">
            <View
              className="items-center justify-center"
              style={{ width: 28, height: 28 }}
            >
              {isToday && !completed ? (
                // 今日でまだ未完了: dashed circle
                <View
                  className="w-6 h-6 rounded-full border-2 border-dashed border-secondaryLabel items-center justify-center"
                />
              ) : completed ? (
                // 完了: 塗り潰し
                <View className={`w-6 h-6 rounded-full ${accentClass}`} />
              ) : (
                // 未完了の過去日
                <View className="w-6 h-6 rounded-full bg-systemFill" />
              )}
            </View>
            <Text className="text-[10px] text-tertiaryLabel">{label}</Text>
          </View>
        );
      })}
    </View>
  );
}
