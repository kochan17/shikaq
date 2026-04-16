import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Play, ChevronDown, ChevronUp, Check, Lock, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { useState } from 'react';

type SectionStatus = 'completed' | 'active' | 'locked';
type LessonStatus = 'completed' | 'active' | 'locked';

interface LessonData {
  title: string;
  duration: string;
  status: LessonStatus;
}

interface SectionData {
  title: string;
  status: SectionStatus;
  lessons: LessonData[];
}

const SECTIONS: SectionData[] = [
  { title: 'Section 1: Computer Systems', status: 'completed', lessons: [
    { title: 'Digital Data Representation', duration: '15:20', status: 'completed' },
    { title: 'Boolean Algebra', duration: '12:05', status: 'completed' },
  ]},
  { title: 'Section 2: Memory & Architecture', status: 'active', lessons: [
    { title: 'CPU Registers', duration: '10:30', status: 'completed' },
    { title: 'Instruction Cycles', duration: '11:45', status: 'completed' },
    { title: 'Memory Hierarchy & Cache', duration: '14:05', status: 'active' },
    { title: 'Interrupt Processing', duration: '9:50', status: 'locked' },
  ]},
  { title: 'Section 3: Databases', status: 'locked', lessons: [
    { title: 'Relational Model', duration: '13:20', status: 'locked' },
    { title: 'SQL Fundamentals', duration: '16:10', status: 'locked' },
  ]},
];

function SectionAccordion({ section }: { section: SectionData }): React.ReactElement {
  const [expanded, setExpanded] = useState(section.status === 'active');
  const router = useRouter();
  const completedCount = section.lessons.filter((l) => l.status === 'completed').length;

  return (
    <View style={{
      backgroundColor: section.status === 'locked' ? COLORS.slate[50] : '#fff',
      borderRadius: 16, borderWidth: 1,
      borderColor: section.status === 'active' ? COLORS.coral + '40' : COLORS.slate[200],
      overflow: 'hidden', opacity: section.status === 'locked' ? 0.7 : 1,
      ...(section.status === 'active' ? { shadowColor: COLORS.coral, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 } : {}),
    }}>
      <Pressable onPress={() => setExpanded(!expanded)} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: section.status === 'completed' ? COLORS.emerald[100] : section.status === 'active' ? COLORS.coral + '20' : COLORS.slate[200],
          }}>
            {section.status === 'completed' ? <Check size={16} color={COLORS.emerald[600]} /> : section.status === 'locked' ? <Lock size={14} color={COLORS.slate[500]} /> : <Text style={{ color: COLORS.coral, fontFamily: 'Inter_700Bold', fontSize: 13 }}>2</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: COLORS.navy }}>{section.title}</Text>
            <Text style={{ fontSize: 12, color: section.status === 'active' ? COLORS.coral : COLORS.slate[500], fontFamily: section.status === 'active' ? 'Inter_500Medium' : 'Inter_400Regular', marginTop: 2 }}>{completedCount}/{section.lessons.length} Lessons{section.status === 'active' ? ' • Active' : ''}</Text>
          </View>
        </View>
        {expanded ? <ChevronUp size={18} color={COLORS.slate[400]} /> : <ChevronDown size={18} color={COLORS.slate[400]} />}
      </Pressable>
      {expanded && (
        <View style={{ paddingHorizontal: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: COLORS.slate[100] }}>
          {section.lessons.map((lesson, i) => (
            <Pressable key={i} onPress={() => { if (lesson.status !== 'locked') router.push('/lesson/1' as never); }} style={{
              flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
              ...(lesson.status === 'active' ? { backgroundColor: COLORS.rose[50], borderWidth: 1, borderColor: COLORS.rose[100] } : {}),
              opacity: lesson.status === 'locked' ? 0.5 : 1,
            }}>
              {lesson.status === 'completed' ? <Check size={16} color={COLORS.emerald[500]} /> : lesson.status === 'active' ? <Play size={16} color={COLORS.coral} fill={COLORS.coral} /> : <Lock size={14} color={COLORS.slate[400]} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: lesson.status === 'active' ? 'Inter_700Bold' : 'Inter_500Medium', color: lesson.status === 'active' ? COLORS.coral : COLORS.slate[700] }}>{lesson.title}</Text>
                {lesson.status === 'active' && <Text style={{ fontSize: 12, color: COLORS.rose[500], fontFamily: 'Inter_400Regular', marginTop: 2 }}>Playing • {lesson.duration}</Text>}
              </View>
              {lesson.status !== 'active' && <Text style={{ fontSize: 12, color: COLORS.slate[400], fontFamily: 'Inter_400Regular' }}>{lesson.duration}</Text>}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CourseDetailScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Hero */}
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center' }}>
        <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', marginLeft: 16, marginTop: 8 }}>
            <ChevronLeft size={22} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center' }}>
          <Play size={28} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 24 }}>
          <View style={{ backgroundColor: COLORS.blue[100], paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: COLORS.blue[700], textTransform: 'uppercase', letterSpacing: 1 }}>Information Technology</Text>
          </View>
          <Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: COLORS.navy, lineHeight: 32, marginBottom: 8 }}>Fundamental IT Engineer (FE) Mastery</Text>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.slate[500], lineHeight: 22, marginBottom: 24 }}>Master the required knowledge for Japan's national IT engineer examination.</Text>

          {/* Progress */}
          <View style={{ backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.slate[200], borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: COLORS.slate[500], textTransform: 'uppercase', letterSpacing: 1 }}>Overall Progress</Text>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: COLORS.navy, marginTop: 4 }}>35% <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.slate[400] }}>/ 42 lessons done</Text></Text>
            <View style={{ height: 8, backgroundColor: COLORS.slate[200], borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
              <View style={{ height: '100%', width: '35%', backgroundColor: COLORS.coral, borderRadius: 4 }} />
            </View>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', gap: 24, borderBottomWidth: 1, borderBottomColor: COLORS.slate[200], marginBottom: 24 }}>
            <View style={{ paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: COLORS.navy }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: COLORS.navy }}>Curriculum</Text>
            </View>
            <View style={{ paddingBottom: 12 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.slate[400] }}>Details</Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            {SECTIONS.map((section, i) => <SectionAccordion key={i} section={section} />)}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: COLORS.slate[200] + '80', padding: 24, paddingBottom: 40 }}>
        <Pressable onPress={() => router.push('/lesson/1' as never)} style={{ backgroundColor: COLORS.navy, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' }}>Continue Learning</Text>
          <ArrowRight size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
