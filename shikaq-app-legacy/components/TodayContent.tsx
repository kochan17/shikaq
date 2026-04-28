import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { MaterialIcon } from './MaterialIcon';
import { ActivityRings } from './ActivityRings';

interface ResumeCard {
  icon: string;
  title: string;
  cert: string;
  progressLabel: string;
  remaining: string;
  progressPct: number;
}

const RESUME_CARDS: ResumeCard[] = [
  { icon: 'dataset', title: 'データベースの基礎', cert: '基本情報技術者', progressLabel: '75%', remaining: '残り3分', progressPct: 75 },
  { icon: 'router', title: 'ネットワーク層とTCP/IP', cert: '基本情報技術者', progressLabel: '40%', remaining: '残り12分', progressPct: 40 },
  { icon: 'functions', title: 'アルゴリズムの計算量', cert: '基本情報技術者', progressLabel: '15%', remaining: '残り20分', progressPct: 15 },
];

interface WeakSpot {
  label: string;
  pct: number;
  color: 'orange' | 'blue';
}

const WEAK_SPOTS: WeakSpot[] = [
  { label: 'SQLのJOIN', pct: 52, color: 'orange' },
  { label: '基数変換', pct: 61, color: 'orange' },
  { label: '公開鍵暗号方式', pct: 68, color: 'blue' },
];

const AI_SUGGESTIONS = ['OSI基本参照モデルとは？', 'B木の特徴'];

