import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  SourceSerif4_400Regular,
  SourceSerif4_500Medium,
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import {
  NotoSerifDevanagari_600SemiBold,
  NotoSerifDevanagari_700Bold,
} from '@expo-google-fonts/noto-serif-devanagari';
import {
  Hind_300Light,
  Hind_400Regular,
  Hind_500Medium,
  Hind_600SemiBold,
  Hind_700Bold,
} from '@expo-google-fonts/hind';

import './src/i18n'; // side-effect: initializes i18next
import { colors } from './src/theme/theme';
import { ToastProvider } from './src/components/Toast';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/useAppStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    SourceSerif4_400Regular,
    SourceSerif4_500Medium,
    SourceSerif4_600SemiBold,
    SourceSerif4_700Bold,
    NotoSerifDevanagari_600SemiBold,
    NotoSerifDevanagari_700Bold,
    Hind_300Light,
    Hind_400Regular,
    Hind_500Medium,
    Hind_600SemiBold,
    Hind_700Bold,
  });
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  const onLayout = React.useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  if ((!fontsLoaded && !fontError) || !hydrated) return null;

  return (
    <SafeAreaProvider onLayout={onLayout} s