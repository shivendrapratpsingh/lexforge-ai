import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Badge from '../../components/Badge';
import { colors, fonts, fontSizes, radii } from '../../theme/theme';
import { docCategories, docTypes, DocCategory } from '../../data/docTypes';
import type { RootScreenProps } from '../../navigation/types';

/**
 * New Draft — document type picker: searchable, categorized grid of gold-accented
 * cards covering all 19 document types. Tapping a card pushes IntakeForm.
 */
export default function DocTypePickerScreen({ navigation }: RootScreenProps<'NewDraftPicker'>) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return docTypes.filter((d) => {
      const matchesCategory = category === 'all' || d.category === category;
      const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{t('newDraft.title')}</Text>
        <Text style={styles.subtitle}>{t('newDraft.subtitle')}</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('newDraft.search') as string}
          placeholderTextColor={colors.inkFaint}
          style={styles.search}
        />
      </View>

      <FlatList
        horizontal
        data={docCategories}
        keyExtractor={(c) => c.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 10 }}
        renderItem={({ item }) => {
          const active = item.key === category;
          return (
            <Pressable onPress={() => setCategory(item.key)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 10, paddingBottom: 40, paddingTop: 6 }}
        renderItem={({ item }) => {
          const disabled = !item.backendType;
          return (
            <Pressable
              style={[styles.card, disabled && styles.cardDisabled]}
              disabled={disabled}
              onPress={() => navigation.navigate('NewDraftIntake', { docTypeId: item.id })}
            >
              {item.pro ? <Badge label="PRO" tone="pro" style={styles.proBadge} /> : null}
              {disabled ? <Badge label="SOON" tone="neutral" style={styles.proBadge} /> : null}
              <View style={styles.mono}><Text style={styles.monoText}>{item.mono}</Text></View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardCategory}>{docCategories.find((c) => c.key === item.category)?.label}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: { padding: 20, paddingBottom: 4 },
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.inkMuted, marginTop: 4 },
  searchWrap: { paddingHorizontal: 20, paddingTop: 10 },
  search: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.input, paddingHorizontal: 14, paddingVertical: 11, color: colors.ink, fontFamily: fonts.body, fontSize: fontSizes.base },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.inkMuted },
  chipTextActive: { color: colors.base },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 14,
    minHeight: 118,
    gap: 10,
    position: 'relative',
  },
  proBadge: { position: 'absolute', top: 10, right: 10 },
  cardDisabled: { opacity: 0.45 },
  mono: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyCon