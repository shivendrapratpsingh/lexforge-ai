import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import BottomSheet from '../components/BottomSheet';
import Field from '../components/Field';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useToast } from '../components/Toast';
import { apiListCourtDates, apiCreateCourtDate, CourtDate, ApiError } from '../lib/api';

const typeTone: Record<string, 'info' | 'warning' | 'danger' | 'success'> = {
  hearing: 'info', review: 'warning', bail: 'danger', mediation: 'success',
};

/** Court Dates — list view + add/edit reminder sheet. Swap the list for a calendar
 *  grid (e.g. react-native-calendars) if you want month-view instead of list-view. */
// Typed loosely — mounted as "CourtDatesHome" inside a nested stack, see note in DashboardScreen.tsx.
export default function CourtDatesScreen(_: any) {
  const toast = useToast();
  const [courtDates, setCourtDates] = useState<CourtDate[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [court, setCourt] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiListCourtDates();
      setCourtDates(res.courtDates);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not load court dates.', 'danger');
      setCourtDates((p) => p ?? []);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.show('Enter a case title.', 'danger'); return; }
    const parsed = new Date(dateTime.replace(' ', 'T'));
    if (isNaN(parsed.getTime())) { toast.show('Enter the date as YYYY-MM-DD HH:MM.', 'danger'); return; }
    setSaving(true);
    try {
      await apiCreateCourtDate({ title: title.trim(), date: parsed.toISOString(), notes: court.trim() || undefined });
      setTitle(''); setDateTime(''); setCourt('');
      setAddOpen(false);
      toast.show('Court date added.', 'success');
      load();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not save this reminder.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Text style={styles.title}>Court Dates</Text>
        <Pressable onPress={() => setAddOpen(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {courtDates === null ? (
        <View style={{ padding: 20, gap: 10 }}>
          {[0, 1, 2].map((i) => <SkeletonLoader key={i} height={72} borderRadius={radii.card} />)}
        </View>
      ) : (
        <FlatList
          data={courtDates}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
          ListEmptyComponent={<EmptyState title="No court dates yet" description="Tap + to add your first reminder." />}
          renderItem={({ item }) => {
            const d = new Date(item.date);
            return (
              <View style={styles.row}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateDay}>{d.getDate()}</Text>
                  <Text style={styles.dateMonth}>{d.toLocaleString('en', { month: 'short' })}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowMeta}>{item.client?.name || item.caseNumber || '—'} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Badge label={(item.type || 'hearing').toUpperCase()} tone={typeTone[item.type?.toLowerCase()] || 'info'} />
              </View>
            );
          }}
        />
      )}

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)}>
        <Text style={styles.sheetTitle}>Add court date reminder</Text>
        <Field label="Case title" placeholder="Mehta vs. Kapoor" value={title} onChangeText={setTitle} />
        <Field label="Date & time" placeholder="2026-07-14 11:00" value={dateTime} onChangeText={setDateTime} autoCapitalize="none" />
        <Field label="Court name / notes" placeholder="Bombay High Court" value={court} onChangeText={setCourt} />
        <Button label="Save reminder" fullWidth loading={saving} onPress={handleSave} />
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
