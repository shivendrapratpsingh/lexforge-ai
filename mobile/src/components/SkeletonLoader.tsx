import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, radii } from '../theme/theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  /** Set true app-wide when the user enables Reduced Motion in Settings. */
  reducedMotion?: boolean;
};

/**
 * Shimmer skeleton loader — animated gradient sweep across a placeholder block.
 * Use while drafts/dashboard stats/client lists are loading.
 * When reducedMotion is true, renders a static (non-animated) placeholder instead.
 */
export default function SkeletonLoader({ width = '100%', height = 16, borderRadius = radii.button, style, reducedMotion }: Props) {
  const { width: screenW } = useWindowDimensions();
  const sweepWidth = typeof width === 'number' ? width : screenW;

  if (reducedMotion) {
    return <View style={[styles.base, { width, height, borderRadius, backgroundColor: colors.surface3 }, style]} />;
  }

  return (
    <View style={[styles.base, { width, height, borderRadius, backgroundColor: colors.surface2, overflow: 'hidden' }, style]}>
      <MotiView
        from={{ translateX: -sweepWidth }}
        animate={{ translateX: sweepWidth }}
        transition={{ type: 'timing', duration: 1100, loop: true, repeatReverse: false }}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={['transparent', 'rgba(212,160,23,0.14)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {},
});
