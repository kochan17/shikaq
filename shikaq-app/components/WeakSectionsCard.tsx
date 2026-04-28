import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcon } from './MaterialIcon';
import type { WeakSection } from '../lib/hooks/useSummaryData';

interface WeakSectionsCardProps {
  sections: WeakSection[];
}

function AccuracyBadge({ pct }: { pct: number }): React.ReactElement {
  const colorClass = pct < 50 ? 'text-systemRed' : pct < 75 ? 'text-systemOrange' : 'text-systemBlue';
  return (
    <Text className={`text-[13px] font-semibold tabular-nums ${colorClass}`}>
      {pct}%
    </Text>
  );
}

interface SectionRowProps {
  section: WeakSection;
  index: number;
}

function SectionRow({ section, index }: SectionRowProps): React.ReactElement {
  const router = useRouter();

  function handlePress(): void {
    router.push(`/practice?section_id=${section.sectionId}` as never);
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-3 py-3 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`${section.sectionTitle} 正答率${section.accuracyPct}% 復習する`}
    >
      <View className="w-6 h-6 rounded-full bg-systemFill items-center justify-center">
        <Text className="text-[11px] font-semibold text-secondaryLabel">{index + 1}</Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-[14px] font-medium text-label" numberOfLines={1}>
          {section.sectionTitle}
        </Text>
        <Text className="text-[12px] text-tertiaryLabel mt-0.5">
          {section.attempts}問回答済み
        </Text>
      </View>
      <AccuracyBadge pct={section.accuracyPct} />
      <MaterialIcon name="chevron_right" size={16} className="text-tertiaryLabel" />
    </Pressable>
  );
}

export function WeakSectionsCard({ sections }: WeakSectionsCardProps): React.ReactElement {
  return (
    <View className="bg-systemBackground rounded-2xl hairline-border px-5 pt-5 pb-2">
      <View className="flex-row items-center gap-2 mb-1">
        <MaterialIcon name="target" size={16} className="text-systemOrange" />
        <Text className="text-[13px] font-semibold text-label">苦手セクション</Text>
      </View>
      {sections.length === 0 ? (
        <View className="py-6 items-center">
          <Text className="text-[13px] text-tertiaryLabel text-center">
            3問以上解答すると{'\n'}苦手な分野が表示されます
          </Text>
        </View>
      ) : (
        <View>
          {sections.map((section, i) => (
            <React.Fragment key={section.sectionId}>
              {i > 0 && <View className="h-px bg-separator" />}
              <SectionRow section={section} index={i} />
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}
