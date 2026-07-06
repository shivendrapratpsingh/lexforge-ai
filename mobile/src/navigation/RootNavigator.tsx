import React, { useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import AuthStack from './AuthStack';
import BottomTabs from './BottomTabs';
import MoreSheet from './MoreSheet';

// Full-screen / modal screens pushed on top of the tab bar
import NewDraftPickerScreen from '../screens/NewDraft/DocTypePickerScreen';
import NewDraftIntakeScreen from '../screens/NewDraft/IntakeFormScreen';
import NewDraftGeneratingScreen from '../screens/NewDraft/GeneratingScreen';
import NewDraftResultScreen from '../screens/NewDraft/ResultScreen';
import ClientsScreen from '../screens/ClientsScreen';
import LegalToolsScreen from '../screens/LegalToolsScreen';
import LegalToolDetailScreen from '../screens/LegalToolDetailScreen';
import ResearchScreen from '../screens/ResearchScreen';
import FutureLawyerScreen from '../screens/FutureLawyerScreen';
import MootCourtScreen from '../screens/MootCourtScreen';
import QnaScreen from '../screens/QnaScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import AdminScreen from '../screens/AdminScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AssistantChat from '../components/AssistantChat';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold,
    background: colors.base,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
    notification: colors.gold,
  },
};

/**
 * App root. Mount this once at the top of your app (e.g. from App.tsx), after
 * fonts have loaded and i18n has initialized.
 *
 * The More sheet and the Assistant chat bubble/panel are rendered here, as
 * siblings of the navigator, so they float above whatever screen is active —
 * matching the always-available floating assistant + more-sheet behavior.
 */
export default function RootNavigator() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.base },
          animation: 'slide_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true, // iOS: allow the swipe-back gesture from anywhere on screen, not just the edge
        }}
      >
        {!isAuthed ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main">
              {() => <BottomTabs onOpenMoreSheet={() => setMoreOpen(true)} />}
            </Stack.Screen>

            <Stack.Screen name="NewDraftPicker" component={NewDraftPickerScreen} />
            <Stack.Screen name="NewDraftIntake" component={NewDraftIntakeScreen} />
            {/* Generation is in flight here — swiping back would abandon a request with no way to cancel it cleanly, so this is the one screen that opts out of the gesture. */}
            <Stack.Screen name="NewDraftGenerating" component={NewDraftGeneratingScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="NewDraftResult" component={NewDraftResultScreen} />

            <Stack.Screen name="Clients" component={ClientsScreen} />
            <Stack.Screen name="LegalTools" component={LegalToolsScreen} />
            <Stack.Screen name="LegalToolDetail" component={LegalToolDetailScreen} />
            <Stack.Screen name="Research" component={ResearchScreen} />
            <Stack.Screen name="FutureLawyer" component={FutureLawyerScreen} />
            <Stack.Screen name="MootCourt" component={MootCourtScreen} />
            <Stack.Screen name="Qna" component={QnaScreen} />
            <Stack.Screen name="Roadmap" component={RoadmapScreen} />
            <Stack.Screen name="Upgrade" component={UpgradeScreen} />
  