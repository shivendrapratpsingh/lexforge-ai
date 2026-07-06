import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import BottomSheet from '../components/BottomSheet';
import Badge from '../components/Badge';
import { colors, fonts, radii } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { setAppLanguage } from '../i18n';
import type { RootStackParamList } from './types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * "More" bottom sheet — Clients, Legal Tools (Pro), Research (Pro), Future Lawyer,
 * Admin Console (admin only), language switcher, upgrade banner, sign out.
 */
export default function MoreSheet({ visible, onClose }: Props) {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { isPro, isAdmin, logout } = useAppStore();

  const go = (screen: keyof RootStackParamList) => {
    onClose();
    navigation.navigate(screen as never);
  };

  const items: { label: string; locked?: boolean; onPress: () => void }[] = [
    { label: t('nav.clients'), onPress: () => go('Clients') },
    { label: t('nav.legalTools'), locked: !isPro, onPress: () => go('LegalTools') },
    { label: t('nav.research'), locked: !isPro, onPress: () => go('Research') },
    { label: t('nav.futureLawyer'), onPress: () => go('FutureLawyer') },
    ...(isAdmin ? [{ label: t('nav.admin'), onPress: () => go('Admin') }] : []),
    { label: t('nav.settings'), onPress: () => go('Settings') },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {!isPro && (
        <Pressable onPress={() => go('Upgrade')} style={styles.upsell}>
          <Text style={styles.upsellText}>{t('dashboard.freeUpsellBanner')}</Text>
          <View style={styles.upsellBtn}><Text style={styles.upsellBtnText}>{t('common.upgrade')}</Text></View>
        </Pressable>
      )}

      {items.map((item) => (
        <Pressable key={item.label} onPress={item.onPress} style={styles.row}>
          <Text style={styles.rowLabel}>{item.label}</Text>
          {item.locked ? <Badge label="PRO" tone="pro" /> : null}
        </Pressable>
      ))}

      <View style={styles.langRow}>
        <Pressable
          onPress={() => setAppLanguage('en')}
          style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
        >
          <Text style={[styles.langText, i18n.language === 'en' && styles.langTextActive]}>English</Text>
        </Pressable>
        <Pressable
          onPress={() => setAppLanguage('hi')}
          style={[styles.langBtn, i18n.language === 'hi' && styles.langBtnActive]}
        >
          <Text style={[styles.langText, i18n.language === 'hi' && styles.langTextActive]}>हिन्दी</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />
      <Pressable onPress={() => { onClose(); logout(); }} style={styles.signOut}>
        <Text style={styles.signOutText}>{t('common.signOut')}</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1608',
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radii.button,
    padding: 12,
    marginBottom: 10,
  },
  upsellText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.goldLight },
  upsellBtn: { backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  upsellBtnText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.base },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  langRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9, backgroundColor: colors.surface2 },
  langBtnActive: { backgroundColor: colors.gold },
  langText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.inkMuted },
  langTextActive: { color: colors.base },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  signOut: { alignItems: 'center', paddingVertical: 12 },
  signOutText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.danger },
});
