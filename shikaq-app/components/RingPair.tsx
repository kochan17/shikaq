import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CERT_COLORS: Record<string, string> = {
  ip: '#64D2FF',
  fe: '#5E5CE6',
  spi: '#FFD60A',
  boki: '#FF375F',
};
const DEFAULT_COLOR = '#007AFF';
const AUDIO_COLOR = '#FF9F0A';

interface RingPairProps {
  size?: number;
  strokeWidth?: number;
  // Daily ring (recall + learn)
  dailyProgress: number;
  dailyCurrent: number;
  dailyTotal: number;
  // Audio ring
  audioProgress: number;
  audioCurrent: number;
  audioTotal: number;
  certSlug?: string | null;
}

function Ring({
  size,
  strokeWidth,
  progress,
  color,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
}): React.ReactElement {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#F2F2F7"
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function RingPair({
  size = 160,
  strokeWidth = 10,
  dailyProgress,
  dailyCurrent,
  dailyTotal,
  audioProgress,
  audioCurrent,
  audioTotal,
  certSlug = null,
}: RingPairProps): React.ReactElement {
  const dailyColor = certSlug !== null ? (CERT_COLORS[certSlug] ?? DEFAULT_COLOR) : DEFAULT_COLOR;
  const audioSize = size * 0.6;

  return (
    <View className="flex-row items-center gap-5">
      {/* Daily ring */}
      <View style={{ width: size, height: size }} className="items-center justify-center relative">
        <Ring size={size} strokeWidth={strokeWidth} progress={dailyProgress} color={dailyColor} />
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-[13px] font-semibold text-label">
            {dailyCurrent}
            <Text className="text-[11px] text-secondaryLabel font-normal"> / {dailyTotal}</Text>
          </Text>
          <Text className="text-[10px] text-secondaryLabel mt-0.5">Daily</Text>
        </View>
      </View>

      {/* Audio ring */}
      <View
        style={{ width: audioSize, height: audioSize }}
        className="items-center justify-center relative"
      >
        <Ring
          size={audioSize}
          strokeWidth={strokeWidth * 0.8}
          progress={audioProgress}
          color={AUDIO_COLOR}
        />
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-[11px] font-semibold text-label">
            {audioCurrent}
            <Text className="text-[10px] text-secondaryLabel font-normal"> / {audioTotal}</Text>
          </Text>
          <Text className="text-[9px] text-secondaryLabel mt-0.5">Audio</Text>
        </View>
      </View>
    </View>
  );
}
