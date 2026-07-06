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
      <Text style={styles.tit