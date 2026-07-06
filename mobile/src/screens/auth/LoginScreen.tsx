import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Field from '../../components/Field';
import Button from '../../components/Button';
import GradientText from '../../components/GradientText';
import { colors, fonts, fontSizes, radii, shadows } from '../../theme/theme';
import { useAppStore } from '../../store/useAppStore';
import type { AuthScreenProps } from '../../navigation/types';

/**
 * Login — centered card on a dark hero background with a radial gold glow,
 * serif brand wordmark with gradient "AI", gold primary CTA.
 * This is one of the 6 screens called out as needing full visual polish.
 */
export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { t } = useTranslation();
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(212,160,23,0.16)', 'rgba(13,13,13,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBlock}>
          <Text style={styles.brandText}>
            LexForge{' '}
            <GradientText style={styles.brandTextInline}>AI</GradientText>
          </Text>
          <Text style={styles.tagline}>{t('auth.loginTagline')}</Text>
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>{t('auth.signInTitle')}</Text>

          <Field
            label={t('auth.email')}
            placeholder="you@lawfirm.in"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label={t('auth.password')}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            {t('auth.forgotLink')}
          </Text>

          <Button label={t('auth.signIn')} onPress={() => login(email || 'aditi.sharma@lawfirm.in')} fullWidth />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label={t('auth.createAccount')}
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
            fullWidth
          />
        </View>

        <Text style={styles.footer}>{t('auth.legalFooter')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 40,
    backgroundColor: colors.base,
  },
  brandBlock: { alignItems: 'center', marginBottom: 40 },
  brandText: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.hero,
    color: colors.ink,
  },
  brandTextInline: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.hero,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.inkMuted,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.modal,
    padding: 22,
  },
  cardTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl + 2,
    color: colors.ink,
    marginBottom: 18,
  },
  forgotLink: {
    textAlign: 'right',
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gold,
    marginBottom: 18,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint },
  footer: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkFaint,
    marginTop: 22,
    lineHeight: 18,
  },
});
