import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import Button from '../components/Button';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

const SAMPLE_OUTPUT = `\u2022 The proposed amendment introduces a new limitation period under Section 5, which conflicts with the existing Section 3 timeline.

\u2022 Recommend cross-referencing with the 2023 amendment to avoid a repugnancy challenge.

\u2022 Suggested strengthening clause 4(b) with explicit retrospective effect language to withstand judicial scrutiny.`;

/** Generic Legal Tool detail — paste text, analyze, view AI-generated result.
 *  Wire `onAnalyze` to your actual Llama 3.x analysis endpoint per toolId. */
export default function LegalToolDetailScreen({ route, navigation }: RootScreenProps<'LegalToolDetail'>) {
  const [text, setText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'\u2190'}</Text></Pressable>
        <Text style={styles.title}>{route.params.toolId}</Text>
      </View>
      <Text style={styles.label}>Paste the document or order text</Text>
      <TextInput
        multiline
        numberOfLines={6}
        value={text}
        onChangeText={setText}
        placeholder="Paste the relevant text here for analysis\u2026"
        placeholderTextColor={colors.inkFaint}
        style={styles.textarea}
      />
      <Button label="Analyze" fullWidth style={{ marginVertical: 16 }} onPress={() => setAnalyzed(true)} />
      {analyzed && (
        <>
          <Text style={styles.label}>Analysis result</Text>
          <View style={styles.paper}>
            <Text style={styles.paperText}>{SAMPLE_OUTPUT}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { color: colors.inkMuted, fontSize: 18 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.ink, textTransform: 'capitalize' },
  label: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.inkMuted, marginBottom: 8 },
  textarea: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radii.input, padding: 14, color: colors.ink, fontFamily: fonts.body, fontSize: fontSizes.base, minHeight: 130, textAlignVertical: 'top' },
  paper: { backgroundColor: '#F5F5F0', borderRadius: radii.card, padding: 18 },
  paperText: { fontFamily: fonts.documentSerif, fontSize: 13, lineHeight: 22, color: '#2a2a24' },
});
