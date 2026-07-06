import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Badge from '../components/Badge';
import Card from '../components/Card';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { labelForBackendType } from '../data/docTypes';
import { useToast } from '../components/Toast';
import { apiGetClient, ApiError } from '../lib/api';

type Tab = 'overview' | 'drafts' | 'payments';

const statusTone: Record<string, 'warning' | 'success' | 'neutral'> = { draft: 'warning', finalized: 'success', locked: 'neutral' };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

/** Client detail — overview / linked drafts / payments, with room for attachments. */
// Typed loosely — mounted inside the Dashboard nested stack, see note in DashboardScreen.tsx.
export default function ClientDetailScreen({ navigation, route }: { navigation: any; route: any }) {
  const { clientId } = route.params;
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<Awaited<ReturnType<typeof apiGetClient>> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGetClient(clientId);
      setData(res);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not load this client.', 'danger');
    }
  }, [clientId, toast]);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <View style={[styles.header, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const { client, totalPaid } = data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(client.name)}</Text></View>
        <View>
          <Text style={styles.name}>{client.name}</Text>
          <Text style={styles.meta}>{[client.phone, client.email].filter(Boolean).join(' · ') || '—'}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {(['overview', 'drafts', 'payments'] as Tab[]).map((tb) => (
          <Pressable key={tb} onPress={() => setTab(tb)} style={[styles.tab, tab === tb && styles.tabActive]}>
            <Text style={[styles.tabText, tab === tb && styles.tabTextActive]}>{tb[0].toUpperCase() + tb.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {tab === 'overview' && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={styles.statValue}>{(client as any).drafts?.length ?? client._count?.drafts ?? 0}</Text><Text style={styles.statLabel}>Linked drafts</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{'₹ ' + totalPaid.toLocaleString('en-IN')}</Text><Text style={styles.statLabel}>Total billed</Text></View>
            </View>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{client.notes || 'No notes yet.'}</Text>
            </View>
          </>
        )}
        {tab === 'drafts' && (
          <View style={{ gap: 10 }}>
            {((client as any).drafts || []).length === 0 ? (
              <Text style={styles.placeholder}>No drafts linked to this client yet.</Text>
            ) : (
              ((client as any).drafts || []).map((d: any) => (
                <Card key={d.id} onPress={() => navigation.navigate('DraftDetail', { draftId: d.id })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{d.title}</Text>
                      <Text style={styles.meta}>{labelForBackendType(d.documentType)}</Text>
                    </View>
                    <Badge label={(d.status || 'draft').toUpperCase()} tone={statusTone[d.status?.toLowerCase()] || 'neutral'} />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
        {tab === 'payment