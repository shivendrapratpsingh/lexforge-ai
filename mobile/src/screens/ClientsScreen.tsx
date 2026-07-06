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
          contentContainerStyle={{ padding: 20