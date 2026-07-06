import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/theme';
import Badge from './Badge';

type Props = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  locked?: boolean; // shows a small PRO badge
  onPress?: () => void;
  /** 'tab' = vertical icon-over-label (bottom tab bar); 'row' = horizontal (More sheet / rail) */
  layout?: 'tab' | 'row';
};

/** Nav item used in the bottom tab bar, the tablet rail, and the More sheet list. */
export default function NavItem({ icon, label, active, locked, onPress, layout = 'tab' }: Props) {
  const color = active ? colors.gold : colors.inkFaint;

  if (layout === 'row') {
    return (
      <Pressable onPress={onPress} style={styles.row}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={[styles.rowLabel, { color: active ? colors.gold : colors.ink }]}>{label}</Text>
        {locked ? <Badge label="PRO" tone="pro" /> : null}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.tab}>
      {icon}
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 56,
  },
  tabLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
});
