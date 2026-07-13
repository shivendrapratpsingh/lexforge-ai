// Web App Manifest — makes LexForge installable ("Add to Home Screen")
// on Android and iOS, launching standalone with a dark splash screen so
// it behaves like a native app rather than a browser tab.
export default function manifest() {
  return {
    name: 'LexForge AI — Legal Drafting',
    short_name: 'LexForge',
    description:
      'AI-powered Indian legal document drafting — court-ready notices, petitions, deeds and more.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0D0D0D',
    theme_color: '#0D0D0D',
    icons: [
      { src: '/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
