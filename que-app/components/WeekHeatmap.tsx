import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { DayActivity } from '../lib/hooks/useSummaryData';

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const dow = (d.getDay() + 6) % 7;
  return DAY_LABELS[dow];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function intensityClass(completionRate: number): string {
  if (completionRate === 0) return 'bg-systemFill';
  if (completionRate <= 0.25) return 'bg-systemBlue/20';
  if (completionRate <= 0.5) return 'bg-systemBlue/40';
  if (completionRate <= 0.75) return 'bg-systemBlue/65';
  return 'bg-systemBlue';
}

interface HeatmapCellProps {
  day: DayActivity;
  isToday: boolean;
}

function HeatmapCell({ day, isToday }: HeatmapCellProps): React.ReactElement {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <View className="flex-1 items-center gap-1.5">
      <Text className="text-[11px] text-secondaryLabel">{dayLabel(day.date)}</Text>
      <Pressable
        onPressIn={() => setTooltipVisible(true)}
        onPressOut={() => setTooltipVisible(false)}
        accessibilityLabel={`${formatDate(day.date)} 完了率${Math.round(day.completionRate * 100)}%`}
        style={{ position: 'relative' }}
      >
        <View
          className={[
            'w-8 h-8 rounded-lg',
            intensityClass(day.completionRate),
            isToday ? 'border border-systemBlue' : '',
          ].join(' ')}
        />
        {tooltipVisible && (
          <View
            style={{
              position: 'absolute',
              bottom: 36,
              left: '50%',
              transform: [{ translateX: -32 }],
              backgroundColor: 'rgba(0,0,0,0.8)',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              minWidth: 64,
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>
              {formatDate(day.date)}
            </Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
              {day.answeredCount}問 / {Math.round(day.completionRate * 100)}%
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const LEGEND_CLASSES = [
  'bg-systemFill',
  'bg-systemBlue/20',
  'bg-systemBlue/40',
  'bg-systemBlue/65',
  'bg-systemBlue',
] as const;

interface WeekHeatmapProps {
  days: DayActivity[];
}

export function WeekHeatmap({ days }: WeekHeatmapProps): React.ReactElement {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <View className="bg-systemBackground rounded-2xl hairline-border p-5">
      <Text className="text-[13px] font-semibold text-label mb-3">今週の記録</Text>
      <View className="flex-row gap-1">
        {days.map((day) => (
          <HeatmapCell key={day.date} day={day} isToday={day.date === today} />
        ))}
      </View>
      <View className="flex-row items-center justify-end gap-1.5 mt-3">
        <Text className="text-[10px] text-tertiaryLabel">少</Text>
        {LEGEND_CLASSES.map((cls, i) => (
          <View key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <Text className="text-[10px] text-tertiaryLabel">多</Text>
      </View>
    </View>
  );
}
