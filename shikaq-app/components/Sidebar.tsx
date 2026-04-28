import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, Platform } from 'react-native';
import { MaterialIcon } from './MaterialIcon';
import { startCheckout } from '../lib/supabase/queries';

export type ScreenKey =
  | 'today'
  | 'learn'
  | 'practice'
  | 'ai-qa'
  | 'audio'
  | 'bookmarks'
  | 'summary'
  | 'playground'
  | 'admin'
  | 'profile'
  | 'search'
  | 'notifications';

interface NavItem {
  key: ScreenKey;
  icon: string;
  label: string;
}

const USER_NAV: NavItem[] = [
  { key: 'today', icon: 'home', label: 'ダッシュボード' },
  { key: 'learn', icon: 'menu_book', label: 'コース一覧' },
  { key: 'practice', icon: 'edit_document', label: '復習リスト' },
  { key: 'ai-qa', icon: 'auto_awesome', label: 'AI Q&A' },
  { key: 'audio', icon: 'graphic_eq', label: '音声解説' },
  { key: 'bookmarks', icon: 'bookmark', label: 'ブックマーク' },
  { key: 'summary', icon: 'bar_chart', label: '学習履歴' },
];

const ADMIN_NAV: NavItem[] = [{ key: 'admin', icon: 'admin_panel_settings', label: 'Admin' }];

interface SidebarProps {
  activeScreen: ScreenKey;
  onNavigate: (key: ScreenKey) => void;
  onLogout: () => void;
  userName?: string | null;
  isAdmin?: boolean;
}

function PremiumCard(): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const url = await startCheckout();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="mx-4 mb-3 p-4 rounded-xl hairline-border bg-secondarySystemBackground">
      <Text className="text-[13px] font-semibold text-label mb-1">shikaq プレミアム</Text>
      <Text className="text-[11px] text-secondaryLabel mb-1">月額 ¥980（税込）</Text>
      <Text className="text-[11px] text-secondaryLabel mb-3">すべての機能を利用できます</Text>
      <Pressable
        onPress={() => void handleCheckout()}
        disabled={busy}
        className="bg-systemBackground rounded-full py-1.5 hairline-border items-center"
      >
        <Text className="text-[12px] font-semibold text-label">
          {busy ? '読み込み中…' : 'プランを確認'}
        </Text>
      </Pressable>
      {error !== null && <Text className="text-[10px] text-systemRed mt-1">{error}</Text>}
    </View>
  );
}

function NavRow({
  item,
  selected,
  onPress,
}: {
  item: NavItem;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      // nav-row-hover provides CSS hover (scale + bg) on web; selected overrides bg
      className={`nav-row-hover flex-row items-center gap-3 px-3 py-2 rounded-xl overflow-hidden ${
        selected ? 'bg-secondarySystemFill' : ''
      }`}
    >
      {/* Active indicator: 3px left accent bar */}
      {selected && (
        <View
          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-systemBlue"
          style={{ position: 'absolute' }}
        />
      )}
      <MaterialIcon
        name={item.icon}
        fill={selected}
        size={20}
        className={selected ? 'text-label' : 'text-secondaryLabel'}
      />
      <Text
        className={`text-[15px] ${selected ? 'text-label font-semibold' : 'text-secondaryLabel'}`}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

export function Sidebar({
  activeScreen,
  onNavigate,
  onLogout,
  userName,
  isAdmin = false,
}: SidebarProps): React.ReactElement {
  const displayName = userName ?? '和田 夏海';

  return (
    // liquid-glass on web: backdrop-filter blur(26px) + rgba white 0.7
    // native: falls back to plain systemBackground (native doesn't support backdrop-filter)
    <View
      className={`w-[260px] h-full flex-col flex-shrink-0 sidebar-hairline-r z-20 ${
        Platform.OS === 'web' ? 'liquid-glass' : 'bg-systemBackground'
      }`}
    >
      <View className="px-6 py-6">
        <Text className="text-[22px] font-semibold text-label tracking-tight">shikaq</Text>
      </View>

      <ScrollView
        className="flex-1 px-3"
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-0.5">
          {USER_NAV.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              selected={item.key === activeScreen}
              onPress={() => onNavigate(item.key)}
            />
          ))}
        </View>

        {isAdmin && (
          <View className="mt-6">
            <Text className="text-[11px] font-semibold text-secondaryLabel uppercase tracking-wider px-3 mb-2">
              運営
            </Text>
            <View className="gap-0.5">
              {ADMIN_NAV.map((item) => (
                <NavRow
                  key={item.key}
                  item={item}
                  selected={item.key === activeScreen}
                  onPress={() => onNavigate(item.key)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <PremiumCard />

      <Pressable
        onPress={() => onNavigate('profile')}
        className="sidebar-hairline-t px-4 py-3 flex-row items-center gap-3"
      >
        <View className="w-9 h-9 rounded-full bg-secondarySystemBackground hairline-border" />
        <View className="flex-1 min-w-0">
          <Text className="text-[13px] font-semibold text-label" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-[11px] text-secondaryLabel" numberOfLines={1}>
            {isAdmin ? '運営アカウント' : 'プレミアム会員'}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onLogout();
          }}
          className="p-1.5 rounded-full"
        >
          <MaterialIcon name="logout" size={18} className="text-secondaryLabel" />
        </Pressable>
      </Pressable>
    </View>
  );
}
