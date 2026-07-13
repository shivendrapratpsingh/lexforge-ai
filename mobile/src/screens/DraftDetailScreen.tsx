import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Share, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { colors, fonts, fontSizes, radii, shadows } from '../theme/theme';
import { labelForBackendType } from '../data/docTypes';
import { useToast } from '../components/Toast';
import { apiGetDraft, apiUpdateDraft, apiListDraftVersions, Draft, ApiError, getApiBaseUrl, getToken } from '../lib/api';

type Tab = 'editor' | 'versions';
type Version = { id: string; version: number; changeNote: string | null; createdAt: string };

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 0)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

/**
 * Draft detail/editor — paragraph-level document preview (paper styling),
 * version history timeline, finalize & lock workflow, export sheet (PDF/DOCX/TXT).
 * This is one of the 6 screens called out as needing full visual polish.
 */
// Typed loosely — reached from both the Dashboard and Drafts nested stacks, so
// there's no single strict RouteName/ParamList this screen belongs to.
export default function DraftDetailScreen({ navigation, route }: { navigation: any; route: any }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { draftId } = route.params;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [tab, setTab] = useState<Tab>('editor');
  const [finalizing, setFinalizing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiGetDraft(draftId);
      setDraft(d);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not load this draft.';
      toast.show(msg, 'danger');
    }
  }, [draftId, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== 'versions' || versions !== null) return;
    apiListDraftVersions(draftId)
      .then((res) => setVersions(res.versions))
      .catch(() => setVersions([]));
  }, [tab, versions, draftId]);

  const handleFinalize = async () => {
    if (!draft) return;
    setFinalizing(true);
    try {
      await apiUpdateDraft(draft.id, { status: 'finalized' });
      setDraft({ ...draft, status: 'finalized' });
      toast.show('Document finalized.', 'success');
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not finalize.', 'danger');
    } finally {
      setFinalizing(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!draft) return;
    if (format !== 'txt') {
      toast.show('PDF/DOCX export is available from the LexForge web app for now.', 'default');
      setExportOpen(false);
      return;
    }
    setExporting(true);
    try {
      const base = await getApiBaseUrl();
      const token = await getToken();
      const res = await fetch(`${base}/api/export/${draft.id}/txt`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Export failed');
      const text = await res.text();
      await Share.share({ message: text, title: draft.title });
    } catch (e) {
      toast.show('Could not export the document.', 'danger');
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  };

  if (!draft) {
    return (
      <View style={[styles.header, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const locked = draft.status === 'finalized' || draft.status === 'locked';
  const paragraphs = draft.content.split('\n\n');

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.headerTitle}>{draft.title}</Text>
          <Text style={styles.headerMeta}>{labelForBackendType(draft.documentType)} · {locked ? 'Locked' : 'Draft'} · Edited {relativeDate(draft.updatedAt)}</Text>
        </View>
        <Pressable onPress={() => setExportOpen(true)} style={styles.exportBtn}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3v13m0 0l-4-4m4 4l4-4M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke={colors.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable onPress={() => setTab('editor')} style={[styles.tab, tab === 'editor' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'editor' && styles.tabTextActive]}>{t('drafts.editorTabDraft')}</Text>
        </Pressable>
        <Pressable onPress={() => setTab('versions')} style={[styles.tab, tab === 'versions' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'versions' && styles.tabTextActive]}>{t('drafts.editorTabVersions')}</Text>
        </Pressable>
      </View>

      {tab === 'editor' ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={[styles.paper, shadows.card]}>
            <Text style={styles.paperEyebrow}>{t('drafts.beforeCourt')}</Text>
            <Text style={styles.paperTitle}>{draft.title}</Text>
            {paragraphs.map((p, i) => (
              <Pressable key={i} disabled={locked} style={styles.paragraphWrap}>
                <Text style={styles.paragraph}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              label={locked ? 'Locked' : t('drafts.finalizeLock')}
              onPress={handleFinalize}
              disabled={locked}
              loading={finalizing}
              style={{ flex: 1 }}
            />
            <Button label={t('drafts.export')} variant="secondary" onPress={() => setExportOpen(true)} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {versions === null ? (
            <ActivityIndicator color={colors.gold} />
          ) : versions.length === 0 ? (
            <Text style={styles.versionNote}>No earlier versions yet — this is the original draft.</Text>
          ) : (
            versions.map((v, i) => (
              <View key={v.id} style={styles.versionRow}>
                <View style={styles.versionRail}>
                  <View style={[styles.versionDot, { backgroundColor: i === 0 ? colors.gold : colors.inkFaint }]} />
                  {i < versions.length - 1 && <View style={styles.versionLine} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 22 }}>
                  <Text style={styles.versionLabel}>Version {v.version}</Text>
                  <Text style={styles.versionMeta}>{relativeDate(v.createdAt)}</Text>
                  {v.changeNote ? <Text style={styles.versionNote}>{v.changeNote}</Text> : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <BottomSheet visible={exportOpen} onClose={() => setExportOpen(false)}>
        <Text style={styles.sheetTitle}>{t('drafts.exportAs')}</Text>
        {[
          { label: t('drafts.exportPdf'), tag: 'PDF', bg: colors.dangerBg, fg: colors.danger },
          { label: t('drafts.exportDocx'), tag: 'DOCX', bg: colors.infoBg, fg: colors.info },
          { label: t('drafts.exportTxt'), tag: 'TXT', bg: colors.surface3, fg: colors.inkMuted },
        ].map((opt) => (
          <Pressable key={opt.tag} style={styles.exportRow} onPress={() => handleExport(opt.tag.toLowerCase() as 'pdf' | 'docx' | 'txt')} disabled={exporting}>
            <View style={[styles.exportTag, { backgroundColor: opt.bg }]}>
              <Text style={[styles.exportTagText, { color: opt.fg }]}>{opt.tag}</Text>
            </View>
            <Text style={styles.exportRowLabel}>{opt.label}</Text>
            {exporting && opt.tag === 'TXT' ? <ActivityIndicator color={colors.gold} style={{ marginLeft: 'auto' }} /> : null}
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.inkMuted, fontSize: 18 },
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md + 0.5, color: colors.ink },
  headerMeta: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint, marginTop: 1 },
  exportBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: 6, padding: 16, paddingBottom: 0 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface2 },
  tabActive: { backgroundColor: colors.gold },
  tabText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.inkMuted },
  tabTextActive: { color: colors.base },
  paper: { backgroundColor: '#F5F5F0', borderRadius: radii.card, padding: 22 },
  paperEyebrow: { textAlign: 'center', fontFamily: fonts.documentSerif, fontSize: 11, letterSpacing: 1.5, color: '#6b6b60', textTransform: 'uppercase', marginBottom: 4 },
  paperTitle: { textAlign: 'center', fontFamily: fonts.documentSerif, fontWeight: '700', fontSize: 16, color: '#1a1a16', marginBottom: 18 },
  paragraphWrap: { marginBottom: 4 },
  paragraph: { fontFamily: fonts.documentSerif, fontSize: 13.5, lineHeight: 25.6, color: '#2a2a24' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  versionRow: { flexDirection: 'row', gap: 12 },
  versionRail: { width: 16, alignItems: 'center' },
  versionDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  versionLine: { width: 1.5, flex: 1, backgroundColor: colors.border, marginTop: 2 },
  versionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink },
  versionMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  versionNote: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted, marginTop: 6 },
  sheetTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink, marginBottom: 12 },
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  exportTag: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  exportTagText: { fontFamily: fonts.bodyBold, fontSize: 9.5 },
  exportRowLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
});
