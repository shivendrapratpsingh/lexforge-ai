import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Badge from '../components/Badge';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

const STATS = [
  { value: '4,812', label: 'Total users' },
  { value: '1,096', label: 'Pro subscribers' },
  { value: '327', label: 'Drafts generated today' },
  { value: '\u20b9 10.9L', label: 'Revenue (MTD)' },
];

const SECTIONS = [
  {
    id: 'users', title: 'User Management', rows: [
      { primary: 'Aditi Sharma', secondary: 'aditi.sharma@lawfirm.in', badge: 'PRO', tone: 'pro' as const },
      { primary: 'Rohan Deshpande', secondary: 'rohan.d@legalfirm.in', badge: 'FREE', tone: 'neutral' as const },
      { primary: 'Kavita Nair', secondary: 'kavita.nair@nairlaw.in', badge: 'PRO', tone: 'pro' as const },
    ],
  },
  {
    id: 'drafts', title: 'Draft Management', rows: [
      { primary: 'Writ Petition \u2014 Article 226', secondary: 'Generated 12 min ago', badge: 'DRAFT', tone: 'warning' as const },
      { primary: 'Sale Deed \u2014 Koregaon Park', secondary: 'Generated 40 min ago', badge: 'FINALIZED', tone: 'success' as const },
    ],
  },
  {
    id: 'pro', title: 'Pro Toggles', rows: [
      { primary: 'Extended trial (14 days)', secondary: 'New signups get 14 days of Pro instead of 7', badge: 'ON', tone: 'success' as const },
      { primary: 'Regional pricing \u2014 Tier 2/3 cities', secondary: 'Discounted Pro pricing outside metros', badge: 'OFF', tone: 'neutral' as const },
    ],
  },
  {
    id: 'promo', title: 'Promo Windows', rows: [
      { primary: 'Independence Day Promo', secondary: '01\u201315 Aug \u00b7 20% off annual', badge: 'SCHEDULED', tone: 'info' as const },
    ],
  },
];

/** Admin Console — platform stats, dense data adapted to mobile as expandable cards. Admin-email only. */
export default function AdminScreen(_: RootScreenProps<'Admin'>) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.title}>Admin Console</Text>
      <Text style={styles.sub}>Platform-wide oversight \u2014 admin access only</Text>

      <View style={styles.statsGrid}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 10, marginTop: 6 }}>
        {SECTIONS.map((sec) => (
          <View key={sec.id} style={styles.section}>
            <Pressable onPress={() => setOpen((o) => ({ ...o, [sec.id]: !o[sec.id] }))} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.chevron}>{open[sec.id] ? '\u2212' : '+'}</Text>
            </Pressable>
            {open[sec.id] && (
              <View style={{ gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
                {sec.rows.map((r) => (
                  <View key={r.primary} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowPrimary}>{r.primary}</Text>
                      <Text style={styles.rowSecondary}>{r.secondary}</Text>
                    </View>
                    <Badge label={r.badge} tone={r.tone} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginTop: 4, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  statCard: { width: '47.5%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  statValue: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, marginTop: 3 },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, overflow: 'hidden' },
  sectionHeader: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink },
  chevron: { color: colors.inkFaint, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11 },
  rowPrimary: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ink },
  rowSecondary: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint, marginTop: 2 },
});
