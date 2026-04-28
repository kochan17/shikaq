import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { MaterialIcon } from '../MaterialIcon';
import { fetchAudioLessons, type AudioLesson } from '../../lib/supabase/queries';
import { createAudioPlayer, type AudioPlayerHandle, type PlaybackStatus } from '../../lib/audio/player';
import { useAuth } from '../AuthProvider';
import { recordAudioCompleted } from '../../lib/hooks/useAudioActivity';

// Placeholder audio URI (Supabase Storage path — swap when real files exist)
const PLACEHOLDER_AUDIO_URI =
  'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3';

// Fake static waveform bars — replaced in Phase 3 with Skia reactive bars
const WAVE_BARS = Array.from({ length: 56 }, (_, i) => {
  const t = i / 56;
  const seed =
    Math.sin(t * Math.PI * 3.7) * 0.28 +
    Math.sin(t * Math.PI * 9.3) * 0.35 +
    Math.sin(t * Math.PI * 17) * 0.15 +
    0.5;
  return Math.max(0.15, Math.min(1, seed));
});

const CERT_TINTS: Record<string, string> = {
  ip: 'bg-systemCyan/20',
  fe: 'bg-fe/20',
  spi: 'bg-systemYellow/20',
  boki: 'bg-systemRed/20',
};

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

interface AudioProps {
  certSlug?: string | null;
  onBack?: () => void;
}

