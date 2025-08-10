import React from 'react';
import { Text, View } from 'react-native';

interface MarkdownMessageProps {
  text: string;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
}

// Minimal markdown renderer for RN supporting bold, italic, inline code, and bullet lists
export function MarkdownMessage({ text, color = '#1F2937', fontSize = 15, lineHeight = 20 }: MarkdownMessageProps) {
  const renderInline = (segment: string, keyPrefix: string) => {
    // Match tokens: **bold**, *italic*, `code`
    const tokenRegex = /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
    const parts = segment.split(tokenRegex).filter(Boolean);

    return (
      <Text style={{ color, fontSize, lineHeight }}>
        {parts.map((part, idx) => {
          const key = `${keyPrefix}-inline-${idx}`;
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            const content = part.slice(2, -2);
            return (
              <Text key={key} style={{ fontWeight: '700', color, fontSize, lineHeight }}>
                {content}
              </Text>
            );
          }
          if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            const content = part.slice(1, -1);
            return (
              <Text key={key} style={{ fontStyle: 'italic', color, fontSize, lineHeight }}>
                {content}
              </Text>
            );
          }
          if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            const content = part.slice(1, -1);
            return (
              <Text
                key={key}
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#111827',
                  borderRadius: 4,
                  paddingHorizontal: 4,
                }}
              >
                {content}
              </Text>
            );
          }
          return <Text key={key} style={{ color, fontSize, lineHeight }}>{part}</Text>;
        })}
      </Text>
    );
  };

  const lines = text.split('\n');

  return (
    <View>
      {lines.map((line, idx) => {
        const keyPrefix = `line-${idx}`;
        const trimmed = line.trim();
        const bulletMatch = /^([-*])\s+(.+)$/.exec(trimmed);
        if (bulletMatch) {
          const content = bulletMatch[2];
          return (
            <View key={keyPrefix} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ color, fontSize, lineHeight, marginRight: 6 }}>•</Text>
              <View style={{ flex: 1 }}>{renderInline(content, keyPrefix)}</View>
            </View>
          );
        }
        // Regular paragraph line
        return (
          <View key={keyPrefix} style={{ marginBottom: 2 }}>
            {renderInline(line, keyPrefix)}
          </View>
        );
      })}
    </View>
  );
}


