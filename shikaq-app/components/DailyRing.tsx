import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CERT_COLORS: Record<string, string> = {
  ip: '#64D2FF',
  fe: '#5E5CE6',
  spi: '#FFD60A',
  boki: '#FF375F',
};
const DEFAULT_COLOR = '#007AFF';

interface DailyRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  current: number;
  total: number;
  certSlug?: string | null;
}

export function DailyRing({
  size = 160,
  strokeWidth = 12,
  progress,
  current,
  total,
  certSlug = null,
}: DailyRingProps): React.ReactElement {
  const color = certSlug !== null ? (CERT_COLORS[certSlug] ?? DEFAULT_COLOR) : DEFAULT_COLOR;

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center relative">
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
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-[13px] text-secondaryLabel">
          {current} / {total}
        </Text>
      </View>
    </View>
  );
}
