import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcon } from '../MaterialIcon';
import { askAI, fetchAIQAHistory, type AIQAEntry } from '../../lib/supabase/queries';
import { useAuth } from '../AuthProvider';

const SUGGESTIONS = [
  '今週間違えた問題を解説して',
  '次に勉強すべきトピックは？',
  '頻出パターンを教えて',
  '直近の弱点をまとめて',
] as const;

function formatRelative(iso: string): string {
  const now = Date.now();
  const diff = now - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

function SparklesIcon({ sending, reducedMotion }: { sending: boolean; reducedMotion: boolean }): React.ReactElement {
  const opacity = useRef(new Animated.Value(1));
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (sending && !reducedMotion) {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity.current, {
            toValue: 0.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity.current, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      opacity.current.setValue(1);
    }
    return () => {
      animRef.current?.stop();
    };
  }, [sending, reducedMotion]);

  return (
    <Animated.View style={{ opacity: opacity.current }}>
      <MaterialIcon name="sparkles" fill size={20} className="text-white" />
    </Animated.View>
  );
}

interface QACardProps {
  entry: AIQAEntry;
  onLessonPress: (lessonId: string) => void;
}

function QACard({ entry, onLessonPress }: QACardProps): React.ReactElement {
  return (
    <View className="bg-secondarySystemBackground rounded-2xl p-4 gap-3">
      <View className="flex-row items-start gap-2">
        <View className="w-5 h-5 rounded-full bg-systemBlue/10 items-center justify-center mt-0.5">
          <MaterialIcon name="person" fill size={12} className="text-systemBlue" />
        </View>
        <Text className="text-[15px] font-semibold text-label leading-[22px] flex-1">
          {entry.question}
        </Text>
      </View>

      <View className="flex-row items-start gap-2">
        <View className="w-5 h-5 rounded-full bg-systemIndigo/10 items-center justify-center mt-0.5">
          <MaterialIcon name="auto_awesome" fill size={12} className="text-systemIndigo" />
        </View>
        <Text className="text-[14px] text-secondaryLabel leading-[22px] flex-1">
          {entry.answer ?? '(回答が保存されていません)'}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] text-tertiaryLabel">{formatRelative(entry.created_at)}</Text>
        {entry.source_lesson_id !== null && (
          <Pressable
            onPress={() => {
              if (entry.source_lesson_id !== null) {
                onLessonPress(entry.source_lesson_id);
              }
            }}
            className="flex-row items-center gap-1 active:opacity-60"
          >
            <MaterialIcon name="menu_book" fill size={13} className="text-systemBlue" />
            <Text className="text-[12px] text-systemBlue font-medium">このレッスンを参照</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function AIQA(): React.ReactElement {
  const { user } = useAuth();
  const [history, setHistory] = useState<AIQAEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    if (user === null) return;
    try {
      const items = await fetchAIQAHistory(user.id);
      setHistory(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSend(question: string): Promise<void> {
    const trimmed = question.trim();
    if (user === null || trimmed === '' || sending) return;
    setSending(true);
    setError(null);
    try {
      await askAI(user.id, trimmed);
      setInput('');
      await refresh();
      // 最新エントリが先頭（逆時系列）なのでスクロールトップへ
      scrollRef.current?.scrollTo({ y: 0, animated: !reducedMotion });
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信に失敗しました');
    } finally {
      setSending(false);
    }
  }

  function handleLessonPress(_lessonId: string): void {
    // Phase 2: Learn 画面の該当レッスンにジャンプ
    // 現フェーズではトーストのみ
  }

  const canSend = input.trim() !== '' && !sending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-systemGroupedBackground"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View className="px-8 pt-8 pb-2">
        <Text className="text-[28px] font-semibold text-label tracking-tight">AI Q&A</Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">
          資格の疑問に、すぐ答えてもらえる
        </Text>
      </View>

      {/* History — 逆時系列 (最新が上) */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 16, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {loading && (
          <View className="items-center py-12">
            <MaterialIcon name="auto_awesome" fill size={32} className="text-systemIndigo/40" />
            <Text className="text-[13px] text-tertiaryLabel mt-3">読み込み中…</Text>
          </View>
        )}

        {!loading && history.length === 0 && (
          <View className="items-center py-16 gap-3">
            <View className="w-16 h-16 rounded-full bg-systemIndigo/8 items-center justify-center">
              <MaterialIcon name="auto_awesome" fill size={32} className="text-systemIndigo/50" />
            </View>
            <Text className="text-[15px] font-semibold text-label">質問してみよう</Text>
            <Text className="text-[13px] text-secondaryLabel text-center leading-[20px]">
              わからないことは、遠慮なく聞ける。{'\n'}下のチップから選ぶのもおすすめ。
            </Text>
          </View>
        )}

        {history.map((entry) => (
          <QACard key={entry.id} entry={entry} onLessonPress={handleLessonPress} />
        ))}
      </ScrollView>

      {/* Error */}
      {error !== null && (
        <View className="px-8 py-2">
          <Text className="text-[13px] text-systemRed">{error}</Text>
        </View>
      )}

      {/* Composer */}
      <View
        className="px-6 pt-3 pb-6 bg-systemGroupedBackground"
        style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(60,60,67,0.29)' }}
      >
        {/* Suggestion chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        >
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setInput(s)}
              className="px-3 py-1.5 bg-secondarySystemBackground rounded-full active:opacity-60"
              style={{ borderWidth: 0.5, borderColor: 'rgba(60,60,67,0.18)' }}
            >
              <Text className="text-[12px] text-label">{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input row */}
        <View
          className="flex-row items-center bg-systemBackground rounded-full px-4 h-[52px] gap-2"
          style={{ borderWidth: 0.5, borderColor: 'rgba(60,60,67,0.18)' }}
        >
          <TextInput
            className="flex-1 text-[15px] text-label"
            placeholder="何でも聞いてみよう"
            placeholderTextColor="rgba(60,60,67,0.4)"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => void handleSend(input)}
            returnKeyType="send"
            multiline={false}
          />
          <Pressable
            onPress={() => void handleSend(input)}
            disabled={!canSend}
            accessibilityLabel="送信"
            className={`w-9 h-9 rounded-full items-center justify-center ${
              canSend ? 'bg-systemBlue' : 'bg-systemFill'
            }`}
            style={{ opacity: canSend ? 1 : 0.5 }}
          >
            {sending ? (
              <SparklesIcon sending={sending} reducedMotion={reducedMotion} />
            ) : (
              <MaterialIcon name="arrow_upward" fill size={20} className="text-white" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
