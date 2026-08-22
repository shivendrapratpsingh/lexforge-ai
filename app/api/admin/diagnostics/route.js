// GET /api/admin/diagnostics — call every upstream for real, from here.
//
// This exists because of a gap that kept recurring: the credentials live
// in the deployment environment, so nothing that runs on a laptop can
// test them, and the features that use them sit behind a login. The
// result was an integration nobody could check — eCourts had a key set
// for seventeen days and had never once been called, so it was neither
// working nor broken, just unknown.
//
// So the check runs where the keys are, and reports what each upstream
// actually said. Verbatim: a provider's own error message ("invalid
// token", "insufficient balance") is the whole diagnosis, and
// paraphrasing it into "something went wrong" throws away the answer.
//
// Costs real money — a Kanoon search is ₹0.50, an eCourts lookup is
// billed per call — so it is admin-only and runs on demand, never on a
// schedule.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// A structurally valid CNR. Whether this particular case exists matters
// far less than whether the call is accepted: "no such case" proves the
// credentials work, which is what is being tested.
const TEST_CNR = 'DLHC010001232024'

async function probe(name, fn, { configured = true, hint = '' } = {}) {
  if (!configured) return { name, state: 'not configured', detail: hint }
  const t = Date.now()
  try {
    // Awaited FIRST. Written inline as `ms: Date.now() - t, detail: await
    // fn()` the properties evaluate in source order, so the duration was
    // computed before the call had even started and every probe proudly
    // reported 0 ms.
    const detail = await fn()
    return { name, state: 'up', ms: Date.now() - t, detail }
  } catch (err) {
    return {
      name,
      state: 'down',
      ms: Date.now() - t,
      // The upstream's own words. This is the diagnosis.
      detail: err?.message || String(err),
      code: err?.code || null,
      status: err?.status || null,
    }
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { kanoonConfigured, ecourtsConfigured } = await import('@/lib/legal-data/config')

  const results = []

  results.push(await probe('AI (Groq)', async () => {
    const { PRO_MODELS } = await import('@/lib/groq')
    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 30000, maxRetries: 0 })
    const c = await groq.chat.completions.create({
      model: PRO_MODELS[0], max_tokens: 900, reasoning_effort: 'low',
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    })
    const text = (c.choices?.[0]?.message?.content || '').trim()
    if (!text) throw new Error('answered, but with an empty message')
    return `${PRO_MODELS[0]} replied "${text.slice(0, 20)}"`
  }, { configured: Boolean(process.env.GROQ_API_KEY), hint: 'GROQ_API_KEY is not set' }))

  results.push(await probe('Judgment search (Indian Kanoon)', async () => {
    const { searchJudgments } = await import('@/lib/legal-data/indiankanoon')
    const out = await searchJudgments({ query: 'dishonour of cheque forged signature defence' })
    if (!out.results.length) throw new Error('answered but found nothing — check the account balance')
    return `${out.results.length} results, e.g. "${out.results[0].title.slice(0, 45)}"`
  }, { configured: kanoonConfigured(), hint: 'INDIANKANOON_TOKEN is not set' }))

  results.push(await probe('Every Act (Indian Kanoon)', async () => {
    const { searchActsOnKanoon } = await import('@/lib/legal-data/indiankanoon')
    // Deliberately an Act that is NOT in the curated 269, so a result
    // proves the long tail is reachable rather than the local corpus.
    const out = await searchActsOnKanoon({ query: 'Coastal Aquaculture Authority Act' })
    if (!out.results.length) throw new Error('the laws doctype answered with nothing')
    return `${out.results.length} acts, e.g. "${out.results[0].title.slice(0, 45)}"`
  }, { configured: kanoonConfigured(), hint: 'INDIANKANOON_TOKEN is not set' }))

  results.push(await probe('Acts (India Code)', async () => {
    const { fetchCollectionFeed, COLLECTIONS } = await import('@/lib/legal-data/indiacode')
    const acts = await fetchCollectionFeed(COLLECTIONS[0])
    if (!acts.length) throw new Error('answered with no acts')
    return `${acts.length} acts, newest "${String(acts[0].shortTitle).slice(0, 40)}"`
  }))

  results.push(await probe('Case status (eCourts)', async () => {
    const { caseByCnr } = await import('@/lib/legal-data/ecourts')
    const out = await caseByCnr(TEST_CNR)
    // A lookup that comes back empty still proves the credentials were
    // accepted, which is the thing in doubt.
    return out?.cnr
      ? `returned case ${out.cnr}`
      : `accepted the request — credentials work, though ${TEST_CNR} matched no case`
  }, {
    configured: ecourtsConfigured(),
    hint: 'ECOURTS_API_BASE and ECOURTS_API_KEY must BOTH be set — one alone silently disables it',
  }))

  results.push(await probe('Email', async () => {
    const { mailConfigured, mailProvider, mailFrom } = await import('@/lib/mail')
    if (!mailConfigured()) throw new Error('no SMTP_* or RESEND_API_KEY — nothing will send, including payment receipts')
    return `${mailProvider()}, sending as ${mailFrom()}`
  }))

  results.push(await probe('Payments (Razorpay)', async () => {
    const { configured, IS_LIVE, KEY_ID } = await import('@/lib/billing')
    if (!configured()) throw new Error('no RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — the app stays invite-only')
    return `${IS_LIVE ? 'LIVE' : 'test'} keys (${KEY_ID.slice(0, 12)}…)`
  }))

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    results,
    summary: {
      up: results.filter(r => r.state === 'up').length,
      down: results.filter(r => r.state === 'down').length,
      unconfigured: results.filter(r => r.state === 'not configured').length,
    },
  })
}
