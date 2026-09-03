// ─────────────────────────────────────────────────────────────────
//  Which AI provider answers, and what happens when it will not.
//
//  WHY THIS EXISTS
//
//  Two outages, both from the same cause: the app was married to one
//  provider. Groq decommissioned llama-3.3-70b-versatile and
//  llama-3.1-8b-instant and every AI feature died at once — drafting,
//  research, analysis — behind a generic "check your GROQ_API_KEY".
//  Then Groq closed Developer-tier signups entirely, leaving the free
//  tier's 8,000 TPM as a hard ceiling with no way to pay past it. At
//  that ceiling a Pro draft in Hindi could not be generated at all:
//  the system prompt left negative headroom, every model was skipped,
//  and the user silently received a template of their own form fields.
//
//  So the provider is now configuration, not architecture.
//
//    AI_PROVIDERS=openrouter,gemini,groq
//
//  The chain is tried in order. A provider with no key is skipped, not
//  failed — so this file is safe to deploy before any key exists, and
//  adding the key is the only step that switches it on.
//
//  EVERY PROVIDER HERE SPEAKS THE OPENAI CHAT-COMPLETIONS DIALECT.
//  That is what makes the abstraction thin enough to be worth having:
//  OpenRouter IS an OpenAI-compatible gateway, Gemini publishes one, and
//  Groq's own SDK is a fork of the OpenAI one. Nothing in the calling
//  code has to know which one answered.
//
//  ON MODEL CHOICE
//
//  Pro drafts a document somebody files in court, so Pro gets the
//  strongest Flash model and Free gets the cheapest. That mirrors the
//  PRO_MODELS / FREE_MODELS split the app already had, and keeps the
//  cost of a free-tier user roughly a sixth of a paying one.
// ─────────────────────────────────────────────────────────────────
import OpenAI from 'openai'

/** "a, b" -> ['a','b'];  empty/unset -> null, so `|| default` works. */
function csv(raw) {
  const list = String(raw || '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
  return list.length ? list : null
}

// ─── Providers ────────────────────────────────────────────────────
//
// tpm: the per-minute token ceiling this provider gives THIS account.
// Groq counts prompt + requested max_tokens against it and rejects the
// whole request when the sum is over, so the number has to be real
// rather than optimistic. Gemini's paid ceiling is high enough that it
// stops being the binding constraint, which is the entire point of
// moving.
const PROVIDERS = {
  // ─── OpenRouter ────────────────────────────────────────────────
  //
  // Primary, and the reason is billing rather than quality: it sells
  // PREPAID CREDITS. Google's Cloud Billing could not be created from
  // India at all — four attempts, four ₹2 verification charges, and
  // OR_BACR2_59 then OR_BACR2_44, the latter a documented Google-side
  // failure with months-old unresolved threads on their own forum. The
  // card was never the problem: those ₹2 authorisations all succeeded.
  // What failed was the recurring-mandate/entity verification that a
  // postpaid account requires. A prepaid top-up needs none of it.
  //
  // It also routes to models the direct Gemini key is barred from:
  // gemini-3.8-flash returns 429 "exceeded your current quota" on a
  // free AI Studio key, but OpenRouter bills Google itself, so the
  // model is simply available.
  //
  // Pricing is passed through with no markup; the cost is a 5.5% fee
  // when buying credits. Model IDs are provider-prefixed — the full
  // catalogue is at openrouter.ai/models, and any of them can be
  // swapped in through the env vars below without a deploy. To A/B a
  // Claude model against Gemini on real drafts:
  //   OPENROUTER_PRO_MODELS=anthropic/claude-haiku-4.5
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
    // Order set by measurement, not by version number.
    //
    // gemini-3.8-flash answers a one-line prompt instantly and then
    // TIMES OUT on every real filing — 10 of 11 full drafts in a bench
    // test returned "Request timed out" at the 60s client ceiling. It
    // is not broken, it is slow under load, but leading with it cost a
    // flat 60 seconds on every single draft before anything useful
    // started. Measured, same document, same facts:
    //
    //   with 3.8 first    154-166s
    //   without it         41-98s
    //
    // Against a 60s serverless budget that minute is the difference
    // between a filing and a timeout, so the model that actually
    // finishes leads. 3.8 stays in the list, last, for when it is
    // healthy — it is reached only if 3.7 and 3.5 have both failed.
    proModels:  csv(process.env.OPENROUTER_PRO_MODELS)  || ['google/gemini-3.7-flash', 'google/gemini-3.5-flash-lite', 'google/gemini-3.8-flash'],
    freeModels: csv(process.env.OPENROUTER_FREE_MODELS) || ['google/gemini-3.5-flash-lite', 'google/gemini-3.7-flash'],
    // Limits scale with credit balance rather than a published ceiling.
    // 250k is the clamp's working assumption; it exists to stop us
    // requesting more than fits, and OpenRouter 429s rather than
    // silently truncating, which the chain already handles.
    tpm: Number(process.env.OPENROUTER_TPM) > 0 ? Number(process.env.OPENROUTER_TPM) : 250_000,
    reasoning: false,   // pass-through varies by underlying model; do not assume
    // Optional, and only for OpenRouter's public leaderboards.
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://lexforge-ai.vercel.app',
      'X-OpenRouter-Title': 'LexForge AI',
    },
  },

  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    envKey: 'GEMINI_API_KEY',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    // Measured against a real AI Studio key, not taken from the docs:
    //
    //   gemini-3.8-flash        429  quota/billing  <- needs billing
    //   gemini-3.7-flash        1.7s  usable
    //   gemini-3.6-flash       14.9s  usable but far too slow
    //   gemini-3.5-flash        2.1s  usable
    //   gemini-3.5-flash-lite   1.1s  usable, fastest
    //   gemini-3.1-flash-lite   1.2s  usable
    //   gemini-2.5-flash        404   not on this key
    //   gemini-2.5-flash-lite   404   not on this key
    //
    // So the published "current generation" names are not a safe
    // default: 2.5-flash-lite is documented and simply is not there,
    // and 3.8-flash answers a one-line prompt but 429s a real draft.
    // These defaults are the strongest pair that actually work without
    // billing. 3.6 is excluded deliberately — 15 seconds for 29 words
    // will not finish a full document inside a 60s function.
    //
    // AFTER BILLING IS LIVE, upgrade without a deploy:
    //   GEMINI_PRO_MODELS=gemini-3.8-flash,gemini-3.7-flash
    proModels:  csv(process.env.GEMINI_PRO_MODELS)  || ['gemini-3.7-flash', 'gemini-3.5-flash'],
    freeModels: csv(process.env.GEMINI_FREE_MODELS) || ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
    // Paid Tier 1. Deliberately conservative against the published
    // figure: the clamp only needs to stop us asking for more than
    // fits, and over-stating it is how the Groq 413s happened.
    //
    // OVERRIDE THIS on the free tier. Google does not publish free-tier
    // ceilings in the docs — they are shown per-project in AI Studio —
    // and claiming 250k when the real number is lower means the clamp
    // sizes a request that then 429s. Read your own figure from
    // aistudio.google.com and set GEMINI_TPM to it.
    tpm: Number(process.env.GEMINI_TPM) > 0 ? Number(process.env.GEMINI_TPM) : 250_000,
    // Gemini's OpenAI-compatible endpoint accepts reasoning_effort.
    reasoning: true,
  },

  groq: {
    id: 'groq',
    label: 'Groq',
    envKey: 'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
    proModels:  ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    freeModels: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
    // Free-plan ceiling, read from x-ratelimit-limit-tokens on this
    // account. Developer tier would be 250k but signups are closed.
    tpm: 8_000,
    reasoning: true,
  },
}

