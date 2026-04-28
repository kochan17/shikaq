import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { MaterialIcon } from './MaterialIcon';
import { ActivityRings } from './ActivityRings';
import { TodayHeroCard } from './TodayHeroCard';
import { DailyRing } from './DailyRing';
import { StreakHallOfFame } from './StreakHallOfFame';
import {
  fetchWeeklyStats,
  fetchWeakAreas,
  fetchLastAnswered,
  fetchInProgressLessons,
  type WeeklyStats,
  type WeakArea,
  type InProgressLesson,
} from '../lib/supabase/queries';
import { useDailyActivity } from '../lib/hooks/useDailyActivity';
import { useStreakState } from '../lib/hooks/useStreakState';
import { useCalmMode } from '../lib/hooks/useCalmMode';
import { useAuth } from './AuthProvider';
import { WeeklyDailyBadges } from './WeeklyDailyBadges';
import { PauseBanner } from './PauseBanner';
import type { ScreenKey } from './Sidebar';

// ストリーク終了検出の最小日数（これ以上の記録が終わった時のみ表示）
const HALL_OF_FAME_MIN_STREAK = 7;

const WEEKLY_GOAL_QUESTIONS = 100;
const WEEKLY_GOAL_MINUTES = 240;

interface TodayContentProps {
  onNavigate?: (screen: ScreenKey) => void;
  certSlug?: string | null;
}

interface ResumeCard {
  icon: string;
  title: string;
  cert: string;
  progressLabel: string;
  remaining: string;
  progressPct: number;
}

const RESUME_CARDS_FALLBACK: ResumeCard[] = [
  { icon: 'dataset', title: 'データベースの基礎', cert: '基本情報技術者', progressLabel: '75%', remaining: '残り3分', progressPct: 75 },
  { icon: 'router', title: 'ネットワーク層とTCP/IP', cert: '基本情報技術者', progressLabel: '40%', remaining: '残り12分', progressPct: 40 },
  { icon: 'functions', title: 'アルゴリズムの計算量', cert: '基本情報技術者', progressLabel: '15%', remaining: '残り20分', progressPct: 15 },
];

const AI_SUGGESTIONS = ['OSI基本参照モデルとは？', 'B木の特徴'];

