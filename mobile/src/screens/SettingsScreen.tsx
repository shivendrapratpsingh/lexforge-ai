import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../components/Field';
import Button from '../components/Button';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { setAppLanguage } from '../i18n';
import { useToast } from '../components/Toast';
import { getApiBaseUrl, setApiBaseUrl } from '../lib/api';
import type { RootScreenProps } from '../navigation/types';

/** Settings — account, language switcher (EN/HI), reduced-motion, plan, server URL, sign out. */
export default function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const { t, i18n } = useTranslation();
  const { isPro, userName, userEmail, reducedMotion, setReducedMotion, logout } = useAppStore();
  const toast = useToast();
  const [serverUrl, setServerUrl] = useState('');
  const [savingServer, setSavingServer] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(setServerUrl);
  }, []);

  const handleSaveServer = async () => {
    setSavingServer(true);
    try {
      await setApiBaseUrl(serverUrl);
      toast.show('Server URL saved.', 'success');
    } finally {
      setSavingServer(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingRight: 4 }}><Text style={styles.back}>{'←'}</Text></Pressable>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={styles.profileRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(userName || '?').slice(0, 2).toUpperCase()}</Text></View>
        <View>
          <Text style={styles.name}>{userName || '—'}</Text>
          <Text style={styles.email}>{userEmail || '—'}</Text>
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
        <Text style={styles.rowTitle}>{isPro ? 'Pro plan — active' : 'Free plan'}</Text>
        <Text style={styles.manage}>Manage ›</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Server</Text>
      <View style={styles.serverCard}>
        <Field
          label="Server URL"
          placeholder="http://192.168.1.23:3000"
          autoCapitalize="none"
          autoCorrect={false}
          value={serverUrl}
          onChangeText={setServerUrl}
        />
        <Button label="Save" size="sm" loading={savingServer} onPress={handleSaveServer} />
      </View>

      <Pressable onPress={logout} style={styles.signOut}>
        <Text style={styles.signOutText}>{t('common.signOut')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, paddingBottom: 8 },
  back: { color: colors.inkMuted, fontSize: 18 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.gold },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink },
  email: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.inkFaint, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  langRow: { flexDirection: 'row', gap: 