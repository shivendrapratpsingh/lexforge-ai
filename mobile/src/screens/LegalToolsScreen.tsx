import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import Badge from '../components/Badge';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import type { RootScreenProps } from '../navigation/types';

const TOOLS = [
  { id: 'amendment', name: 'Analyze Amendment' },
  { id: 'appeal', name: 'Appeal Analysis' },
  { id: 'compliance', name: 'Compliance Check' },
  { id: 'counter', name: 'Counter-Argument Builder' },
  { id: 'fresh', name: 'Fresh Draft Analysis' },
  { id: 'order', name: 'Order Analysis' },
  { id: 'positive', name: 'Positive Points Extraction' },
];

/** Legal Tools (Pro) — analyze amendment/appeal/compliance/counter/fresh/order/positive-points. */
export default function LegalToolsScreen({ navigation }: RootScreenProps<'LegalTools'>) {
  const isPro = useAppStore((s) => s.isPro);

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Text style={styles.title}>Legal Tools</Text>
        <Badge label="PRO" tone="pro" />
      </View>
      <Text style={styles.sub}>AI-assisted analysis for litigation workflows</Text>

      {!isPro && (
        <Pressable onPress={() => navigation.navigate('Upgrade')} style={styles.upsell}>
          <Text style={styles.upsellText}>Legal Tools require Pro</Text>
          <View style={styles.upsellBtn}><Text style={styles.upsellBtnText}>Upgrade</Text></View>
        </Pressable>
      )}

      <FlatList
        data={TOOLS}
        keyExtractor={(t) => t.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 10, paddingVertical: 14, paddingBottom: 110 }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('LegalToolDetail', { toolId: item.id })}>
            <View style={styles.iconWrap} />
            <Text style={styles.cardName}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, paddingHorizontal: 20, marginTop: 4 },
  upsell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 12, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, borderRadius: radii.button, padding: 10 },
  upsellText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.goldLight },
  upsellBtn: { backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  upsellBtnText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.base },
  card: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14, minHeight: 104, gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold },
  cardName: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink, lineHeight: 16 },
});
