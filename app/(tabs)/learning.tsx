import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, Clock, CheckCircle } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

export default function LearningScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: COLORS.navy }}>My Learning</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: COLORS.slate[500], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>In Progress</Text>
        <Pressable onPress={() => router.push('/course/fe' as never)} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.slate[100], shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.orange[100], alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color={COLORS.orange[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: COLORS.navy, fontSize: 16 }}>FE Exam Prep</Text>
              <Text style={{ fontSize: 12, color: COLORS.slate[400], fontFamily: 'Inter_400Regular' }}>42/120 Lessons</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', color: COLORS.blue[500], fontSize: 14 }}>35%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: COLORS.slate[100], borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: '35%', backgroundColor: COLORS.blue[500], borderRadius: 3 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}>
            <Clock size={12} color={COLORS.slate[400]} />
            <Text style={{ fontSize: 12, color: COLORS.slate[400], fontFamily: 'Inter_400Regular' }}>Last studied 2 hours ago</Text>
          </View>
        </Pressable>

        <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: COLORS.slate[500], textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 4 }}>Completed</Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.slate[100], opacity: 0.7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.emerald[100], alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} color={COLORS.emerald[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: COLORS.navy, fontSize: 16 }}>IT Passport</Text>
              <Text style={{ fontSize: 12, color: COLORS.emerald[600], fontFamily: 'Inter_600SemiBold' }}>100% Complete</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
