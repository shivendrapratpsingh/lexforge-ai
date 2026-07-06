import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts, gradients, shadows } from '../theme/theme';
import type { MainTabParamList } from './types';

// Tab root screens (each gets its own native-stack below so it can drill in)
import DashboardScreen from '../screens/DashboardScreen';
import DraftsListScreen from '../screens/DraftsListScreen';
import DraftDetailScreen from '../screens/DraftDetailScreen';
import CourtDatesScreen from '../screens/CourtDatesScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function DashboardStackNav() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.base } }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="DraftDetail" component={DraftDetailScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    </Stack.Navigator>
  );
}

function DraftsStackNav() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.base } }}>
      <Stack.Screen name="DraftsHome" component={DraftsListScreen} />
      <Stack.Screen name="DraftDetail" component={DraftDetailScreen} />
    </Stack.Navigator>
  );
}

function CourtDatesStackNav() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.base } }}>
      <Stack.Screen name="CourtDatesHome" component={CourtDatesScreen} />
    </Stack.Navigator>
  );
}

/** Dummy component — the "New Draft" tab button is intercepted before this ever renders. */
function NewDraftPlaceholder() {
  return <View />;
}
/** Dummy component — the "More" tab button opens a bottom sheet instead of navigating here. */
function MorePlaceholder() {
  return <View />;
}

function TabIcon({ name, color }: { name: keyof MainTabParamList | 'fab'; color: string }) {
  switch (name) {
    case 'DashboardTab':
      return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Path d="M3 11l9-7 9 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'DraftsTab':
      return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Path d="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth={1.8} />
          <Path d="M9 12h6M9 16h6M9 8h3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'CourtDatesTab':
      return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={4} width={18} height={17} rx={2} stroke={color} strokeWidth={1.8} />
          <Path d="M3 9h18M8 2v4M16 2v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'MoreTab':
      return (
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          <Circle cx={5} cy={12} r={1.8} fill={color} />
          <Circle cx={12} cy={12} r={1.8} fill={color} />
          <Circle cx={19} cy={12} r={1.8} fill={color} />
        </Svg>
      );
    default:
      return null;
  }
}

type CustomTabBarProps = {
  state: any;
  navigation: any;
  onNewDraftPress: () => void;
  onMorePress: () => void;
};

/**
 * Custom tab bar: 4 real tabs + an elevated gold-gradient FAB centered above the bar
 * for "New Draft". This is passed as `tabBar` to <Tab.Navigator> below.
 */
function CustomTabBar({ state, navigation, onNewDraftPress, onMorePress }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes as { key: string; name: keyof MainTabParamList }[];
  const focusedName = routes[state.index]?.name;

  const labels: Record<string, string> = {
    DashboardTab: 'Home',
    DraftsTab: 'Drafts',
    CourtDatesTab: 'Dates',
    MoreTab: 'More',
  };

  const renderTab = (name: keyof MainTabParamList, onPress: () => void) => {
    const focused = focusedName === name;
    const color = focused ? colors.gold : colors.inkFaint;
    return (
      <Pressable key={name} onPress={onPress} style={styles.tabItem}>
        <TabIcon name={name} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{labels[name]}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {renderTab('DashboardTab', () => navigation.navigate('DashboardTab'))}
      {renderTab('DraftsTab', () => navigation.navigate('DraftsTab'))}
      <View style={{ width: 56 }} />
      {renderTab('CourtDatesTab', () => navigation.navigate('CourtDatesTab'))}
      {renderTab('MoreTab', onMorePress)}

      <Pressable onPress={onNewDraftPress} style={styles.fabWrap}>
        <LinearGradient colors={gradients.goldPrimary} locations={gradients.goldPrimaryLocations} style={[styles.fab, shadows.goldGlow]}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={colors.base} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

type Props = {
  onOpenMoreSheet: () => void;
};

/** Mount this as the `Main` screen in RootNavigator. */
export default function BottomTabs({ onOpenMoreSheet }: Props) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          onNewDraftPress={() => props.navigation.getParent()?.navigate('NewDraftPicker')}
          onMorePress={onOpenMoreSheet}
        />
      )}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackNav} />
      <Tab.Screen name="DraftsTab" component={DraftsStackNav} />
      <Tab.Screen name="NewDraftTab" component={NewDraftPlaceholder} listeners={{ tabPress: (e) => e.preventDefault() }} />
      <Tab.Screen name="CourtDatesTab" component={CourtDatesStackNav} />
      <Tab.Screen name="MoreTab" component={MorePlaceholder} listeners={{ tabPress: (e) => e.preventDefault() }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(20,20,20,0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 56,
  },
  tabLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
  },
  fabWrap: {
    position: 'absolute',
    top: -26,
    left: '50%',
    marginLeft: -29,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.base,
  },
});
