// Supported locales for LexForge AI.
// Adding a new locale: 1) push it here, 2) create messages/<code>.json,
// 3) add it to LANGUAGE_OPTIONS so it shows up in the switcher.
export const LOCALES = ['en', 'hi']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English',  short: 'EN' },
  { code: 'hi', label: 'हिन्दी',     short: 'हिं' },
]
