import { Platform, View, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  size?: number;
  variant?: 'brand' | 'white';
}

export function BrandSpinner({ size = 32, variant = 'brand' }: Props): React.ReactElement {
  if (Platform.OS !== 'web') {
    return (
      <ActivityIndicator
        color={variant === 'white' ? '#FFFFFF' : '#0600FF'}
        size={size > 28 ? 'large' : 'small'}
      />
    );
  }

  const r = 20;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * 0.7;
  const gap = circumference * 0.3;

  return (
    <View
      // @ts-expect-error className is web-only via NativeWind
      className="brand-spinner"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 50 50">
        {variant === 'brand' && (
          <Defs>
            <LinearGradient id="brand-spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0600FF" />
              <Stop offset="100%" stopColor="#7A0085" />
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx="25"
          cy="25"
          r={r}
          stroke={variant === 'white' ? '#FFFFFF' : 'url(#brand-spinner-grad)'}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        />
      </Svg>
    </View>
  );
}
