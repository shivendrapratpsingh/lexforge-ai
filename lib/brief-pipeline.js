// ─────────────────────────────────────────────────────────────────
//  lib/brief-pipeline.js
//
//  Stateless worker that advances ONE BriefJob by one step.
//  Designed to run inside a Vercel function invocation (≤55s) and
//  hand off to the next invocation via cron or self-trigger.
//
//  This module is intentionally NOT imported by the live streaming
//  route — it's only used when ENABLE_BRIEF_JOBS=1.  To remove the
//  queued path entirely after upgrading to Vercel Pro, simply unset
//  that env var; nothing in this file imports anything outside the
//  brief-jobs route tree.
// ─────────────────────────────────────────────────────────────────

import { prisma } from './prisma.js'
import { buildCaseBriefMessages, isRefusal, PRO_MODELS } from './groq.js'  // re-uses prompt builder + model list
import { activeProviders, clientFor } from './ai.js'

// Whichever provider heads the chain. Lazy, so importing this module
// costs nothing when no key is set.
const groq = {
  get chat() {
    const [provider] = activeProviders()
    if (!provider) {
      const e = new Error('No AI provider is configured. Set GEMINI_API_KEY (or GROQ_API_KEY).')
      e.code = 'NO_AI_PROVIDER'
      throw e
    }
    return clientFor(provider).chat
  },
}

// Sizing follows the PROVIDER's token ceiling, not an env flag somebody
// has to remember to set. These small windows existed only because
// Groq's free plan allows 8,000 tokens a minute: a brief was walked in
// 4,000-character slices, two per tick, four seconds apart, because
// anything larger tripped the limit. On a provider with real headroom
// that pacing is just latency — a case brief that took minutes now
// takes a fraction of it, from bigger windows that also produce a
// better brief because each one sees more context.
//
// GROQ_PAID_TIER is still honoured so nothing regresses for anyone who
// had it set.
const [_primaryProvider] = activeProviders()
const roomy = (_primaryProvider?.tpm ?? 0) >= 100_000 || process.env.GROQ_PAID_TIER === '1'

const WINDOW_CHARS = roomy ? 12_000 : 4_000
const PER_TICK_MAX = roomy ? 5      : 2      // extractions per worker invocation
const PACE_MS      = roomy ? 1_500  : 4_000  // pause between calls inside one tick
const EXTRACT_MAX_TOKENS  = roomy ? 600   : 280
const SYNTH_MAX_TOKENS    = roomy ? 4_000 : 1_200
const SYNTH_HEAD          = roomy ? 30_000 : 6_000  // chars of ledger we send to synth

// Taken from lib/groq.js rather than written out again: this list was
// left behind when Groq retired the Llama models, and every call here
// failed with model_not_found until it was noticed.
const MODEL_LIST = PRO_MODELS

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Slice the source text into N windows of WINDOW_CHARS each.  If the
// source is shorter than one window, we still create one window so the
// pipeline runs identically for short and long inputs.
function planWindows(sourceText) {
  const text = (sourceText || '').trim()
  if (!text) return []
  const n = Math.max(1, Math.ceil(text.length / WINDOW_CHARS))
  const slice = Math.ceil(text.length / n)
  return Array.from({ length: n }, (_, i) => ({
    idx:     i,
    label:   `Section ${i + 1} of ${n}`,
    content: text.slice(i * slice, (i + 1) * slice),
  }))
}

async function extractOne(win) {
  const system = `Paralegal task. Below is ONE PART of a longer case file. Extract a tight factual digest of what's in THIS PART ONLY. Use these labels (skip any with no info):
PARTIES:
DATES & EVENTS:
DOCUMENTS REFERENCED:
LEGAL PROVISIONS:
KEY FACTS:
COURT / PROCEDURAL POSTURE:

No invention. No conclusions. Just facts. Max ~120 words. If unreadable, return "(no usable facts in this section)".`
  const user = `══ ${win.label} ══\n${win.content}\n══ END ══\n\nExtract.`
  let lastErr
  for (const model of MODEL_LIST) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user   },
        ],
        model,
        temperature: 0.1,
        max_tokens: EXTRACT_MAX_TOKENS,
      })
      const text = completion.choices?.[0]?.message?.content?.trim() || ''
      if (text.length > 8) return text
    } catch (err) {
      lastErr = err
      const status = err?.status || err?.response?.status
      if (status === 429 || /rate_limit|TPM|tokens per minute|Request too large/i.test(err?.message || '')) {
        // Let the caller retry this window on the next tick.
        const e = new Error('Rate-limited on extract — will retry on next tick')
        e.code = 'RATE_LIMIT'
        throw e
      }
      // unknown — try the next fallback model
    }
  }
  if (lastErr) throw lastErr
  return '(no usable facts in this section)'
}

