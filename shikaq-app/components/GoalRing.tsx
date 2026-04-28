import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, AccessibilityInfo, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface GoalRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  current: number;
  total: number;
  unit?: string;
}

async function fireSuccess(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // silent
  }
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

  const prevProgressRef = useRef(progress);
  const hasCompletedRef = useRef(progress >= 1);

  // Spring bounce: scale of the entire ring
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Glow: opacity of the shimmer overlay
  const glowOpacity = useRef(new Animated.Value(0)).current;
  // dashOffset as Animated.Value for smooth fill
  const dashOffsetAnim = useRef(
    new Animated.Value(circumference * (1 - Math.min(progress, 1)))
  ).current;

  const reducedMotionRef = useRef(false);
  const [, forceRender] = useState(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((val) => { reducedMotionRef.current = val; })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (val) => {
      reducedMotionRef.current = val;
      forceRender((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const clamped = Math.min(progress, 1);
    const targetOffset = circumference * (1 - clamped);

    // Animate ring fill
    Animated.timing(dashOffsetAnim, {
      toValue: targetOffset,
      duration: 400,
      useNativeDriver: false,
    }).start();

    const wasComplete = hasCompletedRef.current;
    const isNowComplete = progress >= 1;
    const justCompleted = !wasComplete && isNowComplete;

    hasCompletedRef.current = isNowComplete;
    prevProgressRef.current = progress;

    if (!justCompleted) return;

    // Fire success haptic immediately
    void fireSuccess();

    if (reducedMotionRef.current) return;

    // Spring bounce
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 0.3s later: glow shimmer 0 → 0.2 → 0 over 0.6s
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 300);
    });
  }, [progress, circumference, dashOffsetAnim, scaleAnim, glowOpacity]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F2F2F7"
          strokeWidth={strokeWidth}
        />
        {/* Progress — animated via native driver false, so dashOffset changes */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffsetAnim}
          strokeLinecap="round"
        />
      </Svg>

      {/* Glow shimmer overlay */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: strokeWidth * 2,
          top: center - strokeWidth,
          left: 0,
          opacity: glowOpacity,
          backgroundColor: '#FFFFFF',
          borderRadius: strokeWidth,
        }}
      />

      {/* Center label */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-[28px] font-semibold text-label">
          {current} <Text className="text-[20px] text-secondaryLabel font-normal">/ {total}</Text>
        </Text>
        <Text className="text-[13px] text-secondaryLabel mt-1">{unit}完了</Text>
      </View>
    </Animated.View>
  );
}

// Animated wrapper for SVG Circle (dashOffset needs Animated.Value)
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
