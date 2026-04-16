import { View, Text, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Cpu, ShieldCheck, Rocket, TrendingUp } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { useState } from 'react';

type Category = 'all' | 'it' | 'business';

interface CertCard {
  id: string;
  name: string;
  description: string;
  lessons: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  progress: number | null;
  icon: React.ReactNode;
  iconBg: string;
  diffBg: string;
  diffText: string;
}

const CERTS: CertCard[] = [
  { id: 'fe', name: 'Fundamental IT Engineer (FE)', description: 'Master system architecture, network protocols, and software dev lifecycle.', lessons: 120, difficulty: 'Medium', progress: 35, icon: <Cpu size={24} color={COLORS.orange[600]} />, iconBg: COLORS.orange[100], diffBg: COLORS.yellow[100], diffText: COLORS.yellow[700] },
  { id: 'ip', name: 'IT Passport', description: 'Essential IT literacy for business professionals and administrative staff.', lessons: 85, difficulty: 'Easy', progress: 98, icon: <ShieldCheck size={24} color={COLORS.emerald[600]} />, iconBg: COLORS.emerald[100], diffBg: COLORS.emerald[100], diffText: COLORS.emerald[700] },
  { id: 'ap', name: 'Applied IT Engineer (AP)', description: 'Advanced systems design, management strategy, and complex problem solving.', lessons: 210, difficulty: 'Hard', progress: null, icon: <Rocket size={24} color={COLORS.purple[600]} />, iconBg: COLORS.purple[100], diffBg: COLORS.rose[100], diffText: COLORS.rose[700] },
  { id: 'spi', name: 'SPI Corporate Test Prep', description: 'Verbal, non-verbal reasoning and personality profiling strategies.', lessons: 50, difficulty: 'Easy', progress: null, icon: <TrendingUp size={24} color={COLORS.indigo[600]} />, iconBg: COLORS.indigo[100], diffBg: COLORS.emerald[100], diffText: COLORS.emerald[700] },
];

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'it', label: 'IT & Tech' },
  { key: 'business', label: 'Business' },
];

export default function ExploreScreen(): React.ReactElement {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.slate[200] + '80' }}>
        <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: COLORS.navy, marginBottom: 16 }}>Explore</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.slate[200], borderRadius: 16, paddingHorizontal: 16, height: 48, marginBottom: 16 }}>
          <Search size={18} color={COLORS.slate[400]} />
          <TextInput placeholder="Search certifications..." placeholderTextColor={COLORS.slate[400]} value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, marginLeft: 12, fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.navy }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.key} onPress={() => setActiveCategory(cat.key)} style={{ backgroundColor: activeCategory === cat.key ? COLORS.navy : '#fff', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: activeCategory === cat.key ? 0 : 1, borderColor: COLORS.slate[200] }}>
              <Text style={{ color: activeCategory === cat.key ? '#fff' : COLORS.slate[600], fontSize: 14, fontFamily: activeCategory === cat.key ? 'Inter_600SemiBold' : 'Inter_500Medium' }}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, gap: 16, ...(isTablet ? { flexDirection: 'row', flexWrap: 'wrap' } : {}) }}>
        {CERTS.map((cert) => (
          <Pressable key={cert.id} onPress={() => router.push(`/course/${cert.id}` as never)} style={{ backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.slate[100], shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2, ...(isTablet ? { width: (width - 72) / 2 } : {}) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: cert.iconBg, alignItems: 'center', justifyContent: 'center' }}>{cert.icon}</View>
              <View style={{ backgroundColor: cert.diffBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: cert.diffText, textTransform: 'uppercase', letterSpacing: 1 }}>{cert.difficulty}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', color: COLORS.navy, fontSize: 18, marginBottom: 4, lineHeight: 24 }}>{cert.name}</Text>
            <Text style={{ fontSize: 14, color: COLORS.slate[500], fontFamily: 'Inter_400Regular', marginBottom: 16, lineHeight: 20 }} numberOfLines={2}>{cert.description}</Text>
            <View style={{ borderTopWidth: 1, borderTopColor: COLORS.slate[100], paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: COLORS.slate[500] }}>{cert.lessons} Lessons</Text>
              {cert.progress !== null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: COLORS.navy }}>{cert.progress}%</Text>
                  <View style={{ width: 64, height: 6, backgroundColor: COLORS.slate[100], borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${cert.progress}%`, backgroundColor: cert.progress > 80 ? COLORS.emerald[500] : COLORS.blue[500], borderRadius: 3 }} />
                  </View>
                </View>
              ) : (
                <View style={{ backgroundColor: COLORS.rose[50], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: COLORS.coral }}>Start Course</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
