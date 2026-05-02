import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcon } from '../../components/MaterialIcon';
import {
  ONBOARDING_QUESTIONS,
  saveOnboardingResult,
  type CertificationId,
} from '../../data/onboarding-questions';

const CERT_LABELS: Record<CertificationId, string> = {
  ip: 'ITパスポート',
  fe: '基本情報技術者',
  spi: 'SPI',
  boki: '簿記 2 級',
};

function isCertId(value: unknown): value is CertificationId {
  return value === 'ip' || value === 'fe' || value === 'spi' || value === 'boki';
}

export default function OnboardingResult(): React.ReactElement {
  const router = useRouter();
  const { cert, correct } = useLocalSearchParams<{ cert: string; correct: string }>();

  const certId: CertificationId = isCertId(cert) ? cert : 'ip';
  const isCorrect = correct === 'true';
  const question = ONBOARDING_QUESTIONS[certId];

  const correctChoice = question.choices.find((c) => c.id === question.correctChoiceId);

  useEffect(() => {
    saveOnboardingResult({
      cert: certId,
      correct: isCorrect,
      completedAt: new Date().toISOString(),
    });
  }, [certId, isCorrect]);

  function handleContinue(): void {
    router.push('/login' as never);
  }

  function handleLater(): void {
    router.push('/login' as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-systemBackground">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pb-10 justify-between" style={{ minHeight: '100%' }}>
          <View className="pt-12 pb-8 items-center">
            <View
              className={`w-20 h-20 rounded-full items-center justify-center mb-5 ${
                isCorrect ? 'bg-systemGreen/15' : 'bg-systemOrange/15'
              }`}
            >
              <MaterialIcon
                name={isCorrect ? 'check_circle' : 'lightbulb'}
                size={40}
                className={isCorrect ? 'text-systemGreen' : 'text-systemOrange'}
                fill
              />
            </View>

            <Text
              className="text-label text-center mb-2"
              style={{ fontSize: 22, fontWeight: '700', lineHeight: 30 }}
            >
              {isCorrect
                ? '正解です。'
                : '惜しい！'}
            </Text>
            <Text
              className="text-secondaryLabel text-center"
              style={{ fontSize: 15, lineHeight: 22 }}
            >
              {isCorrect
                ? 'あなたは合格に少し近づきました。'
                : `正解は「${correctChoice?.text ?? ''}」でした。`}
            </Text>
          </View>

          <View className="bg-systemBackground rounded-2xl p-5 mb-8" style={{ borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' }}>
            <View className="flex-row items-center gap-2 mb-3">
              <MaterialIcon name="info" size={16} className="text-secondaryLabel" />
              <Text className="text-secondaryLabel" style={{ fontSize: 12, fontWeight: '600' }}>
                {CERT_LABELS[certId]} の解説
              </Text>
            </View>
            <Text
              className="text-label"
              style={{ fontSize: 13, lineHeight: 20 }}
            >
              {question.explanation}
            </Text>
          </View>

          <View className="gap-3">
            <View className="bg-systemBlue/10 rounded-2xl p-4 mb-2">
              <Text
                className="text-systemBlue text-center"
                style={{ fontSize: 13, fontWeight: '500' }}
              >
                {Platform.OS === 'web'
                  ? '続きはアカウントを作成するとすべて無料で使えます。'
                  : '続きはアプリで。アカウントを作成すると\nすべての機能が無料で使えます。'}
              </Text>
            </View>

            <Pressable
              onPress={handleContinue}
              className="bg-systemBlue rounded-full h-[52px] items-center justify-center"
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text className="text-white" style={{ fontSize: 17, fontWeight: '600' }}>
                続きを始める
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLater}
              className="h-[44px] items-center justify-center"
            >
              <Text className="text-secondaryLabel" style={{ fontSize: 15 }}>
                あとで
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
