import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import Button from '../../components/Button';
import { colors, fonts, fontSizes, radii, shadows } from '../../theme/theme';
import { docTypes } from '../../data/docTypes';
import type { RootScreenProps } from '../../navigation/types';

export default function ResultScreen({ route, navigation }: RootScreenProps<'NewDraftResult'>) {
  const { t } = useTranslation();
  const { docTypeId, generatedText, draftId } = route.params;
  const docType = docTypes.find((d) => d.id === docTypeId);

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <View style={styles.readyRow}>
        <View style={styles.readyIcon}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 13l4 4L19 7" stroke={colors.success} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View>
          <Text style={styles.readyTitle}>{t('newDraft.draftReady')}</Text>
          <Text style={styles.readySub}>Review before finalizing</Text>
        </View>
      </View>

      <View style={[styles.paper, shadows.card]}>
        <Text style={styles.paperEyebrow}>In the Court of the District Judge</Text>
        <Text style={styles.paperTitle}>{docType?.name}</Text>
        <Text style={styles.paperBody}>{generatedText}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={t('newDraft.openEditor')}
          onPress={() => navigation.replace('DraftDetail', { draftId })}
          style={{ flex: 1 }}
        />
        <Button
          label={t('newDraft.backHome')}
          variant="secondary"
          onPress={() => navigation.navigate('Main', { screen: 'DashboardTab' } as never)}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  readyIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.successBg, borderWidth: 1, borderColor: '#1e3a28', alignItems: 'center', justifyContent: 'center' },
  readyTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.ink },
  readySub: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint },
  paper: { backgroundColor: '#F5F5F0', borderRadius: radii.card, padding: 22 },
  paperEyebrow: { textAlign: 'center', fontFamily: fonts.documentSerif, fontSize: 10, letterSpacing: 1.5, color: '#6b6b60', textTransform: 'uppercase', marginBottom: 4 },
  paperTitle: { textAlign: 'center', fontFamily: fonts.documentSerif, fontWeight: '700', fontSize: 15, color: '#1a1a16', marginBottom: 16 },
  paperBody: { fontFamily: fonts.documentSerif, fontSize: 13, lineHeight: 24.7, color: '#2a2a24' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