const DEFAULT_CHAIN = 'openrouter,gemini,groq'

/** Configured order, falling back to the default when unset. */
function configuredOrder() {
  const raw = String(process.env.AI_PROVIDERS || DEFAULT_CHAIN)
  return raw.split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
}

// A key that is obviously still the example is NOT a key.
//
// Without this, pasting the placeholder from .env.example — or leaving
// it there intending to fill it in later — makes the provider look
// configured, promotes it to the head of the chain, and turns every
// call into a 401. Worse than having no key at all, because the
// fallback never gets a turn.
const PLACEHOLDER = /^(your[_-]?|paste|xxx|<|changeme|todo|replace)/i

function keyFor(provider) {
  const v = String(process.env[provider.envKey] || '').trim()
  if (!v || PLACEHOLDER.test(v)) return ''
  return v
}

export function providerConfigured(id) {
  const p = PROVIDERS[id]
  return Boolean(p && keyFor(p))
}

/**
 * The providers we can actually call right now, in order.
 *
 * A provider without its key is omitted silently. That is what lets
 * this ship before any Gemini key exists: the chain simply resolves to
 * Groq until the key is set, and to Gemini the moment it is — with no
 * deploy in between.
 */
export function activeProviders() {
  return configuredOrder()
    .map(id => PROVIDERS[id])
    .filter(p => p && keyFor(p))
}

/** Every provider named in the chain, configured or not — for diagnostics. */
export function chainStatus() {
  return configuredOrder().map(id => {
    const p = PROVIDERS[id]
    if (!p) return { id, known: false, configured: false }
    return { id, known: true, label: p.label, configured: Boolean(keyFor(p)), envKey: p.envKey, tpm: p.tpm }
  })
}

// One client per provider per process. The SDK holds a connection pool,
// so rebuilding it per request would throw that away on every call.
const clients = new Map()

export function clientFor(provider) {
  if (clients.has(provider.id)) return clients.get(provider.id)
  const c = new OpenAI({
    apiKey: keyFor(provider),
    baseURL: provider.baseURL,
    timeout: 60_000,
    maxRetries: 1,
    ...(provider.headers ? { defaultHeaders: provider.headers } : null),
  })
  clients.set(provider.id, c)
  return c
}

/**
 * Flatten the chain into the ordered list of attempts.
 *
 * Returns [{ provider, model, tpm, reasoning }, ...] — every model of
 * the first provider before any model of the second, so a working
 * provider is exhausted before falling to a weaker one.
 */
export function attemptPlan({ isPro } = {}) {
  const plan = []
  for (const provider of activeProviders()) {
    const models = isPro === false ? provider.freeModels : provider.proModels
    for (const model of models) {
      plan.push({ provider, model, tpm: provider.tpm, reasoning: provider.reasoning })
    }
  }
  return plan
}

/** The models the primary provider would use — for verify scripts and the admin console. */
export function primaryModels() {
  const [p] = activeProviders()
  if (!p) return { provider: null, pro: [], free: [] }
  return { provider: p.id, label: p.label, pro: p.proModels, free: p.freeModels }
}

export { PROVIDERS }
