import { View, Text, Pressable, ScrollView } from 'react-native';
import { MaterialIcon } from './MaterialIcon';

interface CertItem {
  dotClass: string;
  label: string;
  selected?: boolean;
  selectedTextClass?: string;
  selectedBgClass?: string;
}

const CERTS: CertItem[] = [
  { dotClass: 'bg-itPassport', label: 'ITパスポート' },
  {
    dotClass: 'bg-fe',
    label: '基本情報技術者',
    selected: true,
    selectedTextClass: 'text-fe',
    selectedBgClass: 'bg-fe/10',
  },
  { dotClass: 'bg-spi', label: 'SPI' },
  { dotClass: 'bg-boki', label: '簿記2級' },
];

interface MenuItem {
  icon: string;
  label: string;
  selected?: boolean;
}

const MENU: MenuItem[] = [
  { icon: 'home', label: 'Today', selected: true },
  { icon: 'menu_book', label: 'Learn' },
  { icon: 'edit_document', label: 'Practice' },
  { icon: 'smart_toy', label: 'AI Q&A' },
  { icon: 'bar_chart', label: 'Summary' },
  { icon: 'person', label: 'Profile' },
];

export function Sidebar(): React.ReactElement {
  return (
    <View className="w-[260px] h-full liquid-glass flex-col flex-shrink-0 z-20 border-r border-black/10">
      {/* Profile */}
      <View className="px-6 py-8 items-center">
        <View className="w-16 h-16 rounded-full bg-secondarySystemBackground mb-4 hairline-border" />
        <Text className="text-[17px] font-semibold mb-2 text-label">おはよう、Ayumi さん</Text>
        <View className="flex-row items-center gap-1.5 bg-systemOrange/10 px-3 py-1 rounded-full">
          <MaterialIcon name="local_fire_department" fill size={14} className="text-systemOrange" />
          <Text className="text-[13px] font-medium text-systemOrange tracking-tight">14日連続</Text>
        </View>
      </View>

      {/* Nav */}
      <ScrollView className="flex-1 px-3 pb-8" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-[13px] font-semibold text-secondaryLabel uppercase tracking-wider px-3 mb-2">
            資格
          </Text>
          <View className="gap-1">
            {CERTS.map((cert) => (
              <Pressable
                key={cert.label}
                className={`flex-row items-center gap-3 px-3 py-2 rounded-xl ${cert.selectedBgClass ?? ''}`}
              >
                <View className={`w-2.5 h-2.5 rounded-full ${cert.dotClass}`} />
                <Text
                  className={`text-[17px] ${
                    cert.selected ? `${cert.selectedTextClass} font-semibold` : 'text-secondaryLabel'
                  }`}
                >
                  {cert.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-[13px] font-semibold text-secondaryLabel uppercase tracking-wider px-3 mb-2">
            メニュー
          </Text>
          <View className="gap-1">
            {MENU.map((m) => (
              <Pressable
                key={m.label}
                className={`flex-row items-center gap-3 px-3 py-2 rounded-xl ${
                  m.selected ? 'bg-systemBlue/10' : ''
                }`}
              >
                <MaterialIcon
                  name={m.icon}
                  fill={Boolean(m.selected)}
                  size={20}
                  className={m.selected ? 'text-systemBlue' : 'text-secondaryLabel'}
                />
                <Text
                  className={`text-[17px] ${
                    m.selected ? 'text-systemBlue font-semibold' : 'text-secondaryLabel'
                  }`}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