async function synthesize({ ledger, court, language }) {
  // Take only the most recent SYNTH_HEAD chars of the ledger so the
  // synth call fits comfortably under the TPM budget.
  const trimmed = ledger.length > SYNTH_HEAD
    ? ledger.slice(0, SYNTH_HEAD) + '\n\n[…earlier sections of the ledger have been omitted to fit the model context…]'
    : ledger
  const baseMessages = buildCaseBriefMessages(trimmed, {
    isPro: groqPaid,
    court,
    language,
  })
  const synthSystem = baseMessages.system +
    '\n\nNOTE: The content below is a FACT LEDGER compiled by reading every section of the case file. Treat each "══ Section X of N ══" block as ground truth.  Use facts from across all sections.'
  let lastErr
  for (const model of MODEL_LIST) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: synthSystem },
          { role: 'user',   content: baseMessages.user },
        ],
        model,
        temperature: 0.15,
        max_tokens: SYNTH_MAX_TOKENS,
      })
      const text = completion.choices?.[0]?.message?.content?.trim() || ''
      if (text.length > 20) {
        if (isRefusal(text)) {
          const e = new Error('AI refused to generate this brief.')
          e.code = 'AI_REFUSAL'
          throw e
        }
        return text
      }
    } catch (err) {
      lastErr = err
      const status = err?.status || err?.response?.status
      if (status === 429 || /rate_limit|TPM|tokens per minute/i.test(err?.message || '')) {
        const e = new Error('Rate-limited on synth — will retry on next tick')
        e.code = 'RATE_LIMIT'
        throw e
      }
    }
  }
  if (lastErr) throw lastErr
  throw new Error('All models failed during synthesis.')
}

// ─────────────────────────────────────────────────────────────────
//  Public API — picks the oldest queued/locked job, advances it one
//  step, returns a summary.  Designed to be invoked by Vercel Cron
//  every minute, or on-demand by /api/brief-jobs/worker.
//
//  Returns: { advanced: boolean, jobId?: string, state?: string }
// ─────────────────────────────────────────────────────────────────
const LOCK_TTL_MS = 90_000  // 90s — long enough to cover a tick

export async function advanceOne(reason = 'cron') {
  const now = new Date()
  const staleLock = new Date(Date.now() - LOCK_TTL_MS)

  // Find one job: queued, OR has a stale lock (worker died before unlocking).
  const job = await prisma.briefJob.findFirst({
    where: {
      OR: [
        { state: 'queued' },
        { state: 'extracting' },
        { state: 'reducing' },
      ],
      AND: [
        { OR: [{ lockedAt: null }, { lockedAt: { lt: staleLock } }] },
      ],
    },
    orderBy: { updatedAt: 'asc' },
  })
  if (!job) return { advanced: false, reason: 'no jobs' }

  // Acquire lock
  const lockId = `${reason}-${Math.random().toString(36).slice(2, 8)}`
  const locked = await prisma.briefJob.updateMany({
    where: { id: job.id, OR: [{ lockedAt: null }, { lockedAt: { lt: staleLock } }] },
    data:  { lockedAt: now, lockedBy: lockId },
  })
  if (locked.count === 0) return { advanced: false, reason: 'race lost', jobId: job.id }

  try {
    return await runJobTick(job.id, lockId)
  } catch (err) {
    console.error('[brief-pipeline] tick failed', job.id, err?.message)
    await prisma.briefJob.update({
      where: { id: job.id },
      data:  { state: 'failed', error: err?.message?.slice(0, 500) || 'unknown error', lockedAt: null, lockedBy: null },
    })
    return { advanced: false, reason: 'failed', jobId: job.id, error: err?.message }
  }
}

