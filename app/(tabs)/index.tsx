import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, ArrowRight, Play } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { ProgressRing } from '../../components/ui/ProgressRing';

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <View>
            <Text style={{
              fontSize: 14,
              color: COLORS.slate[500],
              fontFamily: 'Inter_500Medium',
              marginBottom: 4,
            }}>
              Good morning
            </Text>
            <Text style={{
              fontSize: 24,
              fontFamily: 'Inter_700Bold',
              color: COLORS.navy,
              letterSpacing: -0.5,
            }}>
              Hi, Kenji
            </Text>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#fff7ed',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}>
            <Flame size={16} color={COLORS.orange[600]} fill={COLORS.orange[600]} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: COLORS.orange[600] }}>12</Text>
          </View>
        </View>

        {/* Daily CTA */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Pressable
            onPress={() => router.push('/quiz/daily' as never)}
            style={{
              backgroundColor: COLORS.coral,
              borderRadius: 24,
              padding: 24,
              shadowColor: COLORS.coral,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              alignSelf: 'flex-start',
              marginBottom: 12,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                Daily Goal
              </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>
              Today's 5 Questions
            </Text>
            <Text style={{ color: '#ffe4e6', fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 20 }}>
              Keep your IT Passport memory fresh.
            </Text>
            <View style={{
              backgroundColor: '#fff',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
            }}>
              <Text style={{ color: COLORS.coral, fontFamily: 'Inter_700Bold', fontSize: 14 }}>Start Quiz</Text>
              <ArrowRight size={16} color={COLORS.coral} />
            </View>
          </Pressable>
        </View>

        {/* Currently Studying */}
        <View style={{ marginTop: 32 }}>
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: COLORS.navy }}>Currently Studying</Text>
            <Pressable>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.slate[400] }}>View All</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            snapToInterval={isTablet ? 300 : 276}
            decelerationRate="fast"
          >
            {/* FE Card */}
            <View style={{
              minWidth: isTablet ? 284 : 260,
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.slate[100],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.04,
              shadowRadius: 20,
              elevation: 2,
            }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blue[500] }} />
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: COLORS.slate[500], textTransform: 'uppercase', letterSpacing: 1 }}>IT Engineer</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', color: COLORS.navy, fontSize: 16 }}>FE Exam Prep</Text>
                <Text style={{ fontSize: 12, color: COLORS.slate[400], fontFamily: 'Inter_400Regular', marginTop: 4 }}>42/120 Lessons</Text>
              </View>
              <ProgressRing progress={35} color={COLORS.blue[500]} />
            </View>

            {/* IT Passport Card */}
            <View style={{
              minWidth: isTablet ? 284 : 260,
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.slate[100],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.04,
              shadowRadius: 20,
              elevation: 2,
            }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.emerald[500] }} />
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: COLORS.slate[500], textTransform: 'uppercase', letterSpacing: 1 }}>Beginner</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', color: COLORS.navy, fontSize: 16 }}>IT Passport</Text>
                <Text style={{ fontSize: 12, color: COLORS.slate[400], fontFamily: 'Inter_400Regular', marginTop: 4 }}>98/100 Lessons</Text>
              </View>
              <ProgressRing progress={98} color={COLORS.emerald[500]} />
            </View>
          </ScrollView>
        </View>

        {/* Jump Back In */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: COLORS.navy, marginBottom: 16 }}>Jump Back In</Text>
          <Pressable
            onPress={() => router.push('/lesson/1' as never)}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              borderWidth: 1,
              borderColor: COLORS.slate[100],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.04,
              shadowRadius: 20,
              elevation: 2,
            }}
          >
            <View style={{
              width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.navy,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Play size={24} color="#fff" fill="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: COLORS.coral, marginBottom: 2 }}>FE Exam • Section 4</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', color: COLORS.slate[800], fontSize: 14 }} numberOfLines={1}>Memory Management & CPU Architecture</Text>
              <Text style={{ fontSize: 12, color: COLORS.slate[500], fontFamily: 'Inter_400Regular', marginTop: 4 }}>12 mins remaining</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
