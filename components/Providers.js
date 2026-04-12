'use client'
import { SessionProvider } from 'next-auth/react'

// Wraps the app with NextAuth SessionProvider.
// refetchOnWindowFocus: false prevents unnecessary re-fetches.
export function Providers({ children }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  )
}
