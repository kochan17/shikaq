import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcon } from '../MaterialIcon';
import { fetchBookmarks, type BookmarkEntry } from '../../lib/supabase/queries';
import { useAuth } from '../AuthProvider';

export function Bookmarks(): React.ReactElement {
  const { user } = useAuth();
  const [items, setItems] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) return;
    fetchBookmarks(user.id)
      .then(setItems)
      .catch(() => {
        // silent
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      <View className="px-8 pt-8 pb-6">
        <Text className="text-[28px] font-semibold text-label tracking-tight">ブックマーク</Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">あとで見返したい問題・解説</Text>
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      {!loading && items.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <MaterialIcon name="bookmark_border" size={56} className="text-secondaryLabel" />
          <Text className="text-[15px] text-secondaryLabel mt-3">
            ブックマークした問題はまだありません
          </Text>
        </View>
      )}

      {!loading && items.length > 0 && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48, gap: 12 }}
        >
          {items.map((item) => (
            <View
              key={item.id}
              className="bg-systemBackground rounded-2xl hairline-border p-5 flex-row items-start gap-3"
            >
              <MaterialIcon
                name={item.target_type === 'question' ? 'help' : 'menu_book'}
                fill
                size={20}
                className="text-secondaryLabel"
              />
              <View className="flex-1">
                <Text className="text-[12px] text-secondaryLabel mb-1">
                  {item.target_type === 'question' ? '問題' : 'レッスン'}
                </Text>
                <Text className="text-[15px] text-label leading-snug" numberOfLines={3}>
                  {item.preview ?? '(参照先が見つかりません)'}
                </Text>
              </View>
              <MaterialIcon name="chevron_right" size={20} className="text-secondaryLabel" />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
