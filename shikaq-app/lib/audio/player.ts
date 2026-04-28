import { Platform } from 'react-native';

export type PlaybackStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'playing'; positionMs: number; durationMs: number }
  | { type: 'paused'; positionMs: number; durationMs: number }
  | { type: 'ended' }
  | { type: 'error'; message: string };

export interface AudioPlayerHandle {
  load: (uri: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  unload: () => Promise<void>;
  getStatus: () => PlaybackStatus;
  onStatusChange: (handler: (status: PlaybackStatus) => void) => () => void;
  // TODO (Phase 3): Now Playing Info (iOS MediaPlayer) / MediaSession (Web)
}

// Web implementation using HTMLAudioElement
function createWebPlayer(): AudioPlayerHandle {
  let el: HTMLAudioElement | null = null;
  let status: PlaybackStatus = { type: 'idle' };
  const handlers = new Set<(s: PlaybackStatus) => void>();

  function emit(s: PlaybackStatus): void {
    status = s;
    handlers.forEach((h) => h(s));
  }

  function buildStatus(paused: boolean): PlaybackStatus {
    if (el === null) return { type: 'idle' };
    const pos = isFinite(el.currentTime) ? el.currentTime * 1000 : 0;
    const dur = isFinite(el.duration) ? el.duration * 1000 : 0;
    return paused
      ? { type: 'paused', positionMs: pos, durationMs: dur }
      : { type: 'playing', positionMs: pos, durationMs: dur };
  }

  return {
    async load(uri) {
      if (el !== null) {
        el.pause();
        el.src = '';
      }
      emit({ type: 'loading' });
      el = new window.Audio(uri);

      el.addEventListener('timeupdate', () => {
        if (el === null || el.paused) return;
        emit(buildStatus(false));
      });
      el.addEventListener('loadedmetadata', () => {
        if (el === null) return;
        emit(buildStatus(el.paused));
      });
      el.addEventListener('ended', () => emit({ type: 'ended' }));
      el.addEventListener('error', () =>
        emit({ type: 'error', message: el?.error?.message ?? 'unknown audio error' })
      );
    },

    async play() {
      if (el === null) return;
      await el.play();
      emit(buildStatus(false));
    },

    async pause() {
      if (el === null) return;
      el.pause();
      emit(buildStatus(true));
    },

    async seek(positionMs) {
      if (el === null) return;
      el.currentTime = positionMs / 1000;
      emit(buildStatus(el.paused));
    },

    async skipForward(seconds = 15) {
      if (el === null) return;
      el.currentTime = Math.min(el.currentTime + seconds, el.duration ?? el.currentTime);
      emit(buildStatus(el.paused));
    },

    async skipBackward(seconds = 15) {
      if (el === null) return;
      el.currentTime = Math.max(el.currentTime - seconds, 0);
      emit(buildStatus(el.paused));
    },

    async unload() {
      if (el !== null) {
        el.pause();
        el.src = '';
        el = null;
      }
      emit({ type: 'idle' });
    },

    getStatus() {
      return status;
    },

    onStatusChange(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}

// Native implementation using expo-audio (Expo SDK 55+)
function createNativePlayer(): AudioPlayerHandle {
  let playerRef: {
    play(): void;
    pause(): void;
    seekTo(positionSeconds: number): void;
    remove(): void;
    readonly playing: boolean;
    readonly currentTime: number;
    readonly duration: number;
    readonly status?: string;
  } | null = null;
  let status: PlaybackStatus = { type: 'idle' };
  const handlers = new Set<(s: PlaybackStatus) => void>();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function emit(s: PlaybackStatus): void {
    status = s;
    handlers.forEach((h) => h(s));
  }

  function buildStatusFromPlayer(): PlaybackStatus {
    if (playerRef === null) return { type: 'idle' };
    const pos = (playerRef.currentTime ?? 0) * 1000;
    const dur = (playerRef.duration ?? 0) * 1000;
    if (playerRef.status === 'readyToPlay' && playerRef.playing) {
      return { type: 'playing', positionMs: pos, durationMs: dur };
    }
    if (playerRef.status === 'readyToPlay') {
      return { type: 'paused', positionMs: pos, durationMs: dur };
    }
    if (playerRef.status === 'loading') return { type: 'loading' };
    if (playerRef.status === 'idle') return { type: 'idle' };
    return { type: 'ended' };
  }

  function startPolling(): void {
    if (intervalId !== null) return;
    intervalId = setInterval(() => {
      if (playerRef === null) {
        stopPolling();
        return;
      }
      emit(buildStatusFromPlayer());
    }, 250);
  }

  function stopPolling(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    async load(uri) {
      emit({ type: 'loading' });
      try {
        const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
        await setAudioModeAsync({ playsInSilentMode: true });
        if (playerRef !== null) {
          stopPolling();
          playerRef.remove();
          playerRef = null;
        }
        playerRef = createAudioPlayer({ uri });
        startPolling();
        emit({ type: 'paused', positionMs: 0, durationMs: 0 });
      } catch (e: unknown) {
        emit({
          type: 'error',
          message: e instanceof Error ? e.message : 'audio load failed',
        });
      }
    },

    async play() {
      if (playerRef === null) return;
      playerRef.play();
      emit(buildStatusFromPlayer());
    },

    async pause() {
      if (playerRef === null) return;
      playerRef.pause();
      emit(buildStatusFromPlayer());
    },

    async seek(positionMs) {
      if (playerRef === null) return;
      playerRef.seekTo(positionMs / 1000);
      emit(buildStatusFromPlayer());
    },

    async skipForward(seconds = 15) {
      if (playerRef === null) return;
      const next = Math.min(
        (playerRef.currentTime ?? 0) + seconds,
        playerRef.duration ?? playerRef.currentTime ?? 0
      );
      playerRef.seekTo(next);
      emit(buildStatusFromPlayer());
    },

    async skipBackward(seconds = 15) {
      if (playerRef === null) return;
      const next = Math.max((playerRef.currentTime ?? 0) - seconds, 0);
      playerRef.seekTo(next);
      emit(buildStatusFromPlayer());
    },

    async unload() {
      stopPolling();
      if (playerRef !== null) {
        playerRef.remove();
        playerRef = null;
      }
      emit({ type: 'idle' });
    },

    getStatus() {
      return status;
    },

    onStatusChange(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}

export function createAudioPlayer(): AudioPlayerHandle {
  if (Platform.OS === 'web') {
    return createWebPlayer();
  }
  return createNativePlayer();
}
