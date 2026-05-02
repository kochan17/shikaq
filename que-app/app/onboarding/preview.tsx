import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcon } from '../../components/MaterialIcon';
import {
  ONBOARDING_QUESTIONS,
  type CertificationId,
} from '../../data/onboarding-questions';

function hapticSelection(): void {
  if (Platform.OS !== 'web') {
    Vibration.vibrate(10);
  }
}

function hapticSuccess(): void {
  if (Platform.OS !== 'web') {
    Vibration.vibrate([0, 20, 50, 20]);
  }
}

function hapticWarning(): void {
  if (Platform.OS !== 'web') {
    Vibration.vibrate([0, 30, 80]);
  }
}

const CERT_LABELS: Record<CertificationId, string> = {
  ip: 'ITパスポート',
  fe: '基本情報技術者',
  spi: 'SPI',
  boki: '簿記 2 級',
};

function isCertId(value: unknown): value is CertificationId {
  return value === 'ip' || value === 'fe' || value === 'spi' || value === 'boki';
}

export default function OnboardingPreview(): React.ReactElement {
  const router = useRouter();
  const { cert } = useLocalSearchParams<{ cert: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const certId: CertificationId = isCertId(cert) ? cert : 'ip';
  const question = ONBOARDING_QUESTIONS[certId];

  async function handleSelect(choiceId: string): Promise<void> {
    if (selectedId !== null) return;
    setSelectedId(choiceId);

    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    const isCorrect = choiceId === question.correctChoiceId;

    if (Platform.OS !== 'web') {
      if (isCorrect) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }

    setTimeout(() => {
      router.push(
        `/onboarding/result?cert=${certId}&correct=${isCorrect ? 'true' : 'false'}` as never
      );
    }, 600);
  }

  return (
    <SafeAreaView className="flex-1 bg-systemBackground">
      <View className="flex-row items-center px-4 pt-2 pb-1">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
        >
          <MaterialIcon name="arrow_back_ios" size={20} className="text-systemBlue" />
        </Pressable>
        <Text className="flex-1 text-center text-[12px] text-secondaryLabel">
          {CERT_LABELS[certId]}
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pb-8">
          <View className="flex-1 justify-center py-8">
            <Text
              className="text-secondaryLabel mb-4"
              style={{ fontSize: 12 }}
            >
              体験問題
            </Text>
            <Text
              className="text-label"
              style={{ fontSize: 17, lineHeight: 28, fontWeight: '400' }}
            >
              {question.question}
            </Text>
          </View>

          <View className="gap-3 pb-4">
            {question.choices.map((choice) => {
              const isSelected = selectedId === choice.id;
              const isAnswered = selectedId !== null;
              const isCorrect = choice.id === question.correctChoiceId;

              let borderColor = 'rgba(0,0,0,0.1)';
              let bgColor = 'bg-systemBackground';

              if (isAnswered) {
                if (isCorrect) {
                  borderColor = '#34C759';
                  bgColor = 'bg-systemGreen/10';
                } else if (isSelected && !isCorrect) {
                  borderColor = '#FF9F0A';
                  bgColor = 'bg-systemOrange/10';
                }
              }

              return (
                <Pressable
                  key={choice.id}
                  onPress={() => void handleSelect(choice.id)}
                  disabled={isAnswered}
                  className={`${bgColor} rounded-2xl px-4 py-4 flex-row items-center gap-3`}
                  style={(state) => {
                    const isHovered =
                      'hovered' in state && (state as { hovered: boolean }).hovered;
                    return {
                      borderWidth: 0.5,
                      borderColor,
                      opacity: isAnswered && !isSelected && !isCorrect ? 0.5 : 1,
                      transform: [
                        {
                          scale:
                            state.pressed && !isAnswered
                              ? 0.98
                              : isHovered && !isAnswered
                                ? 1.01
                                : 1,
                        },
                      ],
                    };
                  }}
                >
                  <View
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{
                      borderWidth: 1.5,
                      borderColor: isAnswered && isCorrect
                        ? '#34C759'
                        : isAnswered && isSelected && !isCorrect
                          ? '#FF9F0A'
                          : 'rgba(0,0,0,0.15)',
                    }}
                  >
                    <Text
                      className="text-secondaryLabel"
                      style={{ fontSize: 12, fontWeight: '600' }}
                    >
                      {choice.id.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className="text-label flex-1"
                    style={{ fontSize: 16, lineHeight: 22 }}
                  >
                    {choice.text}
                  </Text>
                  {isAnswered && isCorrect && (
                    <MaterialIcon name="check_circle" size={20} className="text-systemGreen" fill />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <MaterialIcon name="cancel" size={20} className="text-systemOrange" fill />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
