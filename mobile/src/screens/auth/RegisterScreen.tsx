import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { colors, fonts, fontSizes, radii } from '../../theme/theme';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../components/Toast';
import { apiRegister, apiLogin, ApiError } from '../../lib/api';
import type { AuthScreenProps } from '../../navigation/types';

export default function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { t } = useTranslation();
  const registerLogin = useAppStore((s) => s.registerLogin);
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in your name, email, and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await apiRegister(name.trim(), email.trim(), password);
      const { token, user } = await apiLogin(email.trim(), password);
      await registerLogin(user, token);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Registration failed. Please try again.';
      setError(msg);
      toast.show(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text onPress={() => navigation.goBack()} style={styles.back}>{'← ' + t('common.back')}</Text>
      <Text style={styles.title}>{t('auth.createAccountTitle')}</Text>
      <Text style={styles.sub}>{t('auth.registerSub')}</Text>

 