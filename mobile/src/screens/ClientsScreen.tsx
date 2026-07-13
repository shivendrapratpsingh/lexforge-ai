import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import { apiListClients, Client, ApiError } from '../lib/api';
import type { RootScreenProps } from '../navigation/types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

/** Clients — list + detail (attachments, payments, linked drafts on ClientDetailScreen). */
export default function ClientsScreen({ navigation }: RootScreenProps<'Clients'>) {
  const toast = useToast();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q?: string) => {
    try {
      const res = await apiListClients(q);
      setClients(res.clients);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not load clients.', 'danger');
      setClients((p) => p ?? []);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(query); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load(query);
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.back}>{'←'}</Text></Pressable>
        <Text style={styles.title}>Clients</Text>
      </View>
      <TextInput
        value={query}
        onChangeText={(v) => { setQuery(v); load(v); }}
        placeholder="Search clients…"
        placeholderTextColor={colors.inkFaint}
        style={styles.search}
      />
      {clients === null ? (
        <View style={{ padding: 20, gap: 10 }}>
          {[0, 1, 2].map((i) => <SkeletonLoader key={i} height={64} borderRadius={radii.card} />)}
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 20, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
          ListEmptyComponent={<EmptyState title={query ? 'No matches' : 'No clients yet'} description={query ? 'Try a different search.' : 'Clients are added automatically when you draft a document, or add one from the web app.'} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
            >
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item._count?.drafts ?? 0} case{item._count?.drafts === 1 ? '' : 's'} · {item.phone || item.city || '—'}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 20 },
  backBtn: { paddingRight: 4 },
  back: { color: colors.inkMuted, fontSize: 18 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  search: { marginHorizontal: 20, marginTop: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.input, paddingHorizontal: 14, paddingVertical: 11, color: colors.ink, fontFamily: fonts.body, fontSize: fontSizes.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  name: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
});
