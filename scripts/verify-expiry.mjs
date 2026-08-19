// Proves the expiry sweep ends lapsed paid terms and leaves everyone
// else alone. Runs on throwaway rows and deletes them.
import { PrismaClient } from '@prisma/client'
import { expireLapsedSubscriptions } from '../lib/billing.js'

const prisma = new PrismaClient()
const ids = []
const past = new Date(Date.now() - 86400000)
const future = new Date(Date.now() + 86400000)
let fails = 0
const check = (n, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${got} want ${want}`}`)
}

async function make(tag, { currentEnd, grandfathered = false, withSub = true }) {
  const u = await prisma.user.create({
    data: {
      email: `zz-expiry-${tag}-${Date.now()}@verify.invalid`,
      name: 'expiry test', password: 'x', tier: 'pro', grandfathered,
    },
  })
  ids.push(u.id)
  if (withSub) {
    await prisma.subscription.create({
      data: { userId: u.id, plan: 'monthly', status: 'active', amountPaise: 49900, currentEnd },
    })
  }
  return u.id
}

try {
  const lapsed = await make('lapsed', { currentEnd: past })
  const current = await make('current', { currentEnd: future })
  const gf = await make('grandfathered', { currentEnd: past, grandfathered: true })
  const manual = await make('manual', { currentEnd: null, withSub: false })

  const r = await expireLapsedSubscriptions()
  console.log('sweep expired:', r.expired)

  const tier = async (id) => (await prisma.user.findUnique({ where: { id }, select: { tier: true } })).tier
  const status = async (id) => (await prisma.subscription.findUnique({ where: { userId: id }, select: { status: true } }))?.status

  check('lapsed term ends access', await tier(lapsed), 'free')
  check('lapsed subscription marked expired', await status(lapsed), 'expired')
  check('a term still running is untouched', await tier(current), 'pro')
  check('current subscription still active', await status(current), 'active')
  check('grandfathered user keeps Pro despite a lapsed row', await tier(gf), 'pro')
  check('a tier set by hand is never swept', await tier(manual), 'pro')

  // Running twice must be a no-op, not a second round of downgrades.
  const again = await expireLapsedSubscriptions()
  check('re-running the sweep changes nothing', again.expired, 0)
} catch (e) {
  console.error('FAILED:', e.message)
  fails++
} finally {
  if (ids.length) {
    await prisma.subscription.deleteMany({ where: { userId: { in: ids } } })
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
    console.log('cleaned up', ids.length, 'test users')
  }
  await prisma.$disconnect()
  console.log(fails ? `\n${fails} FAILED` : '\nexpiry behaves')
  process.exitCode = fails ? 1 : 0
}
