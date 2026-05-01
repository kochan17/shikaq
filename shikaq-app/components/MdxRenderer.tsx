import React, { useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CertificationKey = 'itPassport' | 'fe' | 'spi' | 'boki';

type CalloutVariant = 'hint' | 'warning' | 'exam';

interface CalloutBlock {
  variant: CalloutVariant;
  examLabel: string | null;
  body: string;
}

export interface MdxRendererProps {
  /** Markdown / MDX-lite 文字列 (lessons.body_markdown / questions.explanation 等) */
  markdown: string;
  /** ExamCallout の資格別 tint。省略時は systemBlue */
  certificationKey?: CertificationKey;
  /** コンテナに追加する className (NativeWind) */
  className?: string;
}

// ---------------------------------------------------------------------------
// Semantic color tokens
// Tailwind config の色と 1:1 対応。セマンティックカラーのみ使う。
// ---------------------------------------------------------------------------

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C4399',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  systemBlue: '#0600FF',
  systemOrange: '#FF9F0A',
  systemGreen: '#34C759',
  separator: '#3C3C434A',
  itPassport: '#64D2FF',
  fe: '#5E5CE6',
  spi: '#FFD60A',
  boki: '#FF375F',
} as const;

const CERT_TINT: Record<CertificationKey, string> = {
  itPassport: COLORS.itPassport,
  fe: COLORS.fe,
  spi: COLORS.spi,
  boki: COLORS.boki,
};

// ---------------------------------------------------------------------------
// Callout component
// ---------------------------------------------------------------------------

interface CalloutProps {
  variant: CalloutVariant;
  examLabel: string | null;
  body: string;
  certificationKey?: CertificationKey;
}

