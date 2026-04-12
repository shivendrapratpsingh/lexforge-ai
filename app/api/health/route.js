import { NextResponse } from 'next/server'

// Visit http://localhost:3000/api/health to see what's configured and what's broken
export async function GET() {
  const checks = {
    env: {
      AUTH_SECRET: !!process.env.AUTH_SECRET && !process.env.AUTH_SECRET.includes('REPLACE'),
      DATABASE_URL: !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('user:password@host'),
      GROQ_API_KEY: !!process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('REPLACE'),
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    },
    database: { connected: false, error: null, tables: [] },
    prisma_generated: false,
  }

  // Test Prisma client generation
  try {
    await import('@/lib/prisma')
    checks.prisma_generated = true
  } catch (e) {
    checks.database.error = 'Prisma client not generated. Run: npx prisma generate'
    return NextResponse.json(checks, { status: 200 })
  }

  // Test DB connection
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1 as test`
    checks.database.connected = true

    // Check tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `
    checks.database.tables = tables.map(t => t.table_name)
  } catch (e) {
    checks.database.error = e?.message || 'DB connection failed'
  }

  const allGood =
    checks.env.AUTH_SECRET &&
    checks.env.DATABASE_URL &&
    checks.env.GROQ_API_KEY &&
    checks.database.connected &&
    checks.prisma_generated

  return NextResponse.json(
    { status: allGood ? '✅ All good' : '❌ Issues found — see details', ...checks },
    { status: 200 }
  )
}
