import { View, Text, Pressable } from 'react-native';
import { MaterialIcon } from './MaterialIcon';
import type { PlaybackStatus } from '../lib/audio/player';

interface MiniPlayerProps {
  title: string;
  status: PlaybackStatus;
  onPress: () => void;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
}

export function MiniPlayer({
  title,
  status,
  onPress,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
}: MiniPlayerProps): React.ReactElement | null {
  if (status.type === 'idle') return null;

  const isPlaying = status.type === 'playing';
  const positionMs = status.type === 'playing' || status.type === 'paused' ? status.positionMs : 0;
  const durationMs = status.type === 'playing' || status.type === 'paused' ? status.durationMs : 0;
  const progress = durationMs === 0 ? 0 : Math.min(positionMs / durationMs, 1);

  return (
    <Pressable
      onPress={onPress}
      className="h-[64px] liquid-glass rounded-2xl hairline-border flex-col overflow-hidden"
      accessibilityLabel={`音声プレーヤー: ${title}`}
      accessibilityRole="button"
    >
      {/* Progress bar */}
      <View className="h-[2px] w-full bg-black/10">
        <View
          className="h-full bg-systemOrange rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      {/* Controls row */}
      <View className="flex-1 flex-row items-center px-4">
        <View className="w-9 h-9 rounded-lg bg-systemOrange/10 items-center justify-center mr-3">
          <MaterialIcon name="graphic_eq" size={22} className="text-systemOrange" />
        </View>
        <Text className="flex-1 text-[14px] font-semibold text-label min-w-0" numberOfLines={1}>
          {title}
        </Text>
        <View className="flex-row items-center gap-1 ml-2">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onSkipBackward();
            }}
            className="p-2"
            accessibilityLabel="15秒戻る"
          >
            <MaterialIcon name="replay_15" size={20} className="text-secondaryLabel" />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="w-8 h-8 rounded-full bg-black/5 items-center justify-center"
            accessibilityLabel={isPlaying ? '一時停止' : '再生'}
          >
            <MaterialIcon
              name={isPlaying ? 'pause' : 'play_arrow'}
              fill
              size={20}
              className="text-label"
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onSkipForward();
            }}
            className="p-2"
            accessibilityLabel="15秒進む"
          >
            <MaterialIcon name="forward_15" size={20} className="text-secondaryLabel" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
