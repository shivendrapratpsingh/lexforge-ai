import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Keep Prisma + bcrypt in Node.js runtime (not Edge/Wasm)
  // Keep Prisma in Node.js runtime only (it uses native bindings).
  // bcryptjs is pure JS — do NOT list it here or webpack can't resolve it.
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

export default nextConfig
