import { View, Text, ScrollView } from 'react-native';

interface MarkdownRendererProps {
  content: string;
}

type BlockType =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'blockquote'; text: string }
  | { kind: 'hr' }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'li'; text: string; depth: number }
  | { kind: 'p'; text: string };

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

function parseInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

function parseBlocks(content: string): BlockType[] {
  const lines = content.split('\n');
  const blocks: BlockType[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ kind: 'h1', text: trimmed.slice(2) });
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: trimmed.slice(3) });
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: trimmed.slice(4) });
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({ kind: 'blockquote', text: trimmed.slice(2) });
      i++;
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    // table
    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|---')) {
      const headers = trimmed
        .split('|')
        .filter((c) => c.trim() !== '')
        .map((c) => c.trim());
      i += 2; // skip separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i]
          .trim()
          .split('|')
          .filter((c) => c.trim() !== '')
          .map((c) => c.trim());
        rows.push(row);
        i++;
      }
      blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    // list item
    const liMatch = /^(\s*)([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (liMatch !== null) {
      const depth = Math.floor((liMatch[1]?.length ?? 0) / 2);
      blocks.push({ kind: 'li', text: liMatch[3] ?? '', depth });
      i++;
      continue;
    }

    blocks.push({ kind: 'p', text: trimmed });
    i++;
  }

  return blocks;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps): React.ReactElement {
  const blocks = parseBlocks(content);

  return (
    <View style={{ gap: 0 }}>
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'h1':
            return (
              <Text
                key={idx}
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  letterSpacing: -0.5,
                  lineHeight: 36,
                  marginTop: 32,
                  marginBottom: 8,
                  color: undefined,
                }}
                className="text-label"
              >
                {block.text}
              </Text>
            );

          case 'h2':
            return (
              <Text
                key={idx}
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  lineHeight: 30,
                  marginTop: 28,
                  marginBottom: 6,
                }}
                className="text-label"
              >
                {block.text}
              </Text>
            );

          case 'h3':
            return (
              <Text
                key={idx}
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  lineHeight: 26,
                  marginTop: 20,
                  marginBottom: 4,
                }}
                className="text-label"
              >
                {block.text}
              </Text>
            );

          case 'blockquote':
            return (
              <View
                key={idx}
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: '#FF9500',
                  paddingLeft: 12,
                  paddingVertical: 8,
                  marginVertical: 12,
                  backgroundColor: 'rgba(255,149,0,0.06)',
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 14, lineHeight: 22 }} className="text-secondaryLabel">
                  {stripInline(block.text)}
                </Text>
              </View>
            );

          case 'hr':
            return (
              <View
                key={idx}
                style={{ height: 1, marginVertical: 16 }}
                className="bg-black/10"
              />
            );

          case 'table':
            return (
              <View
                key={idx}
                style={{ marginVertical: 12, borderRadius: 8, overflow: 'hidden' }}
                className="hairline-border"
              >
                {/* header */}
                <View style={{ flexDirection: 'row' }} className="bg-secondarySystemBackground">
                  {block.headers.map((h, hi) => (
                    <Text
                      key={hi}
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: '600',
                        padding: 10,
                        lineHeight: 18,
                      }}
                      className="text-label"
                    >
                      {h}
                    </Text>
                  ))}
                </View>
                {block.rows.map((row, ri) => (
                  <View
                    key={ri}
                    style={{ flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.1)' }}
                  >
                    {row.map((cell, ci) => (
                      <Text
                        key={ci}
                        style={{
                          flex: 1,
                          fontSize: 13,
                          padding: 10,
                          lineHeight: 18,
                        }}
                        className="text-secondaryLabel"
                      >
                        {stripInline(cell)}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            );

          case 'li':
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  paddingLeft: 8 + block.depth * 16,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{ fontSize: 15, lineHeight: 24, marginRight: 8, marginTop: 1 }}
                  className="text-secondaryLabel"
                >
                  {'•'}
                </Text>
                <Text style={{ flex: 1, fontSize: 15, lineHeight: 24 }} className="text-label">
                  {parseInlineBold(stripInline(block.text))}
                </Text>
              </View>
            );

          case 'p':
            return (
              <Text
                key={idx}
                style={{ fontSize: 15, lineHeight: 24, marginBottom: 6 }}
                className="text-label"
              >
                {parseInlineBold(block.text)}
              </Text>
            );
        }
      })}
    </View>
  );
}
