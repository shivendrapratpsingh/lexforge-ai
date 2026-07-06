import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radii } from '../theme/theme';
import type { RootScreenProps } from '../navigation/types';

const CLIENTS = [
  { id: '1', name: 'Rajesh Verma', initials: 'RV', caseCount: '2 cases', activity: 'Active 2 days ago' },
  { id: '2', name: 'Sunita Mehta', initials: 'SM', caseCount: '1 case', activity: 'Active today' },
  { id: '3', name: 'Kapoor Textiles Pvt. Ltd.', initials: 'KT', caseCount: '4 cases', activity: 'Active 1 week ago' },
  { id: '4', name: 'Anjali Deshmukh', initials: 'AD', caseCount: '1 case', activity: 'Active 3 weeks ago' },
];

/** Clients — list + detail (attachments, payments, linked drafts on ClientDetailScreen). */
export default function ClientsScreen({ navigation }: RootScreenProps<'Clients'>) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.base }}>
      <Text style={styles.title}>Clients</Text>
      <FlatList
        data={CLIENTS}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
          >
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.caseCount} \u00b7 {item.activity}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: fontSizes.display, color: colors.ink, padding: 20, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1C1608', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  name: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
});
