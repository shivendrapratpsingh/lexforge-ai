import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { colors, fonts, fontSizes, radii, shadows } from '../theme/theme';
import { SAMPLE_LEGAL_NOTICE, SAMPLE_VERSION_HISTORY } from '../data/sampleDrafts';
import type { RootScreenProps } from '../navigation/types';

type Tab = 'editor' | 'versions';

/**
 * Draft detail/editor — paragraph-level document preview (paper styling),
 * version history timeline, finalize & lock workflow, export sheet (PDF/DOCX/TXT).
 * This is one of the 6 screens called out as needing full visual polish.
 */
// Typed loosely — reached from both the Dashboard and Drafts nested stacks, so
// there's no single strict RouteName/ParamList this screen belongs to.
export default function DraftDetailScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('editor');
  const [locked, setLocked] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const paragraphs = SAMPLE_LEGAL_NOTICE.split('\n\n');

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>{'←'}</Text></Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.headerTitle}>Legal Notice — Property Dispute</Text>
          <Text style={styles.headerMeta}>Mehta vs. Kapoor · {locked ? 'Locked' : 'Draft'} · Edited 2h ago</Text>
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
            <Text style={styles.paperTitle}>Legal Notice — Property Dispute</Text>
            {/* Paragraph-level editing: wrap each paragraph in a Pressable that opens
                an inline edit mode / focuses a TextInput bound to that paragraph's index. */}
            {paragraphs.map((p, i) => (
              <Pressable key={i} disabled={locked} style={styles.paragraphWrap}>
                <Text style={styles.paragraph}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              label={locked ? 'Locked' : t('drafts.finalizeLock')}
              onPress={() => setLocked(true)}
              disabled={locked}
              style={{ flex: 1 }}
            />
            <Button label={t('drafts.export')} variant="secondary" onPress={() => setExportOpen(true)} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {SAMPLE_VERSION_HISTORY.map((v, i) => (
            <View key={i} style={styles.versionRow}>
              <View style={styles.versionRail}>
                <View style={[styles.versionDot, { backgroundColor: v.dotColor }]} />
                {i < SAMPLE_VERSION_HISTORY.length - 1 && <View style={styles.versionLine} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 22 }}>
                <Text style={styles.versionLabel}>{v.label}</Text>
                <Text style={styles.versionMeta}>{v.meta}</Text>
                <Text style={styles.versionNote}>{v.note}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <BottomSheet visible={exportOpen} onClose={() => setExportOpen(false)}>
        <Text style={styles.sheetTitle}>{t('drafts.exportAs')}</Text>
        {[
          { label: t('drafts.exportPdf'), tag: 'PDF', bg: colors.dangerBg, fg: colors.danger },
          { label: t('drafts.exportDocx'), tag: 'DOCX', bg: colors.infoBg, fg: colors.info },
          { label: t('drafts.exportTxt'), tag: 'TXT', bg: colors.surface3, fg: colors.inkMuted },
        ].map((opt) => (
          <Pressable key={opt.tag} style={styles.exportRow} onPress={() => setExportOpen(false)}>
            <View style={[styles.exportTag, { backgroundColor: opt.bg }]}>
              <Text style={[styles.exportTagText, { color: opt.fg }]}>{opt.tag}</Text>
            </View>
            <Text style={styles.exportRowLabel}>{opt.label}</Text>
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