export function TodayContent({ onNavigate, certSlug = null }: TodayContentProps = {}): React.ReactElement {
  const { user } = useAuth();
  const activity = useDailyActivity(user?.id ?? null);
  const streak = useStreakState(user?.id ?? null);
  const { isCalm } = useCalmMode();

  // Hall of Fame: ストリーク終了検出
  const prevStreakRef = useRef(streak.currentStreak);
  const [hallOfFameStreak, setHallOfFameStreak] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevStreakRef.current;
    const curr = streak.currentStreak;
    prevStreakRef.current = curr;

    // 前回より減少 (= ストリーク終了) かつ prev が閾値以上
    if (!isCalm && curr < prev && prev >= HALL_OF_FAME_MIN_STREAK) {
      setHallOfFameStreak(prev);
    }
  }, [streak.currentStreak, isCalm]);

  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [lastAnswered, setLastAnswered] = useState<{ lesson_title: string; cert_name: string } | null>(null);
  const [inProgress, setInProgress] = useState<InProgressLesson[]>([]);

  useEffect(() => {
    if (user === null) return;
    void Promise.all([
      fetchWeeklyStats(user.id),
      fetchWeakAreas(user.id, 3),
      fetchLastAnswered(user.id),
      fetchInProgressLessons(user.id, 3),
    ])
      .then(([s, w, last, ip]) => {
        setStats(s);
        setWeakAreas(w);
        setLastAnswered(last);
        setInProgress(ip);
      })
      .catch(() => {
        // silent: 個人データ無しでも UI は出す
      });
  }, [user]);

  const minutes = stats?.estimated_minutes ?? 0;
  const totalAnswered = stats?.total_answered ?? 0;
  const accuracy = stats?.accuracy_pct ?? 0;
  const ringQuestions = Math.min(totalAnswered / WEEKLY_GOAL_QUESTIONS, 1);
  const ringAccuracy = accuracy / 100;
  const ringMinutes = Math.min(minutes / WEEKLY_GOAL_MINUTES, 1);
  const hours = Math.floor(minutes / 60);
  const minPart = minutes % 60;

  // Calm Mode ではストリーク数字を非表示
  const streakLabel = (!isCalm && streak.currentStreak > 0)
    ? `${streak.currentStreak}日続いています`
    : null;

  return (
    <View className="flex-1 flex-col min-w-0 relative h-full">
      {/* Hall of Fame banner — ストリーク終了時のみ */}
      {hallOfFameStreak !== null && (
        <StreakHallOfFame
          streakDays={hallOfFameStreak}
          onDismiss={() => setHallOfFameStreak(null)}
        />
      )}

      {/* Top Nav */}
      <View className="h-[72px] liquid-glass border-b border-black/10 flex-row items-center justify-between px-8 sticky top-0 z-10 w-full">
        <View>
          <Text className="text-[22px] font-semibold leading-tight text-label">ダッシュボード</Text>
          <Text className="text-[13px] text-secondaryLabel">2026年4月27日 月曜日</Text>
        </View>
        <View className="flex-row items-center gap-4">
          {streakLabel !== null && (
            <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-systemOrange/10">
              <MaterialIcon name="local_fire_department" fill size={14} className="text-systemOrange" />
              <Text className="text-[12px] font-medium text-systemOrange">{streakLabel}</Text>
            </View>
          )}
          <Pressable onPress={() => onNavigate?.('search')} className="p-2 rounded-full">
            <MaterialIcon name="search" size={24} className="text-secondaryLabel" />
          </Pressable>
          <Pressable onPress={() => onNavigate?.('notifications')} className="p-2 rounded-full relative">
            <MaterialIcon name="notifications" size={24} className="text-secondaryLabel" />
            <View className="absolute top-2 right-2 w-2 h-2 bg-systemRed rounded-full border border-white" />
          </Pressable>
        </View>
      </View>

      {/* Pause Banner — paused_until > today の時のみ表示 */}
      <PauseBanner />

      {/* Scrollable Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, paddingBottom: 220, gap: 24 }} showsVerticalScrollIndicator={false}>

        {/* Weekly Daily Badges — 今週の達成状況 */}
        <WeeklyDailyBadges userId={user?.id ?? null} certSlug={certSlug} />

        {/* Today Hero Card — 今日の問題 */}
        <TodayHeroCard
          activity={activity}
          certSlug={certSlug}
          onNavigate={onNavigate}
        />

        {/* Daily Ring row */}
        <View className="flex-row items-center gap-6">
          <View className="bg-systemBackground rounded-2xl hairline-border p-6 items-center justify-center" style={{ minWidth: 180 }}>
            <DailyRing
              size={120}
              strokeWidth={10}
              progress={activity.progress}
              current={activity.totalDone}
              total={activity.totalGoal}
              certSlug={certSlug}
            />
          </View>
          <View className="flex-1">
            {lastAnswered !== null ? (
              <View className="bg-systemBackground rounded-2xl hairline-border p-5">
                <Text className="text-[13px] font-semibold text-fe mb-1">前回の続き</Text>
                <Text className="text-[17px] font-semibold text-label mb-1" numberOfLines={2}>
                  {lastAnswered.lesson_title}
                </Text>
                <Text className="text-[13px] text-secondaryLabel mb-4">{lastAnswered.cert_name}</Text>
                <Pressable
                  onPress={() => onNavigate?.('practice')}
                  className="bg-systemBlue self-start px-5 py-2 rounded-full"
                >
                  <Text className="text-white text-[15px] font-semibold">続きから</Text>
                </Pressable>
              </View>
            ) : (
              <View className="bg-systemBackground rounded-2xl hairline-border p-5 items-center justify-center" style={{ minHeight: 120 }}>
                <Text className="text-[15px] text-secondaryLabel text-center">
                  学習を始めると{'\n'}ここに表示されます
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 続きから */}
        <View>
          <Text className="text-[22px] font-semibold mb-4 px-1 text-label">続きから</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
            {(inProgress.length > 0 ? inProgress : RESUME_CARDS_FALLBACK).map((card) => (
              <Pressable
                key={'lesson_id' in card ? card.lesson_id : card.title}
                onPress={() => onNavigate?.('practice')}
                className="bg-systemBackground rounded-2xl hairline-border p-5 min-w-[240px] flex-col justify-between h-[200px]"
              >
                <View>
                  <View className="w-10 h-10 rounded-lg bg-fe/10 items-center justify-center mb-3">
                    <MaterialIcon
                      name={'icon' in card ? card.icon : 'menu_book'}
                      size={24}
                      className="text-fe"
                    />
                  </View>
                  <Text className="text-[17px] font-semibold leading-tight mb-1 text-label" numberOfLines={2}>
                    {card.title}
                  </Text>
                  <Text className="text-[13px] text-secondaryLabel">
                    {'cert_name' in card ? card.cert_name : card.cert}
                  </Text>
                </View>
                <View>
                  <View className="flex-row justify-between mb-1.5">
                    <Text className="text-[13px] text-secondaryLabel">
                      {'pct' in card ? `${card.pct}%` : card.progressLabel}
                    </Text>
                    <Text className="text-[13px] text-secondaryLabel">
                      {'answered' in card ? `${card.answered}/${card.total_questions}` : card.remaining}
                    </Text>
                  </View>
                  <View className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-systemBlue rounded-full"
                      style={{ width: `${'pct' in card ? card.pct : card.progressPct}%` }}
                    />
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Two-column row */}
        <View className="flex-row gap-6">
          {/* 今週の記録 */}
          <View className="flex-1 bg-systemBackground rounded-2xl hairline-border p-6 flex-col">
            <Text className="text-[17px] font-semibold mb-6 text-label">今週の記録</Text>
            <View className="flex-row items-center gap-8 flex-1">
              <ActivityRings
                size={128}
                strokeWidth={8}
                rings={[
                  { radius: 40, color: '#007AFF', progress: ringMinutes },
                  { radius: 28, color: '#34C759', progress: ringQuestions },
                  { radius: 16, color: '#FF9F0A', progress: ringAccuracy },
                ]}
              />
              <View className="gap-4 flex-1">
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-2 h-2 rounded-full bg-systemBlue" />
                    <Text className="text-[13px] text-secondaryLabel">学習時間</Text>
                  </View>
                  <Text className="text-[22px] font-semibold text-label">
                    {hours}
                    <Text className="text-[16px] text-secondaryLabel font-normal">h</Text>
                    {minPart}
                    <Text className="text-[16px] text-secondaryLabel font-normal">m</Text>
                  </Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-2 h-2 rounded-full bg-systemGreen" />
                    <Text className="text-[13px] text-secondaryLabel">問題数</Text>
                  </View>
                  <Text className="text-[22px] font-semibold text-label">
                    {totalAnswered}
                    <Text className="text-[16px] text-secondaryLabel font-normal">問</Text>
                  </Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-2 h-2 rounded-full bg-systemOrange" />
                    <Text className="text-[13px] text-secondaryLabel">正答率</Text>
                  </View>
                  <Text className="text-[22px] font-semibold text-label">
                    {accuracy}
                    <Text className="text-[16px] text-secondaryLabel font-normal">%</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 苦手分野 + AI */}
          <View className="flex-1 flex-col gap-6">
            <View className="bg-systemBackground rounded-2xl hairline-border p-6 flex-1">
              <Text className="text-[17px] font-semibold mb-4 text-label">苦手分野の復習</Text>
              {weakAreas.length === 0 ? (
                <Text className="text-[13px] text-secondaryLabel">
                  まだデータがありません。問題に取り組むと表示されます。
                </Text>
              ) : (
                <View className="gap-3">
                  {weakAreas.map((spot) => (
                    <View key={spot.lesson_id} className="flex-row items-center justify-between">
                      <Text className="text-[15px] text-label flex-1" numberOfLines={1}>
                        {spot.title}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <View className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full ${
                              spot.pct < 60 ? 'bg-systemOrange' : 'bg-systemBlue'
                            }`}
                            style={{ width: `${spot.pct}%` }}
                          />
                        </View>
                        <Text className="text-[13px] text-secondaryLabel w-8 text-right">
                          {spot.pct}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View className="bg-systemBackground rounded-2xl hairline-border p-5">
              <View className="flex-row items-center gap-2 mb-3">
                <MaterialIcon name="smart_toy" size={20} className="text-fe" />
                <Text className="text-[16px] font-semibold text-label">AIアシスタント</Text>
              </View>
              <View className="relative mb-3">
                <TextInput
                  placeholder="何でも質問してください..."
                  placeholderTextColor="#3C3C4399"
                  className="w-full bg-secondarySystemBackground rounded-xl pl-4 pr-10 py-2.5 text-[16px] text-label"
                />
                <Pressable className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <MaterialIcon name="send" size={20} className="text-secondaryLabel" />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {AI_SUGGESTIONS.map((s) => (
                  <Pressable key={s} className="px-3 py-1.5 bg-black/5 rounded-full">
                    <Text className="text-[13px] text-label">{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Now Playing bar */}
      <Pressable
        onPress={() => onNavigate?.('audio')}
        className="absolute bottom-6 left-8 right-8 h-[64px] liquid-glass rounded-2xl hairline-border flex-row items-center px-4 z-30"
      >
        <View className="w-12 h-12 rounded-lg bg-fe/10 items-center justify-center mr-4">
          <MaterialIcon name="graphic_eq" size={28} className="text-fe" />
        </View>
        <View className="flex-1 min-w-0 pr-4">
          <Text className="text-[16px] font-semibold text-label" numberOfLines={1}>
            音声解説クイズ
          </Text>
          <Text className="text-[13px] text-secondaryLabel" numberOfLines={1}>
            今夜の配信 21:00
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Pressable className="p-2 rounded-full">
            <MaterialIcon name="replay_10" size={24} className="text-secondaryLabel" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-black/5 items-center justify-center">
            <MaterialIcon name="play_arrow" fill size={24} className="text-label" />
          </Pressable>
          <Pressable className="p-2 rounded-full">
            <MaterialIcon name="forward_10" size={24} className="text-secondaryLabel" />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}
