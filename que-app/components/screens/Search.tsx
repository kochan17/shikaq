import { useState } from 'react';
import { BrandSpinner } from '../BrandSpinner';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { MaterialIcon } from '../MaterialIcon';
import { globalSearch, type SearchResult } from '../../lib/supabase/queries';

export function Search(): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);

  async function run(): Promise<void> {
    if (query.trim() === '') return;
    setBusy(true);
    try {
      const r = await globalSearch(query);
      setResults(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      <View className="px-8 pt-8 pb-4">
        <Text className="text-[28px] font-semibold text-label tracking-tight">検索</Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">レッスン・問題から探す</Text>
      </View>

      <View className="px-8 pb-4">
        <View className="flex-row items-center bg-systemBackground rounded-full hairline-border px-5 h-[48px]">
          <MaterialIcon name="search" size={20} className="text-secondaryLabel mr-3" />
          <TextInput
            className="flex-1 text-[15px] text-label"
            placeholder="キーワードを入力"
            placeholderTextColor="#3C3C4399"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void run()}
            autoFocus
          />
          {busy && <BrandSpinner size={20} />}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
        {results.length === 0 && query.trim() !== '' && !busy && (
          <Text className="text-[13px] text-secondaryLabel text-center mt-8">
            一致する結果がありません
          </Text>
        )}
        {results.map((r) => (
          <View
            key={`${r.type}:${r.id}`}
            className="bg-systemBackground rounded-xl hairline-border p-4 gap-1"
          >
            <View className="flex-row items-center gap-2">
              <MaterialIcon
                name={r.type === 'lesson' ? 'menu_book' : 'help'}
                fill
                size={14}
                className="text-secondaryLabel"
              />
              <Text className="text-[11px] uppercase tracking-wider text-secondaryLabel">
                {r.type === 'lesson' ? 'レッスン' : '問題'}
              </Text>
            </View>
            <Text className="text-[15px] font-semibold text-label" numberOfLines={2}>
              {r.title}
            </Text>
            {r.preview !== null && (
              <Text className="text-[13px] text-secondaryLabel" numberOfLines={2}>
                {r.preview}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
