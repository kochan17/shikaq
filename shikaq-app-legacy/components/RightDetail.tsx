import { View, Text, ScrollView } from 'react-native';
import { MaterialIcon } from './MaterialIcon';
import { GoalRing } from './GoalRing';

interface AgendaItem {
  time: string;
  label: string;
  state: 'done' | 'active' | 'upcoming';
}

const AGENDA: AgendaItem[] = [
  { time: '7:50', label: '朝の5問', state: 'done' },
  { time: '21:00', label: '音声クイズ', state: 'active' },
  { time: '22:30', label: '明日の予習', state: 'upcoming' },
];

export function RightDetail(): React.ReactElement {
  return (
    <View className="w-[300px] h-full bg-systemBackground flex-shrink-0 z-20 border-l border-black/10 flex-col p-6">
      <Text className="text-[22px] font-semibold mb-6 text-label">今日のゴール</Text>

      <View className="items-center mb-8">
        <View className="mb-4">
          <GoalRing progress={0.6} current={3} total={5} />
        </View>
        <View className="bg-secondarySystemBackground px-4 py-2 rounded-full">
          <Text className="text-[13px] font-medium text-label">あと2問 · 約3分</Text>
        </View>
      </View>

      <Text className="text-[16px] font-semibold mb-4 text-label">アジェンダ</Text>
      <View className="relative pl-1">
        <View className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-black/5" />
        <ScrollView className="gap-6" showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      </View>
    </View>
  );
}
