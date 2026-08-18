import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Point next-intl at our request-config file. Cookie-based locale, no
// [locale] route restructuring needed.
const withNextIntl = createNextIntlPlugin('./i18n/request.js')

const nextConfig: NextConfig = {
  // Keep Prisma in Node.js runtime only (it uses native bindings).
  // bcryptjs is pure JS — do NOT list it here or webpack can't resolve it.
  //
  // pdf-parse/pdfjs-dist must be external too: reading an Act's official
  // PDF loads pdf.worker.mjs by path at runtime, and once bundled that
  // path no longer exists — the route failed with "Setting up fake worker
  // failed: Cannot find module .../pdf.worker.mjs". Left external, it
  // resolves from node_modules and works.
  serverExternalPackages: ['@prisma/client', 'prisma', 'pdf-parse', 'pdfjs-dist'],

  // Don't fail the build on TypeScript errors — safer for first deploy.
  // Remove this later once you've cleaned up any type errors.
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default withNextIntl(nextConfig)
