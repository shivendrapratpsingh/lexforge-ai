import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { colors, fonts, fontSizes, radii } from '../../theme/theme';
import { useAppStore } from '../../store/useAppStore';
import type { AuthScreenProps } from '../../navigation/types';

export default function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { t } = useTranslation();
  const login = useAppStore((s) => s.login);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text onPress={() => navigation.goBack()} style={styles.back}>{'\u2190 ' + t('common.back')}</Text>
      <Text style={styles.title}>{t('auth.createAccountTitle')}</Text>
      <Text style={styles.sub}>{t('auth.registerSub')}</Text>

      <View style={styles.card}>
        <Field label={t('auth.fullName')} placeholder="Aditi Sharma" />
        <Field label={t('auth.email')} placeholder="you@lawfirm.in" autoCapitalize="none" keyboardType="email-address" />
        <Field label={t('auth.barEnrollment')} placeholder="D/1234/2019" />
        <Field label={t('auth.password')} placeholder="••••••••" secureTextEntry />
        <Button label={t('auth.createAccount')} onPress={() => login('aditi.sharma@lawfirm.in')} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 26, paddingTop: 40, backgroundColor: colors.base },
  back: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginBottom: 22 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginBottom: 26 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.modal, padding: 22 },
});
