import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import Badge from '../components/Badge';
import Card from '../components/Card';
import { colors, fonts, fontSizes, radii, shadows } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import type { MainTabScreenProps } from '../navigation/types';

const RECENT_DRAFTS = [
  { id: '1', title: 'Legal Notice — Property Dispute (Mehta vs. Kapoor)', date: '2 hours ago', status: 'DRAFT' as const },
  { id: '2', title: 'Bail Application — Sessions Court, Pune', date: 'Yesterday', status: 'FINALIZED' as const },
  { id: '3', title: 'Vakalatnama — Sharma & Associates', date: '3 days ago', status: 'LOCKED' as const },
];

const COURT_DATES = [
  { id: '1', day: '14', month: 'Jul', title: 'Mehta vs. Kapoor — Hearing', court: 'Bombay High Court, Court 4' },
  { id: '2', day: '22', month: 'Jul', title: 'State vs. R. Verma — Bail Review', court: 'Sessions Court, Pune' },
];

const statusTone: Record<string, 'warning' | 'success' | 'neutral'> = {
  DRAFT: 'warning',
  FINALIZED: 'success',
  LOCKED: 'neutral',
};

/** Dashboard — stats overview, upsell/Pro banner, quick actions, recent drafts, court-date reminders. */
// NOTE: typed loosely (`any`) because this screen is mounted inside a nested
// stack (DashboardStackNav in BottomTabs.tsx) under the route name
// "DashboardHome", not under the MainTabParamList key "DashboardTab" that the
// strict CompositeScreenProps type expects. Navigation calls to sibling tabs
// (e.g. navigation.navigate('DraftsTab')) still work fine at runtime — React
// Navigation resolves unknown route names by delegating to parent navigators.
export default function DashboardScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { isPro, userName } = useAppStore();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 110 }} style={{ backgroundColor: colors.base }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>{t('dashboard.welcomeBack')}</Text>
          <Text style={styles.name}>{userName || 'Aditi Sharma'}</Text>
        </View>
        <Pressable onPress={() => navigation.getParent()?.navigate('Settings' as never)} style={styles.avatar}>
          <Text style={styles.avatarText}>AS</Text>
        </Pressable>
      </View>

      {isPro ? (
        <View style={[styles.banner, { borderColor: colors.borderGold }]}>
          <Text style={styles.bannerProText}>{t('dashboard.proActiveBanner')}</Text>
        </View>
      ) : (
        <Pressable onPress={() => navigation.getParent()?.navigate('Upgrade' as never)} style={[styles.banner, styles.bannerFree]}>
          <Text style={styles.bannerFreeText}>{t('dashboard.freeUpsellBanner')}</Text>
          <View style={styles.bannerCta}><Text style={styles.bannerCtaText}>{t('common.upgrade')}</Text></View>
        </Pressable>
      )}

      <View style={styles.statsRow}>
        <StatCard value="12" label={t('dashboard.draftsThisMonth')} />
        <StatCard value="4" label={t('dashboard.activeCases')} />
        <StatCard value="2" label={t('dashboard.courtDatesSoon')} />
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('NewDraftPicker' as never)}
          style={[styles.primaryAction, shadows.goldGlow]}
        >
          <Text style={styles.primaryActionText}>+ {t('dashboard.newDraft')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.getParent()?.navigate('Research' as never)} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>{t('dashboard.research')}</Text>
        </Pressable>
      </View>

      <SectionHeader
        title={t('dashboard.recentDrafts')}
        onViewAll={() => navigation.navigate('DraftsTab' as never)}
        viewAllLabel={t('common.viewAll')}
      />
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {RECENT_DRAFTS.map((d) => (
          <Card key={d.id} onPress={() => navigation.navigate('DraftDetail' as never, { draftId: d.id } as never)}>
            <View style={styles.draftRow}>
              <View style={styles.draftIcon}>
                <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={colors.gold} strokeWidth={1.6} />
                  <Path d="M9 12h6M9 16h6M9 8h3" stroke={colors.gold} strokeWidth={1.6} strokeLinecap="round" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.draftTitle}>{d.title}</Text>
                <Text style={styles.draftDate}>{d.date}</Text>
              </View>
              <Badge label={d.status} tone={statusTone[d.status]} />
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader
        title={t('dashboard.upcomingCourtDates')}
        onViewAll={() => navigation.getParent()?.navigate('CourtDates' as never)}
        viewAllLabel={t('common.viewAll')}
      />
      <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
        {COURT_DATES.map((c) => (
          <Card key={c.id}>
            <View style={styles.draftRow}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{c.day}</Text>
                <Text style={styles.dateMonth}>{c.month}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.draftTitle}>{c.title}</Text>
                <Text style={styles.draftDate}>{c.court}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.statCard, shadows.card]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, onViewAll, viewAllLabel }: { title: string; onViewAll: () => void; viewAllLabel: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text onPress={onViewAll} style={styles.sectionViewAll}>{viewAllLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcome: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkMuted },
  name: { fontFamily: fonts.serif, fontSize: fontSizes.heading + 2, color: colors.ink, marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.gold },
  banner: { marginHorizontal: 20, marginTop: 14, borderRadius: radii.button, padding: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerFree: { backgroundColor: '#1C1608', borderColor: colors.borderGold },
  bannerFreeText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.goldLight },
  bannerProText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: colors.goldLight, backgroundColor: 'transparent' },
  bannerCta: { backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bannerCtaText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.base },
  statsRow: { flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 4 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  statValue: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkMuted, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 14 },
  primaryAction: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radii.button, backgroundColor: colors.gold },
  primaryActionText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.base },
  secondaryAction: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radii.button, borderWidth: 1, borderColor: colors.border },
  secondaryActionText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: fontSizes.lg, color: colors.ink },
  sectionViewAll: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.gold },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  draftIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  draftTitle: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  draftDate: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, marginTop: 2 },
  dateBadge: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.goldLight },
  dateMonth: { fontFamily: fonts.body, fontSize: 9, color: colors.goldDim, textTransform: 'uppercase' },
});
