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

      <Bottom