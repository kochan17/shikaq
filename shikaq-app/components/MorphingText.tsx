import { useEffect, useRef } from 'react';
import { Platform, Text, View } from 'react-native';

interface MorphingTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  fontSize?: number;
  className?: string;
}

const SVG_FILTER_ID = 'shikaq-morph-threshold';

function ensureSvgFilter(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SVG_FILTER_ID) !== null) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', SVG_FILTER_ID);
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.innerHTML = `
    <defs>
      <filter id="${SVG_FILTER_ID}-filter">
        <feColorMatrix in="SourceGraphic" type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 255 -140"/>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
}

function MorphingTextWeb({
  texts,
  morphTime,
  cooldownTime,
  fontSize,
}: Required<Omit<MorphingTextProps, 'className'>>): React.ReactElement {
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    ensureSvgFilter();

    let textIndex = 0;
    let morph = 0;
    let cooldown = cooldownTime;
    let lastTime = performance.now();
    let animationFrameId = 0;

    const setStyles = (fraction: number): void => {
      const a = text1Ref.current;
      const b = text2Ref.current;
      if (a === null || b === null) return;

      b.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      b.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const inv = 1 - fraction;
      a.style.filter = `blur(${Math.min(8 / inv - 8, 100)}px)`;
      a.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;

      a.textContent = texts[textIndex % texts.length] ?? '';
      b.textContent = texts[(textIndex + 1) % texts.length] ?? '';
    };

    const doMorph = (): void => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }
      setStyles(fraction);
      if (fraction === 1) textIndex += 1;
    };

    const doCooldown = (): void => {
      morph = 0;
      const a = text1Ref.current;
      const b = text2Ref.current;
      if (a === null || b === null) return;
      a.style.filter = 'none';
      a.style.opacity = '0%';
      b.style.filter = 'none';
      b.style.opacity = '100%';
    };

    const animate = (): void => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      cooldown -= dt;
      if (cooldown <= 0) doMorph();
      else doCooldown();
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [texts, morphTime, cooldownTime]);

  // react-native-web emits <View> as <div>; we use a wrapping div via raw HTML for filter inheritance.
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: fontSize * 1.4,
    fontFamily: "'Inter', 'Hiragino Sans', sans-serif",
    fontSize,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: '#000000',
    textAlign: 'center',
    filter: `url(#${SVG_FILTER_ID}-filter) blur(0.6px)`,
  };
  const spanStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    margin: 'auto',
    display: 'inline-block',
    width: '100%',
  };

  return (
    <div style={containerStyle}>
      <span ref={text1Ref} style={spanStyle} />
      <span ref={text2Ref} style={spanStyle} />
    </div>
  );
}

function MorphingTextNative({
  texts,
  cooldownTime,
  fontSize,
}: Required<Omit<MorphingTextProps, 'className'>>): React.ReactElement {
  // Native fallback: simple cross-fade between texts (no SVG threshold filter on native).
  // Implementation kept minimal — Phase 1 priority is web.
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: fontSize * 1.4 }}>
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: '#000000',
          textAlign: 'center',
        }}
      >
        {texts[0] ?? ''}
      </Text>
    </View>
  );
}

export function MorphingText({
  texts,
  morphTime = 1.5,
  cooldownTime = 0.5,
  fontSize = 64,
  className,
}: MorphingTextProps): React.ReactElement {
  if (Platform.OS === 'web') {
    return (
      <MorphingTextWeb
        texts={texts}
        morphTime={morphTime}
        cooldownTime={cooldownTime}
        fontSize={fontSize}
      />
    );
  }
  return (
    <MorphingTextNative
      texts={texts}
      morphTime={morphTime}
      cooldownTime={cooldownTime}
      fontSize={fontSize}
    />
  );
}
