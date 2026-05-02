import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface RingSpec {
  radius: number;
  color: string;
  progress: number;
}

interface ActivityRingsProps {
  size?: number;
  strokeWidth?: number;
  rings: RingSpec[];
  trackColor?: string;
}

export function ActivityRings({
  size = 128,
  strokeWidth = 8,
  rings,
  trackColor = '#F2F2F7',
}: ActivityRingsProps): React.ReactElement {
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.radius;
          const dashOffset = circumference * (1 - ring.progress);
          return (
            <Circle
              key={`track-${i}`}
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke={trackColor}
              strokeWidth={strokeWidth}
            />
          );
        })}
        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.radius;
          const dashOffset = circumference * (1 - ring.progress);
          return (
            <Circle
              key={`ring-${i}`}
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
}
