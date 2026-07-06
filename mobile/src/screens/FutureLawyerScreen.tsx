import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

const MODULES = [
  { key: 'MootCourt', title: 'Moot Court Practice', desc: 'Argue simulated cases against an AI opposing counsel and get feedback.' },
  { key: 'Qna', title: 'Q&A Drills', desc: 'Quick-fire questions with a tutor mode covering procedure, evidence and ethics.' },
  { key: 'Roadmap', title: 'Study Roadmap', desc: 'A guided path from foundations to mock exams, tracked stage by stage.' },
] as const;

/** Future Lawyer hub — links to Moot Court, Q&A Drills, Study Roadmap. */
export default function FutureLawyerScreen({ navigation }: RootScreenProps<'FutureLawyer'>) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <Text style={styles.title}>Future Lawyer</Text>
      <Text style={styles.sub}>Prepare for practice \u2014 one module at a time</Text>
      <View style={{ padding: 20, gap: 12 }}>
        {MODULES.map((m) => (
          <Pressable key={m.key} onPress={() => navigation.navigate(m.key)} style={styles.card}>
            <View style={styles.iconWrap} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardDesc}>{m.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, paddingHorizontal: 20, paddingTop: 20 },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, paddingHorizontal: 20, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 16 },
  iconWrap: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  cardDesc: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, marginTop: 3, lineHeight: 16 },
});
