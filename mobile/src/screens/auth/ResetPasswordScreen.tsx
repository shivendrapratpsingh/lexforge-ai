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
      toast.show(res.message, 's