import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { colors, fonts, fontSizes, radii } from '../../theme/theme';
import type { AuthScreenProps } from '../../navigation/types';

export default function ResetPasswordScreen({ navigation }: AuthScreenProps<'ResetPassword'>) {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{t('auth.resetTitle')}</Text>
      <Text style={styles.sub}>{t('auth.resetSub')}</Text>
      <View style={styles.card}>
        <Field label={t('auth.newPassword')} placeholder="••••••••" secureTextEntry />
        <Field label={t('auth.confirmPassword')} placeholder="••••••••" secureTextEntry />
        <Button label={t('auth.resetCta')} onPress={() => navigation.navigate('Login')} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 26, paddingTop: 40, backgroundColor: colors.base },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginBottom: 26 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.modal, padding: 22 },
});
