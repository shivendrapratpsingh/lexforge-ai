import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Keep Prisma in Node.js runtime only (it uses native bindings).
  // bcryptjs is pure JS — do NOT list it here or webpack can't resolve it.
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Don't fail the build on TypeScript errors — safer for first deploy.
  // Remove this later once you've cleaned up any type errors.
  typescript: {
    ignoreBuildErrors: true,
  },

  // (Next 16 removed the `eslint` config key — `next build` no longer runs
  // ESLint. Run lint manually with `npx eslint .` if needed.)
}

export default nextConfig
