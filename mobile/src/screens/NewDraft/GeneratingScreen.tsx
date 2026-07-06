import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GeneratingLivePill, StreamingText } from '../../components/StreamingText';
import { colors, fonts, fontSizes, radii, shadows } from '../../theme/theme';
import { docTypes } from '../../data/docTypes';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../components/Toast';
import { apiCreateDraft, ApiError } from '../../lib/api';
import type { RootScreenProps } from '../../navigation/types';

/**
 * New Draft — generation screen. Shows the "Generating live…" pulsing pill and
 * a progress bar while the real request is in flight (the backend returns the
 * finished document in one response rather than a token stream, so the
 * progress bar is a time-based estimate, not a literal token count — it eases
 * toward 90% and only completes once the response actually arrives).
 */
export default function GeneratingScreen({ route, navigation }: RootScreenProps<'NewDraftGenerating'>) {
  const { t } = useTranslation();
  const { docTypeId, formData } = route.params;
  const docType = docTypes.find((d) => d.id === docTypeId);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const toast = useToast();

  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startedRef = useRef(false);

  useEffect(() => {
    // Ease toward 90% over ~20s (generation typically takes 15-40s); the last
    // 10% only fills in once the real response lands, in the effect below.
    timerRef.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 2 : p));
    }, 400);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const draft = await apiCreateDraft({
          documentType: docType?.backendType || '',
          templateData: formData,
        });
        clearInterval(timerRef.current);
        setProgress(100);
        setTimeout(() => {
          navigation.replace('NewDraftResult', { docTypeId, generatedText: draft.content, draftId: draft.id });
        }, 300);
      } catch (e) {
        clearInterval(timerRef.current);
        const msg = e instanceof ApiError ? e.message : 'Could not generate the document. Please try again.';
        setFailed(msg);
        toast.show(msg, 'danger');
      }
    })();
  }, []);

  const previewText = failed ? '' : ''; // no partial content to show until the response lands (no streaming from the backend)

  return (
    <View style={styles.container}>
      <GeneratingLivePill label={t('newDraft.generatingLive') as string} reducedMotion={reducedMotion} />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: failed ? colors.danger : colors.gold }]} />
      </View>
      <Text style={styles.progressLabel}>
        {failed ? failed : progress >= 100 ? 'Draft complete' : `Drafting your document… ${progress}%`}
      </Text>

      <View style={[styles.paper, shadows.card]}>
        <Text style={styles.paperEyebrow}>In the Court of the District Judge</Text>
        <Text style={styles.paperTitle}>{docType?.name}</Text>
        {!failed && <StreamingText text={previewText} reducedMotion={reducedMotion} color="#2a2a24" />}
        {failed && <Text style={styles.failedHint}>Go back and try again — your answers are still filled in.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base, padding: 20, paddingTop: 44, alignItems: 'center' },
  progressTrack: { width: '100%', height: 6, backgroundColor: colors.surface3, borderRadius: 999, overflow: 'hidden', marginTop: 22, marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 999 },
  progressLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.inkFaint, marginBottom: 20 },
  paper: { width: '100%', backgroundColor: '#F5F5F0', borderRadius: radii.card, padding: 22, minHeight: 340 },
  paperEyebrow: { textAlign: 'center', fontFamily: fonts.documentSerif, fontSize: 10, letterSpacing: 1.5, color: '#6b6b60', textTransform: 'uppercase', marginBottom: 4 },
  paperTitle: { textAlign: 'center', fontFamily: fonts.documentSerif, fontWeight: '700', fontSize: 15, color: '#1a1a16', marginBottom: 16 },
  failedHint: { fontFamily: fonts.body, fontSize: 12.5, color: '#8a5a3a', textAlign: 'center', marginTop: 12 },
});
