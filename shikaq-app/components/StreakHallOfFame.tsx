import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View, AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const AUTO_DISMISS_MS = 5000;
const SLIDE_IN_TARGET = 0;
const SLIDE_OUT_TARGET = -220;

interface StreakHallOfFameProps {
  streakDays: number;
  onDismiss: () => void;
}

async function fireSelectionHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // silent
  }
}

export function StreakHallOfFame({ streakDays, onDismiss }: StreakHallOfFameProps): React.ReactElement {
  const translateY = useRef(new Animated.Value(SLIDE_OUT_TARGET)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const reducedMotionRef = useRef(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((val) => { reducedMotionRef.current = val; })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (val) => {
      reducedMotionRef.current = val;
    });
    return () => sub.remove();
  }, []);

  function dismiss(): void {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    void fireSelectionHaptic();

    if (reducedMotionRef.current) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDismiss());
      return;
    }

    Animated.spring(translateY, {
      toValue: SLIDE_OUT_TARGET,
      damping: 20,
      stiffness: 280,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }

  useEffect(() => {
    // Slide in
    if (reducedMotionRef.current) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: SLIDE_IN_TARGET,
        damping: 20,
        stiffness: 280,
        useNativeDriver: true,
      }).start();
    }

    const timer = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // dismiss is stable (uses refs, not closure state)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        transform: reducedMotionRef.current ? undefined : [{ translateY }],
        opacity: reducedMotionRef.current ? opacity : 1,
        position: 'absolute',
        top: 80,
        left: 16,
        right: 16,
        zIndex: 100,
      }}
    >
      <Pressable
        onPress={dismiss}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          padding: 20,
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderWidth: 0.5,
          borderColor: 'rgba(0,0,0,0.08)',
        }}
        className="liquid-glass"
      >
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#000000',
              textAlign: 'center',
              letterSpacing: -0.3,
            }}
          >
            {streakDays}日続けました
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(60,60,67,0.6)',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            素晴らしい記録です
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
