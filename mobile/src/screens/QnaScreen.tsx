import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

const CHOICES = [
  'Has already been arrested for a cognizable offence',
  'Has reason to believe they may be arrested for a non-bailable offence',
  'Has been convicted and is out on parole',
  'Is a witness in a pending trial',
];
const CORRECT_INDEX = 1;

/** Q&A Drills — quick-fire question with instant feedback + explanation. */
export default function QnaScreen({ navigation }: RootScreenProps<'Qna'>) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <View>
          <Text style={styles.title}>Q&A Drills</Text>
          <Text style={styles.progress}>Question 3 of 10 · Criminal Procedure</Text>
        </View>
      </View>

      <Text style={styles.question}>
        Under Section 438 of the CrPC, anticipatory bail can be sought when a person:
      </Text>

      <View style={{ gap: 10, marginBottom: 20 }}>
        {CHOICES.map((choice, i) => {
          const answered = selected !== null;
          const isCorrect = i === CORRECT_INDEX;
          const style =
            answered && isCorrect
              ? styles.optionCorrect
              : selected === i && !isCorrect
              ? styles.optionWrong
              : styles.optionDefault;
          return (
            <Pressable key={i} onPress={() => setSelected(i)} style={[styles.option, style]}>
              <Text style={styles.optionText}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected !== null && (
        <View style={styles.explanation}>
          <Text style={styles.explanationText}>
            Correct. Section 438 CrPC allows a person to apply for anticipatory bail when they have reason to
            believe they may be arrested for a non-bailable offence — the arrest must not have occurred yet.
          </Text>
        </View>
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
