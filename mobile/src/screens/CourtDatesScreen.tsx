import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import BottomSheet from '../components/BottomSheet';
import Field from '../components/Field';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

const COURT_DATES = [
  { id: '1', day: '14', month: 'Jul', title: 'Mehta vs. Kapoor — Hearing', court: 'Bombay High Court, Court 4', time: '11:00 AM', type: 'HEARING' as const },
  { id: '2', day: '18', month: 'Jul', title: 'Kapoor Textiles — Compliance Review', court: 'NCLT, Mumbai Bench', time: '2:30 PM', type: 'REVIEW' as const },
  { id: '3', day: '22', month: 'Jul', title: 'State vs. R. Verma — Bail Review', court: 'Sessions Court, Pune', time: '10:30 AM', type: 'BAIL' as const },
  { id: '4', day: '29', month: 'Jul', title: 'Deshmukh — Divorce Mediation', court: 'Family Court, Pune', time: '3:00 PM', type: 'MEDIATION' as const },
];

const typeTone: Record<string, 'info' | 'warning' | 'danger' | 'success'> = {
  HEARING: 'info', REVIEW: 'warning', BAIL: 'danger', MEDIATION: 'success',
};

/** Court Dates — list view + add/edit reminder sheet. Swap the list for a calendar
 *  grid (e.g. react-native-calendars) if you want month-view instead of list-view. */
// Typed loosely — mounted as "CourtDatesHome" inside a nested stack, see note in DashboardScreen.tsx.
export default function CourtDatesScreen(_: any) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Text style={styles.title}>Court Dates</Text>
        <Pressable onPress={() => setAddOpen(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={COURT_DATES}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 110 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>{item.day}</Text>
              <Text style={styles.dateMonth}>{item.month}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>{item.court} · {item.time}</Text>
            </View>
            <Badge label={item.type} tone={typeTone[item.type]} />
          </View>
        )}
      />

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)}>
        <Text style={styles.sheetTitle}>Add court date reminder</Text>
        <Field label="Case title" placeholder="Mehta vs. Kapoor" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Field label="Date" placeholder="14 Jul 2026" /></View>
          <View style={{ flex: 1 }}><Field label="Time" placeholder="11:00 AM" /></View>
        </View>
        <Field label="Court name" placeholder="Bombay High Court" />
        <Button label="Save reminder" fullWidth onPress={() => setAddOpen(false)} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.base, marginTop: -2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  dateBadge: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.goldLight },
  dateMonth: { fontFamily: fonts.body, fontSize: 9, color: colors.goldDim, textTransform: 'uppercase' },
  rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  rowMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  sheetTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink, marginBottom: 14 },
});
