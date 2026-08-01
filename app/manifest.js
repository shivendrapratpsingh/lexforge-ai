// Web App Manifest — makes LexForge installable ("Add to Home Screen")
// on Android and iOS, launching standalone with a dark splash screen so
// it behaves like a native app rather than a browser tab.
//
// `shortcuts` are the closest thing a PWA has to home-screen widgets:
// long-pressing the installed icon on Android (and via the app's context
// menu on desktop) opens this jump list, so the services are reachable
// in one press without opening the dashboard first.
export default function manifest() {
  return {
    name: 'LexForge AI — Legal Drafting',
    short_name: 'LexForge',
    description:
      'AI-powered Indian legal document drafting — court-ready notices, petitions, deeds and more.',
    id: '/dashboard',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0A07',
    theme_color: '#0B0A07',
    categories: ['productivity', 'business', 'education'],
    icons: [
      { src: '/icon-48.png',  sizes: '48x48',   type: 'image/png', purpose: 'any' },
      { src: '/icon-96.png',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
      { src: '/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
      // Separate artwork with the mark inset to the safe zone, so Android
      // launchers can crop to a circle/squircle without slicing the mark.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'New document',
        short_name: 'Draft',
        description: 'Start a new court-ready draft',
        url: '/new-draft',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Study & Learn',
        short_name: 'Study',
        description: 'Landmark judgments, doctrines and quizzes',
        url: '/study',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Court dates',
        short_name: 'Dates',
        description: 'Your upcoming hearings and deadlines',
        url: '/court-dates',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'My documents',
        short_name: 'Drafts',
        description: 'Every draft you have generated',
        url: '/drafts',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
