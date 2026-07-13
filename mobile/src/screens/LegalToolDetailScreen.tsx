import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import Button from '../components/Button';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useToast } from '../components/Toast';
import { apiAnalyzeTool, ApiError } from '../lib/api';
import type { RootScreenProps } from '../navigation/types';

/** Generic Legal Tool detail — paste text, analyze via the matching /api/analyze/* route, view result. */
export default function LegalToolDetailScreen({ route, navigation }: RootScreenProps<'LegalToolDetail'>) {
  const toast = useToast();
  const { toolId } = route.params;
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (text.trim().length < 20) {
      toast.show('Paste more text — at least a couple of sentences.', 'danger');
      return;
    }
    setLoading(true);
    try {
      const res = await apiAnalyzeTool(toolId, text.trim());
      setResult(res.content);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Analysis failed. Please try again.';
      toast.show(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <Text style={styles.title}>{toolId}</Text>
      </View>
      <Text style={styles.label}>Paste the document or order text</Text>
      <TextInput
        multiline
        numberOfLines={6}
        value={text}
        onChangeText={setText}
        placeholder="Paste the relevant text here for analysis…"
        placeholderTextColor={colors.inkFaint}
        style={styles.textarea}
      />
      <Button label="Analyze" loading={loading} fullWidth style={{ marginVertical: 16 }} onPress={handleAnalyze} />
      {result ? (
        <>
          <Text style={styles.label}>Analysis result</Text>
          <View style={styles.paper}>
            <Text style={styles.paperText}>{result}</Text>
          </View>
        </>
      ) : null}
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
