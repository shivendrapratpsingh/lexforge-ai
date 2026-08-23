import './globals.css'
import { Providers } from '@/components/Providers'
import LaunchSplash from '@/components/LaunchSplash'
import AmbientSparks from '@/components/AmbientSparks'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('metadata')
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://lexforge-ai.vercel.app'

  return {
    // metadataBase turns every relative image and canonical path into an
    // absolute URL. Without it a search engine and a link preview both
    // get "/icon-512.png" and neither can fetch it.
    metadataBase: new URL(site),
    title: {
      // A page that sets its own title keeps it; everything else gets
      // the name appended, so "Pricing" reads "Pricing · LexForge AI" in
      // a results page rather than just "Pricing".
      default: t('title'),
      template: '%s · LexForge AI',
    },
    description: t('description'),
    applicationName: 'LexForge AI',
    // Verification is by environment variable so the code that Search
    // Console hands you can be pasted into Vercel rather than committed
    // to a public repository and deployed.
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
      ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
    },
    alternates: { canonical: '/' },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
    },
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
