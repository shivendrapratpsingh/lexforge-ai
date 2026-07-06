import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, radii } from '../theme/theme';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'pro';

type Props = {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
};

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surface3, fg: colors.inkMuted },
  success: { bg: colors.successBg, fg: colors.success },
  warning: { bg: colors.warningBg, fg: colors.warning },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  info: { bg: colors.infoBg, fg: colors.info },
  pro: { bg: colors.gold, fg: colors.base },
};

/** Small status pill. Use tone="pro" for the gold "PRO" badge used everywhere Pro-gating appears. */
export default function Badge({ label, tone = 'neutral', style }: Props) {
  const { bg, fg } = toneMap[tone];
  return (
    <View style={[styles.base, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
});
