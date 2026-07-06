import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Badge from '../components/Badge';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useToast } from '../components/Toast';
import { apiAdminStats, apiAdminUsers, ApiError } from '../lib/api';
import type { RootScreenProps } from '../navigation/types';

/** Admin Console — platform stats + user list, pulled live. Admin-email only (server-enforced). */
export default function AdminScreen({ navigation }: RootScreenProps<'Admin'>) {
  const toast = useToast();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<Awaited<ReturnType<typeof apiAdminUsers>>['users'] | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ users: true });

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([apiAdminStats(), apiAdminUsers()]);
        setStats(statsRes.stats);
        setUsers(usersRes.users);
      } catch (e) {
        toast.show(e instanceof ApiError ? e.message : 'Could not load admin data.', 'danger');
        setStats({});
        setUsers([]);
      }
    })();
  }, []);

  const STATS = stats ? [
    { value: String(stats.totalUsers ?? 0), label: 'Total users' },
    { value: String(stats.proUsers ?? 0), label: 'Pro subscribers' },
    { value: String(stats.draftsToday ?? 0), label: 'Drafts generated today' },
    { value: String(stats.totalDrafts ?? 0), label: 'Total drafts' },
  ] : [];

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingRight: 4 }}><Text style={styles.back}>{'←'}</Text></Pressable>
        <View>
          <Text style={styles.title}>Admin Console</Text>
          <Text style={styles.sub}>Platform-wide oversight — admin access only</Text>
        </View>
      </View>

      {!stats ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 24 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 10, marginTop: 6 }}>
            <View style={styles.section}>
              <Pressable onPress={() => setOpen((o) => ({ ...o, users: !o.users }))} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Users ({users?.length ?? 0})</Text>
                <Text style={styles.chevron}>{open.users ? '−' : '+'}</Text>
              </Pressable>
              {open.users && (
                <View style={{ gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
                  {(users || []).map((u) => (
                    <View key={u.id} style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowPrimary}>{u.name || u.email}</Text>
                        <Text style={styles.rowSecondary}>{u.email} · {u._count.drafts} drafts</Text>
                      </View>
                      <Badge label={u.suspended ? 'SUSPENDED' : u.tier.toUpperCase()} tone={u.suspended ? 'danger' : u.tier === 'pro' ? 'pro' : 'neutral'} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  back: { color: colors.inkMuted, fontSize: 18 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, marginBottom: 6 },
  statCard: { width: '47.5%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  statValue: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 3 },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, overflow: 'hidden' },
  sectionHeader: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink },
  chevron: { color: colors.inkFaint, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, bo