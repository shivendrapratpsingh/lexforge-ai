import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Button from '../components/Button';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import { useToast } from '../components/Toast';
import { apiStudyQuiz, ApiError } from '../lib/api';
import type { RootScreenProps } from '../navigation/types';

type McqItem = { question: string; options: string[]; answer: string; explanation: string };

/** Q&A Drills — quick-fire questions with instant feedback + explanation, generated live. */
export default function QnaScreen({ navigation }: RootScreenProps<'Qna'>) {
  const toast = useToast();
  const [items, setItems] = useState<McqItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadBatch = async () => {
    try {
      const res = await apiStudyQuiz('mcq', undefined, 5);
      setItems(res.items as McqItem[]);
      setIndex(0);
      setSelected(null);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not generate questions.', 'danger');
      setItems([]);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadBatch(); }, []);

  const current = items?.[index];

  const handleNext = async () => {
    if (items && index < items.length - 1) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setLoadingMore(true);
      await loadBatch();
    }
  };

  const optionLetter = (i: number) => String.fromCharCode(65 + i);

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <View>
          <Text style={styles.title}>Q&A Drills</Text>
          <Text style={styles.progress}>{items ? `Question ${index + 1} of ${items.length}` : 'Loading…'}</Text>
        </View>
      </View>

      {!items ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : !current ? (
        <Text style={styles.explanationText}>Could not load a question. Pull to try again from the hub.</Text>
      ) : (
        <>
          <Text style={styles.question}>{current.question}</Text>

          <View style={{ gap: 10, marginBottom: 20 }}>
            {current.options.map((choice, i) => {
              const letter = optionLetter(i);
              const answered = selected !== null;
              const isCorrect = letter === current.answer;
              const style =
                answered && isCorrect
                  ? styles.optionCorrect
                  : selected === i && !isCorrect
                  ? styles.optionWrong
                  : styles.optionDefault;
              return (
                <Pressable key={i} onPress={() => setSelected(i)} disabled={answered} style={[styles.option, style]}>
                  <Text style={styles.optionText}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>

          {selected !== null && (
            <View style={styles.explanation}>
              <Text style={styles.explanationText}>{current.explanation}</Text>
            </View>
          )}

          {selected !== null && (
            <Button label={loadingMore ? 'Loading…' : 'Next question'} loading={loadingMore} fullWidth style={{ marginTop: 16 }} onPress={handleNext} />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { color: colors.inkMuted, fontSize: 18 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.ink },
  progress: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint, marginTop: 1 },
  question: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, lineHeight: 22, marginBottom: 18 },
  option: { padding: 13, borderRadius: radii.input, borderWidth: 1 },
  optionDefault: { backgroundColor: colors.surface2, borderColor: colors.border },
  optionCorrect: { backgroundColor: colors.successBg, borderColor: colors.success },
  optionWrong: { backgroundColor: colors.dangerBg, borderColor: colors.danger },
  optionText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  explanation: { backgroundColor: colors.successBg, borderWidth: 1, borderColor: '#1e3a28', borderRadius: radii.card, padding: 14 },
  explanationText: { fontFamily: fonts.body, fontSize: 12.5, color: '#8fcaa8', lineHeight: 20 },
});
