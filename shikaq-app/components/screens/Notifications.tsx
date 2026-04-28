import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcon } from '../MaterialIcon';
import {
  fetchNotifications,
  markAllNotificationsRead,
  type NotificationEntry,
} from '../../lib/supabase/queries';
import { useAuth } from '../AuthProvider';

const KIND_ICON: Record<NotificationEntry['kind'], string> = {
  streak: 'local_fire_department',
  reminder: 'alarm',
  system: 'campaign',
  subscription: 'workspace_premium',
};

export function Notifications(): React.ReactElement {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) return;
    void (async () => {
      try {
        const list = await fetchNotifications(user.id);
        setItems(list);
        await markAllNotificationsRead(user.id);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      <View className="px-8 pt-8 pb-4">
        <Text className="text-[28px] font-semibold text-label tracking-tight">通知</Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">学習リマインダーとお知らせ</Text>
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      {!loading && items.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <MaterialIcon name="notifications_none" size={56} className="text-secondaryLabel" />
          <Text className="text-[15px] text-secondaryLabel mt-3">通知はありません</Text>
        </View>
      )}

      {!loading && items.length > 0 && (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, gap: 8 }}>
          {items.map((n) => (
            <View
              key={n.id}
              className="bg-systemBackground rounded-xl hairline-border p-4 flex-row items-start gap-3"
            >
              <MaterialIcon name={KIND_ICON[n.kind]} fill size={20} className="text-systemBlue" />
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-label">{n.title}</Text>
                {n.body !== null && (
                  <Text className="text-[13px] text-secondaryLabel mt-0.5">{n.body}</Text>
                )}
                <Text className="text-[11px] text-secondaryLabel mt-1">
                  {new Date(n.created_at).toLocaleString('ja-JP')}
                </Text>
              </View>
              {n.read_at === null && (
                <View className="w-2 h-2 rounded-full bg-systemBlue mt-2" />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
