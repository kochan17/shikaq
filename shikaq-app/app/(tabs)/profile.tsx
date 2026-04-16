import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, CreditCard, Bell, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps): React.ReactElement {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 16 }}>
      {icon}
      <Text style={{ flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', color: danger ? COLORS.coral : COLORS.navy }}>{label}</Text>
      {!danger && <ChevronRight size={18} color={COLORS.slate[300]} />}
    </Pressable>
  );
}

export default function ProfileScreen(): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.slate[200], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <User size={36} color={COLORS.slate[400]} />
          </View>
          <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: COLORS.navy, marginBottom: 4 }}>Kenji Tanaka</Text>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.slate[500] }}>kenji@example.com</Text>
          <View style={{ marginTop: 12, backgroundColor: COLORS.emerald[100], paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: COLORS.emerald[700] }}>Premium Member</Text>
          </View>
        </View>
        <View style={{ marginHorizontal: 24, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: COLORS.slate[100], overflow: 'hidden' }}>
          <MenuItem icon={<Settings size={20} color={COLORS.slate[500]} />} label="Settings" />
          <View style={{ height: 1, backgroundColor: COLORS.slate[100], marginHorizontal: 20 }} />
          <MenuItem icon={<CreditCard size={20} color={COLORS.slate[500]} />} label="Subscription" />
          <View style={{ height: 1, backgroundColor: COLORS.slate[100], marginHorizontal: 20 }} />
          <MenuItem icon={<Bell size={20} color={COLORS.slate[500]} />} label="Notifications" />
          <View style={{ height: 1, backgroundColor: COLORS.slate[100], marginHorizontal: 20 }} />
          <MenuItem icon={<HelpCircle size={20} color={COLORS.slate[500]} />} label="Help & Support" />
        </View>
        <View style={{ marginHorizontal: 24, marginTop: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: COLORS.slate[100], overflow: 'hidden' }}>
          <MenuItem icon={<LogOut size={20} color={COLORS.coral} />} label="Sign Out" danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
