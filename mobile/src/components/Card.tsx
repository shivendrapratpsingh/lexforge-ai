import React from 'react';
import { Pressable, View, ViewStyle, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, radii, shadows } from '../theme/theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
  padding?: number;
};

/**
 * Card — default / interactive (pressable) / selected states.
 * Interactive press: border shifts to gold, subtle glow, lifts 1px.
 * Pass onPress to get the interactive behavior; omit it for a static card.
 */
export default function Card({ children, onPress, selected, style, padding = 14 }: Props) {
  const [pressed, setPressed] = React.useState(false);
  const active = selected || pressed;

  const card = (
    <MotiView
      animate={{
        translateY: pressed ? -1 : 0,
        borderColor: active ? colors.gold : colors.border,
      }}
      transition={{ type: 'timing', duration: 120 }}
      style={[
        styles.base,
        { padding },
        active && shadows.goldGlow,
        style,
      ]}
    >
      {children}
    </MotiView>
  );

  if (!onPress) return card;

  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
