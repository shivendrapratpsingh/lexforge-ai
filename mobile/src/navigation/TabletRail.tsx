import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/theme';
import Badge from '../components/Badge';

type RailItem = { key: string; label: string; icon: React.ReactNode; locked?: boolean };

type Props = {
  items: RailItem[];
  activeKey: string;
  onSelect: (key: string) => void;
};

/**
 * Persistent left rail shown on tablet / landscape instead of the bottom tab bar,
 * per the web app's responsive rail -> full sidebar behavior. Render this instead
 * of <BottomTabs> when `useWindowDimensions().width > 768` (see RootNavigator.tsx).
 */
export default function TabletRail({ items, activeKey, onSelect }: Props) {
  return (
    <View style={styles.rail}>
      <Text style={styles.brand}>LexForge <Text style={{ color: colors.gold }}>AI</Text></Text>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable key={item.key} onPress={() => onSelect(item.key)} style={[styles.item, active && styles.itemActive]}>
            {item.icon}
            <Text style={[styles.label, { color: active ? colors.gold : colors.inkMuted }]}>{item.label}</Text>
            {item.locked ? <Badge label="PRO" tone="pro" style={{ marginLeft: 'auto' }} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 240,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: 24,
    paddingHorizontal: 16,
    gap: 4,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: colors.surface2,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
});
