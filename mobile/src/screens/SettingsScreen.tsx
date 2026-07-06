import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { setAppLanguage } from '../i18n';
import type { RootScreenProps } from '../navigation/types';

/** Settings — account, language switcher (EN/HI), reduced-motion, plan, sign out. */
export default function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const { t, i18n } = useTranslation();
  const { isPro, userName, userEmail, reducedMotion, setReducedMotion, logout } = useAppStore();

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.profileRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>AS</Text></View>
        <View>
          <Text style={styles.name}>{userName || 'Aditi Sharma'}</Text>
          <Text style={styles.email}>{userEmail || 'aditi.sharma@lawfirm.in'}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
      <View style={styles.langRow}>
        <Pressable onPress={() => setAppLanguage('en')} style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}>
          <Text style={[styles.langText, i18n.language === 'en' && styles.langTextActive]}>English</Text>
        </Pressable>
        <Pressable onPress={() => setAppLanguage('hi')} style={[styles.langBtn, i18n.language === 'hi' && styles.langBtnActive]}>
          <Text style={[styles.langText, i18n.language === 'hi' && styles.langTextActive]}>हिन्दी</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
      <Pressable onPress={() => setReducedMotion(!reducedMotion)} style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{t('settings.reducedMotion')}</Text>
          <Text style={styles.rowDesc}>{t('settings.reducedMotionDesc')}</Text>
        </View>
        <View style={[styles.toggle, reducedMotion && styles.toggleActive]}>
          <View style={[styles.knob, reducedMotion && styles.knobActive]} />
        </View>
      </Pressable>

      <Text style={styles.sectionLabel}>{t('settings.plan')}</Text>
      <Pressable onPress={() => navigation.navigate('Upgrade')} style={styles.row}>
        <Text style={styles.rowTitle}>{isPro ? 'Pro plan \u2014 active' : 'Free plan'}</Text>
        <Text style={styles.manage}>Manage ›</Text>
      </Pressable>

      <Pressable onPress={logout} style={styles.signOut}>
        <Text style={styles.signOutText}>{t('common.signOut')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, padding: 20, paddingBottom: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.gold },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink },
  email: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.inkFaint, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  langRow: { flexDirection: 'row', gap: 4, marginHorizontal: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 4 },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  langBtnActive: { backgroundColor: colors.gold },
  langText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.inkMuted },
  langTextActive: { color: colors.base },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  rowDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  manage: { fontFamily: fonts.body, fontSize: 11.5, color: colors.gold },
  toggle: { width: 42, height: 24, borderRadius: 999, backgroundColor: colors.surface3, padding: 3, justifyContent: 'center' },
  toggleActive: { backgroundColor: colors.gold },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.ink },
  knobActive: { alignSelf: 'flex-end' },
  signOut: { marginHorizontal: 20, marginTop: 28, alignItems: 'center', padding: 13, borderRadius: radii.button, borderWidth: 1, borderColor: '#3A1A16' },
  signOutText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.danger },
});
