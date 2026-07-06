import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, radii, fonts, fontSizes, gradients, shadows } from '../theme/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const sizeStyles: Record<Size, { paddingV: number; fontSize: number }> = {
  sm: { paddingV: 9, fontSize: fontSizes.sm },
  md: { paddingV: 13, fontSize: fontSizes.md },
  lg: { paddingV: 16, fontSize: fontSizes.lg },
};

/**
 * Button — primary/secondary/ghost/destructive, sm/md/lg.
 * Primary renders the signature gold gradient + glow shadow.
 * Press feedback: scale down slightly (Moti) — no ripple, this is not Material.
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
}: Props) {
  const { paddingV, fontSize } = sizeStyles[size];
  const [pressed, setPressed] = React.useState(false);

  const textColor =
    variant === 'primary' ? colors.base : variant === 'destructive' ? colors.danger : colors.ink;

  const content = (
    <Text style={{ color: textColor, fontFamily: fonts.bodyBold, fontSize, letterSpacing: 0.2 }}>
      {loading ? '' : label}
    </Text>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      <MotiView
        animate={{ scale: pressed ? 0.97 : 1, opacity: disabled ? 0.5 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
        style={[
          styles.base,
          { paddingVertical: paddingV, borderRadius: radii.button },
          variant === 'secondary' && styles.secondary,
          variant === 'ghost' && styles.ghost,
          variant === 'destructive' && styles.destructiveOutline,
          variant === 'primary' && shadows.goldGlow,
          style,
        ]}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={gradients.goldPrimary}
            locations={gradients.goldPrimaryLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radii.button }]}
          />
        ) : null}
        {loading ? <ActivityIndicator color={variant === 'primary' ? colors.base : colors.gold} /> : content}
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructiveOutline: {
    borderWidth: 1,
    borderColor: colors.dangerBg,
    backgroundColor: colors.dangerBg,
  },
});
