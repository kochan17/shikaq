import {
  useEffect,
  useRef,
  useCallback,
  useState,
  type MutableRefObject,
} from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  AccessibilityInfo,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getDailyQueue, recordAnswer } from '../../lib/srs/fsrs';
import { useAuth } from '../AuthProvider';
import { MaterialIcon } from '../MaterialIcon';
import { useHaptic } from '../../lib/useHaptic';
import type { SrsQuestion } from '../../types/srs';

type Phase = 'loading' | 'answering' | 'reviewing' | 'done' | 'error';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'] as const;

// 正解時のグリーンフェード → 元に戻るアニメーション (0.3 秒)
function useChoiceFade(): [MutableRefObject<Animated.Value>, () => void] {
  const fade = useRef(new Animated.Value(0));
  const run = useCallback(
    () =>
      Animated.sequence([
        Animated.timing(fade.current, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fade.current, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(),
    []
  );
  return [fade, run];
}

// アイコンのスライドイン + バウンス (Spring)
function useIconBounce(reducedMotion: boolean): [MutableRefObject<Animated.Value>, () => void] {
  const anim = useRef(new Animated.Value(0));
  const run = useCallback(() => {
    anim.current.setValue(0);
    if (reducedMotion) {
      Animated.timing(anim.current, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      return;
    }
    Animated.spring(anim.current, {
      toValue: 1,
      damping: 18,
      stiffness: 280,
      mass: 1,
      useNativeDriver: false,
    }).start();
  }, [reducedMotion]);
  return [anim, run];
}

// 連続正解バウンス (スケール 1.0 → 1.2 → 1.0)
function useStreakBounce(reducedMotion: boolean): [MutableRefObject<Animated.Value>, () => void] {
  const scale = useRef(new Animated.Value(1));
  const run = useCallback(() => {
    if (reducedMotion) return;
    Animated.sequence([
      Animated.spring(scale.current, {
        toValue: 1.2,
        damping: 14,
        stiffness: 240,
        useNativeDriver: false,
      }),
      Animated.spring(scale.current, {
        toValue: 1,
        damping: 14,
        stiffness: 240,
        useNativeDriver: false,
      }),
    ]).start();
  }, [reducedMotion]);
  return [scale, run];
}

// 解説エリアの高さアニメーション
function useExplainExpand(
  reducedMotion: boolean
): [MutableRefObject<Animated.Value>, (show: boolean) => void] {
  const height = useRef(new Animated.Value(0));
  const run = useCallback(
    (show: boolean) => {
      if (reducedMotion) {
        height.current.setValue(show ? 1 : 0);
        return;
      }
      Animated.spring(height.current, {
        toValue: show ? 1 : 0,
        damping: 20,
        stiffness: 300,
        useNativeDriver: false,
      }).start();
    },
    [reducedMotion]
  );
  return [height, run];
}

// 進捗 dots コンポーネント
interface ProgressDotsProps {
  total: number;
  current: number;
}

function ProgressDots({ total, current }: ProgressDotsProps): React.ReactElement {
  const dots = Array.from({ length: total }, (_, i) => i < current);
  return (
    <View className="flex-row items-center gap-1.5 justify-center">
      {dots.map((filled, i) => (
        <View
          key={i}
          className={`rounded-full ${filled ? 'bg-systemBlue' : 'bg-systemFill'}`}
          style={{ width: 6, height: 6 }}
        />
      ))}
    </View>
  );
}

// 連続正解バッジコンポーネント
interface StreakBadgeProps {
  count: number;
  scaleAnim: Animated.Value;
}

function StreakBadge({ count, scaleAnim }: StreakBadgeProps): React.ReactElement | null {
  if (count < 3) return null;
  return (
    <Animated.View
      className="absolute top-0 right-0 flex-row items-center gap-1 px-2 py-1 rounded-full"
      style={{
        transform: [{ scale: scaleAnim }],
        backgroundColor: 'rgba(255,159,10,0.12)',
      }}
    >
      <MaterialIcon name="local_fire_department" fill size={14} className="text-systemOrange" />
      <Text className="text-[12px] font-semibold text-systemOrange">{count}</Text>
    </Animated.View>
  );
}

// 選択肢アイテムコンポーネント
interface ChoiceItemProps {
  choiceId: string;
  text: string;
  label: string;
  phase: Phase;
  selectedId: string | null;
  correctId: string | null;
  onPress: (id: string) => void;
  greenFadeAnim: Animated.Value;
  redFadeAnim: Animated.Value;
  iconAnim: Animated.Value;
  isTarget: boolean;
  isCorrect: boolean;
  isWrongPick: boolean;
  reducedMotion: boolean;
}

function ChoiceItem({
  choiceId,
  text,
  label,
  phase,
  selectedId,
  correctId,
  onPress,
  greenFadeAnim,
  redFadeAnim,
  iconAnim,
  isTarget,
  isCorrect,
  isWrongPick,
  reducedMotion,
}: ChoiceItemProps): React.ReactElement {
  const isSelected = selectedId === choiceId;
  const isAnswering = phase === 'answering';
  const isReviewing = phase === 'reviewing';

  // ベース背景色 (静的)
  let staticBg = 'transparent';
  if (isReviewing && isCorrect) staticBg = 'rgba(52,199,89,0.06)';
  else if (isReviewing && isWrongPick) staticBg = 'rgba(255,59,48,0.06)';
  else if (isAnswering && isSelected) staticBg = 'rgba(0,122,255,0.06)';

  // バッジ色
  let badgeBg = 'bg-secondarySystemBackground';
  let badgeText = 'text-secondaryLabel';
  if (isReviewing && isCorrect) {
    badgeBg = 'bg-systemGreen';
    badgeText = 'text-white';
  } else if (isReviewing && isWrongPick) {
    badgeBg = 'bg-systemRed';
    badgeText = 'text-white';
  } else if (isAnswering && isSelected) {
    badgeBg = 'bg-systemBlue';
    badgeText = 'text-white';
  }

  // ボーダー色
  let borderColor = 'rgba(0,0,0,0.08)';
  if (isReviewing && isCorrect) borderColor = 'rgba(52,199,89,0.5)';
  else if (isReviewing && isWrongPick) borderColor = 'rgba(255,59,48,0.5)';
  else if (isAnswering && isSelected) borderColor = 'rgba(0,122,255,0.4)';

  // アイコン種類
  const showIcon = isReviewing && isTarget;
  const iconName = isCorrect ? 'check_circle' : 'cancel';
  const iconColor = isCorrect ? 'text-systemGreen' : 'text-systemRed';

  const iconOpacity = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const iconTranslateX = reducedMotion
    ? 0
    : iconAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  // アニメーション済みのフェード背景
  const greenBg = greenFadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(52,199,89,0)', 'rgba(52,199,89,0.15)'],
  });
  const redBg = redFadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,59,48,0)', 'rgba(255,59,48,0.15)'],
  });

  return (
    <Pressable
      onPress={() => isAnswering && onPress(choiceId)}
      disabled={!isAnswering}
      className="flex-row items-center px-4 py-4 rounded-2xl"
      style={(state) => {
        const isHovered = 'hovered' in state && (state as { hovered: boolean }).hovered;
        return {
          backgroundColor: isHovered && isAnswering ? 'rgba(120,120,128,0.08)' : staticBg,
          transform: isHovered && isAnswering ? [{ scale: 1.01 }] : [{ scale: 1 }],
          borderWidth: 0.5,
          borderColor,
        };
      }}
    >
      {/* グリーンフェードオーバーレイ */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 16,
          backgroundColor: greenBg,
        }}
      />
      {/* レッドフェードオーバーレイ */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 16,
          backgroundColor: redBg,
        }}
      />

      {/* バッジ */}
      <View className={`w-7 h-7 rounded-lg items-center justify-center mr-3 ${badgeBg}`}>
        <Text className={`text-[13px] font-semibold ${badgeText}`}>{label}</Text>
      </View>

      {/* 選択肢テキスト */}
      <Text className="text-[15px] text-label flex-1 leading-[1.4]">{text}</Text>

      {/* 正誤アイコン */}
      {showIcon && (
        <Animated.View
          style={{
            opacity: iconOpacity,
            transform: [{ translateX: iconTranslateX }],
            marginLeft: 8,
          }}
        >
          <MaterialIcon name={iconName} fill size={20} className={iconColor} />
        </Animated.View>
      )}
    </Pressable>
  );
}

