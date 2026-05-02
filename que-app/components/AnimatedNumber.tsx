import { useEffect, useRef } from 'react';
import { Animated, Text, View, AccessibilityInfo } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  fontSize?: number;
  fontWeight?: '400' | '500' | '600' | '700';
  color?: string;
  suffix?: string;
  suffixFontSize?: number;
  suffixColor?: string;
}

export function AnimatedNumber({
  value,
  duration = 300,
  fontSize = 60,
  fontWeight = '700',
  color = '#000000',
  suffix,
  suffixFontSize,
  suffixColor,
}: AnimatedNumberProps): React.ReactElement {
  const prevValueRef = useRef(value);
  const translateYOut = useRef(new Animated.Value(0)).current;
  const translateYIn = useRef(new Animated.Value(fontSize * 0.6)).current;
  const opacityOut = useRef(new Animated.Value(1)).current;
  const opacityIn = useRef(new Animated.Value(0)).current;
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((val) => { reducedMotionRef.current = val; })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (val) => {
      reducedMotionRef.current = val;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;

    if (reducedMotionRef.current) {
      Animated.sequence([
        Animated.timing(opacityOut, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(opacityOut, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      return;
    }

    // reset in-layer
    translateYIn.setValue(fontSize * 0.6);
    opacityIn.setValue(0);
    translateYOut.setValue(0);
    opacityOut.setValue(1);

    Animated.parallel([
      // out: slide up + fade
      Animated.timing(translateYOut, {
        toValue: -(fontSize * 0.5),
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacityOut, {
        toValue: 0,
        duration: duration * 0.6,
        useNativeDriver: true,
      }),
      // in: slide up from below + fade in
      Animated.timing(translateYIn, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacityIn, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      // snap out-layer to idle for next animation
      translateYOut.setValue(0);
      opacityOut.setValue(1);
      translateYIn.setValue(fontSize * 0.6);
      opacityIn.setValue(0);
    });
  }, [value, duration, fontSize, translateYOut, translateYIn, opacityOut, opacityIn]);

  const lineHeight = fontSize * 1.1;

  return (
    <View style={{ height: lineHeight, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end' }}>
      {/* previous value sliding out */}
      <Animated.View
        style={{
          position: 'absolute',
          transform: [{ translateY: translateYOut }],
          opacity: opacityOut,
        }}
      >
        <Text style={{ fontSize, fontWeight, color, lineHeight }}>
          {value}
          {suffix !== undefined && (
            <Text style={{ fontSize: suffixFontSize ?? fontSize * 0.55, fontWeight: '400', color: suffixColor ?? color }}>
              {suffix}
            </Text>
          )}
        </Text>
      </Animated.View>

      {/* new value sliding in */}
      <Animated.View
        style={{
          position: 'absolute',
          transform: [{ translateY: translateYIn }],
          opacity: opacityIn,
        }}
      >
        <Text style={{ fontSize, fontWeight, color, lineHeight }}>
          {value}
          {suffix !== undefined && (
            <Text style={{ fontSize: suffixFontSize ?? fontSize * 0.55, fontWeight: '400', color: suffixColor ?? color }}>
              {suffix}
            </Text>
          )}
        </Text>
      </Animated.View>

      {/* invisible spacer to hold layout */}
      <Text style={{ fontSize, fontWeight, color: 'transparent', lineHeight }}>
        {value}
        {suffix !== undefined && (
          <Text style={{ fontSize: suffixFontSize ?? fontSize * 0.55 }}>{suffix}</Text>
        )}
      </Text>
    </View>
  );
}
