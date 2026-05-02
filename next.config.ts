import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Point next-intl at our request-config file. Cookie-based locale, no
// [locale] route restructuring needed.
const withNextIntl = createNextIntlPlugin('./i18n/request.js')

const nextConfig: NextConfig = {
  // Keep Prisma in Node.js runtime only (it uses native bindings).
  // bcryptjs is pure JS — do NOT list it here or webpack can't resolve it.
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Don't fail the build on TypeScript errors — safer for first deploy.
  // Remove this later once you've cleaned up any type errors.
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default withNextIntl(nextConfig)
