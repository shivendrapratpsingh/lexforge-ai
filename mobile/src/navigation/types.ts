/**
 * Central param-list types for React Navigation. Adjust screen names to match
 * whatever you wire up in RootNavigator/BottomTabs — these are the ones used
 * throughout this handoff's example screens.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined; // hosts BottomTabs
  NewDraftPicker: undefined;
  NewDraftIntake: { docTypeId: string };
  NewDraftGenerating: { docTypeId: string; formData: Record<string, string> };
  NewDraftResult: { docTypeId: string; generatedText: string; draftId: string };
  DraftDetail: { draftId: string };
  ClientDetail: { clientId: string };
  Clients: undefined;
  CourtDates: undefined;
  LegalTools: undefined;
  LegalToolDetail: { toolId: string };
  Research: undefined;
  FutureLawyer: undefined;
  MootCourt: undefined;
  Qna: undefined;
  Roadmap: undefined;
  Upgrade: undefined;
  Admin: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string; email?: string };
};

export type MainTabParamList = {
  DashboardTab: undefined;
  DraftsTab: undefined;
  NewDraftTab: undefined; // intercepted by the FAB, never actually navigated to
  CourtDatesTab: undefined;
  MoreTab: undefined; // intercepted to open the More bottom sheet
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackSc