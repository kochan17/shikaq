import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface GoalRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  current: number;
  total: number;
  unit?: string;
}

export function GoalRing({
  size = 160,
  strokeWidth = 12,
  progress,
  current,
  total,
  unit = '問',
}: GoalRingProps): React.ReactElement {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, position: 'relative' }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke="#F2F2F7" strokeWidth={strokeWidth} />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-[28px] font-semibold text-label">
          {current} <Text className="text-[20px] text-secondaryLabel font-normal">/ {total}</Text>
        </Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">{unit}完了</Text>
      </View>
    </View>
  );
}
