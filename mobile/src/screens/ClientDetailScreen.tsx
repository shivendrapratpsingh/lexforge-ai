import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

type Tab = 'overview' | 'drafts' | 'payments';

/** Client detail — overview / linked drafts / payments, with room for attachments. */
// Typed loosely — mounted inside the Dashboard nested stack, see note in DashboardScreen.tsx.
export default function ClientDetailScreen({ navigation }: { navigation: any }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <View style={styles.avatar}><Text style={styles.avatarText}>RV</Text></View>
        <View>
          <Text style={styles.name}>Rajesh Verma</Text>
          <Text style={styles.meta}>+91 98200 XXXXX · rajesh.v@email.com</Text>
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
              <View style={styles.statCard}><Text style={styles.statValue}>3</Text><Text style={styles.statLabel}>Linked drafts</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{'₹ 45,000'}</Text><Text style={styles.statLabel}>Total billed</Text></View>
            </View>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>Property boundary dispute with neighbour. Prefers WhatsApp updates. Hearing rescheduled twice — next date confirmed for 14 Jul.</Text>
            </View>
          </>
        )}
        {tab === 'drafts' && (
          <Text style={styles.placeholder}>Linked drafts list — reuse the Card + Badge pattern from DraftsListScreen, filtered to this client.</Text>
        )}
        {tab === 'payments' && (
          <Text style={styles.placeholder}>Payment history — list of {`{label, date, amount}`} rows, same as the web app's client ledger.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.inkMuted, fontSize: 18 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint },
  tabRow: { flexDirection: 'row', gap: 6, padding: 16, paddingBottom: 0 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface2 },
  tabActive: { backgroundColor: colors.gold },
  tabText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.inkMuted },
  tabTextActive: { color: colors.base },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 12 },
  statValue: { fontFamily: fonts.serifBold, fontSize: 19, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkMuted, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.inkMuted, marginBottom: 8 },
  noteCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  noteText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkMuted, lineHeight: 20 },
  placeholder: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkFaint, lineHeight: 20 },
});
