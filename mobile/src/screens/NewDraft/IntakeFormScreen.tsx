import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { colors, fonts, fontSizes } from '../../theme/theme';
import { docTypes } from '../../data/docTypes';
import type { RootScreenProps } from '../../navigation/types';

const TONES = ['formal', 'assertive', 'diplomatic'] as const;

/** New Draft — dynamic intake form. In production, swap the fixed fields below
 *  for a per-docType schema (react-hook-form + zod resolver is a good fit). */
export default function IntakeFormScreen({ route, navigation }: RootScreenProps<'NewDraftIntake'>) {
  const { t } = useTranslation();
  const { docTypeId } = route.params;
  const docType = docTypes.find((d) => d.id === docTypeId);

  const [partyYou, setPartyYou] = useState('');
  const [partyOther, setPartyOther] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [keyFacts, setKeyFacts] = useState('');
  const [tone, setTone] = useState<(typeof TONES)[number]>('formal');

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: colors.base }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>{'\u2190'}</Text>
      </Pressable>
      <Text style={styles.title}>{docType?.name}</Text>
      <Text style={styles.subtitle}>{t('newDraft.intakeSub')}</Text>

      <Field label={t('newDraft.partyYou')} placeholder="Mrs. Sunita Mehta" value={partyYou} onChangeText={setPartyYou} />
      <Field label={t('newDraft.partyOther')} placeholder="Mr. Rohan Kapoor" value={partyOther} onChangeText={setPartyOther} />
      <Field label={t('newDraft.jurisdiction')} placeholder="Mumbai, Maharashtra" value={jurisdiction} onChangeText={setJurisdiction} />

      <Text style={styles.label}>{t('newDraft.keyFacts')}</Text>
      <TextInput
        multiline
        numberOfLines={5}
        value={keyFacts}
        onChangeText={setKeyFacts}
        placeholder={t('newDraft.keyFactsPlaceholder') as string}
        placeholderTextColor={colors.inkFaint}
        style={styles.textarea}
      />

      <Text style={[styles.label, { marginTop: 20 }]}>{t('newDraft.tone')}</Text>
      <View style={styles.toneRow}>
        {TONES.map((tn) => {
          const active = tone === tn;
          return (
            <Pressable key={tn} onPress={() => setTone(tn)} style={[styles.toneChip, active && styles.toneChipActive]}>
              <Text style={[styles.toneChipText, active && styles.toneChipTextActive]}>
                {t(`newDraft.tone${tn[0].toUpperCase()}${tn.slice(1)}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={t('newDraft.generateDraft')}
        fullWidth
        style={{ marginTop: 24 }}
        onPress={() =>
          navigation.navigate('NewDraftGenerating', {
            docTypeId,
            formData: { partyYou, partyOther, jurisdiction, keyFacts, tone },
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 16, paddingBottom: 48 },
  back: { color: colors.inkMuted, fontSize: 18, marginBottom: 16 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg + 1, color: colors.ink, marginBottom: 2 },
  subtitle: { fontFamily: fonts.body, fontSize: fontSizes.xs + 1, color: colors.inkFaint, marginBottom: 18 },
  label: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkMuted, marginBottom: 8 },
  textarea: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    textAlignVertical: 'top',
    minHeight: 110,
  },
  toneRow: { flexDirection: 'row', gap: 8 },
  toneChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  toneChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  toneChipText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.inkMuted },
  toneChipTextActive: { color: colors.base },
});
