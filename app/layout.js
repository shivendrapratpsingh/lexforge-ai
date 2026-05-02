import './globals.css'
import { Providers } from '@/components/Providers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('metadata')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function RootLayout({ children }) {
  const locale   = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
