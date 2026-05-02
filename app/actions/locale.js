'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { LOCALES, LOCALE_COOKIE } from '@/i18n/config'

// Persist the user's chosen UI locale in a cookie. Validates against the
// supported list so we never write garbage. Caller (LanguageSwitcher)
// triggers a router.refresh() after this resolves so the new strings render.
export async function setLocale(nextLocale) {
  if (!LOCALES.includes(nextLocale)) return { ok: false, error: 'unsupported locale' }
  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, nextLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: false,
  })
  revalidatePath('/', 'layout')
  return { ok: true, locale: nextLocale }
}
