import { useEffect, useState } from 'react';
import { Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface TypewriterProps {
  texts: string[];
  speed?: number;
  waitTime?: number;
  deleteSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorChar?: string;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle>;
  cursorClassName?: string;
}

export function Typewriter({
  texts,
  speed = 80,
  waitTime = 1800,
  deleteSpeed = 40,
  loop = true,
  showCursor = true,
  cursorChar = '_',
  textClassName,
  textStyle,
  cursorClassName,
}: TypewriterProps): React.ReactElement {
  const [displayText, setDisplayText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  const currentText = texts[textIndex] ?? '';

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false);
        if (textIndex === texts.length - 1 && !loop) return;
        setTextIndex((prev) => (prev + 1) % texts.length);
        setCharIndex(0);
      } else {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, deleteSpeed);
      }
    } else {
      if (charIndex < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev + currentText.charAt(charIndex));
          setCharIndex((prev) => prev + 1);
        }, speed);
      } else if (texts.length > 1) {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, waitTime);
      }
    }

    return () => {
      if (timeout !== null) clearTimeout(timeout);
    };
  }, [charIndex, displayText, isDeleting, textIndex, currentText, speed, waitTime, deleteSpeed, loop, texts.length]);

  // Cursor blink (Reanimated, Reduced Motion 自動対応)
  const cursorOpacity = useSharedValue(1);
  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400, easing: Easing.linear }),
        withTiming(1, { duration: 400, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, [cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({ opacity: cursorOpacity.value }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text className={textClassName} style={textStyle}>
        {displayText}
      </Text>
      {showCursor && (
        <Animated.Text
          className={cursorClassName ?? textClassName}
          style={[textStyle, cursorStyle, { marginLeft: 2 }]}
        >
          {cursorChar}
        </Animated.Text>
      )}
    </View>
  );
}