function Callout({ variant, examLabel, body, certificationKey }: CalloutProps): React.ReactElement {
  const accentColor =
    variant === 'hint'
      ? COLORS.systemBlue
      : variant === 'warning'
        ? COLORS.systemOrange
        : certificationKey != null
          ? CERT_TINT[certificationKey]
          : COLORS.systemBlue;

  const iconName =
    variant === 'hint'
      ? 'info'
      : variant === 'warning'
        ? 'warning'
        : 'quiz';

  const bgColor =
    variant === 'hint'
      ? 'rgba(6,0,255,0.06)'
      : variant === 'warning'
        ? 'rgba(255,159,10,0.08)'
        : 'rgba(94,92,230,0.07)';

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: bgColor,
        borderRadius: 10,
        marginVertical: 10,
        overflow: 'hidden',
      }}
    >
      {/* 左の縦線アクセント */}
      <View style={{ width: 3, backgroundColor: accentColor }} />

      <View style={{ flex: 1, padding: 12 }}>
        {/* ヘッダ行: アイコン + ラベル */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: body ? 6 : 0 }}>
          <Text
            className="material-symbols-outlined fill"
            style={{ fontSize: 16, lineHeight: 16, color: accentColor, marginRight: 6 }}
            selectable={false}
          >
            {iconName}
          </Text>
          {variant === 'exam' && examLabel != null && (
            <View
              style={{
                backgroundColor: accentColor,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#FFFFFF' }}>
                過去問 {examLabel}
              </Text>
            </View>
          )}
          {variant !== 'exam' && (
            <Text style={{ fontSize: 13, fontWeight: '600', color: accentColor }}>
              {variant === 'hint' ? 'ヒント' : '注意'}
            </Text>
          )}
        </View>

        {body.length > 0 && (
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: COLORS.label,
              fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
            }}
          >
            {body}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Callout パーサ
// `> [!hint]`, `> [!warning]`, `> [!exam] ラベル` を検出して分割する
// ---------------------------------------------------------------------------

type Segment =
  | { type: 'markdown'; content: string }
  | { type: 'callout'; data: CalloutBlock };

const CALLOUT_LINE_RE = /^> \[!(hint|warning|exam)\](.*)$/i;

function parseSegments(raw: string): Segment[] {
  const lines = raw.split('\n');
  const segments: Segment[] = [];
  let mdBuffer: string[] = [];
  let currentCallout: CalloutBlock | null = null;
  let calloutLines: string[] = [];

  const flushMd = () => {
    const trimmed = mdBuffer.join('\n').trim();
    if (trimmed.length > 0) segments.push({ type: 'markdown', content: trimmed });
    mdBuffer = [];
  };

  const flushCallout = () => {
    if (currentCallout == null) return;
    segments.push({
      type: 'callout',
      data: { ...currentCallout, body: calloutLines.join('\n').trim() },
    });
    currentCallout = null;
    calloutLines = [];
  };

  for (const line of lines) {
    const match = CALLOUT_LINE_RE.exec(line);
    if (match != null) {
      flushMd();
      flushCallout();
      const variant = match[1].toLowerCase() as CalloutVariant;
      const rest = (match[2] ?? '').trim();
      currentCallout = {
        variant,
        examLabel: variant === 'exam' && rest.length > 0 ? rest : null,
        body: '',
      };
      continue;
    }

    if (currentCallout != null) {
      // 引用ブロックの継続行 (`> ...`)
      if (line.startsWith('> ')) {
        calloutLines.push(line.slice(2));
        continue;
      }
      // 空行は callout の終端
      flushCallout();
    }

    mdBuffer.push(line);
  }

  flushMd();
  flushCallout();

  return segments;
}

// ---------------------------------------------------------------------------
// react-native-markdown-display styles
// ---------------------------------------------------------------------------

const mdStyles = {
  body: {
    color: COLORS.label,
    fontSize: 17,
    lineHeight: 24.65, // 17 * 1.45
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heading1: {
    fontSize: 32,
    fontWeight: '600' as const,
    color: COLORS.label,
    marginTop: 24,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: COLORS.label,
    marginTop: 20,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.label,
    marginTop: 16,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  strong: {
    fontWeight: '600' as const,
    color: COLORS.label,
  },
  em: {
    fontStyle: 'italic' as const,
    color: COLORS.label,
  },
  link: {
    color: COLORS.systemBlue,
    textDecorationLine: 'none' as const,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: COLORS.secondarySystemBackground,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.separator,
    paddingLeft: 16,
    paddingVertical: 8,
    marginVertical: 8,
    borderRadius: 4,
  },
  code_inline: {
    backgroundColor: COLORS.secondarySystemBackground,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: COLORS.label,
  },
  fence: {
    backgroundColor: COLORS.secondarySystemBackground,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.label,
  },
  code_block: {
    backgroundColor: COLORS.secondarySystemBackground,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.label,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginBottom: 4,
    paddingLeft: 16,
  },
  image: {
    borderRadius: 12,
    maxWidth: '100%' as unknown as number,
  },
  hr: {
    backgroundColor: COLORS.separator,
    height: 1,
    marginVertical: 12,
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MdxRenderer({
  markdown,
  certificationKey,
  className,
}: MdxRendererProps): React.ReactElement {
  const segments = useMemo(() => parseSegments(markdown), [markdown]);

  return (
    <ScrollView
      className={className}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {segments.map((seg, i) => {
        if (seg.type === 'callout') {
          return (
            <Callout
              key={i}
              variant={seg.data.variant}
              examLabel={seg.data.examLabel}
              body={seg.data.body}
              certificationKey={certificationKey}
            />
          );
        }

        return (
          <Markdown
            key={i}
            style={mdStyles}
            onLinkPress={(url) => {
              // XSS 対策: http/https のみ許可
              if (url.startsWith('http://') || url.startsWith('https://')) {
                void Linking.openURL(url);
              }
              return false;
            }}
          >
            {seg.content}
          </Markdown>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Named re-export (screens からの import を簡潔にするため)
// ---------------------------------------------------------------------------

export default MdxRenderer;
