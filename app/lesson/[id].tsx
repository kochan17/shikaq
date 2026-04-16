import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Play, Pause, ChevronRight, Subtitles } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { useState } from 'react';

type TabKey = 'notes' | 'transcript' | 'qa';

export default function LessonPlayerScreen(): React.ReactElement {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const [playing, setPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('notes');
  const splitView = isTablet && isLandscape;

  const videoPlayer = (
    <View style={{
      width: splitView ? '55%' : '100%',
      aspectRatio: splitView ? undefined : 16 / 9,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
      ...(splitView ? { flex: 1 } : {}),
    }}>
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ChevronLeft size={22} color="rgba(255,255,255,0.8)" />
            <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.8)' }}>Back to Course</Text>
          </Pressable>
          <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Subtitles size={20} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
      <Pressable onPress={() => setPlaying(!playing)} style={{ width: splitView ? 80 : 64, height: splitView ? 80 : 64, borderRadius: splitView ? 40 : 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        {playing ? <Pause size={30} color="#fff" /> : <Play size={30} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />}
      </Pressable>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 16, paddingTop: 32 }}>
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 }}>
          <View style={{ height: '100%', width: '45%', backgroundColor: COLORS.coral, borderRadius: 3 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' }}>06:14</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' }}>14:05</Text>
        </View>
      </View>
    </View>
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'notes', label: 'Notes' },
    { key: 'transcript', label: 'Transcript' },
    { key: 'qa', label: 'Q&A' },
  ];

  const contentPane = (
    <View style={{ flex: splitView ? 1 : undefined, backgroundColor: COLORS.background, borderLeftWidth: splitView ? 1 : 0, borderLeftColor: COLORS.slate[200] }}>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.slate[200], backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: splitView ? 24 : 0 }}>
        {TABS.map((tab) => (
          <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={{ paddingBottom: 12, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: activeTab === tab.key ? COLORS.coral : 'transparent' }}>
            <Text style={{ fontSize: 14, fontFamily: activeTab === tab.key ? 'Inter_700Bold' : 'Inter_500Medium', color: activeTab === tab.key ? COLORS.coral : COLORS.slate[500] }}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: COLORS.coral, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Section 2 • Lesson 4</Text>
        <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: COLORS.navy, marginBottom: 16, lineHeight: 28 }}>Memory Hierarchy & Cache</Text>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.slate[600], lineHeight: 24, marginBottom: 16 }}>Cache memory acts as a high-speed buffer between the CPU and main memory (RAM). Understanding the memory hierarchy is fundamental to optimizing system performance.</Text>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.slate[600], lineHeight: 24 }}>
          Key concepts covered in this lesson:{'\n'}{'\n'}• L1, L2, L3 cache levels and their characteristics{'\n'}• Cache hit rate and its impact on performance{'\n'}• Memory access patterns and locality principles{'\n'}• Write-through vs write-back cache policies
        </Text>
      </ScrollView>
    </View>
  );

  if (splitView) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#000' }}>
        {videoPlayer}
        {contentPane}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {videoPlayer}
      <View style={{ flex: 1 }}>{contentPane}</View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 40, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.slate[100] }}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ChevronLeft size={18} color={COLORS.slate[400]} />
          <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: COLORS.slate[400] }}>Previous</Text>
        </Pressable>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: COLORS.coral }}>Next Lesson</Text>
          <ChevronRight size={18} color={COLORS.coral} />
        </Pressable>
      </View>
    </View>
  );
}
