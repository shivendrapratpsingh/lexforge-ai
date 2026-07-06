import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import Button from '../components/Button';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useToast } from '../components/Toast';
import { apiMootMemorial, ApiError } from '../lib/api';
import type { RootScreenProps } from '../navigation/types';

const SCENARIO = 'You represent the petitioner in a bail application before the Sessions Court. ' +
  'The prosecution alleges flight risk due to a recently cancelled passport renewal.';

/** Moot Court practice — scenario prompt, your argument, AI-generated memorial feedback. */
export default function MootCourtScreen({ navigation }: RootScreenProps<'MootCourt'>) {
  const toast = useToast();
  const [argument, setArgument] = useState('');
  const [memorial, setMemorial] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (argument.trim().length < 10) {
      toast.show('Write a bit more of your argument first.', 'danger');
      return;
    }
    setLoading(true);
    setMemorial('');
    try {
      const problem = `${SCENARIO}\n\nPetitioner's argument: ${argument.trim()}`;
      const res = await apiMootMemorial(problem, 'petitioner');
      setMemorial(res.memorial);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not build feedback right now.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <Text style={styles.title}>Moot Court Practice</Text>
      </View>

      <View style={styles.scenario}>
        <Text style={styles.scenarioLabel}>Scenario</Text>
        <Text style={styles.scenarioText}>{SCENARIO}</Text>
      </View>

      <View style={styles.oppCard}>
        <Text style={styles.oppLabel}>Opposing counsel argues</Text>
        <Text style={styles.oppText}>
          "The accused has strong international ties and the cancelled passport renewal shows a deliberate attempt
          to evade travel restrictions, not comply with them."
        </Text>
      </View>

      <Text style={styles.label}>Your argument</Text>
      <TextInput
        multiline
        numberOfLines={5}
        value={argument}
        onChangeText={setArgument}
        placeholder="Frame your rebuttal citing precedent and facts on record…"
        placeholderTextColor={colors.inkFaint}
        style={styles.textarea}
      />
      <Button label="Submit Argument" loading={loading} fullWidth style={{ marginTop: 16 }} onPress={handleSubmit} />

      {memorial ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackLabel}>AI feedback</Text>
          <Text style={styles.feedbackText}>{memorial}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { color: colors.inkMuted, fontSize: 18 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.ink },
  scenario: { backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, borderRadius: radii.card, padding: 14, marginBottom: 16 },
  scenarioLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.goldDim, textTransform: 'uppercase', marginBottom: 6 },
  scenarioText: { fontFamily: fonts.body, fontSize: 13, color: colors.goldLight, lineHeight: 20 },
  oppCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14, marginBottom: 12 },
  oppLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginBottom: 6 },
  oppText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkMuted, lineHeight: 20 },
  label: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkMuted, marginBottom: 8 },
  textarea: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.input, padding: 14, color: colors.ink, fontFamily: fonts.body, fontSize: fontSizes.base, minHeight: 110, textAlignVertical: 'top' },
  feedbackCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGold, borderRadius: radii.card, padding: 14, marginTop: 16 },
  feedbackLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.goldDim, textTransform: 'uppercase', marginBottom: 6 },
  feedbackText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkMuted, lineHeight: 20 },
});
