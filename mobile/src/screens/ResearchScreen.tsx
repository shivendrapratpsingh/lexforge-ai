import React from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import Badge from '../components/Badge';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import type { RootScreenProps } from '../navigation/types';

const RESULTS = [
  { id: '1', caseName: 'K.K. Verma vs. Union of India', citation: 'AIR 1954 SC 236', court: 'Supreme Court of India', year: '1954', snippet: 'Landmark ruling on the scope of judicial review under Article 32, frequently cited in writ petitions challenging executive action.' },
  { id: '2', caseName: 'M.C. Mehta vs. Kamal Nath', citation: '(1997) 1 SCC 388', court: 'Supreme Court of India', year: '1997', snippet: 'Established the polluter pays principle and public trust doctrine, foundational for environmental compliance matters.' },
  { id: '3', caseName: 'Shreya Singhal vs. Union of India', citation: '(2015) 5 SCC 1', court: 'Supreme Court of India', year: '2015', snippet: 'Struck down Section 66A of the IT Act as unconstitutional for violating free speech protections under Article 19(1)(a).' },
];

/** Research (Pro) — case law search/results. Wire the TextInput to your search API/index. */
export default function ResearchScreen({ navigation }: RootScreenProps<'Research'>) {
  const isPro = useAppStore((s) => s.isPro);

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Text style={styles.title}>Research</Text>
        <Badge label="PRO" tone="pro" />
      </View>
      <TextInput
        placeholder="Search case law, citations, keywords\u2026"
        placeholderTextColor={colors.inkFaint}
        style={styles.search}
      />
      {!isPro && (
        <Pressable onPress={() => navigation.navigate('Upgrade')} style={styles.upsell}>
          <Text style={styles.upsellText}>Case law research requires Pro</Text>
          <View style={styles.upsellBtn}><Text style={styles.upsellBtnText}>Upgrade</Text></View>
        </Pressable>
      )}
      <FlatList
        data={RESULTS}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 110 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.caseName}>{item.caseName}</Text>
            <Text style={styles.citation}>{item.citation}</Text>
            <Text style={styles.courtYear}>{item.court} \u00b7 {item.year}</Text>
            <Text style={styles.snippet}>{item.snippet}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  search: { marginHorizontal: 20, marginTop: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.input, paddingHorizontal: 14, paddingVertical: 11, color: colors.ink, fontFamily: fonts.body, fontSize: fontSizes.base },
  upsell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 10, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, borderRadius: radii.button, padding: 10 },
  upsellText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.goldLight },
  upsellBtn: { backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  upsellBtnText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.base },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  caseName: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink, lineHeight: 18 },
  citation: { fontFamily: fonts.body, fontSize: 11, color: colors.gold, marginTop: 4 },
  courtYear: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  snippet: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 8, lineHeight: 18 },
});
