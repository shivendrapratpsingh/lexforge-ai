import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassPanel from './GlassPanel';
import Button from './Button';
import { colors, fonts, fontSizes, gradients, shadows } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { apiAssistantChat, ApiError } from '../lib/api';
import { useToast } from './Toast';

type Message = { id: number; role: 'user' | 'assistant'; text: string };

/**
 * Floating AI Case Assistant. Collapsed: gold circular bubble with a slow
 * "breathing" idle pulse (disabled when reducedMotion is on). Expanded: a
 * glass chat panel (Pro-gated — Free users see an upsell instead of chat).
 *
 * Mount this once near the root (see RootNavigator.tsx) so it floats above
 * every screen.
 */
export default function AssistantChat() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isPro, reducedMotion, userName } = useAppStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: `Hello${userName ? ` ${userName.split(' ')[0]}` : ''} — I can help you find clauses, check deadlines, or explain procedure for any of your active matters. What do you need?` },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    const history = [...messages, { id: Date.now(), role: 'user' as const, text }];
    setMessages(history);
    setInput('');
    setTyping(true);
    try {
      const { reply } = await apiAssistantChat(
        history.map((m) => ({ role: m.role, content: m.text }))
      );
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: reply }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'The assistant is temporarily unavailable.';
      toast.show(msg, 'danger');
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: `Sorry — ${msg}` }]);
    } finally {
      setTyping(false);
    }
  };

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={[styles.bubbleWrap, { bottom: insets.bottom + 90 }]}>
        <MotiView
          animate={reducedMotion ? {} : { scale: [1, 1.08, 1] }}
          transition={reducedMotion ? undefined : { type: 'timing', duration: 1600, loop: true }}
        >
          <LinearGradient colors={gradients.goldPrimary} locations={gradients.goldPrimaryLocations} style={[styles.bubble, shadows.goldGlow]}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M12 3C7 3 3 6.4 3 10.6c0 2.4 1.3 4.6 3.4 6L6 20l3.7-1.6c.7.15 1.5.24 2.3.24 5 0 9-3.4 9-7.6S17 3 12 3z" stroke={colors.base} strokeWidth={1.6} fill="none" />
            </Svg>
          </LinearGradient>
        </MotiView>
      </Pressable>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <GlassPanel style={[StyleSheet.absoluteFill, { borderRadius: 0, borderWidth: 0 }]} borderRadius={0}>
        <View style={[styles.panelHeader, { paddingTop: insets.top + 12 }]}>
          <LinearGradient colors={gradients.goldPrimary} locations={gradients.goldPrimaryLocations} style={styles.panelAvatar}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M12 3C7 3 3 6.4 3 10.6c0 2.4 1.3 4.6 3.4 6L6 20l3.7-1.6c.7.15 1.5.24 2.3.24 5 0 9-3.4 9-7.6S17 3 12 3z" stroke={colors.base} strokeWidth={1.6} fill="none" />
            </Svg>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>{t('assistant.title')}</Text>
            <Text style={styles.panelSubtitle}>{t('assistant.subtitle')}</Text>
          </View>
          <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>{'✕'}</Text>
          </Pressable>
        </View>

        {!isPro ? (
          <View style={styles.lockedWrap}>
            <View style={styles.lockedIcon}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Rect x={5} y={10} width={14} height={10} rx={2} stroke={colors.gold} strokeWidth={1.6} />
                <Path d="M8 10V7a4 4 0 018 0v3" stroke={colors.gold} strokeWidth={1.6} />
              </Svg>
            </View>
            <Text style={styles.lockedTitle}>{t('assistant.lockedTitle')}</Text>
            <Text style={styles.lockedDesc}>{t('assistant.lockedDesc')}</Text>
            <Button
              label={t('assistant.upgradeToUnlock')}
              onPress={() => { setOpen(false); navigation.navigate('Upgrade'); }}
            />
          </View>
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.messages}>
              {messages.map((m) => (
                <View key={m.id} style={[styles.bubbleRow, { justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }]}>
                  <View style={[styles.msgBubble, m.role === 'user' ? styles.msgUser : styles.msgAssistant]}>
                    <Text style={{ color: m.role === 'user' ? colors.base : colors.ink, fontFamily: fonts.body, fontSize: fontSizes.base, lineHeight: 20 }}>
                      {m.text}
                    </Text>
                  </View>
                </View>
              ))}
              {typing && (
                <View style={[styles.bubbleRow, { justifyContent: 'flex-start' }]}>
                  <View style={[styles.msgBubble, styles.msgAssistant, { flexDirection: 'row', gap: 4 }]}>
                    {[0, 1, 2].map((i) => (
                      <MotiView
                        key={i}
                        from={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 500, loop: true, repeatReverse: true, delay: i * 150 }}
                        style={styles.typingDot}
                      />
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={t('assistant.placeholder') as string}
                placeholderTextColor={colors.inkFaint}
                style={styles.input}
              />
              <Pressable onPress={send} style={styles.sendBtn}>
                <LinearGradient colors={gradients.goldPrimary} locations={gradients.goldPrimaryLocations} style={StyleSheet.absoluteFill} />
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke={colors.base} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            </View>
          </>
        )}
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: { position: 'absolute', right: 16, zIndex: 150 },
  bubble: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  panelAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  panelSubtitle: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint, marginTop: 1 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  lockedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 4 },
  lockedIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  lockedTitle: { fontFamily: fonts.serif, fontSize: 16, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  lockedDesc: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  messages: { padding: 16, gap: 12 },
  bubbleRow: { flexDirection: 'row' },
  msgBubble: { maxWidth: '78%', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14 },
  msgUser: { backgroundColor: colors.gold },
  msgAssistant: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.inkMuted },
  inputRow: { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.