import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcon } from './MaterialIcon';
import { ActivityRings } from './ActivityRings';

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

const AI_PILLS = ['なぜ正規化が必要？', 'この問題の解き方は？'];

export function MobileToday(): React.ReactElement {
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
                Today
              </Text>
              <Text className="text-[15px] text-secondaryLabel mt-1">おはよう、Ayumi さん</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-systemOrange/10 px-3 py-1.5 rounded-full">
              <MaterialIcon name="local_fire_department" fill size={14} className="text-systemOrange" />
              <Text className="text-[13px] font-semibold text-systemOrange">14日</Text>
            </View>
          </View>

          {/* Hero Card */}
          <View className="bg-systemBackground rounded hairline-border relative overflow-hidden p-5 h-[200px]">
            <View className="absolute top-[-16px] right-[-16px] w-32 h-32 bg-fe/10 rounded-bl-[60px]" />
            <View className="relative z-10">
              <Text className="text-systemBlue text-[13px] font-semibold mb-2">朝の5問</Text>
              <Text className="text-[26px] font-semibold leading-[32px] tracking-tight text-label w-3/4">
                データベースの{'\n'}正規化
              </Text>
              <Text className="text-[13px] text-secondaryLabel mt-2">基本情報技術者 · 5問 · 約7分</Text>
            </View>
            <View className="absolute bottom-5 right-5 z-10">
              <Pressable className="bg-systemBlue px-5 py-2 rounded-full">
                <Text className="text-white text-[15px] font-medium">始める</Text>
              </Pressable>
            </View>
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

          {/* 今週の記録 */}
          <View>
            <Text className="text-[20px] font-semibold tracking-tight text-label mb-3">今週の記録</Text>
            <View className="bg-systemBackground rounded hairline-border p-4 flex-row items-center gap-5">
              <ActivityRings
                size={80}
                strokeWidth={8}
                rings={[
                  { radius: 40, color: '#007AFF', progress: 0.76 },
                  { radius: 28, color: '#34C759', progress: 0.83 },
                  { radius: 16, color: '#FF9F0A', progress: 0.9 },
                ]}
              />
              <View className="flex-1 gap-1.5">
                <View className="flex-row justify-between items-center border-b border-black/5 pb-1">
                  <Text className="text-[13px] text-secondaryLabel">問題数</Text>
                  <Text className="text-[15px] font-semibold text-label">147</Text>
                </View>
                <View className="flex-row justify-between items-center border-b border-black/5 pb-1">
                  <Text className="text-[13px] text-secondaryLabel">正答率</Text>
                  <Text className="text-[15px] font-semibold text-label">82%</Text>
                </View>
                <View className="flex-row justify-between items-center pb-1">
                  <Text className="text-[13px] text-secondaryLabel">学習時間</Text>
                  <Text className="text-[15px] font-semibold text-label">3h24m</Text>
                </View>
              </View>
            </View>
          </View>

          {/* AI Assistant */}
          <View className="bg-systemBackground rounded hairline-border p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <MaterialIcon name="auto_awesome" size={18} className="text-fe" />
              <Text className="text-[16px] font-semibold text-label">疑問をそのまま聞いてみる</Text>
            </View>
            <View className="bg-secondarySystemBackground rounded-full px-4 py-2 mb-3">
              <Text className="text-[15px] text-secondaryLabel">AIアシスタントに質問...</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {AI_PILLS.map((p) => (
                <Pressable key={p} className="bg-secondarySystemBackground px-3 py-1.5 rounded-full">
                  <Text className="text-[12px] text-label">{p}</Text>
                </Pressable>
              ))}
            </View>
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
