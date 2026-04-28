import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcon } from './MaterialIcon';
import type { TrendMetric } from '../lib/hooks/useSummaryData';

interface TrendRowProps {
  metric: TrendMetric;
}

function TrendRow({ metric }: TrendRowProps): React.ReactElement {
  const isNeutral = metric.delta === 0;
  const arrowIcon = isNeutral ? 'remove' : metric.isPositive ? 'arrow_upward' : 'arrow_downward';
  const valueColorClass = isNeutral
    ? 'text-secondaryLabel'
    : metric.isPositive
      ? 'text-systemGreen'
      : 'text-systemOrange';
  const iconColorClass = isNeutral
    ? 'text-secondaryLabel'
    : metric.isPositive
      ? 'text-systemGreen'
      : 'text-systemOrange';

  const deltaLabel =
    isNeutral
      ? '前週比 変化なし'
      : `前週比 ${metric.isPositive ? '+' : ''}${metric.delta}${metric.unit}`;

  return (
    <View className="flex-row items-center gap-2 py-2.5">
      <View className="flex-1 min-w-0">
        <Text className="text-[12px] text-tertiaryLabel mb-0.5">{metric.label}</Text>
        <View className="flex-row items-baseline gap-0.5">
          <Text className="text-[22px] font-semibold text-label tabular-nums">
            {metric.currentValue}
          </Text>
          <Text className="text-[12px] text-secondaryLabel">{metric.unit}</Text>
        </View>
      </View>
      <View className="items-end gap-0.5">
        <View className="flex-row items-center gap-0.5">
          <MaterialIcon name={arrowIcon} size={14} className={iconColorClass} />
          <Text className={`text-[12px] font-medium tabular-nums ${valueColorClass}`}>
            {isNeutral ? '-' : `${metric.isPositive ? '+' : ''}${metric.delta}${metric.unit}`}
          </Text>
        </View>
        <Text className="text-[10px] text-tertiaryLabel">先週 {metric.previousValue}{metric.unit}</Text>
      </View>
    </View>
  );
}

interface TrendsCardProps {
  metrics: TrendMetric[];
}

export function TrendsCard({ metrics }: TrendsCardProps): React.ReactElement {
  return (
    <View className="bg-systemBackground rounded-2xl hairline-border px-5 pt-5 pb-2">
      <View className="flex-row items-center gap-2 mb-1">
        <MaterialIcon name="trending_up" size={16} className="text-systemBlue" />
        <Text className="text-[13px] font-semibold text-label">先週比トレンド</Text>
      </View>
      {metrics.length === 0 ? (
        <View className="py-6 items-center">
          <Text className="text-[13px] text-tertiaryLabel">データがまだありません</Text>
        </View>
      ) : (
        <View>
          {metrics.map((metric, i) => (
            <React.Fragment key={metric.label}>
              {i > 0 && <View className="h-px bg-separator" />}
              <TrendRow metric={metric} />
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}
