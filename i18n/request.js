import {getRequestConfig} from 'next-intl/server'
import {cookies, headers} from 'next/headers'
import {LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE} from './config'

// Reads the NEXT_LOCALE cookie on every request. If unset / invalid we fall
// back to (a) the Accept-Language header's primary tag if it's one we
// support, otherwise (b) DEFAULT_LOCALE. The cookie is written by the
// LanguageSwitcher component via the setLocale server action.
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value

  let locale = DEFAULT_LOCALE
  if (cookieLocale && LOCALES.includes(cookieLocale)) {
    locale = cookieLocale
  } else {
    try {
      const h = await headers()
      const accept = h.get('accept-language') || ''
      const primary = accept.split(',')[0]?.split('-')[0]?.toLowerCase()
      if (primary && LOCALES.includes(primary)) locale = primary
    } catch { /* headers() not always available — fall back */ }
  }

  const messages = (await import(`../messages/${locale}.json`)).default
  return { locale, messages }
})
