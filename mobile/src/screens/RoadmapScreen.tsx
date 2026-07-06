import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

const STAGES = [
  { title: 'Foundations', desc: 'Constitutional law, jurisprudence, legal reasoning basics.', state: 'done' as const },
  { title: 'Procedure & Evidence', desc: 'CrPC, CPC, Evidence Act \u2014 core procedural mastery.', state: 'done' as const },
  { title: 'Practical Drafting', desc: 'Draft petitions, notices and applications under guided review.', state: 'current' as const },
  { title: 'Moot Practice', desc: 'Simulated arguments across civil, criminal and writ matters.', state: 'locked' as const },
  { title: 'Mock Exams', desc: 'Timed practice papers modelled on bar council patterns.', state: 'locked' as const },
];

/** Study Roadmap — a guided, staged path with completion state per stage. */
export default function RoadmapScreen({ navigation }: RootScreenProps<'Roadmap'>) {
  return (
    <ScrollView style={{ backgroundColor: colors.base }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'\u2190'}</Text></Pressable>
        <Text style={styles.title}>Study Roadmap</Text>
      </View>

      {STAGES.map((s, i) => (
        <View key={s.title} style={styles.row}>
          <View style={styles.rail}>
            <View
              style={[
                styles.dot,
                s.state === 'done' && styles.dotDone,
                s.state === 'current' && styles.dotCurrent,
                s.state === 'locked' && styles.dotLocked,
              ]}
            >
              <Text style={styles.dotText}>{s.state === 'done' ? '\u2713' : i + 1}</Text>
            </View>
            {i < STAGES.length - 1 && <View style={styles.line} />}
          </View>
          <View style={{ flex: 1, paddingBottom: 22 }}>
            <Text style={[styles.stageTitle, s.state === 'locked' && { color: colors.inkMuted }]}>{s.title}</Text>
            <Text style={styles.stageDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { color: colors.inkMuted, fontSize: 18 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.ink },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotCurrent: { backgroundColor: '#1C1608', borderColor: colors.gold },
  dotLocked: { backgroundColor: colors.surface2, borderColor: colors.border },
  dotText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
  line: { width: 1.5, flex: 1, backgroundColor: colors.border, marginTop: 2, minHeight: 26 },
  stageTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink },
  stageDesc: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, marginTop: 3, lineHeight: 17 },
});
