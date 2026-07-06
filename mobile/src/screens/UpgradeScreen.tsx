import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import GradientText from '../components/GradientText';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { colors, fonts, fontSizes, gradients, radii } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import type { RootScreenProps } from '../navigation/types';

const ROWS = [
  { feature: 'Drafts', free: '3 / mo', pro: 'Unlimited' },
  { feature: 'Legal Tools suite', free: '\u2014', pro: '\u2713' },
  { feature: 'Case law research', free: '\u2014', pro: '\u2713' },
  { feature: 'Priority generation', free: '\u2014', pro: '\u2713' },
  { feature: 'Export formats', free: 'PDF', pro: 'PDF/DOCX/TXT' },
  { feature: 'Support', free: 'Email', pro: 'Priority' },
];

/**
 * Upgrade / Pro — the most visually striking screen in the app: gold gradient
 * hero text, animated rotating-gradient border on the pricing card, full
 * comparison table. Animation is skipped when reducedMotion is on.
 */
export default function UpgradeScreen({ navigation }: RootScreenProps<'Upgrade'>) {
  const { t } = useTranslation();
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const toast = useToast();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <ScrollView style={{ backgroundColor: colors.base }}>
      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(212,160,23,0.16)', 'rgba(13,13,13,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.back}>{'←'}</Text>
        </Pressable>
        <View style={styles.kicker}>
          <Text style={styles.kickerText}>LEXFORGE PRO</Text>
        </View>
        <Text style={styles.heroLine}>
          {t('upgrade.heroLine1')}{'\n'}
          <GradientText style={styles.heroLineGradient}>{t('upgrade.heroLine2') as string}</GradientText>
        </Text>
        <Text style={styles.heroSub}>{t('upgrade.heroSub')}</Text>
      </View>

      <View style={styles.billingRow}>
        <Pressable onPress={() => setBilling('monthly')} style={[styles.billingChip, billing === 'monthly' && styles.billingChipActive]}>
          <Text style={[styles.billingText, billing === 'monthly' && styles.billingTextActive]}>{t('upgrade.monthly')}</Text>
        </Pressable>
        <Pressable onPress={() => setBilling('yearly')} style={[styles.billingChip, billing === 'yearly' && styles.billingChipActive, { flexDirection: 'row', gap: 6 }]}>
          <Text style={[styles.billingText, billing === 'yearly' && styles.billingTextActive]}>{t('upgrade.yearly')}</Text>
          <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>{t('upgrade.save17')}</Text></View>
        </Pressable>
      </View>

      <GradientBorderCard reducedMotion={reducedMotion}>
        <Text style={styles.planLabel}>{t('upgrade.proPlan')}</Text>
        <Text style={styles.price}>
          {billing === 'monthly' ? '\u20b9999' : '\u20b99,990'}
          <Text style={styles.priceSuffix}>{billing === 'monthly' ? ' / month' : ' / year'}</Text>
        </Text>
        <Button
          label={t('upgrade.upgradeNow')}
          fullWidth
          style={{ marginTop: 16 }}
          onPress={() => toast.show('Self-serve billing isn’t wired up yet — contact the administrator to upgrade your account to Pro.', 'default')}
        />
      </GradientBorderCard>

      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>{t('upgrade.feature')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>{t('upgrade.free')}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center', color: colors.gold }]}>{t('upgrade.pro')}</Text>
        </View>
        {ROWS.map((row) => (
          <View key={row.feature} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.6 }]}>{row.feature}</Text>
            <Text style={[styles.tableCellMuted, { flex: 1, textAlign: 'center' }]}>{row.free}</Text>
            <Text style={[styles.tableCellPro, { flex: 1, textAlign: 'center' }]}>{row.pro}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/** Rotating gold gradient border — the "animated gradient border" signature effect. */
function GradientBorderCard({ children, reducedMotion }: { children: React.ReactNode; reducedMotion?: boolean }) {
  return (
    <View style={styles.gradientBorderWrap}>
      {reducedMotion ? (
        <LinearGradient colors={gradients.goldPrimary} style={StyleSheet.absoluteFill} />
      ) : (
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ type: 'timing', duration: 4000, loop: true }}
          style={[StyleSheet.absoluteFill, { width: '140%', height: '140%', left: '-20%', top: '-20%' }]}
        >
          <LinearGradient colors={['#A07810', '#F0C040', '#D4A017', '#A07810']} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        </MotiView>
      )}
      <View style={styles.gradientBorderInner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 26, paddingTop: 40, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 44, left: 20, zIndex: 1, width: 32, height: 32, borderRadius: 9, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.ink, fontSize: 16 },
  kicker: { backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 6, marginBottom: 16 },
  kickerText: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.goldLight, letterSpacing: 0.4 },
  heroLine: { fontFamily: fonts.serifBold, fontSize: 27, lineHeight: 34, color: colors.ink, textAlign: 'center' },
  heroLineGradient: { fontFamily: fonts.serifBold, fontSize: 27, lineHeight: 34 },
  heroSub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  billingRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingBottom: 18 },
  billingChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface2 },
  billingChipActive: { backgroundColor: colors.gold },
  billingText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.inkMuted },
  billingTextActive: { color: colors.base },
  saveBadge: { backgroundColor: colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  saveBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.base },
  gradientBorderWrap: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 2, overflow: 'hidden' },
  gradientBorderInner: { backgroundColor: colors.surface, borderRadius: 18, padding: 22, alignItems: 'center' },
  planLabel: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkMuted, marginBottom: 6 },
  price: { fontFamily: fonts.serifBold, fontSize: 36, color: colors.ink },
  priceSuffix: { fontFamily: fonts.body, fontSize: 14, color: colors.inkFaint },
  table: { paddingHorizontal: 20, paddingBottom: 32 },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 1