// ============================
// Practice メイン画面
// ============================

export function Practice(): React.ReactElement {
  const { user } = useAuth();
  const router = useRouter();
  const haptic = useHaptic();

  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<SrsQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [prevStreakMilestone, setPrevStreakMilestone] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const answerStartTime = useRef<number>(Date.now());

  // アニメーション
  const [greenFadeAnim, runGreenFade] = useChoiceFade();
  const [redFadeAnim, runRedFade] = useChoiceFade();
  const [correctIconAnim, runCorrectIcon] = useIconBounce(reducedMotion);
  const [wrongIconAnim, runWrongIcon] = useIconBounce(reducedMotion);
  const [streakScale, runStreakBounce] = useStreakBounce(reducedMotion);
  const [explainHeight, runExplainExpand] = useExplainExpand(reducedMotion);

  // 解説高さの interpolate (最大 320)
  const explainMaxHeight = explainHeight.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });

  const question = queue[currentIndex] ?? null;
  const totalCount = queue.length;
  const answeredCount = currentIndex; // 現在のインデックスが答えた数
  const isCorrectAnswer =
    phase === 'reviewing' && question !== null && selectedId === question.correct_choice_id;

  // Reduced Motion 検出
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((val) => setReducedMotion(val)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  // キューのロード
  const load = useCallback(async (): Promise<void> => {
    if (user === null) return;
    setPhase('loading');
    setSelectedId(null);
    setConsecutiveCorrect(0);
    setPrevStreakMilestone(0);
    setShowExplanation(false);
    try {
      const daily = await getDailyQueue(user.id, 7, 3);
      const combined = [...daily.recall, ...daily.learn];
      setQueue(combined);
      setCurrentIndex(0);
      setPhase(combined.length === 0 ? 'done' : 'answering');
      answerStartTime.current = Date.now();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
      setPhase('error');
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  // キーボードショートカット (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKey = (e: KeyboardEvent): void => {
      if (phase === 'answering' && question !== null) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= question.choices.length) {
          const choice = question.choices[num - 1];
          if (choice !== undefined) {
            handleChoiceSelect(choice.id);
          }
        }
        if (e.key === '?' || e.key === '/') {
          e.preventDefault();
          setShowExplanation((prev) => {
            runExplainExpand(!prev);
            return !prev;
          });
        }
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void handleNext();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question, selectedId]);

  function handleChoiceSelect(id: string): void {
    if (phase !== 'answering') return;
    haptic('selection');
    setSelectedId(id);
  }

  async function handleSubmit(): Promise<void> {
    if (user === null || question === null || selectedId === null || phase !== 'answering') return;

    const elapsedMs = Date.now() - answerStartTime.current;
    const isCorrect = selectedId === question.correct_choice_id;

    try {
      await recordAnswer({
        userId: user.id,
        questionId: question.id,
        selectedChoiceId: selectedId,
        isCorrect,
        elapsedMs,
      });
    } catch {
      // quiz_results 保存失敗はサイレント (ユーザー体験を壊さない)
    }

    if (isCorrect) {
      runGreenFade();
      runCorrectIcon();
      haptic('success');
      const next = consecutiveCorrect + 1;
      setConsecutiveCorrect(next);
      const milestone = next >= 10 ? 10 : next >= 5 ? 5 : next >= 3 ? 3 : 0;
      if (milestone > 0 && milestone !== prevStreakMilestone) {
        setPrevStreakMilestone(milestone);
        runStreakBounce();
      }
    } else {
      runRedFade();
      runWrongIcon();
      haptic('warning');
      setConsecutiveCorrect(0);
      setPrevStreakMilestone(0);
    }

    setPhase('reviewing');
    if (question.explanation !== null) {
      runExplainExpand(true);
      setShowExplanation(true);
    }
  }

  async function handleNext(): Promise<void> {
    if (phase === 'answering' && selectedId !== null) {
      await handleSubmit();
      return;
    }
    if (phase === 'reviewing') {
      const next = currentIndex + 1;
      if (next >= queue.length) {
        setPhase('done');
        return;
      }
      setCurrentIndex(next);
      setSelectedId(null);
      setShowExplanation(false);
      runExplainExpand(false);
      greenFadeAnim.current.setValue(0);
      redFadeAnim.current.setValue(0);
      correctIconAnim.current.setValue(0);
      wrongIconAnim.current.setValue(0);
      setPhase('answering');
      answerStartTime.current = Date.now();
    }
  }

  // 各選択肢に渡すアイコンアニメーション (正解選択肢 or 誤選択肢)
  function getIconAnim(choiceId: string): Animated.Value {
    if (question === null) return correctIconAnim.current;
    if (choiceId === question.correct_choice_id) return correctIconAnim.current;
    return wrongIconAnim.current;
  }

  // ============================
  // ローディング
  // ============================
  if (phase === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-systemBackground">
        <ActivityIndicator />
      </View>
    );
  }

  // ============================
  // エラー
  // ============================
  if (phase === 'error') {
    return (
      <View className="flex-1 items-center justify-center px-10 bg-systemBackground">
        <MaterialIcon name="error_outline" size={40} className="text-systemRed mb-4" />
        <Text className="text-[17px] text-label font-semibold mb-2">読み込めませんでした</Text>
        <Text className="text-[14px] text-secondaryLabel mb-6 text-center">
          {error ?? 'もう一度お試しください'}
        </Text>
        <Pressable
          onPress={() => void load()}
          className="px-8 py-3 rounded-full bg-systemBlue"
        >
          <Text className="text-white text-[15px] font-semibold">再試行する</Text>
        </Pressable>
      </View>
    );
  }

  // ============================
  // 完了画面
  // ============================
  if (phase === 'done') {
    return (
      <View className="flex-1 items-center justify-center px-10 bg-systemBackground">
        <MaterialIcon name="verified" fill size={48} className="text-systemBlue mb-4" />
        <Text className="text-[22px] font-semibold text-label mb-2 text-center">
          今日のセッション完了
        </Text>
        <Text className="text-[15px] text-secondaryLabel mb-8 text-center leading-[1.5]">
          {totalCount} 問に取り組みました。{'\n'}明日また少しだけ続けましょう。
        </Text>
        <Pressable
          onPress={() => router.replace('/(app)/')}
          className="px-8 py-3 rounded-full bg-systemBlue"
        >
          <Text className="text-white text-[15px] font-semibold">Today に戻る</Text>
        </Pressable>
      </View>
    );
  }

  // ============================
  // 問題画面 (answering / reviewing)
  // ============================
  if (question === null) return <View />;

  const nextButtonEnabled =
    (phase === 'answering' && selectedId !== null) || phase === 'reviewing';

  return (
    <ScrollView
      className="flex-1 bg-systemBackground"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 items-center px-6 pt-10 pb-12">
        <View className="w-full" style={{ maxWidth: 720 }}>
          {/* 連続正解バッジ */}
          <View className="relative mb-6" style={{ height: 32 }}>
            <StreakBadge
              count={consecutiveCorrect}
              scaleAnim={streakScale.current}
            />
          </View>

          {/* 進捗 dots */}
          <View className="mb-8">
            <ProgressDots total={totalCount} current={answeredCount} />
          </View>

          {/* 問題文 */}
          <View className="mb-10">
            <Text className="text-[22px] font-semibold text-secondaryLabel mb-3">
              Q{currentIndex + 1}.
            </Text>
            <Text
              className="text-[17px] text-label leading-7"
              style={{ fontFamily: 'System' }}
            >
              {question.question_text}
            </Text>
          </View>

          {/* 選択肢 */}
          <View className="gap-3 mb-6">
            {question.choices.map((choice, i) => {
              const label = CHOICE_LABELS[i] ?? String.fromCharCode(65 + i);
              const isCorrect = phase === 'reviewing' && choice.id === question.correct_choice_id;
              const isWrongPick =
                phase === 'reviewing' &&
                selectedId === choice.id &&
                choice.id !== question.correct_choice_id;
              const isTarget =
                isCorrect || (phase === 'reviewing' && selectedId === choice.id);

              return (
                <ChoiceItem
                  key={choice.id}
                  choiceId={choice.id}
                  text={choice.text}
                  label={label}
                  phase={phase}
                  selectedId={selectedId}
                  correctId={question.correct_choice_id}
                  onPress={handleChoiceSelect}
                  greenFadeAnim={isCorrect ? greenFadeAnim.current : new Animated.Value(0)}
                  redFadeAnim={isWrongPick ? redFadeAnim.current : new Animated.Value(0)}
                  iconAnim={getIconAnim(choice.id)}
                  isTarget={isTarget}
                  isCorrect={isCorrect}
                  isWrongPick={isWrongPick}
                  reducedMotion={reducedMotion}
                />
              );
            })}
          </View>

          {/* 解説エリア (reviewing 時に inline expand) */}
          {phase === 'reviewing' && question.explanation !== null && (
            <Animated.View style={{ maxHeight: explainMaxHeight, overflow: 'hidden' }}>
              <View
                className={`p-5 rounded-2xl mb-6 ${
                  isCorrectAnswer ? 'bg-systemGreen/10' : 'bg-systemRed/10'
                }`}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <MaterialIcon
                    name={isCorrectAnswer ? 'check_circle' : 'info'}
                    fill
                    size={16}
                    className={isCorrectAnswer ? 'text-systemGreen' : 'text-systemRed'}
                  />
                  <Text
                    className={`text-[13px] font-semibold ${
                      isCorrectAnswer ? 'text-systemGreen' : 'text-systemRed'
                    }`}
                  >
                    {isCorrectAnswer ? '正解です' : '不正解でした'}
                  </Text>
                </View>
                <Text className="text-[14px] text-label leading-[1.6]">
                  {question.explanation}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* 次へボタン / 解答ボタン */}
          <Pressable
            onPress={() => void handleNext()}
            disabled={!nextButtonEnabled}
            className="w-full items-center justify-center rounded-2xl"
            style={({ pressed }) => ({
              backgroundColor: nextButtonEnabled
                ? pressed
                  ? 'rgba(0,106,220,1)'
                  : 'rgba(0,122,255,1)'
                : 'rgba(120,120,128,0.2)',
              height: 52,
              opacity: nextButtonEnabled ? 1 : 0.6,
            })}
          >
            <Text
              className={`text-[17px] font-semibold ${
                nextButtonEnabled ? 'text-white' : 'text-secondaryLabel'
              }`}
            >
              {phase === 'answering'
                ? selectedId !== null
                  ? '解答する'
                  : '選択してください'
                : currentIndex + 1 >= totalCount
                ? '完了する'
                : '次の問題へ進む'}
            </Text>
          </Pressable>

          {/* キーボードヒント (web & iPad) */}
          {Platform.OS === 'web' && (
            <Text className="text-[11px] text-tertiaryLabel text-center mt-4">
              1〜4 で選択 · Enter で確定 / 次へ
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
