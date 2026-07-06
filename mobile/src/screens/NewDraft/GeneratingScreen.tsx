import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GeneratingLivePill, StreamingText } from '../../components/StreamingText';
import { colors, fonts, fontSizes, radii, shadows } from '../../theme/theme';
import { docTypes } from '../../data/docTypes';
import { SAMPLE_LEGAL_NOTICE } from '../../data/sampleDrafts';
import { useAppStore } from '../../store/useAppStore';
import type { RootScreenProps } from '../../navigation/types';

/**
 * New Draft — generation screen. Shows the "Generating live…" pulsing pill,
 * a progress bar, and the draft streaming in on paper-styled preview with a
 * blinking caret — the app's signature moment. Replace the setInterval below
 * with real streamed tokens from your Llama 3.x generation endpoint (append
 * each chunk to `streamed` as it arrives; drive `progress` from your own
 * estimate or from a token-count callback).
 */
export default function GeneratingScreen({ route, navigation }: RootScreenProps<'NewDraftGenerating'>) {
  const { t } = useTranslation();
  const { docTypeId } = route.params;
  const docType = docTypes.find((d) => d.id === docTypeId);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 4);
        if (next >= 100) {
          clearInterval(timerRef.current);
          setTimeout(() => {
            navigation.replace('NewDraftResult', { docTypeId, generatedText: SAMPLE_LEGAL_NOTICE });
          }, 400);
        }
        return next;
      });
    }, 120);
    return () => clearInterval(timerRef.current);
  }, []);

  const streamed = SAMPLE_LEGAL_NOTICE.slice(0, Math.round((SAMPLE_LEGAL_NOTICE.length * progress) / 100));

  return (
    <View style={styles.container}>
      <GeneratingLivePill label={t('newDraft.generatingLive') as string} reducedMotion={reducedMotion} />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{progress >= 100 ? 'Draft complete' : `Drafting your document… ${progress}%`}</Text>

      <View style={[styles.paper, shadows.card]}>
        <Text style={styles.paperEyebrow}>In the Court of the District Judge</Text>
        <Text style={styles.paperTitle}>{docType?.name}</Text>
        <StreamingText text={streamed} reducedMotion={reducedMotion} color="#2a2a24" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base, padding: 20, paddingTop: 44, alignItems: 'center' },
  progressTrack: { width: '100%', height: 6, backgroundColor: colors.surface3, borderRadius: 999, overflow: 'hidden', marginTop: 22, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 999 },
  progressLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, marginBottom: 20 },
  paper: { width: '100%', backgroundColor: '#F5F5F0', borderRadius: radii.card, padding: 22, minHeight: 340 },
  paperEyebrow: { textAlign: 'center', fontFamily: fonts.documentSerif, fontSize: 10, letterSpacing: 1.5, color: '#6b6b60', textTransform: 'uppercase', marginBottom: 4 },
  paperTitle: { textAlign: 'center', fontFamily: fonts.documentSerif, fontWeight: '700', fontSize: 15, color: '#1a1a16', marginBottom: 16 },
});
