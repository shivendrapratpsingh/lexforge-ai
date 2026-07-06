import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { labelForBackendType } from '../data/docTypes';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/Toast';
import { apiListDrafts, Draft, ApiError } from '../lib/api';

const statusTone: Record<string, 'warning' | 'success' | 'neutral'> = { draft: 'warning', finalized: 'success', locked: 'neutral' };
const FILTERS = ['all', 'draft', 'finalized', 'locked'] as const;

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 0)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

/** Drafts list — filterable/searchable, status badges. Swipe actions (clone/export/delete):
 *  wrap each Card in react-native-gesture-handler's Swipeable for real swipe-to-reveal;
 *  a simple long-press action sheet is a lighter-weight alternative. */
// Typed loosely — mounted as "DraftsHome" inside a nested stack, see note in DashboardScreen.tsx.
export default function DraftsListScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const toast = useToast();
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q?: string) => {
    try {
      const res = await apiListDrafts(q);
      setDrafts(res.drafts);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not load drafts.';
      toast.show(msg, 'danger');
      setDrafts((prev) => prev ?? []);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      load(query);
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(query);
    setRefreshing(false);
  };

  const filtered = (drafts || []).filter((d) => {
    const matchesFilter = filter === 'all' || d.status?.toLowerCase() === filter;
    const matchesQuery = !query || d.title.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <Text style={styles.title}>{t('drafts.title')}</Text>
      <TextInput
        value={query}
        onChangeText={(v) => { setQuery(v); load(v); }}
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

      {drafts === null ? (
        <View style={{ padding: 20, gap: 10 }}>
          {[0, 1, 2, 3].map((i) => <SkeletonLoader key={i} height={64} borderRadius={radii.card} reducedMotion={reducedMotion} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 110, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
          ListEmptyComponent={
            <EmptyState
              title={query || filter !== 'all' ? 'No drafts match' : 'No drafts yet'}
              description={query || filter !== 'all' ? 'Try a different search or filter.' : 'Generate your first document from the + button below.'}
            />
          }
          renderItem={({ item }) => (
      