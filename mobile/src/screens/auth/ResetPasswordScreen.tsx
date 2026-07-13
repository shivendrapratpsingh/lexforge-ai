import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { colors, fonts, fontSizes, radii } from '../../theme/theme';
import { useToast } from '../../components/Toast';
import { apiResetPassword, ApiError } from '../../lib/api';
import type { AuthScreenProps } from '../../navigation/types';

export default function ResetPasswordScreen({ navigation, route }: AuthScreenProps<'ResetPassword'>) {
  const { t } = useTranslation();
  const toast = useToast();
  const [email, setEmail] = useState(route.params?.email || '');
  const [token, setToken] = useState(route.params?.token || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (!email.trim() || !token.trim()) {
      setError('Missing reset link details — request a new link from Forgot Password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiResetPassword(token.trim(), email.trim(), password);
      toast.show(res.message, 'success');
      navigation.navigate('Login');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not reset password. Please try again.';
      setError(msg);
      toast.show(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{t('auth.resetTitle')}</Text>
      <Text style={styles.sub}>{t('auth.resetSub')}</Text>
      <View style={styles.card}>
        {!route.params?.email && (
          <Field label={t('auth.email')} placeholder="you@lawfirm.in" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        )}
        {!route.params?.token && (
          <Field label="Reset code" placeholder="Paste the code from your email" autoCapitalize="none" value={token} onChangeText={setToken} />
        )}
        <Field label={t('auth.newPassword')} placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
        <Field label={t('auth.confirmPassword')} placeholder="••••••••" secureTextEntry value={confirm} onChangeText={setConfirm} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button label={t('auth.resetCta')} onPress={handleReset} loading={loading} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 26, paddingTop: 40, backgroundColor: colors.base },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginBottom: 26 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.modal, padding: 22 },
  errorText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.danger, marginBottom: 12 },
});
