/**
 * i18n bootstrap using i18next + react-i18next, mirroring the web app's
 * next-intl en/hi setup. Wrap your app root with <I18nextProvider i18n={i18n}>
 * (or just import this file once before rendering — i18next works as a singleton).
 *
 * Install: expo install expo-localization
 *          npm install i18next react-i18next
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './en.json';
import hi from './hi.json';

const deviceLang = Localization.getLocales()[0]?.languageCode === 'hi' ? 'hi' : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: deviceLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

/** Persist + apply a user-chosen language. Call from the Settings screen. */
export async function setAppLanguage(lang: 'en' | 'hi') {
  await i18n.changeLanguage(lang);
  // Optionally persist with AsyncStorage:
  // await AsyncStorage.setItem('lexforge.lang', lang);
}
