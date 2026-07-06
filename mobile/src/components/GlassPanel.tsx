import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { View } from 'react-native';
import { colors, radii } from '../theme/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
};

/**
 * Translucent glass panel — used for the Assistant chat panel background,
 * modals, and any overlay that should feel like frosted glass over content.
 * Install: expo install expo-blur
 */
export default function GlassPanel({ children, style, intensity = 40, borderRadius = radii.modal }: Props) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.base, { borderRadius }, style]}>
      <View style={[styles.tint, { borderRadius }]} />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,13,13,0.55)',
  },
});
