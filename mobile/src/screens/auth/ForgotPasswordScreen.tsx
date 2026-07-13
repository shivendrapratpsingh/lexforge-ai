import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { colors, fonts, fontSizes, radii } from '../../theme/theme';
import { useToast } from '../../components/Toast';
import { apiForgotPassword, ApiError } from '../../lib/api';
import type { AuthScreenProps } from '../../navigation/types';

export default function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { t } = useTranslation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiForgotPassword(email.trim());
      toast.show(res.message, 'success');
      const tokenFromLink = res.resetLink ? new URL(res.resetLink).searchParams.get('token') ?? undefined : undefined;
      navigation.navigate('ResetPassword', { token: tokenFromLink, email: email.trim() });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not send reset link. Please try again.';
      setError(msg);
      toast.show(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text onPress={() => navigation.goBack()} style={styles.back}>{'← ' + t('common.back')}</Text>
      <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
      <Text style={styles.sub}>{t('auth.forgotSub')}</Text>
      <View style={styles.card}>
        <Field label={t('auth.email')} placeholder="you@lawfirm.in" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button label={t('auth.sendResetLink')} onPress={handleSend} loading={loading} fullWidth />
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
  errorText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.danger, marginBottom: 12 },
});
