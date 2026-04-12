import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata = {
  title: 'LexForge AI — AI-Powered Legal Platform',
  description: 'Generate professional Indian legal documents with AI. Legal notices, contracts, case briefs, petitions — powered by Llama 3.3 70B.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