export function Audio({ certSlug = null, onBack }: AudioProps): React.ReactElement {
  const { user } = useAuth();

  const [lessons, setLessons] = useState<AudioLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>({ type: 'idle' });
  const [reducedMotion, setReducedMotion] = useState(false);

  const playerRef = useRef<AudioPlayerHandle | null>(null);
  const recordedRef = useRef(false); // prevent double-recording per track

  // Reduced Motion detection
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  // Initialise player once
  useEffect(() => {
    const p = createAudioPlayer();
    playerRef.current = p;
    const unsub = p.onStatusChange((s) => {
      setPlaybackStatus(s);
    });
    return () => {
      unsub();
      void p.unload();
    };
  }, []);

  // Fetch lesson list
  useEffect(() => {
    fetchAudioLessons()
      .then((list) => {
        setLessons(list);
        if (list.length > 0) setActiveId(list[0].id);
      })
      .catch(() => {
        // Silent — empty list will show empty state
      })
      .finally(() => setLoading(false));
  }, []);

  const active = lessons.find((l) => l.id === activeId) ?? null;

  // Load audio when active lesson changes
  useEffect(() => {
    if (playerRef.current === null) return;
    recordedRef.current = false;
    const uri = active?.audio_url ?? (active !== null ? PLACEHOLDER_AUDIO_URI : null);
    if (uri !== null) {
      void playerRef.current.load(uri);
    } else {
      void playerRef.current.unload();
    }
  }, [active]);

  // Record completion when track ends
  useEffect(() => {
    if (
      playbackStatus.type === 'ended' &&
      !recordedRef.current &&
      user !== null
    ) {
      recordedRef.current = true;
      void recordAudioCompleted(user.id);
    }
  }, [playbackStatus, user]);

  const togglePlay = useCallback((): void => {
    const p = playerRef.current;
    if (p === null) return;
    const s = p.getStatus();
    if (s.type === 'playing') {
      void p.pause();
    } else {
      void p.play();
    }
  }, []);

  const skipForward = useCallback((): void => {
    void playerRef.current?.skipForward(15);
  }, []);

  const skipBackward = useCallback((): void => {
    void playerRef.current?.skipBackward(15);
  }, []);

  function selectPrev(): void {
    if (active === null) return;
    const idx = lessons.findIndex((l) => l.id === active.id);
    if (idx > 0) setActiveId(lessons[idx - 1].id);
  }

  function selectNext(): void {
    if (active === null) return;
    const idx = lessons.findIndex((l) => l.id === active.id);
    if (idx >= 0 && idx < lessons.length - 1) setActiveId(lessons[idx + 1].id);
  }

  const isPlaying = playbackStatus.type === 'playing';
  const positionMs =
    playbackStatus.type === 'playing' || playbackStatus.type === 'paused'
      ? playbackStatus.positionMs
      : 0;
  const durationMs =
    playbackStatus.type === 'playing' || playbackStatus.type === 'paused'
      ? playbackStatus.durationMs
      : (active?.duration_seconds ?? 0) * 1000;

  const progress = durationMs === 0 ? 0 : Math.min(positionMs / durationMs, 1);
  const tintClass = certSlug !== null ? (CERT_TINTS[certSlug] ?? 'bg-fe/20') : 'bg-fe/20';

  return (
    <View className="flex-1 bg-systemGroupedBackground">
      {/* Header */}
      <View className="h-[64px] liquid-glass border-b border-black/10 flex-row items-center px-6 gap-3">
        {onBack !== undefined && (
          <Pressable onPress={onBack} className="p-2 rounded-full" accessibilityLabel="戻る">
            <MaterialIcon name="arrow_back" size={24} className="text-label" />
          </Pressable>
        )}
        <Text className="text-[20px] font-semibold text-label tracking-tight flex-1">
          音声解説
        </Text>
      </View>

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      {!loading && lessons.length === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcon name="graphic_eq" size={56} className="text-secondaryLabel" />
          <Text className="text-[15px] text-secondaryLabel mt-3 text-center">
            音声がまだありません{'\n'}Admin でレッスンに音声を追加してください
          </Text>
        </View>
      )}

      {!loading && lessons.length > 0 && active !== null && (
        <View className="flex-1 flex-row">
          {/* ── Player column ── */}
          <View className="flex-1 items-center px-8 pt-6 pb-8">
            <View className="w-full max-w-[560px] flex-col items-center gap-6">
              {/* Artwork — Apple Music Now Playing style */}
              <View
                className={`w-full aspect-square max-w-[340px] rounded-3xl overflow-hidden ${tintClass} items-center justify-center hairline-border`}
                style={{ elevation: 4 }}
              >
                {/* Tint gradient overlay */}
                <View className="absolute inset-0 bg-secondarySystemBackground/60" />
                {/* Decorative shape */}
                <View className="absolute top-[15%] right-[20%] w-[45%] aspect-square rounded-full bg-white/10" />
                <View className="absolute top-[12%] right-[17%] w-[45%] aspect-square rounded-full bg-systemOrange/25" />
                <View className="absolute bottom-0 left-0 right-0 h-[35%] bg-black/25" />
                {/* Icon centrepiece */}
                <MaterialIcon
                  name="graphic_eq"
                  fill
                  size={72}
                  className="text-white/90 z-10"
                />
                {/* Title over artwork */}
                <View className="absolute bottom-5 left-5 right-5 z-10">
                  <Text
                    className="text-white text-[17px] font-semibold"
                    numberOfLines={2}
                  >
                    {active.title}
                  </Text>
                  <Text className="text-white/70 text-[13px] mt-0.5">音声解説</Text>
                </View>
              </View>

              {/* Title below artwork (larger screens) */}
              <View className="w-full">
                <Text
                  className="text-[22px] font-semibold text-label tracking-tight"
                  numberOfLines={2}
                >
                  {active.title}
                </Text>
                <Text className="text-[13px] text-secondaryLabel mt-1">音声解説</Text>
              </View>

              {/* Waveform scrubber */}
              <View className="w-full">
                <View className="flex-row items-center h-[44px] gap-[2.5px]">
                  {WAVE_BARS.map((h, i) => {
                    const filled = i / WAVE_BARS.length < progress;
                    // Reduced Motion: flat bars when user prefers
                    const barH = reducedMotion ? 0.4 : h;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => {
                          const targetMs = (i / WAVE_BARS.length) * durationMs;
                          void playerRef.current?.seek(targetMs);
                        }}
                        className="flex-1"
                        style={{ height: '100%', justifyContent: 'center', alignItems: 'center' }}
                        accessibilityLabel={`${Math.round((i / WAVE_BARS.length) * 100)}% へシーク`}
                      >
                        <View
                          className={`w-full rounded-full ${filled ? 'bg-label' : 'bg-black/15'}`}
                          style={{ height: `${barH * 100}%` }}
                        />
                      </Pressable>
                    );
                  })}
                </View>
                <View className="flex-row justify-between mt-1.5">
                  <Text className="text-[12px] text-secondaryLabel">{formatTime(positionMs)}</Text>
                  <Text className="text-[12px] text-secondaryLabel">{formatTime(durationMs)}</Text>
                </View>
              </View>

              {/* Transport controls */}
              <View className="flex-row items-center gap-10">
                <Pressable
                  onPress={selectPrev}
                  className="p-3"
                  accessibilityLabel="前のエピソード"
                >
                  <MaterialIcon name="skip_previous" fill size={32} className="text-label" />
                </Pressable>

                <Pressable
                  onPress={skipBackward}
                  className="p-3"
                  accessibilityLabel="15秒戻る"
                >
                  <MaterialIcon name="replay_15" size={28} className="text-secondaryLabel" />
                </Pressable>

                {/* Primary play button — 80pt, Apple Music style */}
                <Pressable
                  onPress={togglePlay}
                  className="w-20 h-20 rounded-full bg-label items-center justify-center"
                  accessibilityLabel={isPlaying ? '一時停止' : '再生'}
                >
                  <MaterialIcon
                    name={isPlaying ? 'pause' : 'play_arrow'}
                    fill
                    size={40}
                    className="text-white"
                  />
                </Pressable>

                <Pressable
                  onPress={skipForward}
                  className="p-3"
                  accessibilityLabel="15秒進む"
                >
                  <MaterialIcon name="forward_15" size={28} className="text-secondaryLabel" />
                </Pressable>

                <Pressable
                  onPress={selectNext}
                  className="p-3"
                  accessibilityLabel="次のエピソード"
                >
                  <MaterialIcon name="skip_next" fill size={32} className="text-label" />
                </Pressable>
              </View>

              {/* Error state */}
              {playbackStatus.type === 'error' && (
                <View className="flex-row items-center gap-2 px-4 py-2 bg-systemRed/10 rounded-xl">
                  <MaterialIcon name="error" size={16} className="text-systemRed" />
                  <Text className="text-[13px] text-systemRed">
                    {playbackStatus.message}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Episode list ── */}
          <View className="w-[280px] border-l border-black/10 bg-systemBackground">
            <View className="px-4 pt-5 pb-3">
              <Text className="text-[11px] uppercase tracking-wider text-secondaryLabel font-medium">
                すべてのエピソード
              </Text>
            </View>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: 2 }}
              showsVerticalScrollIndicator={false}
            >
              {lessons.map((l, idx) => {
                const selected = l.id === activeId;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => setActiveId(l.id)}
                    className={`px-3 py-3 rounded-xl flex-row items-center gap-3 ${
                      selected ? 'bg-secondarySystemBackground' : ''
                    }`}
                    accessibilityLabel={l.title}
                    accessibilityState={{ selected }}
                  >
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center flex-shrink-0 ${
                        selected ? 'bg-systemOrange' : 'bg-black/5'
                      }`}
                    >
                      {selected && isPlaying ? (
                        <MaterialIcon name="graphic_eq" size={14} className="text-white" />
                      ) : (
                        <Text
                          className={`text-[11px] font-semibold ${
                            selected ? 'text-white' : 'text-secondaryLabel'
                          }`}
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text
                        className={`text-[13px] ${
                          selected ? 'font-semibold text-label' : 'text-label'
                        }`}
                        numberOfLines={2}
                      >
                        {l.title}
                      </Text>
                      {l.duration_seconds !== null && (
                        <Text className="text-[11px] text-secondaryLabel mt-0.5">
                          {formatTime(l.duration_seconds * 1000)}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