async function runJobTick(jobId, lockId) {
  // Re-read to pick up any state written by previous tick.
  const job = await prisma.briefJob.findUnique({ where: { id: jobId } })
  if (!job) return { advanced: false, reason: 'gone', jobId }

  // Phase 0 — initial chunk planning
  if (job.totalWindows === 0) {
    const windows = planWindows(job.sourceText)
    await prisma.briefJob.update({
      where: { id: jobId },
      data: {
        totalWindows: windows.length,
        state: windows.length === 0 ? 'failed' : 'extracting',
        error: windows.length === 0 ? 'Source text is empty.' : null,
        ledger: '',
        doneWindows: 0,
      },
    })
    if (windows.length === 0) return { advanced: true, jobId, state: 'failed' }
  }

  // Phase 1 — run up to PER_TICK_MAX extractions
  const refreshed = await prisma.briefJob.findUnique({ where: { id: jobId } })
  if (refreshed.doneWindows < refreshed.totalWindows) {
    const windows = planWindows(refreshed.sourceText)
    let ledger    = refreshed.ledger
    let done      = refreshed.doneWindows
    for (let n = 0; n < PER_TICK_MAX && done < windows.length; n++) {
      const win = windows[done]
      try {
        const facts = await extractOne(win)
        ledger += `\n\n══ Section ${done + 1} of ${windows.length} ══\n${facts}`
        done += 1
        if (n < PER_TICK_MAX - 1 && done < windows.length) await sleep(PACE_MS)
      } catch (err) {
        if (err?.code === 'RATE_LIMIT') {
          // save progress so far; the next tick will resume here
          break
        }
        throw err
      }
    }
    await prisma.briefJob.update({
      where: { id: jobId },
      data: {
        ledger,
        doneWindows: done,
        state: done >= windows.length ? 'reducing' : 'extracting',
        lockedAt: null,
        lockedBy: null,
      },
    })
    return { advanced: true, jobId, state: done >= windows.length ? 'reducing' : 'extracting', progress: done / windows.length }
  }

  // Phase 2 — synthesize the final brief
  if (refreshed.state === 'reducing' || (refreshed.doneWindows >= refreshed.totalWindows && !refreshed.brief)) {
    const brief = await synthesize({
      ledger: refreshed.ledger,
      court: refreshed.court,
      language: refreshed.language,
    })
    await prisma.briefJob.update({
      where: { id: jobId },
      data: { brief, state: 'done', lockedAt: null, lockedBy: null },
    })
    return { advanced: true, jobId, state: 'done' }
  }

  // Should not reach here — unlock so the job isn't stuck.
  await prisma.briefJob.update({
    where: { id: jobId },
    data:  { lockedAt: null, lockedBy: null },
  })
  return { advanced: false, jobId, state: refreshed.state, reason: 'no-op' }
}

// Helper for advancing a SPECIFIC job (used by self-trigger right after
// create).  Loops up to N times in one invocation to drain quickly when
// the document is small.
export async function pumpJob(jobId, maxTicks = 3) {
  for (let i = 0; i < maxTicks; i++) {
    const before = await prisma.briefJob.findUnique({ where: { id: jobId } })
    if (!before || before.state === 'done' || before.state === 'failed') break

    const now      = new Date()
    const staleAt  = new Date(Date.now() - LOCK_TTL_MS)
    const lockId   = `pump-${i}-${Math.random().toString(36).slice(2, 6)}`
    const claimed  = await prisma.briefJob.updateMany({
      where: { id: jobId, OR: [{ lockedAt: null }, { lockedAt: { lt: staleAt } }] },
      data:  { lockedAt: now, lockedBy: lockId },
    })
    if (claimed.count === 0) break
    try {
      const res = await runJobTick(jobId, lockId)
      if (!res.advanced) break
    } catch (err) {
      await prisma.briefJob.update({
        where: { id: jobId },
        data:  { state: 'failed', error: err?.message?.slice(0, 500), lockedAt: null, lockedBy: null },
      })
      break
    }
  }
}
