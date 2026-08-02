import './globals.css'
import { Providers } from '@/components/Providers'
import LaunchSplash from '@/components/LaunchSplash'
import AmbientSparks from '@/components/AmbientSparks'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('metadata')
  return {
    title: t('title'),
    description: t('description'),
    // Installed-app behavior on iOS (Android reads app/manifest.js).
    appleWebApp: {
      capable: true,
      title: 'LexForge',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon: [
        { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      // iOS uses this for the home-screen icon; it must be opaque PNG.
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
  }
}

// Mobile: edge-to-edge rendering with safe-area insets (viewportFit) and a
// dark themed browser chrome so the app reads as a native dark app.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0A07',
}

export default async function RootLayout({ children }) {
  const locale   = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {/* Sparks keep falling behind the whole app, and burst off the
                mark when it is opened from the home screen. */}
            <AmbientSparks />
            <LaunchSplash />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
