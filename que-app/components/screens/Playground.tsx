import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { MaterialIcon } from '../MaterialIcon';

const CODE_LINES = [
  '// 配列の要素の合計値を求める関数',
  'func sumArray(_ numbers: [Int]) -> Int {',
  '    var total = 0',
  '    for n in numbers {',
  '        total += n',
  '    }',
  '    return total',
  '}',
  '',
  'let data = [1, 2, 3, 4, 5]',
  'let result = sumArray(data)',
  'print(result)',
];

export function Playground(): React.ReactElement {
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      {/* Header */}
      <View className="px-8 pt-8 pb-6 flex-row items-end justify-between">
        <View>
          <Text className="text-[24px] font-semibold text-label tracking-tight">
            Playground（基本情報技術者）
          </Text>
          <Text className="text-[13px] text-secondaryLabel mt-1">科目B（実技）コード実行環境</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable className="p-2">
            <MaterialIcon name="notifications" size={22} className="text-secondaryLabel" />
          </Pressable>
          <Pressable className="p-2">
            <MaterialIcon name="more_horiz" size={22} className="text-secondaryLabel" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <View className="bg-systemBackground rounded-2xl hairline-border p-6 flex-row items-start gap-6">
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-secondaryLabel mb-1">問題</Text>
            <Text className="text-[18px] font-semibold text-label mb-2">
              配列の要素の合計値を求める関数を作成してください。
            </Text>
            <Text className="text-[13px] text-secondaryLabel leading-5">
              整数の配列を受け取り、すべての要素の合計値を返す関数を実装してください。
            </Text>
          </View>
          <Pressable className="bg-systemBlue rounded-full px-5 py-2.5 flex-row items-center gap-2">
            <MaterialIcon name="play_arrow" fill size={18} className="text-white" />
            <Text className="text-white text-[15px] font-semibold">実行</Text>
          </Pressable>
        </View>

        {/* Editor + Result */}
        <View className="flex-row gap-4">
          {/* Editor */}
          <View className="flex-1 bg-systemBackground rounded-2xl hairline-border overflow-hidden">
            <View className="px-5 py-3 border-b border-black/5">
              <Text className="text-[13px] font-semibold text-label">コードエディタ</Text>
            </View>
            <View className="px-5 py-4">
              {CODE_LINES.map((line, i) => (
                <View key={i} className="flex-row">
                  <Text className="text-[12px] text-secondaryLabel w-7 text-right mr-3 font-mono">
                    {i + 1}
                  </Text>
                  <Text className="text-[13px] text-label font-mono">{line}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Result */}
          <View className="flex-1 bg-systemBackground rounded-2xl hairline-border overflow-hidden">
            <View className="px-5 py-3 border-b border-black/5 flex-row justify-between items-center">
              <Text className="text-[13px] font-semibold text-label">実行結果</Text>
              <View className="flex-row items-center gap-1.5">
                <MaterialIcon name="check_circle" fill size={14} className="text-systemGreen" />
                <Text className="text-[11px] text-secondaryLabel">実行完了 0.01 秒</Text>
              </View>
            </View>
            <View className="px-5 py-4">
              <Text className="text-[20px] font-semibold text-label font-mono">15</Text>
            </View>
          </View>
        </View>

        {/* Hint */}
        <Pressable
          onPress={() => setHintOpen(!hintOpen)}
          className="bg-systemBackground rounded-2xl hairline-border p-5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <MaterialIcon name="lightbulb" fill size={20} className="text-systemAmber" />
            <Text className="text-[15px] font-semibold text-label">ヒント</Text>
          </View>
          <MaterialIcon
            name={hintOpen ? 'expand_less' : 'expand_more'}
            size={22}
            className="text-secondaryLabel"
          />
        </Pressable>
        {hintOpen && (
          <View className="bg-systemBackground rounded-2xl hairline-border p-5">
            <Text className="text-[13px] text-secondaryLabel leading-5">
              配列の各要素を順番に取り出して、合計値を 1 つの変数に加算していきます。
              for ループで反復し、初期値を 0 にした合計用変数を更新してください。
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
