import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { colors, fonts, fontSizes, radii } from '../../theme/theme';
import type { AuthScreenProps } from '../../navigation/types';

export default function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text onPress={() => navigation.goBack()} style={styles.back}>{'\u2190 ' + t('common.back')}</Text>
      <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
      <Text style={styles.sub}>{t('auth.forgotSub')}</Text>
      <View style={styles.card}>
        <Field label={t('auth.email')} placeholder="you@lawfirm.in" autoCapitalize="none" keyboardType="email-address" />
        <Button label={t('auth.sendResetLink')} onPress={() => navigation.navigate('ResetPassword', {})} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 26, paddingTop: 40, backgroundColor: colors.base },
  back: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginBottom: 22 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginBottom: 26, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.modal, padding: 22 },
});
