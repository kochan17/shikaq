import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { useState } from 'react';

interface Choice {
  id: string;
  text: string;
}

const QUESTION = {
  text: 'Which of the following is the correct description of cache memory?',
  choices: [
    { id: 'a', text: 'A type of auxiliary storage that compensates for insufficient main memory capacity' },
    { id: 'b', text: 'High-speed memory placed between the CPU and main memory to reduce access time differences' },
    { id: 'c', text: 'Memory that stores the BIOS and is read-only' },
    { id: 'd', text: 'Virtual memory implemented on the hard disk' },
  ] satisfies Choice[],
  correctId: 'b',
  explanation: 'Cache memory is high-speed memory placed between the CPU and main memory to bridge the speed gap between the two.',
};

export default function QuizScreen(): React.ReactElement {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = submitted && selectedId === QUESTION.correctId;

  const handleSubmit = (): void => {
    if (selectedId) setSubmitted(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate[100] }}>
        <Pressable onPress={() => router.back()}><X size={24} color={COLORS.slate[500]} /></Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 120, height: 4, backgroundColor: COLORS.slate[100], borderRadius: 2, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: '12%', backgroundColor: COLORS.coral, borderRadius: 2 }} />
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: COLORS.slate[500] }}>3/25</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.slate[50], paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
          <Clock size={14} color={COLORS.slate[500]} />
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: COLORS.navy }}>2:34</Text>
        </View>
      </View>

      {/* Question */}
      <View style={{ flex: 1, paddingHorizontal: isTablet ? 48 : 24, paddingTop: 32, maxWidth: isTablet ? 720 : undefined, alignSelf: 'center', width: '100%' }}>
        <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: COLORS.coral, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Question 3</Text>
        <Text style={{ fontSize: 18, fontFamily: 'Inter_600SemiBold', color: COLORS.navy, lineHeight: 28, marginBottom: 32 }}>{QUESTION.text}</Text>

        <View style={{ gap: 12 }}>
          {QUESTION.choices.map((choice) => {
            const isSelected = selectedId === choice.id;
            const isAnswer = choice.id === QUESTION.correctId;
            let borderColor = COLORS.slate[200];
            let bgColor = '#fff';
            if (submitted) {
              if (isAnswer) { borderColor = COLORS.emerald[500]; bgColor = COLORS.emerald[100] + '40'; }
              else if (isSelected) { borderColor = COLORS.coral; bgColor = COLORS.rose[50]; }
            } else if (isSelected) { borderColor = COLORS.navy; bgColor = COLORS.slate[50]; }

            return (
              <Pressable key={choice.id} onPress={() => !submitted && setSelectedId(choice.id)} style={{ borderWidth: 2, borderColor, backgroundColor: bgColor, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                  borderColor: submitted && isAnswer ? COLORS.emerald[500] : submitted && isSelected ? COLORS.coral : isSelected ? COLORS.navy : COLORS.slate[300],
                  backgroundColor: isSelected && !submitted ? COLORS.navy : submitted && isAnswer ? COLORS.emerald[500] : submitted && isSelected ? COLORS.coral : 'transparent',
                }}>
                  {submitted && isAnswer ? <CheckCircle size={16} color="#fff" /> : submitted && isSelected && !isAnswer ? <XCircle size={16} color="#fff" /> : <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: isSelected && !submitted ? '#fff' : COLORS.slate[500] }}>{choice.id.toUpperCase()}</Text>}
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular', color: COLORS.navy, lineHeight: 20 }}>{choice.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {submitted && (
          <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: isCorrect ? COLORS.emerald[100] + '60' : COLORS.rose[50], borderWidth: 1, borderColor: isCorrect ? COLORS.emerald[500] + '30' : COLORS.coral + '30' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: isCorrect ? COLORS.emerald[700] : COLORS.coral, marginBottom: 4 }}>{isCorrect ? 'Correct!' : 'Incorrect'}</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: COLORS.slate[600], lineHeight: 20 }}>{QUESTION.explanation}</Text>
          </View>
        )}
      </View>

      {/* Submit */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}>
        <Pressable onPress={submitted ? () => router.back() : handleSubmit} style={{
          backgroundColor: selectedId ? COLORS.navy : COLORS.slate[200], borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
          shadowColor: selectedId ? COLORS.navy : 'transparent', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: selectedId ? 8 : 0,
        }}>
          <Text style={{ color: selectedId ? '#fff' : COLORS.slate[400], fontSize: 16, fontFamily: 'Inter_700Bold' }}>{submitted ? 'Next Question' : 'Submit Answer'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
