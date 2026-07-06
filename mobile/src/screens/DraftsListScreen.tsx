import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Badge from '../components/Badge';
import Card from '../components/Card';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { MainTabScreenProps } from '../navigation/types';

const DRAFTS = [
  { id: '1', title: 'Legal Notice — Property Dispute (Mehta vs. Kapoor)', docType: 'Legal Notice', date: '2 hours ago', status: 'DRAFT' as const },
  { id: '2', title: 'Bail Application — Sessions Court, Pune', docType: 'Bail Application', date: 'Yesterday', status: 'FINALIZED' as const },
  { id: '3', title: 'Vakalatnama — Sharma & Associates', docType: 'Vakalatnama', date: '3 days ago', status: 'LOCKED' as const },
  { id: '4', title: 'Writ Petition — Article 226, Delhi HC', docType: 'Writ Petition', date: '4 days ago', status: 'DRAFT' as const },
  { id: '5', title: 'Cheque Bounce Complaint — Sec. 138 NI Act', docType: 'Cheque Bounce', date: '5 days ago', status: 'FINALIZED' as const },
];

const statusTone: Record<string, 'warning' | 'success' | 'neutral'> = { DRAFT: 'warning', FINALIZED: 'success', LOCKED: 'neutral' };
const FILTERS = ['all', 'draft', 'finalized', 'locked'] as const;

/** Drafts list — filterable/searchable, status badges. Swipe actions (clone/export/delete):
 *  wrap each Card in react-native-gesture-handler's Swipeable for real swipe-to-reveal;
 *  a simple long-press action sheet is a lighter-weight alternative. */
// Typed loosely — mounted as "DraftsHome" inside a nested stack, see note in DashboardScreen.tsx.
export default function DraftsListScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');

  const filtered = DRAFTS.filter((d) => {
    const matchesFilter = filter === 'all' || d.status.toLowerCase() === filter;
    const matchesQuery = d.title.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <Text style={styles.title}>{t('drafts.title')}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('drafts.search') as string}
        placeholderTextColor={colors.inkFaint}
        style={styles.search}
      />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`drafts.filter${f[0].toUpperCase()}${f.slice(1)}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 110 }}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('DraftDetail', { draftId: item.id } as never)}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>{item.docType} · {item.date}</Text>
              </View>
              <Badge label={item.status} tone={statusTone[item.status]} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, padding: 20, paddingBottom: 8 },
  search: { marginHorizontal: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.input, paddingHorizontal: 14, paddingVertical: 11, color: colors.ink, fontFamily: fonts.body, fontSize: fontSizes.base },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surface2 },
  chipActive: { backgroundColor: colors.gold },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.inkMuted },
  chipTextActive: { color: colors.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  rowMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
});