export function TodayContent(): React.ReactElement {
  return (
    <View className="flex-1 flex-col min-w-0 relative h-full">
      {/* Top Nav */}
      <View className="h-[72px] liquid-glass border-b border-black/10 flex-row items-center justify-between px-8 sticky top-0 z-10 w-full">
        <View>
          <Text className="text-[22px] font-semibold leading-tight text-label">Today</Text>
          <Text className="text-[13px] text-secondaryLabel">2026年4月24日 金曜日</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-full">
            <MaterialIcon name="search" size={24} className="text-secondaryLabel" />
          </Pressable>
          <Pressable className="p-2 rounded-full relative">
            <MaterialIcon name="notifications" size={24} className="text-secondaryLabel" />
            <View className="absolute top-2 right-2 w-2 h-2 bg-systemRed rounded-full border border-white" />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, paddingBottom: 96, gap: 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View className="bg-systemBackground rounded-2xl hairline-border overflow-hidden flex-row h-[240px]">
          <View className="flex-1 p-8 flex-col justify-between">
            <View>
              <Text className="text-[13px] font-semibold text-fe mb-1">朝の5問</Text>
              <Text className="text-[28px] font-semibold mb-2 text-label">データベースの正規化</Text>
              <Text className="text-[16px] text-secondaryLabel">基本情報技術者 · 5問 · 約7分</Text>
            </View>
            <Pressable className="bg-systemBlue self-start px-6 py-2.5 rounded-full">
              <Text className="text-white text-[17px] font-semibold">始める</Text>
            </Pressable>
          </View>
          <View className="w-[300px] bg-fe/5 items-center justify-center">
            <View className="flex-row flex-wrap p-4 w-full max-w-[200px] gap-2">
              <View className="h-4 bg-fe/20 w-full" />
              <View className="flex-row gap-2 w-full">
                <View className="h-16 bg-fe/40 flex-1" />
                <View className="h-16 bg-fe/30 flex-1" />
                <View className="h-16 bg-fe/20 flex-1" />
              </View>
              <View className="h-4 bg-fe/10 w-full mt-2" />
            </View>
          </View>
        </View>

        {/* 続きから */}
        <View>
          <Text className="text-[22px] font-semibold mb-4 px-1 text-label">続きから</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
            {RESUME_CARDS.map((card) => (
              <View
                key={card.title}
                className="bg-systemBackground rounded-2xl hairline-border p-5 min-w-[240px] flex-col justify-between h-[200px]"
              >
                <View>
                  <View className="w-10 h-10 rounded-lg bg-fe/10 items-center justify-center mb-3">
                    <MaterialIcon name={card.icon} size={24} className="text-fe" />
                  </View>
                  <Text className="text-[17px] font-semibold leading-tight mb-1 text-label">{card.title}</Text>
                  <Text className="text-[13px] text-secondaryLabel">{card.cert}</Text>
                </View>
                <View>
                  <View className="flex-row justify-between mb-1.5">
                    <Text className="text-[13px] text-secondaryLabel">{card.progressLabel}</Text>
                    <Text className="text-[13px] text-secondaryLabel">{card.remaining}</Text>
                  </View>
                  <View className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <View className="h-full bg-systemBlue rounded-full" style={{ width: `${card.progressPct}%` }} />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Two-column row */}
        <View className="flex-row gap-6">
          {/* 今週の記録 */}
          <View className="flex-1 bg-systemBackground rounded-2xl hairline-border p-6 flex-col">
            <Text className="text-[17px] font-semibold mb-6 text-label">今週の記録</Text>
            <View className="flex-row items-center gap-8 flex-1">
              <ActivityRings
                size={128}
                strokeWidth={8}
                rings={[
                  { radius: 40, color: '#007AFF', progress: 0.76 },
                  { radius: 28, color: '#34C759', progress: 0.77 },
                  { radius: 16, color: '#FF9F0A', progress: 0.82 },
                ]}
              />
              <View className="gap-4 flex-1">
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-2 h-2 rounded-full bg-systemBlue" />
                    <Text className="text-[13px] text-secondaryLabel">学習時間</Text>
                  </View>
                  <Text className="text-[22px] font-semibold text-label">
                    3<Text className="text-[16px] text-secondaryLabel font-normal">h</Text>24
                    <Text className="text-[16px] text-secondaryLabel font-normal">m</Text>
                  </Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-2 h-2 rounded-full bg-systemGreen" />
                    <Text className="text-[13px] text-secondaryLabel">問題数</Text>
                  </View>
                  <Text className="text-[22px] font-semibold text-label">
                    147<Text className="text-[16px] text-secondaryLabel font-normal">問</Text>
                  </Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-2 h-2 rounded-full bg-systemOrange" />
                    <Text className="text-[13px] text-secondaryLabel">正答率</Text>
                  </View>
                  <Text className="text-[22px] font-semibold text-label">
                    82<Text className="text-[16px] text-secondaryLabel font-normal">%</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 苦手分野 + AI */}
          <View className="flex-1 flex-col gap-6">
            <View className="bg-systemBackground rounded-2xl hairline-border p-6 flex-1">
              <Text className="text-[17px] font-semibold mb-4 text-label">苦手分野の復習</Text>
              <View className="gap-3">
                {WEAK_SPOTS.map((spot) => (
                  <View key={spot.label} className="flex-row items-center justify-between">
                    <Text className="text-[16px] text-label">{spot.label}</Text>
                    <View className="flex-row items-center gap-3">
                      <View className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden">
                        <View
                          className={`h-full ${spot.color === 'orange' ? 'bg-systemOrange' : 'bg-systemBlue'} rounded-full`}
                          style={{ width: `${spot.pct}%` }}
                        />
                      </View>
                      <Text className="text-[13px] text-secondaryLabel w-8 text-right">{spot.pct}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="bg-systemBackground rounded-2xl hairline-border p-5">
              <View className="flex-row items-center gap-2 mb-3">
                <MaterialIcon name="smart_toy" size={20} className="text-fe" />
                <Text className="text-[16px] font-semibold text-label">AIアシスタント</Text>
              </View>
              <View className="relative mb-3">
                <TextInput
                  placeholder="何でも質問してください..."
                  placeholderTextColor="#3C3C4399"
                  className="w-full bg-secondarySystemBackground rounded-xl pl-4 pr-10 py-2.5 text-[16px] text-label"
                />
                <Pressable className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <MaterialIcon name="send" size={20} className="text-secondaryLabel" />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {AI_SUGGESTIONS.map((s) => (
                  <Pressable key={s} className="px-3 py-1.5 bg-black/5 rounded-full">
                    <Text className="text-[13px] text-label">{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Now Playing bar */}
      <View className="absolute bottom-6 left-8 right-8 h-[64px] liquid-glass rounded-2xl hairline-border flex-row items-center px-4 z-30">
        <View className="w-12 h-12 rounded-lg bg-fe/10 items-center justify-center mr-4">
          <MaterialIcon name="graphic_eq" size={28} className="text-fe" />
        </View>
        <View className="flex-1 min-w-0 pr-4">
          <Text className="text-[16px] font-semibold text-label" numberOfLines={1}>
            音声解説クイズ
          </Text>
          <Text className="text-[13px] text-secondaryLabel" numberOfLines={1}>
            今夜の配信 21:00
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-full">
            <MaterialIcon name="replay_10" size={24} className="text-secondaryLabel" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-black/5 items-center justify-center">
            <MaterialIcon name="play_arrow" fill size={24} className="text-label" />
          </Pressable>
          <Pressable className="p-2 rounded-full">
            <MaterialIcon name="forward_10" size={24} className="text-secondaryLabel" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
