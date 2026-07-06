import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, fonts, fontSizes, radii } from '../theme/theme';

type Props = {
  /** Full target text. Reveal it incrementally by growing this prop from your generation logic
   *  (e.g. setInterval appending characters, or streamed chunks from your LLM API). */
  text: string;
  fontSize?: number;
  lineHeight?: number;
  color?: string;
  fontFamily?: string;
  reducedMotion?: boolean;
};

/** Blinking caret rendered at the end of in-progress streamed text. */
function Caret({ color, fontSize, reducedMotion }: { color: string; fontSize: number; reducedMotion?: boolean }) {
  if (reducedMotion) return <Text style={{ color, fontSize }}>▍</Text>;
  return (
    <MotiView
      from={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ type: 'timing', duration: 500, loop: true, repeatReverse: true }}
    >
      <Text style={{ color, fontSize }}>▍</Text>
    </MotiView>
  );
}

/** Streamed document text with a live caret — used on the New Draft generation screen. */
export function StreamingText({ text, fontSize = 13, lineHeight = 24.7, color = colors.base, fontFamily = 'Georgia', reducedMotion }: Props) {
  return (
    <Text style={{ fontFamily, fontSize, lineHeight, color }}>
      {text}
      <Caret color={colors.goldDim} fontSize={fontSize} reducedMotion={reducedMotion} />
    </Text>
  );
}

/** "Generating live…" pulsing dot pill shown above the streaming preview. */
export function GeneratingLivePill({ label = 'Generating live\u2026', reducedMotion }: { label?: string; reducedMotion?: boolean }) {
  return (
    <View style={styles.pill}>
      {reducedMotion ? (
        <View style={styles.dot} />
      ) : (
        <MotiView
          from={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1.15, opacity: 1 }}
          transition={{ type: 'timing', duration: 700, loop: true, repeatReverse: true }}
          style={styles.dot}
        />
      )}
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1608',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  pillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.goldLight,
  },
});
