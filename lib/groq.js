// ─────────────────────────────────────────────────────────────────
//  LexForge AI — groq.js
//  AI legal document generation — all 25 High Courts + Supreme Court
//  + District Courts + Tribunals across India
// ─────────────────────────────────────────────────────────────────

import Groq from 'groq-sdk'
import { buildLawsPromptBlock, findApplicableLaws } from './indian-laws.js'
import { DOC_FIELDS, fieldSchemaForPrompt } from './document-fields.js'
import { stripMarkdown } from './markdown.js'
import { buildLexiconBlock, TYPE_GROUP, PRO_ELEVATED_REGISTER, buildLanguageLexicon } from './legal-dictionary.js'
import { trackUsage } from './usage.js'

// ─── Universal citation rule ──────────────────────────────────────
// Injected into every document and chat prompt. Ensures the model
// cites the FULL official act name + EXACT section/article + year
// instead of vague phrases like "as per the relevant statute".
const CITATION_MANDATE = `
═══════ CITATION RULES (MANDATORY) ═══════
1. Whenever a statute, ordinance, rule, or regulation is referenced,
   write it in this canonical form:
       "Section <N> of <Full Official Act Name>, <Year>"
   For constitutional provisions:
       "Article <N> of the Constitution of India, 1950"
   For procedural codes (CPC/CrPC/BNSS): include the Order/Rule too
   when applicable, e.g. "Order VII Rule 11 CPC, 1908".
2. NEVER use a colloquial short form alone (e.g. "498A", "138 NI",
   "S.420") without spelling out the full name on first mention. The
   short form may be used on subsequent mentions in the same paragraph.
3. When you are NOT certain that a section number is correct for the
   point you are making, write the placeholder
       "[SECTION TO BE VERIFIED — <law name>]"
   rather than inventing a number. A bracketed placeholder is always
   preferable to a hallucinated citation.
4. If multiple acts could apply, list them in order of authority
   (Constitution → central act → state act → rules → notification).
═══════ END CITATION RULES ═══════
`

// ─── Case-law guard — goes LAST in every document prompt ───────────
// The court-format blocks tell the model to "reference Allahabad HC
// precedents", "cite Supreme Court precedents extensively" and so on.
// Those blocks are appended AFTER the fidelity mandate, so on recency
// alone they were winning the argument — and a model told to cite
// precedents extensively, with no case database to draw on, invents
// them. Users reported exactly that: real-sounding case names carrying
// citations that do not exist.
//
// This block therefore sits at the very end of the prompt, after
// everything including the court block, so it is the last instruction
// the model reads. It does not forbid citation — a genuinely well-known
// authority is useful — it forbids UNCERTAIN citation, and gives the
// model a safe way to signal "an authority belongs here" without
// fabricating one.
//
// Statutory sections are handled separately above; those are far more
// stable in training data than case names, years and reporter numbers.
const CASE_LAW_GUARD = `
═══════ CASE LAW — FINAL RULE, OVERRIDES EVERY INSTRUCTION ABOVE ═══════
Where any instruction above asks you to "cite precedents", "reference
High Court precedents" or similar, it is satisfied by citing the correct
STATUTORY PROVISIONS. It does NOT authorise you to name judgments.

Name a judgment ONLY if you are certain of BOTH the case name AND that
it genuinely decides the point. If you are not certain of the citation
(reporter, year, volume, page), give the case name alone and omit the
citation — never complete one from memory.

If an authority is needed but you are not certain of one, write:
    [CITE AUTHORITY — TO BE VERIFIED]
That placeholder is always correct. A fabricated citation is a
professional disaster for the advocate who files it: it is caught by
opposing counsel or the bench, and it is their name on the document.

Zero citations is a good document. One invented citation ruins it.
═══════ END CASE LAW RULE ═══════
`

// ─── Universal Indian court layout mandate ─────────────────────────
// Injected into every document prompt. Governs the PHYSICAL LAYOUT of
// the text so the exported PDF/DOCX matches the format Indian courts
// actually accept for filing (cause title, memo of parties, numbered
// paragraphs, prayer, verification, execution blocks).
const COURT_FORMAT_MANDATE = `
═══════ LAYOUT RULES (INDIAN COURT FILING FORMAT) ═══════
The export engine automatically centres any line that is ONLY a court name, ONLY the word VERSUS, or ONLY an ALL-CAPS heading — so keep such lines free of other text.
A. COURT FILINGS (petitions, applications, affidavits, complaints): (1) full court name in caps, alone on line 1 ("IN THE HIGH COURT OF ..."); (2) jurisdiction/side and the case-number block ("WRIT PETITION (CIVIL) NO. _____ OF 20__"), each on its own line; (3) parties block — "[PARTY, FULL DESCRIPTION]  ...PETITIONER" / then "VERSUS" alone on its own line / "[PARTY]  ...RESPONDENT"; (4) document title in caps stating the enabling provision ("APPLICATION UNDER SECTION 439 CrPC, 1973 ..."); (5) where used, "MOST RESPECTFULLY SHOWETH:"; (6) numbered facts and grounds — "1. That ..." — sub-points (a),(b),(c); (7) PRAYER as lettered reliefs ending with the residuary clause; (8) Place:/Date:, signature block, and VERIFICATION where required.
B. NOTICES/LETTERS (legal notice, cheque-bounce notice, email): letterhead, dispatch line ("BY SPEED POST / REGISTERED A.D."), date, addressee, SUBJECT line in caps, numbered body, demand + time limit, reservation of rights, signature. NEVER name a court in a notice.
C. DEEDS (contract, rent agreement, sale deed, vakalatnama): title in caps, execution date/place recital, parties with "hereinafter referred to as ...", recitals ("AND WHEREAS ..."), numbered operative clauses, testimonium ("IN WITNESS WHEREOF ..."), signature blocks with two attesting witnesses.
D. CONVENTIONS: write the body in normal sentence case — reserve ALL CAPS ONLY for the cause title, section headings and party-designation tags (PETITIONER/RESPONDENT); never set whole paragraphs in capitals. Dates "05.03.2026" (or "the 5th day of March, 2026" in recitals), never "5/3/26"; money as figures + words "Rs. 5,00,000/- (Rupees Five Lakhs only)"; refer to parties after first mention as "the Petitioner"/"the Respondent No. 2", never bare names; mark exhibits "ANNEXURE P-1/A-1/R-1" and reference each where first mentioned; number paragraphs consecutively with no gaps and no empty numbered items; one blank line between paragraphs.
═══════ END LAYOUT RULES ═══════
`

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 60000,   // 60-second timeout
  maxRetries: 1,
})

// ─── Available models in priority order ───────────────────────────
// Pro users get the best 70B models first. Free users start with a smaller/faster model.
// NOTE: Groq decommissioned llama-3.1-70b-versatile, llama3-70b-8192,
// llama3-8b-8192 and mixtral-8x7b-32768. Removed from the fallback chain
// to stop "model_decommissioned" failures cascading into a missing-fallback
// crash.
// Groq decommissioned llama-3.3-70b-versatile and llama-3.1-8b-instant.
// Both returned model_not_found, which took every AI feature in the app
// down at once — drafting, research, analysis — with the generic
// "check your GROQ_API_KEY" message, because a missing model and a bad
// key both surface as a failed call.
//
// These are the replacements available on the account. They are REASONING
// models: they think before answering, and that thinking is billed against
// max_tokens. Two consequences handled below — REASONING_MODELS and
// MIN_REASONING_BUDGET.
export const PRO_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',       // last-resort so a Pro user still gets *something*
]
export const FREE_MODELS = [
  'openai/gpt-oss-20b',       // smaller and faster; fine for free-tier output
  'openai/gpt-oss-120b',
]

// Models that emit reasoning tokens before their answer. Their reasoning
// arrives in a separate `reasoning` field rather than inside `content`, so
// nothing has to be stripped — but it IS charged against max_tokens, so a
// request with a small budget returns an empty string. Measured: a 20-token
// request produced "" while spending ~560 tokens thinking.
const REASONING_MODELS = new Set(['openai/gpt-oss-120b', 'openai/gpt-oss-20b'])
// Floor for those models, so short requests still leave room for an answer.
const MIN_REASONING_BUDGET = 900
const MODELS = PRO_MODELS  // legacy default used by helpers that don't pass isPro

// ─── Per-model TPM (tokens-per-minute) ceilings ────────────────────
// Groq counts prompt tokens + the REQUESTED max_tokens (not just what's
// actually generated) against this org's per-request TPM allowance. Our
// system prompts are large (the whole FIDELITY_MANDATE + court/style
// addenda run several thousand tokens on their own), so asking for a
// generous max_tokens on top of that can silently blow past the limit —
// Groq then rejects the ENTIRE request with a 413, generation falls back
// to the raw-text template, and the "document" a user gets is just their
// form fields dumped verbatim with no legal formatting at all. That is
// almost certainly the single biggest cause of unprofessional-looking
// output. See chatCompleteRaw()'s per-model budget clamp below.
// Read from the x-ratelimit-limit-tokens header on this account: both
// replacement models report 8000, down from the old 70B's 12000. Long
// document prompts therefore have less completion headroom than before.
const MODEL_TPM_LIMIT = {
  'openai/gpt-oss-120b': 8000,
  'openai/gpt-oss-20b': 8000,
}
const DEFAULT_TPM_LIMIT = 8000
const TPM_SAFETY_MARGIN = 400 // headroom for token-count estimation error

// Cheap, deliberately conservative token estimate (no tokenizer dependency).
// English legal prose with lots of capitalized statute names and Latin
// maxims runs closer to 3.3-3.7 chars/token than the usual "4 chars ~ 1
// token" rule of thumb, and Devanagari text is denser still — use 3.2 so we
// err on the side of under-requesting rather than tripping the TPM cap again.
function estimateTokens(text) {
  return Math.ceil((text || '').length / 3.2)
}

// ─── Refusal detection ────────────────────────────────────────────
// Phrases that indicate the model refused to generate content.
// We throw a specific error so the caller can surface it properly.
const REFUSAL_PHRASES = [
  "i can't help with that",
  "i cannot help with that",
  "i'm unable to assist",
  "i am unable to assist",
  "i'm not able to help",
  "i cannot assist",
  "i can't assist",
  "i won't be able to",
  "i cannot provide",
  "i can't provide",
  "i'm not going to",
  "i will not generate",
  "i cannot generate",
  "i can't generate",
  "this request contains",
  "the input contains offensive",
  "content policy",
]

export function isRefusal(text) {
  if (!text) return false
  const lower = text.toLowerCase().trim()
  // Short responses that are clearly refusals (under 120 chars)
  if (lower.length < 120 && REFUSAL_PHRASES.some(p => lower.includes(p))) return true
  // Even longer responses — if they start with a refusal phrase
  if (REFUSAL_PHRASES.some(p => lower.startsWith(p))) return true
  return false
}

// ─── Robust chat completion with model fallback ────────────────────
// Returns { text, finishReason } so callers can detect truncation
// (finishReason === 'length' means Groq cut the response off at max_tokens —
// the single most common cause of a document missing its own closing
// VERIFICATION / PRAYER / signature block).
async function chatCompleteRaw(messages, maxTokens = 4000, temperature = 0.25, opts = {}) {
  const modelList = opts.isPro ? PRO_MODELS : (opts.isPro === false ? FREE_MODELS : MODELS)
  const promptTokens = estimateTokens(messages.map(m => m.content || '').join('\n'))
  let sawRateLimit = false
  let lastError = null
  for (const model of modelList) {
    // Clamp max_tokens so prompt + completion stays under THIS model's TPM
    // ceiling — Groq reserves the full requested max_tokens against the
    // limit regardless of how much is actually generated, so requesting
    // more than fits is a guaranteed 413 on every attempt, not a
    // probabilistic one.
    const tpmLimit = MODEL_TPM_LIMIT[model] || DEFAULT_TPM_LIMIT
    // Guard on the HEADROOM the prompt leaves, not on the clamped result.
    // Clamping first meant a caller who deliberately asked for a short
    // answer — a one-line search query, say — was read as "no room left"
    // and every model was skipped, so the call silently returned null
    // however much headroom there actually was.
    const headroom = tpmLimit - promptTokens - TPM_SAFETY_MARGIN
    if (headroom < 150) {
      console.warn(`[Groq] Prompt alone (~${promptTokens} tokens) leaves no room under ${model}'s ${tpmLimit} TPM limit, skipping...`)
      continue
    }
    // Reasoning models spend part of the budget thinking before they answer,
    // so a request sized only for the answer comes back empty. Give them a
    // floor — but never above the headroom, or the request 413s.
    const wanted = REASONING_MODELS.has(model)
      ? Math.max(maxTokens, MIN_REASONING_BUDGET)
      : maxTokens
    const safeMaxTokens = Math.min(wanted, headroom)

    try {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature,
        max_tokens: safeMaxTokens,
        // Keep the thinking short. These prompts ask for drafting and
        // extraction, not puzzles, and every reasoning token is one fewer
        // available for the answer under an 8K ceiling.
        ...(REASONING_MODELS.has(model) ? { reasoning_effort: 'low' } : null),
      })
      // Record what this cost. Fire and forget: accounting must never be
      // the reason a draft fails, so trackUsage swallows its own errors
      // and is deliberately not awaited. opts.userId is passed by the
      // routes that know who is asking; jobs without a user still record
      // the spend against no one, which keeps the totals honest.
      trackUsage({
        userId: opts.userId ?? null,
        provider: 'groq',
        operation: opts.operation || 'generate',
        tokens: completion.usage?.total_tokens ?? null,
      })

      const text = completion.choices[0]?.message?.content
      if (text && text.trim().length > 10) {
        // Check if the model refused to generate content
        if (isRefusal(text)) {
          const err = new Error(
            'The AI could not generate this document. Please check that the case details ' +
            'do not contain offensive, abusive, or inappropriate language, and try again.'
          )
          err.code = 'AI_REFUSAL'
          throw err
        }
        return { text, finishReason: completion.choices[0]?.finish_reason || 'stop' }
      }
    } catch (err) {
      // Re-throw refusal errors immediately — no point trying other models
      if (err.code === 'AI_REFUSAL') throw err

      const msg    = err?.message || ''
      const status = err?.status || err?.response?.status

      // Auth errors — fatal, no point retrying any model.
      if (status === 401 || status === 403 || msg.includes('API key') || /invalid.*api.*key/i.test(msg)) {
        const e = new Error('Invalid GROQ_API_KEY. Please check your environment configuration.')
        e.code = 'GROQ_AUTH'
        throw e
      }
      // Rate-limit / request-too-large. NOTE: Groq's 429 message embeds the
      // model name ("Rate limit reached for model `llama-...`"), so this MUST
      // be checked BEFORE the generic "model" branch below or every 429 gets
      // misread as a missing model. Remember it and try the next model.
      if (status === 429 || status === 413 || /rate.?limit|tokens per minute|\bTPM\b|Request too large|quota/i.test(msg)) {
        sawRateLimit = true
        console.warn(`[Groq] ${model} rate-limited / over TPM — trying next model...`)
        continue
      }
      // Genuine model problem (decommissioned / not found) — try next model.
      if (status === 404 || /model|not found|deprecated|decommissioned/i.test(msg)) {
        console.warn(`[Groq] Model ${model} unavailable — trying next...`)
        continue
      }
      // Anything else — try next model but record it.
      lastError = err
      console.warn(`[Groq] Error with ${model}: ${msg}`)
      continue
    }
  }
  // All models failed. If it was purely a rate-limit exhaustion, signal that
  // distinctly so the caller can tell the user to wait and retry instead of
  // silently saving the raw undrafted template.
  if (sawRateLimit) {
    const e = new Error('The AI provider is rate-limited right now. Please wait about a minute and generate again.')
    e.code = 'GROQ_RATE_LIMIT'
    throw e
  }
  if (lastError) {
    const e = new Error(lastError.message || 'AI generation failed.')
    e.code = 'GROQ_ERROR'
    throw e
  }
  return null  // All models skipped (e.g. prompt too large for every model)
}

// Back-compat thin wrapper for the many call sites that only need the text
// (chat, analysis, JSON-extraction helpers, etc. — none of these produce a
// final court filing, so they don't need the completeness/continuation
// machinery below).
async function chatComplete(messages, maxTokens = 4000, temperature = 0.25, opts = {}) {
  const result = await chatCompleteRaw(messages, maxTokens, temperature, opts)
  return result?.text || null
}

// ─── Structural completeness check ─────────────────────────────────
// Every real court filing ends with SOME kind of formal closing — a
// verification clause, a deponent/advocate signature line, an execution
// block, or a "Place: / Date:" pair. If none of these markers appear
// anywhere in roughly the last third of the document, the model almost
// certainly stopped mid-document (even if Groq reported finish_reason
// "stop" rather than "length" — models sometimes just trail off).
const CLOSING_MARKERS = /\b(VERIFICATION|VERIFIED AT|DEPONENT|ADVOCATE|SIGNATURE|IN WITNESS WHEREOF|EXECUTION|WITNESSES?:|Place\s*:|Date\s*:)\b/i

function looksStructurallyComplete(text) {
  if (!text) return false
  const tail = text.slice(-Math.max(400, Math.floor(text.length / 3)))
  return CLOSING_MARKERS.test(tail)
}

// ─── Per-type required sections ────────────────────────────────────
// A court filing missing any of these would be returned by the registry /
// rejected by the bench. After generation we check the assembled text and,
// if anything is missing, ask the model for JUST those sections in one
// bounded repair call (see generateCourtDocument below).
const REQUIRED_SECTIONS = {
  PETITION: [
    ['court name / cause title (e.g. "IN THE COURT OF ...")', /^\s*(IN THE|BEFORE THE)\s/im],
    ['prayer clause', /PRAY/i],
    ['verification clause', /VERIF/i],
  ],
  WRIT_PETITION: [
    ['court name / cause title', /^\s*(IN THE|BEFORE THE)\s/im],
    ['prayer clause', /PRAY/i],
    ['verification clause', /VERIF/i],
  ],
  PIL: [
    ['court name / cause title', /^\s*(IN THE|BEFORE THE)\s/im],
    ['prayer clause', /PRAY/i],
    ['verification clause', /VERIF/i],
  ],
  BAIL_APPLICATION: [
    ['court name / cause title', /^\s*(IN THE|BEFORE THE)\s/im],
    ['grounds section', /GROUND/i],
    ['prayer clause', /PRAY/i],
  ],
  STAY_APPLICATION: [
    ['court name / cause title', /^\s*(IN THE|BEFORE THE)\s/im],
    ['prayer clause', /PRAY/i],
  ],
  CONSUMER_COMPLAINT: [
    ['forum name / cause title', /^\s*(IN THE|BEFORE THE)\s/im],
    ['prayer / relief clause', /PRAY|RELIEF/i],
    ['verification or supporting affidavit', /VERIF|AFFIDAVIT/i],
  ],
  DIVORCE_PETITION: [
    ['court name / cause title', /^\s*(IN THE|BEFORE THE)\s/im],
    ['prayer clause', /PRAY/i],
    ['verification clause', /VERIF/i],
  ],
  AFFIDAVIT: [
    ['deponent identification ("I, ..., do hereby solemnly affirm")', /solemnly affirm|DEPONENT/i],
    ['verification clause', /VERIF/i],
  ],
  LEGAL_NOTICE: [
    ['subject line', /SUBJECT|SUB\s*:/i],
    ['compliance time limit (e.g. "within 15 days")', /within\s+(a\s+period\s+of\s+)?\w+\s*(\(\d+\)\s*)?days?/i],
  ],
  CHEQUE_BOUNCE: [
    ['cheque particulars (number / date / bank)', /cheque\s*(bearing\s*)?no/i],
    ['15-day statutory demand under Section 138(c)', /fifteen|15/i],
  ],
  CONTRACT: [
    ['testimonium / execution clause ("IN WITNESS WHEREOF ...")', /IN WITNESS WHEREOF/i],
  ],
  RENT_AGREEMENT: [
    ['testimonium / execution clause ("IN WITNESS WHEREOF ...")', /IN WITNESS WHEREOF/i],
  ],
  SALE_DEED: [
    ['property schedule', /SCHEDULE/i],
    ['testimonium / execution clause ("IN WITNESS WHEREOF ...")', /IN WITNESS WHEREOF/i],
  ],
  VAKALATNAMA: [
    ['operative appointment ("KNOW ALL MEN BY THESE PRESENTS ...")', /KNOW ALL/i],
  ],
  RTI_APPLICATION: [
    ['Section 6(1) RTI Act reference', /SECTION\s*6/i],
    ['information sought section', /INFORMATION SOUGHT|INFORMATION REQUIRED/i],
  ],
  FIR_COMPLAINT: [
    ['addressee (Station House Officer / police station)', /STATION HOUSE OFFICER|POLICE STATION|S\.?H\.?O/i],
    ['prayer / request for registration', /PRAY|REQUEST/i],
    ['truth declaration', /DECLAR|true and correct/i],
  ],
  MEMORANDUM:   [['conclusion / opinion section', /CONCLUSION|OPINION/i]],
  LEGAL_OPINION:[['definitive opinion section', /OPINION/i]],
  CASE_BRIEF:   [['conclusion section', /CONCLUSION|HELD/i]],
  LEGAL_EMAIL: [
    ['"To:" header line', /^\s*To\s*:/im],
    ['"Subject:" header line', /^\s*Subject\s*:/im],
  ],
}

// Returns human-readable labels of the sections missing from `text` for
// this document type — including the universal closing block check.
function missingSections(documentType, text) {
  const missing = []
  for (const [label, re] of (REQUIRED_SECTIONS[documentType] || [])) {
    if (!re.test(text)) missing.push(label)
  }
  if (documentType !== 'LEGAL_EMAIL' && !looksStructurallyComplete(text)) {
    missing.push('closing formalities (verification / signature / execution block as appropriate)')
  }
  return missing
}

// ─── Deterministic closing scaffolds ───────────────────────────────
// Last line of defence: if the model AND the bounded repair call both
// leave the document without its closing formalities (typically because
// Groq rate-limited the follow-up call), we append a standard,
// placeholder-driven closing for the document family. A closing with
// bracketed placeholders is fileable once the advocate fills them in —
// a document that simply stops mid-way is not.
function buildFallbackClosing(documentType, text) {
  const group = TYPE_GROUP[documentType] || 'PLEADING'
  const parts = []

  if (group === 'PLEADING') {
    if (!/PRAYER/i.test(text)) {
      parts.push(
        'PRAYER',
        '',
        "It is, therefore, most respectfully prayed that this Hon'ble Court may graciously be pleased to:",
        '',
        '(a) [PRINCIPAL RELIEF SOUGHT — TO BE FILLED];',
        '',
        "(b) Pass such other and further order(s) as this Hon'ble Court may deem fit and proper in the facts and circumstances of the case and in the interest of justice.",
        '',
        'AND FOR THIS ACT OF KINDNESS, THE APPLICANT/PETITIONER AS IN DUTY BOUND SHALL EVER PRAY.',
        '',
      )
    }
    parts.push(
      'Place: [PLACE — TO BE FILLED]',
      'Date: [DATE — TO BE FILLED]',
      '',
      '[NAME OF ADVOCATE — TO BE FILLED]',
      'Advocate for the Applicant/Petitioner',
      'Enrolment No.: [STATE BAR COUNCIL ENROLMENT NO. — TO BE FILLED]',
    )
    if (!/VERIFICATION/i.test(text)) {
      parts.push(
        '',
        'VERIFICATION',
        '',
        'I, [NAME OF DEPONENT — TO BE FILLED], the Applicant/Petitioner above-named, do hereby verify that the contents of the foregoing paragraphs are true and correct to my personal knowledge and belief, that no part thereof is false and that nothing material has been concealed therefrom.',
        '',
        'Verified at [PLACE] on this [DAY] day of [MONTH], [YEAR].',
        '',
        'DEPONENT',
      )
    }
  } else if (group === 'DEED') {
    if (!/IN WITNESS WHEREOF/i.test(text)) {
      parts.push(
        'IN WITNESS WHEREOF the parties hereto have set their respective hands and signatures on the day, month and year first hereinabove written, in the presence of the following attesting witnesses:',
        '',
      )
    }
    parts.push(
      '[SIGNATURE OF FIRST PARTY]                    [SIGNATURE OF SECOND PARTY]',
      '[NAME OF FIRST PARTY — TO BE FILLED]          [NAME OF SECOND PARTY — TO BE FILLED]',
      '',
      'WITNESSES:',
      '1. [NAME, ADDRESS AND SIGNATURE OF WITNESS NO. 1 — TO BE FILLED]',
      '2. [NAME, ADDRESS AND SIGNATURE OF WITNESS NO. 2 — TO BE FILLED]',
    )
  } else if (group === 'NOTICE') {
    parts.push(
      '[SIGNATURE]',
      '[NAME OF ADVOCATE — TO BE FILLED]',
      'Advocate',
      'Enrolment No.: [STATE BAR COUNCIL ENROLMENT NO. — TO BE FILLED]',
      '[OFFICE ADDRESS — TO BE FILLED]',
      '',
      'Place: [PLACE — TO BE FILLED]',
      'Date: [DATE — TO BE FILLED]',
    )
  } else if (group === 'APPLICATION') {
    parts.push(
      'Thanking you,',
      '',
      'Yours faithfully,',
      '',
      '[SIGNATURE]',
      '[NAME OF APPLICANT/COMPLAINANT — TO BE FILLED]',
      '',
      'Place: [PLACE — TO BE FILLED]',
      'Date: [DATE — TO BE FILLED]',
    )
  } else {
    // OPINION and any unknown family
    parts.push(
      'Place: [PLACE — TO BE FILLED]',
      'Date: [DATE — TO BE FILLED]',
      '',
      '[NAME, DESIGNATION AND ENROLMENT NO. — TO BE FILLED]',
    )
  }
  return parts.join('\n')
}

// ─── Generate a court document with a truncation/completeness safety net ──
// Wraps chatCompleteRaw with two defensive passes, both bounded so total
// latency stays well inside the 60s serverless ceiling:
//   1. If Groq cut the response off at max_tokens, ask it to continue
//      EXACTLY where it stopped (one continuation call, generous but capped
//      token budget).
//   2. If the assembled text still doesn't look like it ends with a proper
//      closing (verification / signature / execution block), ask for just
//      that missing block in one short, cheap follow-up call.
// Always returns plain text with markdown stripped (defense-in-depth in
// case the model ignores the "no markdown" instruction in the prompt).
// Compact fidelity rules for the continuation / repair calls, which
// deliberately do NOT resend the full FIDELITY_MANDATE (token budget).
// Without these the follow-up model invents advocate names, enrolment
// numbers and dates, and appends meta-commentary into the filing.
const REPAIR_RULES =
  ' HARD RULES: (1) Output ONLY document text — no notes, no explanations, no commentary about what you did or what remains to be filled. ' +
  '(2) Use a name, date or number ONLY if it appears in the excerpt; for everything else write a [BRACKETED PLACEHOLDER — TO BE FILLED]. ' +
  'NEVER invent a person\'s name, an enrolment number, an address or a calendar date. ' +
  '(3) Plain text only — no markdown.'

// Strip a trailing meta-commentary paragraph the model sometimes appends
// ("Note: the above is a continuation ...", "Please ensure that the
// details are filled in ..."). Only the FINAL paragraph is considered,
// and only when it is clearly about the document rather than part of it.
function scrubTrailingMeta(text) {
  const paras = text.split(/\n{2,}/)
  while (paras.length > 1) {
    const last = paras[paras.length - 1].trim()
    const looksMeta =
      /^(note|please note|disclaimer)\b/i.test(last) &&
      /\b(above|continuation|this document|this draft|ensure that|fill(ed)? in|generated|formatted)\b/i.test(last)
    if (!looksMeta) break
    paras.pop()
  }
  return paras.join('\n\n')
}

// Remove empty numbered/lettered stub lines the model occasionally emits
// under token pressure — e.g. a bare "7. That" with no averment following,
// which would read as a blank paragraph in a court filing. A stub is a line
// whose entire content is a list marker (digit or single letter) plus an
// optional "That"/"WHEREAS" opener and nothing else.
function removeEmptyListStubs(text) {
  return (text || '')
    .split('\n')
    .filter(line => !/^[ \t]*(\d+\.|\(?[a-z]\)|[ivx]+\.)[ \t]*(That\b|WHEREAS\b)?[ \t]*$/i.test(line))
    .join('\n')
}

// Strip pleading/deed furniture from ADVISORY and CORRESPONDENCE documents
// (legal opinion, memorandum, case brief, email). Despite explicit prompt
// instructions the model sometimes still bolts a sworn VERIFICATION clause,
// an oath-commissioner/notary attestation, a witness-signature block or an
// "IN WITNESS WHEREOF" execution recital onto a memo or email — none of
// which belong there. We drop any whole paragraph that is one of these.
// Safe for these types because they never legitimately contain such blocks.
function stripPleadingFurniture(text) {
  const isFurniture = p => {
    const t = p.trim()
    return (
      /^VERIFICATION\b/i.test(t) ||
      /\bdo hereby verify that the contents\b/i.test(t) ||
      /\bsolemnly affirm and state\b/i.test(t) ||
      /\bOath Commissioner\b|\bNotary Public\b/i.test(t) ||
      /\bIN WITNESS WHEREOF\b/i.test(t) ||
      /^WITNESS(ES)?\s*:/i.test(t) ||
      /^\s*(DISTRICT )?COURT STAMP BLOCK\b/i.test(t)
    )
  }
  return text
    .split(/\n{2,}/)
    .filter(p => !isFurniture(p))
    .join('\n\n')
}

async function generateCourtDocument(messages, maxTokens, temperature, opts = {}) {
  // Bounded retry: a single transient rate-limit (common on a free Groq key
  // when the user generated another document seconds earlier) should not
  // fail the draft. Wait ~9s for the per-minute TPM bucket to refill and try
  // once more; the wait keeps total latency inside the 60s serverless ceiling.
  // A refusal or auth error is fatal and re-thrown immediately. If the retry
  // is also rate-limited, the GROQ_RATE_LIMIT propagates so the route can tell
  // the user to wait — never silently saving the raw undrafted template.
  let first = null
  try {
    first = await chatCompleteRaw(messages, maxTokens, temperature, opts)
  } catch (err) {
    if (err?.code === 'AI_REFUSAL' || err?.code === 'GROQ_AUTH') throw err
    await sleep(9000)
    first = await chatCompleteRaw(messages, maxTokens, temperature, opts)  // may throw again → propagate
  }
  if (!first) return null

  let text = first.text

  // Continuation/repair calls deliberately do NOT resend the original
  // (very large) system prompt — on this org's TPM tier, re-sending several
  // thousand tokens of instructions just to ask for a few more paragraphs
  // would eat almost the entire budget before generating a single new word.
  // A short, focused instruction + the tail of what's already written gives
  // the model enough context to continue in the same voice while leaving
  // nearly the whole TPM budget free for actual output.
  const tailContext = text.slice(-1500)

  if (first.finishReason === 'length') {
    const continuation = await chatCompleteRaw([
      {
        role: 'system',
        content: 'You are continuing an Indian court document that was cut off mid-way through generation. Continue in the exact same formal legal register and structure. Do not repeat or restart any earlier section — pick up exactly where the excerpt below ends. Finish every remaining required section, ending with the proper verification clause and advocate/deponent signature block (or execution/witness block, for instruments that use one).' + REPAIR_RULES,
      },
      { role: 'user', content: `END OF DOCUMENT SO FAR (last ~1500 characters — continue from here):\n${tailContext}` },
    ], Math.min(2200, maxTokens), temperature, opts).catch(() => null)
    if (continuation?.text) text = `${text}\n${continuation.text}`
  }

  // Per-type structural audit: if any court-mandated section is missing
  // (prayer, verification, testimonium, subject line, …), ask for JUST the
  // missing sections in one bounded, cheap repair call.
  const missing = missingSections(opts.documentType, text)
  if (missing.length > 0) {
    const repair = await chatCompleteRaw([
      {
        role: 'system',
        content: 'An Indian legal document is missing one or more sections that a court/registry would insist on. Given the excerpt below, write ONLY the missing sections listed by the user — in the order listed, formatted per Indian court drafting conventions (ALL-CAPS headings on their own line, numbered paragraphs, plain text, no markdown) — so they can be appended directly after the existing text. Do not repeat or rewrite any earlier content.' + REPAIR_RULES,
      },
      { role: 'user', content: `MISSING SECTIONS (write these only):\n${missing.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\n${opts.detailsExcerpt ? `AUTHORITATIVE CASE DETAILS (use these exact values in the sections — placeholders only for what is NOT here):\n${opts.detailsExcerpt}\n\n` : ''}END OF DOCUMENT SO FAR (for context and continuity):\n${text.slice(-1500)}` },
    ], Math.min(900, 300 + missing.length * 250), temperature, opts).catch(() => null)
    if (repair?.text) text = `${text}\n\n${repair.text}`
  }

  // Drop trailing meta-commentary and any empty numbered/lettered stubs.
  text = removeEmptyListStubs(scrubTrailingMeta(text))

  // Advisory / correspondence documents must never carry pleading or deed
  // furniture (sworn verification, oath attestation, witness block, "IN
  // WITNESS WHEREOF") — strip any the model bolted on despite instructions.
  if (opts.advisory) text = stripPleadingFurniture(text)

  // Deterministic last line of defence — never ship a filing that stops
  // mid-way. If the closing is STILL missing after the model repair
  // (e.g. the repair call itself got rate-limited), append the standard
  // placeholder closing for this document family. Advisory documents are
  // exempt (their closing is a plain signature, handled by their prompt).
  if (opts.documentType !== 'LEGAL_EMAIL' && !opts.advisory && !looksStructurallyComplete(text)) {
    text = `${text}\n\n${buildFallbackClosing(opts.documentType, text)}`
  }

  return stripMarkdown(text)
}

// ─── Court-specific formatting addendum ───────────────────────────
function courtAddendum(court) {
  if (!court) return ''
  if (court === 'PRAYAGRAJ_HC' || court === 'LUCKNOW_BENCH') {
    const bench = court === 'LUCKNOW_BENCH' ? 'Lucknow Bench' : 'Prayagraj'
    return ` Format this strictly for the HIGH COURT OF JUDICATURE AT ALLAHABAD (${bench}). Use the Allahabad High Court Rules, 1952. Cause title must start with "IN THE HIGH COURT OF JUDICATURE AT ALLAHABAD". For writs: Civil Misc. Writ Petition = WRIT-C, Habeas Corpus = WRIT-B, Service matters = WRIT-A. Include: Court stamp block, Case No. block, proper prayer paragraph ending "IN THE PREMISES IT IS MOST RESPECTFULLY PRAYED THAT...". Reference UP-specific statutes and Allahabad HC precedents. End with proper verification and advocate signature block with UP Bar Council enrollment number.`
  }
  if (court === 'DISTRICT_PRAYAGRAJ' || court === 'ADJ_PRAYAGRAJ') {
    return ` Format this for the DISTRICT & SESSIONS COURT, PRAYAGRAJ. Use appropriate court designation (District Judge / Additional District Judge). Follow UP Civil Procedure Code and CrPC formatting. Include proper case title, vakalatnama reference, and district court stamp block.`
  }
  if (court === 'CJM_PRAYAGRAJ') {
    return ` Format this for the COURT OF CHIEF JUDICIAL MAGISTRATE, PRAYAGRAJ. Use CrPC provisions. Include magistrate court header, CJM court number, and proper CrPC section references.`
  }
  if (court === 'CIVIL_JUDGE_SD' || court === 'CIVIL_JUDGE_JD') {
    const div = court === 'CIVIL_JUDGE_SD' ? 'SENIOR' : 'JUNIOR'
    return ` Format this for the COURT OF CIVIL JUDGE (${div} DIVISION), PRAYAGRAJ. Reference CPC and UP Civil Courts Act provisions. Include proper civil suit/application number block.`
  }
  if (court === 'FAMILY_COURT') {
    return ` Format this for the FAMILY COURT, PRAYAGRAJ under the Family Courts Act, 1984 and UP Family Courts Rules. Use domestic relations law (Hindu Marriage Act / Special Marriage Act / Hindu Succession Act as applicable). Include reconciliation reference where appropriate.`
  }
  if (court === 'LABOUR_COURT') {
    return ` Format this for the LABOUR COURT, PRAYAGRAJ under the Industrial Disputes Act, 1947 and UP Industrial Disputes Act. Reference UP Labour Laws and include the required ID Act sections. Use workman/employer designations correctly.`
  }
  if (court === 'RENT_TRIBUNAL') {
    return ` Format this under the UP Urban Buildings (Regulation of Letting, Rent and Eviction) Act, 1972 for the Rent Control & Eviction Officer, Prayagraj. Reference correct sections of UP Rent Control Act. Include tenant/landlord designations and property details block.`
  }
  if (court === 'CONSUMER_FORUM') {
    return ` Format this for the DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION, PRAYAGRAJ under the Consumer Protection Act, 2019. Include complainant/opposite party designations, deficiency of service/unfair trade practice grounds, and relief under Section 39.`
  }
  if (court && court.startsWith('DISTRICT_')) {
    const distMap = {
      DISTRICT_PRATAPGARH: 'PRATAPGARH',
      DISTRICT_KAUSHAMBI: 'KAUSHAMBI',
      DISTRICT_FATEHPUR: 'FATEHPUR',
      DISTRICT_CHITRAKOOT: 'CHITRAKOOT (KARVI)',
      DISTRICT_MIRZAPUR: 'MIRZAPUR',
    }
    const dist = distMap[court] || court.replace('DISTRICT_', '')
    return ` Format this for the DISTRICT & SESSIONS COURT, ${dist}. Follow standard UP district court formatting with proper case title, CPC/CrPC section references and district court stamp block.`
  }

  // ── Tamil Nadu courts ─────────────────────────────────────────
  if (court === 'MADRAS_HC') {
    return ` Format this strictly for the HIGH COURT OF JUDICATURE AT MADRAS. Cause title must begin "IN THE HIGH COURT OF JUDICATURE AT MADRAS". Use Madras High Court Original Side / Appellate Side rules as appropriate. Reference Tamil Nadu-specific statutes (Tamil Nadu Buildings (Lease and Rent Control) Act, Tamil Nadu Revenue Recovery Act, Tamil Nadu Apartment Ownership Act), Madras HC Rules 1994, and Madras High Court precedents. For writs: use W.P. (civil), Crl. O.P. (criminal), W.A. (writ appeal). End with proper prayer ending "IT IS THEREFORE PRAYED THAT...", verification, and advocate's signature with Tamil Nadu Bar Council enrollment number.`
  }
  if (court === 'MADURAI_BENCH') {
    return ` Format this for the MADURAI BENCH OF MADRAS HIGH COURT. Cause title: "IN THE HIGH COURT OF JUDICATURE AT MADRAS — MADURAI BENCH". Use Madurai Bench jurisdiction (Districts: Madurai, Dindigul, Ramanathapuram, Sivaganga, Tirunelveli, Thoothukudi, Virudhunagar, Pudukottai, Krishnagiri, Dharmapuri). Apply same Madras HC Rules 1994. Use W.P.MD., Crl. O.P.MD. prefixes for case numbers. Reference Madurai Bench and Madras HC precedents and Tamil Nadu state laws.`
  }
  if (court === 'TN_CONSUMER_CHENNAI') {
    return ` Format this for the STATE CONSUMER DISPUTES REDRESSAL COMMISSION, TAMIL NADU, CHENNAI. Apply Consumer Protection Act, 2019. This is the State Commission — jurisdiction for complaints above Rs. 1 crore or appeals from District Commission orders. Include complainant, opposite party designations. Cite Tamil Nadu Consumer Commission and NCDRC precedents.`
  }
  if (court === 'TN_FAMILY_CHENNAI' || court === 'TN_FAMILY_MADURAI') {
    const city = court === 'TN_FAMILY_MADURAI' ? 'MADURAI' : 'CHENNAI'
    return ` Format this for the FAMILY COURT, ${city} under the Family Courts Act, 1984. Apply Hindu Marriage Act 1955 / Special Marriage Act 1954 / Hindu Succession Act 1956 / Hindu Adoption and Maintenance Act as relevant. Tamil Nadu Family Court Rules apply. Include reconciliation statement where applicable. Reference Madras HC family law precedents.`
  }
  if (court === 'TN_LABOUR_CHENNAI') {
    return ` Format this for the LABOUR COURT, CHENNAI under the Industrial Disputes Act, 1947, Tamil Nadu Industrial Disputes Rules, 1958 and Tamil Nadu Labour Laws. Reference Tamil Nadu-specific industrial relations precedents and Madras HC labour law judgments. Use workman/management designations correctly.`
  }
  if (court === 'TN_RENT_CHENNAI') {
    return ` Format this for the RENT CONTROLLER, CHENNAI under the Tamil Nadu Buildings (Lease and Rent Control) Act, 1960. Reference correct sections — Section 10 (eviction), Section 4 (fair rent), Section 14 (arrears). Include proper landlord/tenant designations, property schedule description, and Madras HC rent control precedents.`
  }
  if (court && court.startsWith('TN_')) {
    // Generic TN district court
    const distMap = {
      TN_CHENNAI: 'CHENNAI', TN_COIMBATORE: 'COIMBATORE', TN_MADURAI: 'MADURAI',
      TN_TRICHY: 'TIRUCHIRAPPALLI', TN_SALEM: 'SALEM', TN_TIRUNELVELI: 'TIRUNELVELI',
      TN_VELLORE: 'VELLORE', TN_ERODE: 'ERODE', TN_THANJAVUR: 'THANJAVUR', TN_DINDIGUL: 'DINDIGUL',
    }
    const dist = distMap[court] || court.replace('TN_', '')
    return ` Format this for the DISTRICT COURT, ${dist}, TAMIL NADU. Apply Tamil Nadu-specific procedural rules, CPC/CrPC provisions, and relevant Tamil Nadu state statutes. Reference Madras HC and appropriate District Court precedents. Use standard Tamil Nadu District Court formatting with proper case title and stamp block.`
  }

  // ── Supreme Court ─────────────────────────────────────────────
  if (court === 'SUPREME_COURT') {
    return ` Format this strictly for the SUPREME COURT OF INDIA. Cause title must begin "IN THE SUPREME COURT OF INDIA, [CIVIL/CRIMINAL] ORIGINAL/APPELLATE JURISDICTION". Apply Supreme Court Rules, 2013. For Article 32 petitions use "WRIT PETITION (C/CRL.) NO. ___ OF [YEAR] UNDER ARTICLE 32 OF THE CONSTITUTION OF INDIA". For SLPs use "SPECIAL LEAVE PETITION (C/CRL.) NO. ___ OF [YEAR] UNDER ARTICLE 136". Include synopsis, list of dates, statement of facts, questions of law, grounds, prayer, and Advocate-on-Record signature block. Cite Supreme Court precedents extensively.`
  }

  // ── All-India High Courts (generic addendum, state-specific bench) ─
  const HC_INFO = {
    BOMBAY_HC:             { name: 'HIGH COURT OF JUDICATURE AT BOMBAY',                state: 'Maharashtra',     rules: 'Bombay HC (OS) Rules and Bombay HC Appellate Side Rules' },
    BOMBAY_HC_AURANGABAD:  { name: 'BOMBAY HIGH COURT, AURANGABAD BENCH',                 state: 'Maharashtra',     rules: 'Bombay HC Appellate Side Rules' },
    BOMBAY_HC_NAGPUR:      { name: 'BOMBAY HIGH COURT, NAGPUR BENCH',                     state: 'Maharashtra',     rules: 'Bombay HC Appellate Side Rules' },
    BOMBAY_HC_GOA:         { name: 'BOMBAY HIGH COURT, PANAJI (GOA) BENCH',               state: 'Goa',             rules: 'Bombay HC Goa Bench Rules' },
    CALCUTTA_HC:           { name: 'HIGH COURT OF CALCUTTA',                              state: 'West Bengal',     rules: 'Calcutta HC Rules' },
    CALCUTTA_HC_PORTBLAIR: { name: 'CALCUTTA HC, PORT BLAIR CIRCUIT BENCH',                state: 'A&N Islands',     rules: 'Calcutta HC Rules' },
    MADRAS_HC_FULL:        { name: 'HIGH COURT OF JUDICATURE AT MADRAS',                  state: 'Tamil Nadu',      rules: 'Madras HC Rules 1994' },
    MADURAI_BENCH_FULL:    { name: 'HIGH COURT OF JUDICATURE AT MADRAS — MADURAI BENCH',  state: 'Tamil Nadu',      rules: 'Madras HC Rules 1994' },
    DELHI_HC:              { name: 'HIGH COURT OF DELHI AT NEW DELHI',                    state: 'Delhi',           rules: 'Delhi HC (Original Side) Rules and Delhi HC Rules' },
    KARNATAKA_HC:          { name: 'HIGH COURT OF KARNATAKA AT BENGALURU',                state: 'Karnataka',       rules: 'Karnataka HC Rules' },
    KARNATAKA_HC_DHARWAD:  { name: 'HIGH COURT OF KARNATAKA, DHARWAD BENCH',              state: 'Karnataka',       rules: 'Karnataka HC Rules' },
    KARNATAKA_HC_KALABURAGI:{ name: 'HIGH COURT OF KARNATAKA, KALABURAGI BENCH',          state: 'Karnataka',       rules: 'Karnataka HC Rules' },
    KERALA_HC:             { name: 'HIGH COURT OF KERALA AT ERNAKULAM',                   state: 'Kerala',          rules: 'Kerala HC Rules' },
    TELANGANA_HC:          { name: 'HIGH COURT FOR THE STATE OF TELANGANA AT HYDERABAD',  state: 'Telangana',       rules: 'Telangana HC Rules' },
    ANDHRA_HC:             { name: 'HIGH COURT OF ANDHRA PRADESH AT AMARAVATI',           state: 'Andhra Pradesh',  rules: 'Andhra Pradesh HC Rules' },
    GUJARAT_HC:            { name: 'HIGH COURT OF GUJARAT AT AHMEDABAD',                  state: 'Gujarat',         rules: 'Gujarat HC Rules' },
    PUNJAB_HARYANA_HC:     { name: 'PUNJAB AND HARYANA HIGH COURT AT CHANDIGARH',         state: 'Punjab/Haryana',  rules: 'Punjab and Haryana HC Rules' },
    RAJASTHAN_HC:          { name: 'HIGH COURT OF RAJASTHAN AT JODHPUR',                  state: 'Rajasthan',       rules: 'Rajasthan HC Rules' },
    RAJASTHAN_HC_JAIPUR:   { name: 'HIGH COURT OF RAJASTHAN, JAIPUR BENCH',                state: 'Rajasthan',       rules: 'Rajasthan HC Rules' },
    MP_HC:                 { name: 'HIGH COURT OF MADHYA PRADESH AT JABALPUR',            state: 'Madhya Pradesh',  rules: 'MP HC Rules' },
    MP_HC_INDORE:          { name: 'MP HIGH COURT, INDORE BENCH',                          state: 'Madhya Pradesh',  rules: 'MP HC Rules' },
    MP_HC_GWALIOR:         { name: 'MP HIGH COURT, GWALIOR BENCH',                         state: 'Madhya Pradesh',  rules: 'MP HC Rules' },
    PATNA_HC:              { name: 'HIGH COURT OF JUDICATURE AT PATNA',                    state: 'Bihar',           rules: 'Patna HC Rules' },
    JHARKHAND_HC:          { name: 'HIGH COURT OF JHARKHAND AT RANCHI',                    state: 'Jharkhand',       rules: 'Jharkhand HC Rules' },
    ORISSA_HC:             { name: 'HIGH COURT OF ORISSA AT CUTTACK',                      state: 'Odisha',          rules: 'Orissa HC Rules' },
    CHHATTISGARH_HC:       { name: 'HIGH COURT OF CHHATTISGARH AT BILASPUR',               state: 'Chhattisgarh',    rules: 'Chhattisgarh HC Rules' },
    UTTARAKHAND_HC:        { name: 'HIGH COURT OF UTTARAKHAND AT NAINITAL',                state: 'Uttarakhand',     rules: 'Uttarakhand HC Rules' },
    HP_HC:                 { name: 'HIGH COURT OF HIMACHAL PRADESH AT SHIMLA',             state: 'Himachal Pradesh',rules: 'HP HC Rules' },
    JK_HC:                 { name: 'HIGH COURT OF J&K AND LADAKH',                          state: 'J&K / Ladakh',    rules: 'J&K HC Rules' },
    SIKKIM_HC:             { name: 'HIGH COURT OF SIKKIM AT GANGTOK',                      state: 'Sikkim',          rules: 'Sikkim HC Rules' },
    TRIPURA_HC:            { name: 'HIGH COURT OF TRIPURA AT AGARTALA',                    state: 'Tripura',         rules: 'Tripura HC Rules' },
    MEGHALAYA_HC:          { name: 'HIGH COURT OF MEGHALAYA AT SHILLONG',                  state: 'Meghalaya',       rules: 'Meghalaya HC Rules' },
    MANIPUR_HC:            { name: 'HIGH COURT OF MANIPUR AT IMPHAL',                      state: 'Manipur',         rules: 'Manipur HC Rules' },
    GAUHATI_HC:            { name: 'HIGH COURT OF GAUHATI AT GUWAHATI',                    state: 'Assam',           rules: 'Gauhati HC Rules' },
    GAUHATI_HC_AIZAWL:     { name: 'GAUHATI HIGH COURT, AIZAWL BENCH',                      state: 'Mizoram',         rules: 'Gauhati HC Rules' },
    GAUHATI_HC_KOHIMA:     { name: 'GAUHATI HIGH COURT, KOHIMA BENCH',                      state: 'Nagaland',        rules: 'Gauhati HC Rules' },
    GAUHATI_HC_ITANAGAR:   { name: 'GAUHATI HIGH COURT, ITANAGAR BENCH',                    state: 'Arunachal Pradesh', rules: 'Gauhati HC Rules' },
  }
  if (HC_INFO[court]) {
    const hc = HC_INFO[court]
    return ` Format this strictly for the ${hc.name}. Cause title must begin "IN THE ${hc.name}". Apply ${hc.rules} and the Code of Civil/Criminal Procedure as applicable. For writs use the appropriate State HC writ classification. Reference state-specific statutes for ${hc.state} and binding precedents of the ${hc.name} and the Supreme Court of India. End with proper prayer ending, verification clause, and advocate signature block with relevant State Bar Council enrollment number.`
  }

  // ── Tribunals ─────────────────────────────────────────────────
  const TRIBUNAL_INFO = {
    NCLT:  'NATIONAL COMPANY LAW TRIBUNAL — apply the Companies Act 2013 and IBC 2016. Use NCLT Rules 2016. Cause title: "BEFORE THE NATIONAL COMPANY LAW TRIBUNAL, [BENCH], AT [CITY]".',
    NCLAT: 'NATIONAL COMPANY LAW APPELLATE TRIBUNAL — appellate jurisdiction over NCLT and CCI orders. Apply Companies Act 2013 and IBC 2016. Cause title: "BEFORE THE NATIONAL COMPANY LAW APPELLATE TRIBUNAL, NEW DELHI".',
    ITAT:  'INCOME TAX APPELLATE TRIBUNAL — apply the Income-tax Act 1961, Rules and ITAT Rules 1963. Cause title: "BEFORE THE INCOME TAX APPELLATE TRIBUNAL, [BENCH]".',
    GSTAT: 'GST APPELLATE TRIBUNAL — apply the CGST/SGST Acts 2017. Cause title: "BEFORE THE GST APPELLATE TRIBUNAL, [BENCH]".',
    AFT:   'ARMED FORCES TRIBUNAL — apply the Army Act, Navy Act, Air Force Act and AFT Act 2007. Cause title: "BEFORE THE ARMED FORCES TRIBUNAL, [REGIONAL BENCH]".',
    NGT:   'NATIONAL GREEN TRIBUNAL — apply the NGT Act 2010, Environment (Protection) Act 1986, Air/Water Acts, Forest Conservation Act. Cause title: "BEFORE THE NATIONAL GREEN TRIBUNAL, [BENCH]".',
    CAT:   'CENTRAL ADMINISTRATIVE TRIBUNAL — apply the Administrative Tribunals Act 1985 and service-law jurisprudence. Cause title: "BEFORE THE CENTRAL ADMINISTRATIVE TRIBUNAL, [BENCH]".',
    DRT:   'DEBTS RECOVERY TRIBUNAL — apply the RDB Act 1993 and SARFAESI Act 2002. Cause title: "BEFORE THE DEBTS RECOVERY TRIBUNAL, [LOCATION]".',
    SAT:   'SECURITIES APPELLATE TRIBUNAL — appeals from SEBI, IRDAI, PFRDA. Apply SEBI Act 1992. Cause title: "BEFORE THE SECURITIES APPELLATE TRIBUNAL, MUMBAI".',
    CCI:   'COMPETITION COMMISSION OF INDIA — apply the Competition Act 2002 and CCI Regulations. Cause title: "BEFORE THE COMPETITION COMMISSION OF INDIA, NEW DELHI".',
    NCDRC: 'NATIONAL CONSUMER DISPUTES REDRESSAL COMMISSION — apply the Consumer Protection Act 2019. Cause title: "BEFORE THE NATIONAL CONSUMER DISPUTES REDRESSAL COMMISSION, NEW DELHI".',
    TDSAT: 'TELECOM DISPUTES SETTLEMENT AND APPELLATE TRIBUNAL — apply the TRAI Act 1997. Cause title: "BEFORE THE TELECOM DISPUTES SETTLEMENT AND APPELLATE TRIBUNAL, NEW DELHI".',
  }
  if (TRIBUNAL_INFO[court]) {
    return ` Format this for the ${TRIBUNAL_INFO[court]} Include parties, jurisdiction clause, statement of facts, grounds, prayer, and the appropriate authorised representative signature block.`
  }

  // ── Tribunal benches (NCLT_DELHI, ITAT_MUMBAI, AFT_KOLKATA, etc.) ──
  // The bare tribunal forms are handled by TRIBUNAL_INFO above; this
  // catches the per-bench variants generated by india-data.js.
  const TRIBUNAL_PREFIXES = ['NCLT', 'NCLAT', 'ITAT', 'AFT', 'NGT', 'CAT', 'DRT', 'DRAT', 'GSTAT']
  for (const tp of TRIBUNAL_PREFIXES) {
    if (court === tp || court.startsWith(tp + '_')) {
      const bench = court === tp ? '' : court.slice(tp.length + 1).replace(/_/g, ' ')
      const baseInfo = TRIBUNAL_INFO[tp] || `${tp} — apply the relevant statute and bench rules.`
      return ` Format this for the ${baseInfo}${bench ? ` Bench: ${bench}.` : ''} Include parties, jurisdiction clause, statement of facts, grounds, prayer, and the appropriate authorised representative signature block.`
    }
  }

  // ── All-India state laws (every state and UT) ───────────────────
  // Used for state-specialised courts (Family / Labour / Consumer / Rent)
  // and for any old-style `<STATE>_<DIST>` district court values.
  const STATE_LAWS = {
    AP: { name: 'Andhra Pradesh',     laws: 'CPC, CrPC, AP (Telangana Areas) Tenancy Act, AP Rent Control, AP Stamp Act, AP Revenue Recovery Act' },
    AR: { name: 'Arunachal Pradesh',  laws: 'CPC, CrPC, Arunachal Pradesh Anchal Forest Reserve Act, AP customary laws' },
    AS: { name: 'Assam',              laws: 'CPC, CrPC, Assam Urban Areas Rent Control Act, Assam Stamp Act' },
    BR: { name: 'Bihar',              laws: 'CPC, CrPC, Bihar Buildings (Lease, Rent and Eviction) Control Act 1982, Bihar Stamp Act' },
    CG: { name: 'Chhattisgarh',       laws: 'CPC, CrPC, Chhattisgarh Rent Control Act, Chhattisgarh Stamp Act' },
    GA: { name: 'Goa',                laws: 'CPC, CrPC, Goa, Daman and Diu Rent Control Act 1968, Goa Stamp Act' },
    GJ: { name: 'Gujarat',            laws: 'CPC, CrPC, Gujarat Rent Act 2011, Gujarat Stamp Act' },
    HR: { name: 'Haryana',            laws: 'CPC, CrPC, Haryana Urban (Control of Rent and Eviction) Act 1973, Punjab Stamp Act (as applied to Haryana)' },
    HP: { name: 'Himachal Pradesh',   laws: 'CPC, CrPC, HP Urban Rent Control Act 1987, HP Stamp Act' },
    JH: { name: 'Jharkhand',          laws: 'CPC, CrPC, Jharkhand Buildings (Lease, Rent and Eviction) Control Act, Jharkhand Stamp Act' },
    KA: { name: 'Karnataka',          laws: 'CPC, CrPC, Karnataka Rent Act 1999, Karnataka Co-op Societies Act, Karnataka Stamp Act' },
    KL: { name: 'Kerala',             laws: 'CPC, CrPC, Kerala Buildings (Lease and Rent Control) Act 1965, Kerala Stamp Act, Kerala Land Reforms Act' },
    MP: { name: 'Madhya Pradesh',     laws: 'CPC, CrPC, MP Accommodation Control Act 1961, MP Stamp Act' },
    MH: { name: 'Maharashtra',        laws: 'CPC, CrPC, Maharashtra Rent Control Act 1999, Maharashtra Co-op Societies Act, Bombay Stamp Act' },
    MN: { name: 'Manipur',            laws: 'CPC, CrPC, Manipur Rent Control Act, Manipur Stamp Act' },
    ML: { name: 'Meghalaya',          laws: 'CPC, CrPC, Meghalaya Land Transfer Act, Meghalaya Stamp Act' },
    MZ: { name: 'Mizoram',            laws: 'CPC, CrPC, Mizoram Buildings Rent Control Act, Mizoram Stamp Act' },
    NL: { name: 'Nagaland',           laws: 'CPC, CrPC, Nagaland Rent Control Act, Nagaland customary laws' },
    OD: { name: 'Odisha',             laws: 'CPC, CrPC, Odisha House Rent Control Act 1967, Odisha Stamp Act' },
    PB: { name: 'Punjab',             laws: 'CPC, CrPC, East Punjab Urban Rent Restriction Act 1949, Punjab Stamp Act' },
    RJ: { name: 'Rajasthan',          laws: 'CPC, CrPC, Rajasthan Rent Control Act 2001, Rajasthan Stamp Act, Rajasthan Tenancy Act' },
    SK: { name: 'Sikkim',             laws: 'CPC, CrPC, Sikkim Rent Control Act, Sikkim Stamp Act' },
    TN: { name: 'Tamil Nadu',         laws: 'CPC, CrPC, Tamil Nadu Buildings (Lease and Rent Control) Act 1960, Tamil Nadu Stamp Act' },
    TG: { name: 'Telangana',          laws: 'CPC, CrPC, Telangana Buildings (Lease, Rent and Eviction) Control Act, Telangana Stamp Act' },
    TR: { name: 'Tripura',            laws: 'CPC, CrPC, Tripura Buildings (Lease and Rent Control) Act, Tripura Stamp Act' },
    UP: { name: 'Uttar Pradesh',      laws: 'CPC, CrPC, UP Urban Buildings (Regulation of Letting, Rent and Eviction) Act 1972, UP Stamp Act, UP Zamindari Abolition Act' },
    UK: { name: 'Uttarakhand',        laws: 'CPC, CrPC, Uttarakhand Rent Control Act, Uttarakhand Stamp Act' },
    WB: { name: 'West Bengal',        laws: 'CPC, CrPC, West Bengal Premises Tenancy Act 1997, West Bengal Stamp Act' },
    AN: { name: 'Andaman & Nicobar',  laws: 'CPC, CrPC, A&N Buildings (Lease and Rent Control) Regulation, Indian Stamp Act' },
    CH: { name: 'Chandigarh',         laws: 'CPC, CrPC, Chandigarh (Tenancy) Act, Punjab Stamp Act (as applied to Chandigarh)' },
    DN: { name: 'Dadra & Nagar Haveli and Daman & Diu', laws: 'CPC, CrPC, Goa, Daman and Diu Rent Control Act 1968, Indian Stamp Act' },
    DL: { name: 'Delhi',              laws: 'CPC, CrPC, Delhi Rent Control Act 1958, Delhi Stamp Act' },
    JK: { name: 'Jammu & Kashmir',    laws: 'CPC, CrPC, J&K Houses and Shops Rent Control Act, J&K Stamp Act' },
    LA: { name: 'Ladakh',             laws: 'CPC, CrPC, Ladakh-applicable Central Acts, Indian Stamp Act' },
    LD: { name: 'Lakshadweep',        laws: 'CPC, CrPC, Lakshadweep Land Revenue and Tenancy Regulation, Indian Stamp Act' },
    PY: { name: 'Puducherry',         laws: 'CPC, CrPC, Puducherry Buildings (Lease and Rent Control) Act, Puducherry Stamp Act' },
  }

  // ── DC_<STATE>_<DISTRICT> — pan-India district & sessions courts ──
  // This is the auto-generated form used by india-data.js / buildDistrictCourts.
  if (court.startsWith('DC_')) {
    const rest      = court.slice(3) // strip "DC_"
    const stateCode = rest.split('_')[0]
    const district  = rest.slice(stateCode.length + 1).replace(/_/g, ' ')
    const sl        = STATE_LAWS[stateCode]
    if (sl) {
      return ` Format this for the DISTRICT & SESSIONS COURT, ${district.toUpperCase()} (${sl.name}). Apply ${sl.laws}. Reference precedents of the High Court having appellate jurisdiction over ${sl.name} and the Supreme Court of India. Use standard district court formatting — full case title, party particulars, numbered "That..." paragraphs, prayer clause, verification, and advocate signature block with the relevant State Bar Council enrollment number.`
    }
    return ` Format this for the DISTRICT & SESSIONS COURT, ${district.toUpperCase()}. Apply CPC, CrPC and the relevant state-specific laws. Use standard district court formatting.`
  }

  // ── State-specialised courts: FAMILY_<S>, LABOUR_<S>, CONSUMER_<S>,
  //    RENT_<S>, STATE_CONSUMER_<S> ──────────────────────────────────
  const SPECIAL_PREFIXES = {
    FAMILY:          { label: 'FAMILY COURT',                                            statute: 'Family Courts Act 1984 with Hindu Marriage Act 1955 / Special Marriage Act 1954 / Hindu Succession Act 1956 / Hindu Adoption and Maintenance Act 1956 as relevant. Include reconciliation reference.' },
    LABOUR:          { label: 'LABOUR COURT',                                            statute: 'Industrial Disputes Act 1947 with applicable State Industrial Disputes Rules. Use workman/employer designations.' },
    CONSUMER:        { label: 'DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION',         statute: 'Consumer Protection Act 2019 (Section 35 jurisdiction up to Rs. 1 crore). Include complainant/opposite party designations and Section 39 reliefs.' },
    RENT:            { label: 'RENT CONTROLLER',                                         statute: 'the applicable State Rent Control Act. Include landlord/tenant designations and property schedule.' },
    STATE_CONSUMER:  { label: 'STATE CONSUMER DISPUTES REDRESSAL COMMISSION',            statute: 'Consumer Protection Act 2019 (State Commission jurisdiction Rs. 1 crore – Rs. 10 crore, plus appeals from District Commission). Include complainant/opposite party designations.' },
  }
  for (const sp of Object.keys(SPECIAL_PREFIXES)) {
    if (court === sp || court.startsWith(sp + '_')) {
      const stateCode = court === sp ? '' : court.slice(sp.length + 1)
      const sl        = STATE_LAWS[stateCode]
      const def       = SPECIAL_PREFIXES[sp]
      if (sl) {
        return ` Format this for the ${def.label}, ${sl.name}. Apply ${def.statute} Apply ${sl.laws}. Reference precedents of the High Court having jurisdiction over ${sl.name} and the Supreme Court of India.`
      }
      // Fallback if state code not recognised — still produce a sensible header.
      return ` Format this for the ${def.label}. Apply ${def.statute}`
    }
  }

  // ── Old/legacy generic state district code prefixes (kept for back-compat) ──
  const stateMap = {
    MH: 'Maharashtra (CPC, CrPC, Maharashtra Rent Control Act 1999, Maharashtra Co-op Societies Act, Bombay Stamp Act)',
    KA: 'Karnataka (CPC, CrPC, Karnataka Rent Act 1999, Karnataka Co-op Societies Act, Karnataka Stamp Act)',
    TG: 'Telangana (CPC, CrPC, Telangana Rent Control Act, Telangana Stamp Act)',
    PB: 'Punjab (CPC, CrPC, East Punjab Urban Rent Restriction Act 1949, Punjab Stamp Act)',
    KL: 'Kerala (CPC, CrPC, Kerala Buildings (Lease and Rent Control) Act 1965, Kerala Stamp Act, Kerala Land Reforms Act)',
    AS: 'Assam (CPC, CrPC, Assam Urban Areas Rent Control Act, Assam Stamp Act)',
  }
  for (const prefix of Object.keys(stateMap)) {
    if (court && court.startsWith(prefix + '_')) {
      const niceName = court.replace(prefix + '_', '').replace(/_/g, ' ')
      return ` Format this for the ${niceName.toUpperCase()} (${stateMap[prefix].split(' (')[0]} state district / city court). Apply ${stateMap[prefix]}. Reference the relevant State High Court precedents and use standard district / metropolitan court formatting with proper case title and stamp block.`
    }
  }

  return ''
}

// ─── Language addendum ────────────────────────────────────────────
// Compact per-language drafting instruction. The court VOCABULARY for each
// language now lives in lib/legal-dictionary.js (buildLanguageLexicon), so
// it is maintained in one place and this block stays small — the previous
// inline Devanagari block alone cost ~1,300 prompt tokens, which starved
// the document's own output budget on a free Groq key.
const LANGUAGE_NAMES = {
  hindi:  'Hindi (Devanagari script)',
  urdu:   'Urdu (Nastaliq script)',
  tamil:  'Tamil (Tamil script)',
  telugu: 'Telugu (Telugu script)',
}

function languageAddendum(language) {
  if (language === 'bilingual') {
    return ` DUAL-LANGUAGE FORMAT: draft the main body, facts, grounds and analysis in formal court ENGLISH. The cause title, subject line, prayer, verification and any affidavit declaration MUST additionally appear in court-standard Hindi (Devanagari) immediately below their English version, marked "(हिन्दी अनुवाद)". Statutory citations stay in English in BOTH versions. Reproduce names, dates, addresses, amounts and section numbers exactly in both versions, without transliteration.`
  }
  const name = LANGUAGE_NAMES[language]
  if (!name) return ''
  return `
═══════ MANDATORY LANGUAGE — ${name.toUpperCase()} ═══════
Write the ENTIRE document in ${name}. This is absolute and overrides the language of these instructions (which are in English only because they are instructions).
- EVERY part is in ${name}: the court/cause title, the party designations, each numbered averment, the grounds, the prayer, the verification and the signature block.
- NEVER drift back into English mid-document. Producing the opening in ${name} and then continuing in English is a failure — re-read your last line before each new paragraph and continue in ${name}.
- The ONLY text that stays in English/Roman script is: Act names, section/article numbers, case citations, and proper nouns/figures the user supplied (names, addresses, dates, amounts, case and FIR numbers) — reproduce those exactly, never transliterated.
- Use the register actually used in Indian courts and government offices for this language: formal and respectful, neither archaic nor colloquial. Do not write whole paragraphs in capitals.
═══════ END MANDATORY LANGUAGE ═══════`
}

// ─── Base prompts per document type ───────────────────────────────
// Each prompt establishes the Senior Advocate persona. The SUPREME_COURT_STYLE
// addendum (defined below) is appended automatically by buildSystemPrompt().
const BASE_PROMPTS = {
  LEGAL_NOTICE: `You are a Senior Advocate with 30 years of practice, renowned for drafting legal notices that command immediate compliance. CRITICAL — PRE-LITIGATION DOCUMENT: A legal notice is dispatched BEFORE any court proceedings are initiated. It is a demand letter, not a court pleading. Therefore: (a) DO NOT name or reference any specific court, High Court, bench, or tribunal in the notice body; (b) where future proceedings are threatened, use only "competent court/forum of appropriate jurisdiction" or "appropriate legal forum as permissible under law"; (c) DO NOT include court-specific headers such as "IN THE HIGH COURT OF JUDICATURE AT ALLAHABAD" — those belong in petitions, not notices. LANGUAGE: Transform the user's description — however informally written — into precise, elevated legal English. The user writes in plain language; you render it in the formal vocabulary of the Indian Bar. AUTO-SUPPLY SECTIONS: Identify and cite the correct statutory provisions based on the subject matter (e.g., Section 138 NI Act for cheque dishonour, Section 420 IPC / BNS 318 for fraud, Consumer Protection Act 2019 for service deficiency, etc.) — the user need not specify them. Draft a complete, impeccably formatted Legal Notice. Structure: (1) Advocate's office letterhead with full address and Bar Council enrollment number, (2) Date formatted as "the [Day] day of [Month], [Year]", (3) "BY SPEED POST / REGISTERED POST AD" header, (4) Addressee block — full name, designation, address, (5) "SUBJECT:" line in capitals, (6) Opening: "NOTICE", followed by "Under instructions from and on behalf of my client, [Client Name], I hereby issue this notice unto you as under:", (7) Numbered "FACTS" paragraphs — chronological, legally precise, each beginning "That...", (8) "LEGAL BASIS" — cite specific sections of applicable Indian law with sub-sections (identify these from the facts even if the user did not supply them), (9) "DEMAND" — clear, specific, unambiguous relief demanded, (10) "TIME LIMIT" — use the statutory deadline if one applies (15 days for cheque bounce u/s 138 NI Act; otherwise 15 days from receipt as the professional standard) with exact consequence: "failing which my client shall be constrained to initiate appropriate civil/criminal proceedings before the competent court/forum of appropriate jurisdiction without further notice, and the costs thereof shall be borne entirely by you", (11) "PRE-LITIGATION MEDIATION" — where the dispute is commercial and of value Rs. 3 lakh or above, offer pre-litigation mediation under the Mediation Act 2023 read with Section 12A of the Commercial Courts Act 2015, (12) Reservation of all rights clause, (13) Advocate signature block with State Bar Council enrollment number. Write all section headings in ALL CAPS on their own line — no asterisks, no bold markers, no markdown. Use elevated legal vocabulary throughout.`,

  CASE_BRIEF: `You are a Senior Advocate and eminent legal scholar who has argued before the Constitution Bench of the Supreme Court of India. LANGUAGE TRANSFORMATION: The user may provide facts and arguments in plain or informal language. Transform every description into precise, rigorous legal analysis using the vocabulary and analytical rigour of a Supreme Court Senior Advocate. AUTO-SUPPLY APPLICABLE LAW: Identify all relevant constitutional provisions, statutes, and binding precedents based on the facts — the user need not specify them. Draft a comprehensive, analytically rigorous Case Brief employing the strict IRAC methodology as adopted by the Supreme Court of India. Structure: (I) CASE IDENTIFICATION — full case title, court name, case number, bench composition, date of judgment, coram; (II) MATERIAL FACTS — numbered, chronological, distinguishing between admitted facts and disputed facts; (III) PROCEDURAL HISTORY — how the matter travelled through courts; (IV) QUESTIONS OF LAW — precisely framed, as the court would frame them; (V) RULE/LAW APPLIED — constitutional provisions, statutes with sections, binding precedents, legal principles; (VI) ARGUMENTS FOR PETITIONER/APPELLANT — point-wise, with ratio from supporting precedents; (VII) ARGUMENTS FOR RESPONDENT — counter-arguments with supporting authority; (VIII) ANALYSIS — application of ratio decidendi to facts, distinguishing contrary precedents; (IX) HELD — verbatim core holding; (X) OBITER DICTA — significant observations not essential to decision; (XI) CONCLUSION — practical implications and precedential value. CITATIONS: cite as many real, on-point Supreme Court / High Court precedents as actually exist for the issue — landmark issues warrant 5+ citations; narrow points may warrant only 1-2. One genuinely on-point precedent beats five weakly relevant ones. NEVER fabricate to hit a number — the FIDELITY MANDATE governs. Write all section headings (CASE IDENTIFICATION, MATERIAL FACTS, QUESTIONS OF LAW, ANALYSIS, HELD, CONCLUSION, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  CONTRACT: `You are an eminent contract lawyer, former Additional Solicitor General of India. LANGUAGE TRANSFORMATION: Convert any plain or informal description of terms and obligations into precise contractual language. AUTO-SUPPLY APPLICABLE LAW: Automatically incorporate the correct provisions of the Indian Contract Act 1872, Specific Relief Act 1963, DPDP Act 2023, and other relevant statutes based on the contract type — the user need not specify sections. with expertise in commercial contracts under the Indian Contract Act, 1872 and the Specific Relief Act, 1963 (as amended in 2018). Draft a comprehensive, enforceable Contract that will withstand judicial scrutiny. Structure: (1) Indenture opening: "THIS AGREEMENT/CONTRACT is entered into on the [Day] day of [Month], [Year] AT [Place] BETWEEN:", (2) Parties — described with full legal particulars, hereinafter referred to as "FIRST PARTY/SECOND PARTY" or specific designations; (3) RECITALS / WHEREAS CLAUSES — background, consideration, intent; (4) DEFINITIONS — exhaustive definitional clause; (5) SCOPE OF AGREEMENT — precise obligations of each party; (6) CONSIDERATION AND PAYMENT TERMS — amount in words and figures, schedule, mode; (7) REPRESENTATIONS AND WARRANTIES — by each party; (8) COVENANTS — affirmative and negative covenants; (9) INDEMNIFICATION AND HOLD HARMLESS — mutual indemnity for breach; (10) LIMITATION OF LIABILITY — extent and caps; (11) CONFIDENTIALITY AND NON-DISCLOSURE — perpetual obligations; (12) DATA PROTECTION (DPDP ACT 2023) — where personal data is exchanged or processed, include a clause stating the lawful basis (consent / legitimate use), purpose limitation, retention period, and the obligations of each party as Data Fiduciary or Data Processor under the Digital Personal Data Protection Act 2023; (13) INTELLECTUAL PROPERTY — ownership and licensing; (14) FORCE MAJEURE — listing events including epidemic/government action, notification requirements, consequences (Energy Watchdog v. CERC line of cases); (15) TERMINATION — with cause and without cause provisions, notice requirements; (16) PRE-LITIGATION MEDIATION — for commercial disputes valued at Rs. 3 lakh or above, include a Section 12A Commercial Courts Act 2015 / Mediation Act 2023 pre-suit mediation clause unless urgent interim relief is sought; (17) DISPUTE RESOLUTION — arbitration under the Arbitration and Conciliation Act 1996 (as amended 2015/2019/2021) with seat, language, number of arbitrators, and institutional vs ad-hoc choice specified; (18) GOVERNING LAW AND JURISDICTION; (19) ENTIRE AGREEMENT / MERGER CLAUSE; (20) SEVERABILITY; (21) AMENDMENTS — must be in writing signed by both parties; (22) STAMP DUTY — note that stamp duty is payable as per the Stamp Act of the State of execution (use a "[STAMP DUTY — TO BE FILLED PER STATE]" placeholder rather than inventing a figure; e-stamping where available); (23) EXECUTION — signature blocks with witness attestation lines. Draft to be balanced, commercially sensible and enforceable.`,

  PETITION: `You are a Senior Advocate on the rolls of the Supreme Court of India with extensive experience in constitutional and civil litigation. LANGUAGE TRANSFORMATION: The user may describe their dispute in plain language. Convert every fact and ground into precise pleading language using "That..." paragraph form. AUTO-SUPPLY APPLICABLE LAW: Identify the correct CPC provisions, limitation grounds, and cause of action from the facts — the user need not specify them. Draft a formal, court-ready Civil Petition/Plaint meeting the requirements of Order VII Rule 1 of the Code of Civil Procedure, 1908. Structure: (1) Court header in ALL CAPS on its own line; (2) Case number block — "CIVIL SUIT/CASE NO. _____ OF [YEAR]"; (3) CAUSE TITLE — Petitioner/Plaintiff (with description) v. Respondent/Defendant (with description); (4) "IN THE MATTER OF: A petition/plaint under [relevant provision] for [relief]"; (5) JURISDICTION — territorial, pecuniary, subject-matter jurisdiction established with statutory basis; (6) PARTIES — full description, locus standi explained; (7) STATEMENT OF FACTS — numbered paragraphs, each beginning "That...", chronological, legally precise; (8) CAUSE OF ACTION — "The cause of action arose on [date] when...", establishing limitation under Limitation Act, 1963; (9) VALUATION AND COURT FEES — as per Court Fees Act; (10) GROUNDS — numbered, citing statutes, constitutional provisions, and Supreme Court/HC precedents; (11) PRAYER — comprehensive, specific orders sought, including interim relief; (12) UNDERTAKING — counsel's undertaking as to accuracy; (13) VERIFICATION — mandatory under CPC; (14) LIST OF DOCUMENTS/ANNEXURES; (15) Advocate signature block.`,

  MEMORANDUM: `You are a Senior Partner at a premier Indian law firm, former law clerk to a Supreme Court judge. LANGUAGE TRANSFORMATION: Transform the user's plain-language description of the legal issue into formal legal analysis. AUTO-SUPPLY APPLICABLE LAW: Identify the correct statutes, constitutional provisions, and precedents relevant to the legal question — the user need not supply the sections. with unparalleled expertise in legal opinion writing. Draft a formal Legal Memorandum of the highest analytical quality. Structure: (1) MEMORANDUM HEADING — strictly formatted: "PRIVILEGED AND CONFIDENTIAL — ATTORNEY-CLIENT COMMUNICATION"; (2) TO/FROM/DATE/RE block; (3) EXECUTIVE SUMMARY — authoritative answer to the legal question in 3–4 sentences, stating the conclusion upfront; (4) BACKGROUND AND FACTS — as furnished by the instructing party (no independent verification); (5) DOCUMENTS CONSIDERED — exhaustive list of materials reviewed; (6) LEGAL FRAMEWORK — applicable constitutional provisions, statutes, rules, notifications; (7) LEGAL ANALYSIS — structured IRAC for each sub-issue: Rule of Law → Application to Facts → Counter-arguments → Conclusion on each issue; (8) RELEVANT PRECEDENTS — cite as many real, on-point Supreme Court / HC judgments as actually exist for each issue (typical range 2-5 for substantive issues; 1 may be enough for a narrow point) with proper neutral citations and one-sentence ratio. Quality over count; (9) RISK ASSESSMENT — categorized High/Medium/Low with reasoning; (10) CONCLUSION — definitive legal opinion; (11) RECOMMENDATIONS — numbered, actionable, practical steps; (12) CAVEAT — "This opinion is rendered on the basis of the law as it stands on the date hereof and the facts as furnished. It is for the exclusive and confidential use of the addressee."; (13) Senior Advocate signature with qualifications and enrollment number. Write all section headings (EXECUTIVE SUMMARY, BACKGROUND AND FACTS, LEGAL FRAMEWORK, LEGAL ANALYSIS, RISK ASSESSMENT, CONCLUSION, RECOMMENDATIONS, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  WRIT_PETITION: `You are a distinguished Senior Advocate, designated by the Supreme Court of India, with decades of practice before Constitutional Benches of High Courts across India. LANGUAGE TRANSFORMATION: Transform any plain-language description of facts or grievances into formal writ-petition language using "That..." paragraph form with proper constitutional and statutory grounds. AUTO-SUPPLY APPLICABLE LAW: Identify and cite the applicable constitutional articles (14, 19, 21, 226, etc.) and statutory provisions based on the facts — the user need not specify them. Draft a complete Writ Petition under Article 226 of the Constitution of India of the highest professional calibre. COURT-SPECIFIC FORMATTING: Use the court name, writ classification codes, and High Court Rules supplied in the court addendum below — do NOT default to any particular High Court unless specified. If no court is specified, use "[IN THE HIGH COURT OF JUDICATURE AT (COURT NAME)]" as a placeholder. Structure: (1) Court header in ALL CAPS on its own line using the correct court name from the addendum; (2) Writ Petition category and number block per the relevant High Court convention; (3) CAUSE TITLE — Petitioner (full description with age and address) VERSUS Respondents (State through Principal Secretary / relevant authority + other respondents numbered); (4) "WRIT PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA FOR THE ISSUE OF A WRIT OF [MANDAMUS/CERTIORARI/PROHIBITION/HABEAS CORPUS/QUO WARRANTO] OR ANY OTHER APPROPRIATE WRIT, ORDER OR DIRECTION"; (5) SYNOPSIS — brief narrative of injustice, not exceeding one page; (6) LIST OF DATES AND EVENTS — table format; (7) STATEMENT OF FACTS — numbered paragraphs, each beginning "That..."; (8) QUESTIONS OF LAW presented for adjudication; (9) GROUNDS — numbered, building from constitutional (Articles 14, 19, 21, 300-A) to statutory to equitable, each ground citing authoritative precedents; (10) PRAYER — "IN THE PREMISES AFORESTATED IT IS MOST RESPECTFULLY PRAYED THAT THIS HON'BLE COURT MAY GRACIOUSLY BE PLEASED TO:" followed by specific writs, interim relief (Rule NISI, stay, injunction), and costs; (11) INTERIM RELIEF APPLICATION with urgency grounds; (12) VERIFICATION under CPC Order VI Rule 15; (13) AFFIDAVIT in support; (14) Advocate signature with the relevant State Bar Council enrollment number. Apply the High Court Rules of the court specified in the court addendum.`,

  VAKALATNAMA: `You are a meticulous Senior Advocate with deep knowledge of the Advocates Act, 1961. LANGUAGE TRANSFORMATION: Cast all details into the formal, precise language of a vakalatnama as used before Indian courts. AUTO-SUPPLY APPLICABLE LAW: Include the correct Advocates Act and Bar Council Rule references automatically. the Bar Council of India Rules, and BCI Certificate of Practice Verification Rules 2024. Draft a legally impeccable Vakalatnama (Authority to Plead) that confers full authority on the advocate and is valid before all courts and tribunals. Structure: (1) Court name and case title in full; (2) "VAKALATNAMA" heading; (3) "KNOW ALL MEN BY THESE PRESENTS THAT I/WE, [Client Name(s)], son/daughter/wife of [Father/Husband Name], aged [X] years, resident of [Full Address], do hereby appoint, nominate, authorise and retain [Advocate Name], Advocate, enrolled on the rolls of the State Bar Council of [State] (Enrollment No.: [Number]; AOR No. if Supreme Court), to appear, plead, act and represent me/us in the above-captioned matter and all proceedings connected therewith including all applications, appeals, revisions and proceedings before any court, tribunal or authority, and to do all acts, deeds and things necessary for the conduct of the said case."; (4) SPECIFIC AUTHORITIES conferred — file applications, sign pleadings, engage junior counsel, accept service, compromise if so instructed in writing, withdraw, accept payment; (5) E-FILING AUTHORITY — express authority to file and sign electronically through the relevant court e-filing portal (e-Courts SCI app, JustIS HC portals, NCLT e-filing) using the Advocate's digital signature certificate; (6) RATIFICATION CLAUSE — "I/We agree to ratify and confirm all acts done by the said Advocate in pursuance of this authority"; (7) STAMP DUTY — duly stamped as per the Stamp Act of the State of execution. State-specific schedule applies (use a "[VAKALATNAMA STAMP — PER STATE SCHEDULE]" placeholder rather than inventing a figure; most states currently use Rs. 5-10 court-fee stamps for civil matters, additional stamp for revenue matters); (8) "IN WITNESS WHEREOF I/WE have signed/thumb-impressed this Vakalatnama on this [Day] day of [Month], [Year] at [Place]"; (9) Client signatures with witness attestation. Use the State Bar Council enrollment number matching the court specified in the court addendum.`,

  BAIL_APPLICATION: `You are an eminent criminal law advocate with 35 years of practice. LANGUAGE TRANSFORMATION: Convert any plain-language description of the applicant's circumstances into formal bail-application language with "That..." paragraphs. AUTO-SUPPLY APPLICABLE LAW: Automatically cite the correct CrPC/BNSS sections (depending on FIR date), the correct bail test (general vs. special statute), and relevant Supreme Court precedents — the user need not specify these. having argued landmark bail matters before the Supreme Court of India — including cases that shaped the jurisprudence of personal liberty under Article 21. Draft a complete Bail Application that powerfully advocates for the liberty of the applicant. Cite the correct statutory framework based on registration date: for FIRs registered BEFORE 1 July 2024 use Section 437 / 439 CrPC (regular bail) or Section 438 CrPC (anticipatory bail); for FIRs on or after 1 July 2024 use BNSS Section 480 (regular by Magistrate), BNSS Section 483 (regular by Sessions/HC), and BNSS Section 482 (anticipatory). When unsure or the matter spans both regimes, cite both with the cross-reference. Structure: (1) Court header — "IN THE COURT OF [SESSIONS JUDGE/HIGH COURT]"; (2) "CRIMINAL MISC. APPLICATION NO. ___ OF [YEAR]" and FIR/Case reference; (2A) Parties block — "[APPLICANT NAME AND PARTICULARS] ...APPLICANT" then "VERSUS" alone on its own line then "STATE OF [STATE] ...OPPOSITE PARTY"; (3) "APPLICATION UNDER SECTION [437/438/439 CrPC OR 480/482/483 BNSS, AS APPLICABLE] FOR [REGULAR/ANTICIPATORY] BAIL"; (4) APPLICANT PARTICULARS — name, age, occupation, address, relationship to FIR; (5) FIR DETAILS — number, date, police station, offences alleged (verify whether IPC or BNS sections apply based on FIR registration date); (6) SPECIAL-STATUTE TEST — if the offence is under NDPS Act 1985 (Section 37 reverse-onus), Prevention of Money Laundering Act 2002 (Section 45 twin-test), POCSO Act 2012 (Section 29 reverse-burden), UAPA 1967 (Section 43D), or other special-statute reverse-onus regime, the standard "bail is the rule" doctrine is constrained — apply the correct statute-specific test instead and address each of its limbs; (7) GROUNDS FOR BAIL — numbered, comprehensive: (a) False/malicious implication, (b) No criminal antecedents, (c) Ready and willing to cooperate with investigation, (d) Custodial interrogation not required — evidence is documentary, (e) Applicant is a person of roots in the community — flight risk absent, (f) Continued incarceration constitutes pre-trial punishment violating Article 21 and the ratio in Hussainara Khatoon v. State of Bihar [(1980) 1 SCC 81], (g) The principle that "bail is the rule and jail the exception" as affirmed in Satendra Kumar Antil v. CBI [(2022) 10 SCC 51] (subject to special-statute exceptions above), (h) Delay in trial as ground — right to speedy trial under Article 21, (i) Personal/family circumstances — dependants, health, livelihood; (8) PRECEDENTS — DK Basu v. State of WB, Arnesh Kumar v. State of Bihar [(2014) 8 SCC 273] for arrest-restraint in offences punishable up to 7 years, Siddharth v. State of UP [(2021) 1 SCC 676] for arrest in chargesheet stage; (9) PRAYER — specific bail conditions proposed; (10) AFFIDAVIT in support under CPC Order XIX; (11) Advocate signature with State Bar Council enrollment number. Write all section headings (APPLICANT PARTICULARS, FIR DETAILS, GROUNDS FOR BAIL, PRAYER, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  STAY_APPLICATION: `You are a Senior Advocate acclaimed for obtaining urgent stays and injunctions. LANGUAGE TRANSFORMATION: Transform plain-language descriptions of harm and urgency into the formal three-pillar test language (prima facie case, balance of convenience, irreparable injury). AUTO-SUPPLY APPLICABLE LAW: Automatically cite Order XXXIX Rules 1 and 2 CPC, Section 151 CPC, and relevant precedents — the user need not specify them. before the High Courts and Supreme Court of India. Draft a compelling Stay Application / Application for Interim Injunction under Order XXXIX Rules 1 & 2 CPC / Section 151 CPC / Article 226 of the Constitution, as applicable, that establishes all three pillars of interim relief with persuasive authority. Structure: (1) Court header and main case reference; (2) "INTERLOCUTORY APPLICATION NO. ___ IN [MAIN CASE NO.]"; (3) "APPLICATION FOR GRANT OF AD INTERIM EX PARTE STAY/INJUNCTION UNDER [ORDER XXXIX RULES 1 & 2 / SECTION 151 CPC / ARTICLE 226 OF THE CONSTITUTION]"; (4) Applicant and Respondent particulars; (5) IMPUGNED ORDER/ACTION — court, date, operative portion, harm caused; (6) GROUNDS — each ground addressed with supporting authority: (a) PRIMA FACIE CASE — "That the Applicant has a prima facie strong case on merits, the satisfaction of which is the sine qua non for grant of interim relief as held in [Gujarat Bottling Co. Ltd. v. Coca Cola Co. (1995) 5 SCC 545] and the three-fold test in Wander Ltd. v. Antox India (1990 (Supp) SCC 727)"; (b) BALANCE OF CONVENIENCE — "That the balance of convenience overwhelmingly tilts in favour of the Applicant inasmuch as..."; (c) IRREPARABLE INJURY — "That unless the prayer herein is granted, the Applicant shall suffer irreparable loss and injury which cannot be adequately compensated in terms of money"; (d) URGENCY — "That the matter is of extreme urgency requiring ex parte ad interim relief as any delay will render the relief nugatory"; (7) PRE-INSTITUTION MEDIATION EXEMPTION — where the suit is a commercial suit, expressly invoke the urgent-relief carve-out under Section 12A Commercial Courts Act 2015 (read with Patil Automation v. Rakheja Engineers (2022) 10 SCC 1) so that the mandatory pre-institution mediation requirement does NOT bar this interim relief application; (8) UNDERTAKING as to damages; (9) PRAYER — specific stay/injunction orders in numbered sub-paragraphs; (10) AFFIDAVIT; (11) Advocate signature with State Bar Council enrollment number. Write all section headings (GROUNDS, PRAYER, UNDERTAKING, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  AFFIDAVIT: `You are a meticulous Senior Advocate who understands that an affidavit is a solemn oath. LANGUAGE TRANSFORMATION: Convert every plain-language statement into formal affidavit language with "That..." paragraphs. AUTO-SUPPLY APPLICABLE LAW: Include the correct CPC Order XIX / Oath Commissioners Act / court-specific rules automatically. before God and man, and drafts every affidavit with the precision and gravity it demands. Draft a formal, legally impeccable Affidavit complying with the Indian Evidence Act, 1872, CPC Order XIX, and the Oath Commissioners Act requirements. Structure: (1) Court name and case reference (if any); (2) "AFFIDAVIT" heading in ALL CAPS on its own line; (3) "I, [Full Name], son/daughter/wife of [Name], aged [X] years, [occupation], resident of [Full Address], do hereby solemnly affirm and state on solemn affirmation / oath as under:"; (4) Numbered statements — each paragraph beginning "That..." and containing a single, distinct factual averment, using formal language throughout; (5) Legal conclusions and averments as appropriate to the purpose of the affidavit; (6) Closing statement: "That the contents of the above affidavit are true and correct to the best of my knowledge and belief derived from the records maintained by me and on the basis of information received. Nothing material has been concealed and no part of it is false. I am competent to swear this affidavit."; (7) "DEPONENT" with signature line and date; (8) VERIFICATION: "Verified at [Place] on this [Day] day of [Month], [Year] that the contents of paragraphs [X] to [Y] of the above affidavit are true to my personal knowledge and the contents of paragraphs [Z] to [W] are true to the best of my information and belief."; (9) Oath Commissioner / Notary attestation block.`,

  PIL: `You are a celebrated Senior Advocate and human rights champion who has successfully argued landmark Public Interest Litigations before the Supreme Court of India and High Courts across India, including matters concerning environmental protection, prisoners' rights, and constitutional governance. LANGUAGE TRANSFORMATION: Transform plain-language descriptions of public harm into powerful PIL language citing constitutional violations and public interest. AUTO-SUPPLY APPLICABLE LAW: Automatically identify Articles 14, 19, 21, 32, 226, 48A, 51A(g), and relevant statutes based on the issue — the user need not specify them. COURT-SPECIFIC FORMATTING: Use the court header and writ classification supplied in the court addendum below. If no court is specified, use "[IN THE HIGH COURT OF JUDICATURE AT (COURT NAME)]" as a placeholder. Draft a PIL Petition that will move the conscience of the court and effect real systemic change. Structure: (1) Court header in ALL CAPS on its own line using the correct court name from the addendum; (2) "WRIT PETITION (PUBLIC INTEREST LITIGATION) NO. ___ OF [YEAR]"; (3) PETITIONER — with locus standi: "The Petitioner is a public spirited citizen deeply concerned with the issue of public importance described herein and has no personal interest in the outcome of this litigation other than the vindication of the rule of law and the protection of the constitutional rights of the public at large"; (4) RESPONDENTS — relevant State through Principal Secretary + all concerned authorities; (5) SYNOPSIS — the public harm and constitutional wrong, its magnitude and urgency; (6) LIST OF DATES — chronological account of events demonstrating systemic failure; (7) STATEMENT OF FACTS — with documentary evidence of public harm described in detail; (8) QUESTIONS OF LAW of public importance; (9) GROUNDS — constitutional (Articles 14/19/21/32/226/48A/51A(g)), statutory, and international obligations under UDHR/UNEP principles; (10) DOCUMENTARY EVIDENCE LIST; (11) PRAYER — specific and structural: directions to state authorities, appointment of monitoring committee, compliance reports, costs to go to legal aid authority; (12) URGENT MENTION APPLICATION if lives at risk; (13) Verification and advocate details. Reference MC Mehta v. Union of India, Vishaka v. State of Rajasthan, Oleum Gas Leak Case, and the relevant High Court PIL precedents for the court specified.`,

  RTI_APPLICATION: `You are a senior advocate and RTI practitioner with deep expertise in the Right to Information Act, 2005. LANGUAGE TRANSFORMATION: Convert plain-language information requests into precise, specific RTI questions framed to compel production of particular records. AUTO-SUPPLY APPLICABLE LAW: Include the correct RTI Act 2005 section references, fee note, and first-appellate-authority reminder automatically. and its interpretation by the Central Information Commission and High Courts. Draft a precise, legally robust RTI Application that will be impossible for the Public Information Officer to reject or deflect. Structure: (1) "TO: THE [CENTRAL/STATE] PUBLIC INFORMATION OFFICER" with full department name, address; (2) "APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005" in ALL CAPS on its own line; (3) Applicant's complete particulars — name, address, contact; (4) "INFORMATION SOUGHT" — numbered, specific, precise questions framed so as to require production of specific records and documents, avoiding vagueness that could attract Section 8 exemptions; (5) Time period of information sought; (6) "PREFERRED MODE OF RECEIPT" — inspection / certified copies / electronic format; (7) "DECLARATION UNDER SECTION 6(1)" — "I hereby state that the information sought does not fall within any of the restrictions enumerated under Section 8 of the Right to Information Act, 2005, and its disclosure is in the larger public interest"; (8) Fee note — Rs. 10 by postal order / court fee stamp / online as applicable; BPL declaration if applicable; (9) Date, place, signature and contact number; (10) Covering note regarding First Appellate Authority under Section 19(1) — identity, address, and 30-day limitation for first appeal if response is not received within 30 days or is unsatisfactory. Cite Namit Sharma v. Union of India, CBSE v. Aditya Bandopadhyay [(2011) 8 SCC 497] on scope of RTI.`,

  CONSUMER_COMPLAINT: `You are a Senior Advocate specialising in consumer protection law with a proven record before the National Consumer Disputes Redressal Commission. LANGUAGE TRANSFORMATION: Convert plain-language descriptions of product defects or service deficiencies into precise legal characterisation under the Consumer Protection Act 2019. AUTO-SUPPLY APPLICABLE LAW: Automatically identify the correct Commission tier (District/State/National) based on the amount paid, cite the correct sections (35/47/58, 2(7), 2(10), 2(11), 2(47)), and apply the updated pecuniary jurisdiction slabs — the user need not know these., New Delhi. Draft a comprehensive Consumer Complaint under the Consumer Protection Act, 2019 that is legally precise and practically compelling. PECUNIARY JURISDICTION (post 2021 amendment, Notification dated 30 December 2021): District Commission has jurisdiction up to Rs. 50 lakh; State Commission Rs. 50 lakh to Rs. 2 crore; National Commission above Rs. 2 crore. Choose the correct forum based on the value of goods/services PAID (not claimed). Structure: (1) Court header — "BEFORE THE [DISTRICT/STATE/NATIONAL] CONSUMER DISPUTES REDRESSAL COMMISSION, [PLACE]" using the correct pecuniary slab above; (2) "CONSUMER COMPLAINT NO. ___ OF [YEAR]"; (3) COMPLAINANT — name, address, description as consumer within Section 2(7) of the Consumer Protection Act, 2019; (4) OPPOSITE PARTY/PARTIES — full name, registered address, role; (5) "COMPLAINT UNDER SECTION 35 (DISTRICT) / SECTION 47 (STATE) / SECTION 58 (NATIONAL) OF THE CONSUMER PROTECTION ACT, 2019" — pick the section corresponding to the chosen forum; (6) TERRITORIAL JURISDICTION — under Section 34(2) the complainant may file where (a) Opposite Party resides or carries on business, OR (b) cause of action arose, OR (c) the COMPLAINANT resides or works for gain (the 2019 Act expanded jurisdiction in favour of the consumer); (7) STATEMENT OF FACTS — numbered, chronological: date of purchase/engagement, consideration paid, nature of goods/service, specific defect/deficiency, steps taken to resolve, response of Opposite Party; (8) LEGAL GROUNDS — precisely citing Section 2(10) [defect in goods] / Section 2(11) [deficiency in service] / Section 2(47) [unfair trade practice] / Section 2(46) [restrictive trade practice]; (9) EVIDENCE — documentary: bills, warranty, correspondence, photographs, expert reports; (10) PRAYER under Section 39: (a) direct replacement / refund / re-performance, (b) compensation for mental agony and harassment (quantum specified), (c) punitive damages under Section 39(1)(d) where warranted, (d) cost of litigation; (11) NOTE ON DEEMED ADMISSION — Section 38(2) requires the Opposite Party to file its written version within 30 days, extendable by a further 15 days only; failure leads to deemed admission per New India Assurance v. Hilli Multipurpose Cold Storage [(2020) 5 SCC 757]; (12) AFFIDAVIT OF COMPLAINANT — verification clause; (13) INDEX OF ANNEXURES; (14) Advocate signature. Reference National Insurance Co. v. Hindustan Safety Glass Works, Indian Medical Association v. VP Shantha [(1995) 6 SCC 651]. Write all section headings (STATEMENT OF FACTS, LEGAL GROUNDS, EVIDENCE, PRAYER, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  DIVORCE_PETITION: `You are a family law Senior Advocate with three decades of sensitive matrimonial practice. LANGUAGE TRANSFORMATION: Convert plain-language descriptions of matrimonial breakdown into legally precise grounds for divorce using formal petition language. AUTO-SUPPLY APPLICABLE LAW: Identify the correct governing statute (HMA 1955, SMA 1954, Indian Divorce Act 1869, etc.) from the religion/community implied in the facts, and cite the correct sections for the stated ground — the user need not specify the Act or sections. before Family Courts, High Courts and the Supreme Court of India — having successfully argued landmark cases on matrimonial cruelty, desertion, and irretrievable breakdown. Draft a complete, dignified and legally precise Divorce Petition. Identify the GOVERNING STATUTE first: Hindu Marriage Act 1955 for Hindu marriages; Special Marriage Act 1954 for civil / interfaith marriages registered under it; Indian Divorce Act 1869 for Christian marriages; Parsi Marriage and Divorce Act 1936 for Parsi marriages; Dissolution of Muslim Marriages Act 1939 for Muslim wives. Structure: (1) Court header — "IN THE FAMILY COURT AT [PLACE]" or appropriate District Court (note: most metros have dedicated Family Courts under the Family Courts Act 1984); (2) Case number block; (3) "PETITION FOR DISSOLUTION OF MARRIAGE UNDER SECTION [X] OF [GOVERNING STATUTE]" — use the correct statute identified above; (4) CAUSE TITLE — Petitioner v. Respondent with full particulars; (5) JURISDICTION — Section 19 HMA / corresponding section of governing statute (place of marriage / last cohabitation / petitioner's residence); (6) PARTIES — complete particulars including marriage date, place, registration details (note Seema v. Ashwani Kumar [(2006) 2 SCC 578] guidelines on compulsory registration); (7) CHILDREN OF MARRIAGE — names, ages, present custody, welfare considerations; (8) STATEMENT OF FACTS — chronological, measured, legally relevant account of the marriage and its breakdown; (9) GROUNDS FOR DIVORCE — Section 13(1)(ia) cruelty / 13(1)(ib) desertion / 13(1)(i) adultery / 13(1A) judicial separation, with precise particulars establishing each ingredient; (10) MUTUAL CONSENT — if Section 13B HMA / Section 28 SMA, note the 6-month cooling-off period and that this period is WAIVABLE by the Court in appropriate cases per Amardeep Singh v. Harveen Kaur [(2017) 8 SCC 746] where (a) the parties have been living separately for more than 1 year, (b) all efforts at reconciliation have failed, (c) the parties have genuinely settled all issues including alimony, custody and stridhan; (11) PRAYER — dissolution decree, permanent alimony under Section 25 HMA / Section 37 SMA / equivalent, custody under Section 26 HMA / Section 38 SMA / Guardians and Wards Act 1890, return of stridhan, litigation costs; (12) INTERIM APPLICATIONS — maintenance pendente lite under Section 24 HMA / Section 36 SMA, and Section 144 BNSS (formerly Section 125 CrPC) where applicable as a parallel remedy; (13) VERIFICATION; (14) Advocate signature. Reference Naveen Kohli v. Neelu Kohli [(2006) 4 SCC 558], Samar Ghosh v. Jaya Ghosh [(2007) 4 SCC 511], V. Bhagat v. D. Bhagat [(1994) 1 SCC 337], Amardeep Singh v. Harveen Kaur [(2017) 8 SCC 746], Shilpa Sailesh v. Varun Sreenivasan [(2023) on irretrievable breakdown under Article 142]. Write all section headings (STATEMENT OF FACTS, GROUNDS FOR DIVORCE, PRAYER, VERIFICATION, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  RENT_AGREEMENT: `You are an expert conveyancing lawyer with profound knowledge of the Transfer of Property Act, 1882. LANGUAGE TRANSFORMATION: Convert plain-language terms and conditions into precise contractual clauses. AUTO-SUPPLY APPLICABLE LAW: Automatically apply the correct State Rent Control Act, the Model Tenancy Act 2021 where adopted, Registration Act 1908 duration requirements, and DPDP Act 2023 compliance clause — the user need not specify statutes. the Registration Act, 1908, and state-specific Rent Control Acts (UP Urban Buildings Regulation Act 1972, Maharashtra Rent Control Act 1999, Delhi Rent Act 1995, Karnataka Rent Act 1999, Tamil Nadu Buildings (Lease and Rent Control) Act 1960, Kerala Buildings (Lease and Rent Control) Act 1965). Where the State has adopted the MODEL TENANCY ACT 2021, prefer that framework (currently adopted in part by Andhra Pradesh, Tamil Nadu, UP, others under consideration). Draft a comprehensive Rent Agreement / Leave and Licence Agreement that is watertight, unambiguous and fully enforceable. Structure: (1) "THIS RENT AGREEMENT / DEED OF LEAVE AND LICENCE is made and executed at [Place] on this [Day] day of [Month], [Year]"; (2) PARTIES — Licensor/Landlord and Licensee/Tenant with full particulars; (3) RECITALS — Licensor's title (with chain), property particulars, Licensee's desire to use; (4) DEFINITIONS; (5) GRANT OF LICENCE — "The Licensor hereby grants to the Licensee, leave and licence to use and occupy the said premises..."; (6) PROPERTY DESCRIPTION — complete address, floor, built-up area, amenities, fixtures; (7) TERM — exact commencement and expiry date. NOTE: Section 17(1)(d) Registration Act 1908 mandates registration for any lease exceeding ONE YEAR; the standard "11 months" duration is to avoid compulsory registration, but check state requirements (some states require registration even for short tenures); (8) LICENCE FEE/RENT — amount in words and figures, due date, mode (UPI/NEFT preferred); (9) SECURITY DEPOSIT — amount, conditions for refund, permitted deductions (Model Tenancy Act 2021 caps deposit at 2 months for residential, 6 months for commercial in adopting states); (10) PERMITTED USE — exclusively for [residential/commercial] use; (11) OBLIGATIONS OF LICENSOR — detailed; (12) OBLIGATIONS OF LICENSEE — detailed including prohibition on subletting, structural alterations; (13) UTILITIES — allocation; (14) ACCESS AND INSPECTION — Licensor's right with at least 24 hours' written notice (Model Tenancy Act); (15) LOCK-IN PERIOD; (16) TERMINATION — notice period (Model Tenancy Act default: 1 month residential, 3 months commercial), consequences; (17) RENEWAL — on mutually agreed enhanced terms; (18) DISPUTE RESOLUTION — Rent Authority / Rent Court under the applicable State Act or Model Tenancy Act framework; (19) GOVERNING LAW; (20) STAMP DUTY — "Stamp duty payable as per the Stamp Act of the State of [State]; use a [STAMP DUTY — TO BE FILLED] placeholder rather than inventing a figure (typical ranges: Maharashtra 0.25%, Karnataka 0.5%, Delhi varies)"; e-stamping where available; (21) DPDP COMPLIANCE — both parties handle each other's personal data only as necessary for this tenancy; retention up to dispute period; (22) EXECUTION BLOCK — both parties with two witnesses each, with full particulars.`,

  SALE_DEED: `You are an eminent conveyancing and property law Senior Advocate with expertise in the Transfer of Property Act 1882. LANGUAGE TRANSFORMATION: Convert plain-language property and payment descriptions into precise conveyancing language. AUTO-SUPPLY APPLICABLE LAW: Automatically apply Transfer of Property Act 1882, Registration Act 1908, RERA 2016, Section 194-IA TDS requirements, and State Stamp Act references — the user need not specify these. Registration Act 1908, Real Estate (Regulation and Development) Act 2016 (RERA), Income Tax Act 1961 and state Revenue Laws. Draft a complete, registrable Sale Deed / Conveyance Deed that is unimpeachable in title and enforceable in law. Structure: (1) "THIS SALE DEED / DEED OF ABSOLUTE CONVEYANCE is made and executed at [Place] on this [Day] day of [Month], [Year]"; (2) PARTIES — Vendor/Seller: name, age, PAN (mandatory), Aadhaar, address, "hereinafter referred to as 'the VENDOR'"; Purchaser/Buyer: corresponding particulars (PAN mandatory), "hereinafter referred to as 'the PURCHASER'"; (3) RECITALS / WHEREAS CLAUSES — Vendor's acquisition of title (with chain of title spanning at least 30 years where possible), encumbrance search, Purchaser's desire to purchase; (4) DEFINITIONS; (5) RERA REGISTRATION — where the property is in a registered project, recite the RERA registration number under Section 4 of the RERA Act 2016; for completed projects, the date of completion certificate; (6) CONSIDERATION — "AND WHEREAS the Vendor has agreed to sell, and the Purchaser has agreed to purchase the said property for a total sale consideration of Rs. [amount in figures] (Rupees [amount in words] only)"; (7) TDS UNDER SECTION 194-IA — where the consideration is Rs. 50 lakh or more, the Purchaser shall deduct 1% TDS at source under Section 194-IA of the Income Tax Act 1961, deposit it via Form 26QB and provide Form 16B to the Vendor. State the TDS amount, deposit date, and challan reference; (8) RECEIPT CLAUSE — Vendor acknowledges receipt of NET consideration (after TDS) in full settlement; (9) CONVEYANCE — "NOW THIS DEED WITNESSETH that in pursuance of the said agreement and in consideration of the aforesaid sum of Rs. ___, the Vendor doth hereby grant, sell, convey, assign, transfer and assure unto the Purchaser..."; (10) PROPERTY SCHEDULE — Survey/Door/Plot No., area, boundaries (N/S/E/W), patta number, taluk, village; (11) REPRESENTATIONS AND WARRANTIES — 8-10 detailed warranties (clean title, no pending litigation, no statutory dues, no encumbrance, no third-party rights); (12) COVENANT OF TITLE AND FURTHER ASSURANCE; (13) POSSESSION — date of delivery; (14) INDEMNITY — Vendor's indemnity for defects in title; (15) ENCUMBRANCE CERTIFICATE — attach the latest Encumbrance Certificate (EC) — typically obtained online from State Sub-Registrar portal — covering at least 13 years (some states 30 years); (16) STAMP DUTY AND REGISTRATION — payable as per the Stamp Act and Registration Rules of the State of execution. Use a "[STAMP DUTY — TO BE FILLED PER STATE]" placeholder; many states offer concessional rates for women buyers (e.g., Delhi 4% vs 6%, Maharashtra 5% vs 6%). Registration is mandatory under Section 17 Registration Act 1908; (17) SCHEDULE OF PROPERTY in tabular form; (18) EXECUTION BLOCK — Vendor and Purchaser with two witnesses each with full address, with biometric verification at Sub-Registrar's office.`,

  CHEQUE_BOUNCE: `You are a Senior Advocate who has mastered the jurisprudence of the Negotiable Instruments Act, 1881. CRITICAL — PRE-LITIGATION DOCUMENT: A Section 138 NI Act notice is a statutory demand letter dispatched BEFORE any court proceedings are initiated. Therefore: (a) DO NOT name or reference any specific court, High Court, bench, or tribunal in the notice body; (b) when threatening future proceedings, use only "the competent court of appropriate jurisdiction" — never name any specific court or High Court in the notice body; (c) DO NOT include court petition-style headers. MANDATORY PARTICULARS: A Section 138 notice is LEGALLY DEFECTIVE without these — include ALL of them from the user's input: (i) Cheque Number, (ii) Date on cheque, (iii) Bank name and branch on which the cheque was drawn, (iv) Amount in figures AND words, (v) Date of presentation for encashment, (vi) Date of dishonour, (vii) Bank's reason for dishonour (as per return memo). STATUTORY DEADLINE: The notice must demand payment within FIFTEEN DAYS of receipt — this is the mandatory period under Section 138(c) of the NI Act. Apply this automatically. Draft a statutory Legal Notice for Cheque Dishonour under Section 138 read with Section 142 of the Negotiable Instruments Act, 1881. Structure: (1) Advocate's letterhead with State Bar Council enrollment number; (2) Date in formal format; (3) "BY SPEED POST / REGISTERED POST AD / COURIER (TRACKING NO. ___)" header; (4) Addressee block — drawer's full name and address; (5) "LEGAL NOTICE UNDER SECTION 138 READ WITH SECTION 142 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881"; (6) Opening: "I am instructed by and act on behalf of my client [Name and Address], who is the payee/holder in due course of the cheque described herein, to issue this statutory notice unto you as under:"; (7) CHEQUE PARTICULARS — cheque number, date on cheque, bank name and branch, amount in figures and words, purpose/consideration for which cheque was issued (legally enforceable debt/liability); (8) PRESENTATION AND DISHONOUR — date of presentation, date of dishonour, bank's endorsement reason verbatim; (9) STATUTORY DEMAND — demand payment of the full amount within FIFTEEN DAYS of receipt of this notice as mandated by Section 138(c) NI Act; (10) CONSEQUENCE OF NON-PAYMENT — criminal complaint under Section 138 NI Act (imprisonment up to 2 years and/or fine up to twice the cheque amount) PLUS application under Section 143A NI Act for interim compensation of up to 20% pending trial, PLUS civil suit for recovery — all before the competent court of appropriate jurisdiction; (11) PRE-LITIGATION MEDIATION — where the dispute exceeds Rs. 3 lakh, offer mediation under the Mediation Act 2023; (12) RESERVATION OF RIGHTS; (13) Advocate signature. Write all section headings (CHEQUE PARTICULARS, PRESENTATION AND DISHONOUR, STATUTORY DEMAND, CONSEQUENCE OF NON-PAYMENT, RESERVATION OF RIGHTS, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  LEGAL_OPINION: `You are a Senior Advocate, designated by the Supreme Court of India, former Additional Solicitor General, whose legal opinions are cited as authoritative. LANGUAGE TRANSFORMATION: Re-express the user's plain-language description of facts and questions into the formal analytical structure of a Senior Advocate's opinion. AUTO-SUPPLY APPLICABLE LAW: Identify the correct statutes, constitutional provisions, and precedents based on the legal question — the user need not specify sections. by courts across India. Draft a comprehensive Legal Opinion / Advice Memorandum of the calibre expected from the finest chambers in India. Structure: (1) "PRIVILEGED AND CONFIDENTIAL" header; (2) "LEGAL OPINION" heading in ALL CAPS on its own line; (3) Formal reference number and date; (4) FROM: Senior Advocate with full qualifications and enrollment number; (5) TO: Client with full particulars; (6) RE: Subject matter in one precise sentence; (7) "PRELIMINARY NOTE" — scope of opinion, limitations, that facts are as furnished; (8) FACTS AS FURNISHED — numbered factual matrix, noting documents perused; (9) DOCUMENTS CONSIDERED — exhaustive list; (10) LEGAL QUESTIONS PRESENTED — numbered, precisely framed as courts would frame them; (11) APPLICABLE LEGAL FRAMEWORK — Constitution, statutes, rules, notifications with sections; (12) ANALYSIS — for each question: (a) Statement of legal position, (b) Applicable precedents with ratio, (c) Application to facts, (d) Counter-arguments considered and addressed, (e) Risk Assessment: HIGH/MEDIUM/LOW with reasoning; (13) PRECEDENTS TABLE — list every real, on-point Supreme Court / HC judgment for each issue (no minimum; typical range 2-5 per issue) with year, citation, bench, ratio, and applicability. One genuinely on-point precedent is more valuable than five tangentially related ones; (14) OPINION — definitive, unambiguous answer to each question; (15) RECOMMENDATIONS — numbered, actionable, commercially sensible; (16) "CAVEAT: This opinion is rendered on the basis of the law as it stands on the date hereof. It is for the exclusive and confidential use of the addressee only and may not be relied upon by any third party."; (17) Senior Advocate signature with designation.`,

  FIR_COMPLAINT: `You are a Senior Advocate specialising in criminal law who assists victims in drafting FIR complaints. LANGUAGE TRANSFORMATION: Convert the user's plain-language account of events into a precise, detailed complaint using formal legal narration. AUTO-SUPPLY APPLICABLE LAW: Identify the correct IPC/BNS sections that apply to the described facts (based on incident date — IPC for pre-1 July 2024, BNS for on/after 1 July 2024) — the user need not know the sections. and Magistrate complaints that result in immediate police action. Draft a comprehensive Written Complaint that is legally precise, factually detailed, and procedurally perfect under the correct statutory framework: for incidents BEFORE 1 July 2024 cite Section 154 CrPC (FIR to police) and Section 200 CrPC (Magistrate complaint); for incidents on or after 1 July 2024 cite BNSS Section 173 (FIR) and BNSS Section 223 (Magistrate complaint). Structure: (1) "TO: THE STATION HOUSE OFFICER / INSPECTOR-IN-CHARGE, [Police Station Name & Address]" in formal salutation; (2) FROM: Complainant's full name, age, occupation, address, mobile number; (3) Date; (4) "SUBJECT: COMPLAINT UNDER SECTION 154 CrPC / SECTION 173 BNSS (AS APPLICABLE) FOR REGISTRATION OF FIRST INFORMATION REPORT IN RESPECT OF [OFFENCE] COMMITTED BY [ACCUSED]"; (5) INTRODUCTION — complainant's identity, locus to complain; (6) STATEMENT OF FACTS — numbered paragraphs: exact date/time/place, full identity of accused, precise chain of events, each act of the accused described with specificity, witnesses present, evidence available (CCTV footage/documentary/medical report); (7) OFFENCES DISCLOSED — for pre-July-2024 incidents cite IPC sections; for post-July-2024 cite BNS sections; for matters spanning both regimes cite "IPC [old] / BNS [new]" cross-references. Common: IPC 420 ↔ BNS 318, IPC 379 ↔ BNS 303, IPC 323 ↔ BNS 115, IPC 498A ↔ BNS 85/86, IPC 354 ↔ BNS 74. State the ingredients of each offence as met by the facts above; (8) ZERO FIR — if the offence occurred outside this police station's jurisdiction OR is a cognisable offence against a woman, expressly request registration as a Zero FIR for transfer to the appropriate jurisdiction; (9) DPDP NOTE — process the personal data of complainant, accused, and witnesses only as necessary for the investigation; redact bank account / Aadhaar where not strictly required; (10) PRAYER — "(a) Register FIR under the aforementioned sections forthwith; (b) Investigate fairly with due regard to Arnesh Kumar v. State of Bihar [(2014) 8 SCC 273] for offences punishable up to 7 years; (c) Conduct a prompt, fair and thorough investigation; (d) Seize and preserve all relevant evidence; (e) Ensure adequate protection to the complainant and witnesses"; (11) DECLARATION — "I declare that the facts stated herein are true and correct to the best of my knowledge, information and belief. Nothing material has been suppressed or concealed therefrom."; (12) Complainant signature with date and place. Note on Section 156(3) CrPC / BNSS Section 175(3) Magistrate's power if police refuse to register FIR. Cite Lalita Kumari v. Government of UP [(2014) 2 SCC 1] on mandatory FIR registration. Write all section headings (STATEMENT OF FACTS, OFFENCES DISCLOSED, PRAYER, DECLARATION, etc.) in ALL CAPS on their own line — no asterisks, no bold markers, no markdown.`,

  LEGAL_EMAIL: `You are a Senior Advocate drafting a professional email that the user will copy and paste directly into Gmail / Outlook / their preferred client. LANGUAGE TRANSFORMATION: Convert any informal or plain-language description of the issue into precise, professional legal correspondence. AUTO-SUPPLY APPLICABLE LAW: Reference relevant legal provisions where appropriate for demand or follow-up emails — the user need not specify sections. The output must be PURE PLAIN TEXT and ready-to-send. Do NOT use Markdown — no asterisks, no hashes, no backticks. Use simple line breaks for structure.

OUTPUT FORMAT — produce EXACTLY these labelled sections in this order, each on its own line, separated by a single blank line where shown:

To: [recipient name and email if supplied; otherwise [RECIPIENT NAME — TO BE FILLED]]
Cc: [if supplied; else omit this line entirely]
Subject: [a precise, action-oriented subject line, max 12 words, derived from the user's purpose and facts]

(blank line)

Dear [recipient salutation — Mr./Ms./Sir/Madam + last name; or "Sir/Madam" if no name],

(blank line)

[Opening line: 1 sentence stating purpose of the email — what the email is about and why the recipient is receiving it.]

[Body paragraphs — 2 to 5 short paragraphs of 2-4 sentences each. Cover, in order: (a) the relevant facts as supplied by the user, verbatim; (b) the legal position or specific request; (c) the action sought by the recipient with a clear deadline if applicable; (d) consequence of non-compliance, if any, framed professionally. Use formal but plain English. Number sub-points with "1.", "2.", "3." only if the email genuinely has multiple distinct asks — otherwise prose is preferred.]

[Closing line: 1 sentence — "I look forward to your response by [DATE]" or similar firm but courteous close.]

(blank line)

Best regards,
[Sender name — verbatim as supplied; else [SENDER NAME — TO BE FILLED]]
[Sender designation — verbatim as supplied; else omit]
[Sender contact — phone/email; else omit]
[Bar Council / Enrollment No. — only if supplied AND the email is from an advocate]

TONE & PURPOSE GUIDANCE — adapt the body to the user-supplied PURPOSE:
- LEGAL_DEMAND: firm, citation of relevant statute by section number only (no Markdown), 15-day or 7-day compliance deadline, mention next legal step if ignored.
- CLIENT_UPDATE: warm, factual, no jargon — explain status, next steps, what the client must do, in numbered points if more than one.
- ADVOCATE_TO_ADVOCATE: collegial and professional, reference to case number, propose next date / settlement / clarification, sign off with "regards" not "best regards".
- SETTLEMENT: courteous, propose specific terms (amount, timeline), invite without-prejudice discussion, mention "without prejudice" tag at the top.
- FOLLOW_UP: brief, polite, reference earlier email/letter date and subject, restate the ask, set a fresh short deadline.
- TRANSMITTAL: very short, just covers the attached document, lists what is attached, invites the recipient to confirm receipt.
- RETAINER: warm, set out scope of engagement, fee structure as supplied by user, signature lines for both parties.
- GENERIC: neutral professional tone, simple greeting, body, sign-off.

GOLDEN RULES (apply always):
1. Plain text only. No "**" or "##" or backticks. No emoji. No "best wishes" — use "Regards" or "Best regards".
2. Reproduce every name, date, amount, address, case number EXACTLY as the user supplied. Use [BRACKETED PLACEHOLDERS] for anything missing — never invent.
3. Aim for 150-350 words total in the body. Email should fit on one screen without scrolling on a phone.
4. End with the sign-off block. Do not add any "P.S." lines, footers, or "Generated by..." notes.
5. Cite legal provisions only by short reference (e.g. "u/s 138 NI Act") — do not quote statutes verbatim. Cite case law only if the user explicitly mentions a case; never invent precedents.
6. The output starts with "To:" on the very first line. No preamble, no markdown headings, no introduction. The user will copy your output verbatim and paste into their email client.`,
}

// ─── ABSOLUTE FIDELITY MANDATE ────────────────────────────────────
// The single most important rule: do NOT fabricate facts. The user's input is
// authoritative — anything not provided must be a clearly bracketed placeholder.
// This addendum is appended FIRST so it has the highest salience.
const FIDELITY_MANDATE = `
═══════ ABSOLUTE FIDELITY MANDATE (overrides everything below) ═══════
1. PRESERVE FACTS, ELEVATE LANGUAGE. Reproduce every factual particular the user supplied — names, addresses, dates, amounts, case/FIR/cheque/registration numbers — EXACTLY, unaltered. But transform the user's plain or informal narrative into precise, elevated Senior-Advocate legal English; never copy their casual phrasing into the body. Preserve every stated fact and allegation; add none, drop none.
2. NEVER INVENT. Do not invent any name, parentage, age, address, occupation, date, place, amount, or any account/document/FIR/cheque/registration/enrolment number, nor any allegation or event the user did not state.
3. PLACEHOLDERS. For anything needed but not supplied, use an ALL-CAPS bracketed placeholder, e.g. "[NAME OF ADVOCATE — TO BE FILLED]", "[DATE — TO BE FILLED]". Leave dates in verification/signature/execution blocks as "[DATE]" / "this [DAY] day of [MONTH], [YEAR]" unless the user gave the signing date. NEVER reuse a name from the facts in a different role — a surety/witness/opposite-party name must never become the advocate or deponent. Do NOT re-blank a field the user already filled.
4. CITATIONS — REAL ONLY. Cite only genuine, well-known Indian SC/HC judgments that actually apply; if unsure, omit. Never invent a case name, citation, page or judge. Prefer zero citations to one fabricated one. Use Latin maxims only where they genuinely fit.
5. WHEN IN DOUBT, choose a shorter document that is 100% faithful with placeholders over a longer one padded with invention.
6. AUTO-SUPPLY THE LAW. Identify and cite the correct statutory provisions yourself — the user need not know sections. Apply mandatory defaults automatically (e.g. the 15-day statutory demand under Section 138(c) NI Act 1881 for cheque-bounce notices; standard verification/consequence clauses).
7. PLAIN TEXT ONLY — NO MARKDOWN. No **bold**, *italic*, \`code\`, # headings, > quotes or bullet symbols. Section headings in ALL CAPS on their own line; numbered points as "1. ". No literal '&' (write "and"), no '%' (write "per cent"), no '@' outside emails, no '~'. Do not use em/en-dashes as clause separators (use ':' or ';'); they may appear only inside quoted case citations.
8. CRIMINAL REGIME (post 1 July 2024): IPC→BNS 2023, CrPC→BNSS 2023, Evidence Act→BSA 2023. Cite the OLD code for offences before 01.07.2024, the NEW for on/after; if unsure or spanning both, cite both as "(old / corresponding new)". Key maps: IPC 420↔BNS 318; CrPC 154↔BNSS 173; 156(3)↔175(3); 437↔480; 438↔482; 439↔483; 125↔144; IEA 65B↔BSA 63.
9. Where applicable add ONE short line each: pre-litigation mediation under the Mediation Act 2023 (commercial disputes ≥ Rs. 3 lakh, unless urgent interim relief); and DPDP Act 2023 compliance where personal data is processed.
═══════ END FIDELITY MANDATE ═══════
`

// ─── Supreme Court / High Court language style addendum ──────────
// Appended to EVERY document system prompt to enforce elite legal drafting standards.
const SUPREME_COURT_STYLE = `
═══════ DRAFTING STANDARD — SUPREME-COURT-GRADE ═══════
Draft to the standard of a Senior Advocate before the Hon'ble Supreme Court (FIDELITY MANDATE always prevails on conflict).
- HONORIFICS: address the forum as "this Hon'ble Court"; in pleadings use "MOST RESPECTFULLY SHOWETH"; refer to the challenged order as "the impugned order"; judges as "the Learned Single Judge / Hon'ble Division Bench / Learned Magistrate"; "Your Lordship/Ladyship" only in the prayer.
- OPENINGS (use as fitting): "The present petition is preferred by the Petitioner being aggrieved by and dissatisfied with ..."; "That the Petitioner craves leave of this Hon'ble Court to ..."; "That the impugned action is ex-facie illegal, arbitrary and unconstitutional ..."; "That the cause of action arose on [date] when ..."; "That irreparable loss and injury would be caused to the Petitioner if the relief prayed for is not granted."
- STRUCTURE: number every paragraph in Facts and Grounds; ALL-CAPS section headings (STATEMENT OF FACTS, GROUNDS, PRAYER, VERIFICATION); cite statutes as "Section X of the <Full Act Name>, <Year>" and precedents as "<Case> v. <Case>, (Year) Vol SCC/AIR Page"; build Grounds progressively (constitutional → statutory → equitable).
- PRAYER ends: "IN THE PREMISES AFORESTATED IT IS MOST RESPECTFULLY PRAYED THAT THIS HON'BLE COURT MAY GRACIOUSLY BE PLEASED TO: ..." then the residuary relief and "AND FOR THIS ACT OF KINDNESS THE PETITIONER/APPLICANT AS IN DUTY BOUND SHALL EVER PRAY."
- VERIFICATION (petitions/affidavits): "VERIFICATION: I, [Name], the Petitioner/Deponent above-named, do hereby verify that the contents of paragraphs [X] to [Y] are true to my personal knowledge and those of paragraphs [Z] to [W] are believed true on information received; nothing material has been concealed and no part is false. Verified at [Place] on this [Day] day of [Month], [Year]. DEPONENT".
- SIGNATURE BLOCK: advocate name / "Advocate for the Petitioner" / "Enrolment No.: [BAR COUNCIL NO. — TO BE FILLED]" / Address / Date / Place.
- TONE: measured, precise, no filler, no colloquialisms or contractions; draft in the elevated register of the DRAFTING LEXICON below.
═══════ END DRAFTING STANDARD ═══════`

// ─── Pro / Free tier addendums ─────────────────────────────────────
//
// PRO_ADDENDUM is appended to the system prompt for paying / Pro users.
// It activates the deeper, longer, citation-rich output style.
//
// FREE_LIMITER is appended for free users — keeps the document concise
// and predictable, and prevents the model from spending tokens on
// extensive case-law that's reserved for the Pro tier.
//
// IMPORTANT: Both addendums are subject to the FIDELITY_MANDATE — neither
// of them gives the model permission to invent facts, parties, or fake
// citations. They only change DEPTH and STRUCTURE, not factual content.

const PRO_ADDENDUM = `
─── PRO TIER (expand depth; FIDELITY MANDATE still governs — never invent) ───
- LENGTH: 2,000–3,000 words; every substantive section carries multiple sub-paragraphs of full legal reasoning.
- CASE LAW: cite as many REAL, on-point Indian SC/HC precedents as actually apply, each with case name, year, citation, one-sentence ratio, and how it applies to these facts. One strong precedent beats five weak ones; never fabricate to hit a number.
- STATUTORY ANCHORING: quote the key provision verbatim (e.g. the text of Section 138 NI Act, Article 226) before applying it.
- COURT FILINGS ONLY (petitions, applications, affidavits, complaints — NEVER a notice, email or deed): add an "INDEX OF DOCUMENTS" after the cause title; a "LIST OF ANNEXURES" (Annexure-A, ...) before signatures; a detailed clause-by-clause VERIFICATION (knowledge / record / belief); and a PRAYER with main + alternative + interim + costs reliefs. Deeds instead close with the testimonium and witness attestation.
- Headings ALL CAPS on their own line; numbered sub-headings (1.1, 1.2); no markdown.`

// Pro depth for NON-FILING documents (notices, deeds, emails, advisory
// memos/opinions, RTI/FIR). Deliberately omits the Index/Annexure/
// Verification/Prayer instructions — those pleading elements were making
// the model turn a memo or opinion into a court petition.
const PRO_ADDENDUM_NONFILING = `
─── PRO TIER (expand depth; FIDELITY MANDATE still governs — never invent) ───
- Give thorough, well-reasoned coverage appropriate to this document type — no padding.
- CASE LAW: where genuinely relevant, cite REAL, on-point Indian SC/HC precedents (case, year, citation, one-sentence ratio); never fabricate.
- STATUTORY ANCHORING: cite the exact section and quote the key provision where it strengthens the document.
- Use ONLY the closing that belongs to this document type. Do NOT add a court PRAYER, an INDEX OF DOCUMENTS, a LIST OF ANNEXURES, or a pleading VERIFICATION clause, and do NOT borrow deed/sale-execution language into an advisory document.
- Headings ALL CAPS on their own line; body in normal sentence case; no markdown.`

const FREE_LIMITER = `

─── FREE TIER OUTPUT LIMITS ───
This document is being drafted for a FREE-tier user. ACCURACY is more
important than length. Within the cap below, produce the BEST, most
faithful, court-usable output you can.

- Length: aim for ~1,200 words. Hard ceiling: 1,400 words. Cover every
  essential element a court would require for this document type, then
  stop. Better to be short and correct than long and padded.
- Cite AT MOST 1 real, well-known Indian precedent per legal issue,
  and ONLY when you are CERTAIN the citation is real and applies on
  these facts. If unsure, skip the citation entirely. A missing
  citation is far better than a fabricated one.
- Quote statutory provisions by section number only (e.g. "u/s 138 NI
  Act") rather than reproducing the full statutory text.
- Skip the Index of Documents and the Annexure schedule.
- Verification: brief, one numbered paragraph. Not clause-by-clause.
- Prayer: 2-4 numbered points covering main relief and costs. No
  alternative-prayer schedule, no interim prayer block (unless it's
  the document's whole purpose, e.g. a stay application).
- Section headings: ALL CAPS on their own line, no markdown, no asterisks, no bold markers. No multi-level numbering.
- Every name, date, address, amount, and section reference from the
  user input must be reproduced EXACTLY. Use [BRACKETED PLACEHOLDER]
  for anything missing - never invent.`

// ─── Build final system prompt ─────────────────────────────────────
// `opts.isPro` selects Pro vs Free addendum. When undefined we default
// to the legacy (Pro-style) behavior to avoid silent regressions.
// Document types that are NOT court filings — notices, correspondence and
// executed instruments. For these the selected court supplies jurisdiction
// context only (state statutes, stamp duty), and the document must NEVER
// open with a court name. Vakalatnama is deliberately excluded: it names
// the court and case title, so it keeps the full court addendum.
const NON_FILING_TYPES = new Set([
  'LEGAL_NOTICE', 'CHEQUE_BOUNCE', 'LEGAL_EMAIL',
  'CONTRACT', 'RENT_AGREEMENT', 'SALE_DEED',
  // Addressed to an authority (CPIO / SHO), NOT presented to a court —
  // so they must never open with a court cause title. Their own base
  // prompts already produce the correct "TO: ..." addressee block.
  'RTI_APPLICATION', 'FIR_COMPLAINT',
  // Advisory documents to a client — a legal opinion and a memorandum are
  // NOT filed in a court and must NOT carry a cause title, prayer or
  // court-style verification. The full court addendum ("Format this for
  // the HIGH COURT ...") was making the model turn a memo into a petition.
  'MEMORANDUM', 'LEGAL_OPINION',
])

// Document types that are advisory or correspondence, not sworn court
// filings — they must NOT carry a pleading-style verification clause,
// signature-on-oath, prayer or witness-attestation block. They get the
// lexicon register but not the SUPREME_COURT_STYLE pleading furniture.
const NO_PLEADING_STYLE_TYPES = new Set([
  'MEMORANDUM', 'LEGAL_OPINION', 'CASE_BRIEF', 'LEGAL_EMAIL',
])

// Jurisdiction-only context for non-filing documents.
function jurisdictionOnlyAddendum(court) {
  const where = court ? `the matter arises within the jurisdiction of ${court.replace(/_/g, ' ')}; use this SOLELY to select the correct state statutes, stamp-duty/registration references and local conventions. ` : ''
  return ` JURISDICTION CONTEXT ONLY: ${where}THIS DOCUMENT IS NOT A COURT PLEADING — do NOT name or reference any court, do NOT begin with "IN THE ... COURT" or any cause title, do NOT add a case-number block, and do NOT add a court-style PRAYER ("this Hon'ble Court may be pleased to ...") or pleading VERIFICATION clause. Use the closing that belongs to this document type (notice: signature; deed: testimonium and witnesses; email: sign-off; opinion/memo: the advocate's signature block; RTI/FIR: the prescribed declaration).`
}

function buildSystemPrompt(documentType, court, language, opts = {}) {
  const base = BASE_PROMPTS[documentType] || BASE_PROMPTS.LEGAL_NOTICE
  const nonFiling = NON_FILING_TYPES.has(documentType)
  // FIDELITY_MANDATE goes FIRST so it has the highest salience for the model and
  // overrides any conflicting instructions elsewhere in the prompt chain.
  // Anything without pleading furniture (notices/deeds/emails AND the
  // analytical types — case brief, memo, opinion) gets the Pro addendum
  // WITHOUT the index/annexure/prayer/verification instructions, which
  // otherwise pull the model into drafting a petition.
  const tierAddendum = opts.isPro === false
    ? FREE_LIMITER
    : (NO_PLEADING_STYLE_TYPES.has(documentType) ? PRO_ADDENDUM_NONFILING : PRO_ADDENDUM)
  // LEGAL_EMAIL is correspondence, not a filing — it gets the lexicon
  // (email register) but not the court layout mandate.
  const layoutMandate = NO_PLEADING_STYLE_TYPES.has(documentType) ? '' : COURT_FORMAT_MANDATE
  // Notices, emails and deeds get jurisdiction context only — the full
  // court addendum ("Format this for the DISTRICT & SESSIONS COURT ...")
  // contradicts their own formats and was leaking cause titles into them.
  const courtBlock = NON_FILING_TYPES.has(documentType)
    ? jurisdictionOnlyAddendum(court)
    : courtAddendum(court)
  // Advisory / correspondence documents (memo, opinion, case brief, email)
  // must NOT inherit the pleading verification/prayer/signature-on-oath
  // furniture from SUPREME_COURT_STYLE — that was leaking absurd
  // "VERIFICATION" and "WITNESS SIGNATURE" blocks into emails and memos.
  const styleBlock = NO_PLEADING_STYLE_TYPES.has(documentType) ? '' : SUPREME_COURT_STYLE
  // PRO ONLY: the elevated register (weightier verbs, doctrinal nouns of
  // art, Latin, varied connectives) is what makes a Pro draft read like a
  // Senior Advocate's own work. Free deliberately never receives it, so
  // Free output stays plain, predictable and consistent run to run.
  const proRegister = opts.isPro === false ? '' : PRO_ELEVATED_REGISTER
  // Court vocabulary for the drafting language (Hindi / Urdu / Tamil /
  // Telugu / bilingual). Empty for English.
  const languageLexicon = buildLanguageLexicon(language)
  // ORDER MATTERS. The elevated register goes LAST: when it sat in the
  // middle it was buried under the long document-specific base prompt and
  // the model ignored it (measured: 1 heavy-register phrase in a Pro draft,
  // i.e. no better than Free). Trailing position gives it recency salience.
  return (
    FIDELITY_MANDATE +
    CITATION_MANDATE +
    layoutMandate +
    buildLexiconBlock(documentType) +
    base +
    styleBlock +
    courtBlock +
    languageAddendum(language) +
    languageLexicon +
    tierAddendum +
    proRegister +
    CASE_LAW_GUARD
  )
}

// ─── Generate legal document ──────────────────────────────────────
export async function generateLegalDocument(documentType, details, court = null, language = 'english', opts = {}) {
  const systemPrompt = buildSystemPrompt(documentType, court, language, opts)
  const nonFiling    = NON_FILING_TYPES.has(documentType)
  // Non-filing documents (notices, deeds, emails) must not be framed as
  // being "for" a court — the court only supplies jurisdiction context.
  const courtLabel   = court && !nonFiling ? ` for ${court.replace(/_/g, ' ')}` : ''
  const langNote     = language !== 'english' ? ` in ${language}` : ''

  // Determine jurisdiction context for user message
  const isTNcourt = court && (court.startsWith('MADRAS_HC') || court.startsWith('MADURAI_BENCH') || court.startsWith('TN_'))
  const courtJurisdictionLabel = court ? court.replace(/_/g, ' ') : 'the specified court'
  const jurisdictionNote = nonFiling
    ? `${court ? `${courtJurisdictionLabel} jurisdiction — use only to select the correct state statutes and local references. ` : ''}This document is NOT a court filing: do not name any court in it or give it a cause title.`
    : isTNcourt
    ? 'Tamil Nadu / Madras High Court jurisdiction — cite Tamil Nadu statutes and Madras HC / Supreme Court of India precedents (real ones only).'
    : court
      ? `${courtJurisdictionLabel} jurisdiction — cite the applicable state statutes and the High Court / Supreme Court of India precedents that govern this court (real ones only).`
      : 'Cite applicable Indian statutes and Supreme Court of India precedents. Apply the relevant High Court or jurisdictional rules based on the court specified in the case details.'

  const styleNote = `
Cast the case details below into a complete, court-ready ${documentType.replace(/_/g, ' ')} per the layout and fidelity rules above: elevated legal English, correct structure, every factual particular reproduced exactly, bracketed placeholders for anything missing, real precedents only.`

  // Pro gets a much larger token budget so the longer Pro structure can
  // fit. Free is capped at ~1,200-1,400 words - enough room for a
  // complete, accurate, court-usable document at the chosen length.
  // If the user supplied a specific targetWords (already rounded to the
  // nearest 10 and tier-clamped upstream), honour it — set max_tokens to
  // ~2.2x the target word count. Formal Indian legal English runs closer
  // to 1.6-1.8 tokens/word than casual prose, and the mandatory closing
  // furniture (prayer, verification, signature/execution block, and for
  // Pro the Index of Documents + Annexure list) adds several hundred
  // tokens on top of the body — a tighter multiplier was cutting
  // documents off before they reached their own signature block, which
  // is exactly the kind of defect a judge would flag immediately.
  // generateCourtDocument() below is a second line of defence: if this
  // budget still isn't enough, it detects the truncation and asks the
  // model to finish the document rather than shipping it incomplete.
  // NOTE: these MUST be declared before `userMessage` because the template
  // literal below interpolates `lengthInstruction`. Referencing it before
  // its `let` declaration throws a ReferenceError (TDZ), which surfaces to
  // the user as the generic "Failed to generate document" error.
  const tierCap = opts.isPro === false ? 2600 : 8500
  let maxTokens = tierCap
  let lengthInstruction = ''
  if (typeof opts.targetWords === 'number' && opts.targetWords > 0) {
    const t = Math.round(opts.targetWords / 10) * 10
    maxTokens = Math.min(tierCap, Math.round(t * 2.2))
    lengthInstruction =
      `\n\nTARGET LENGTH: Aim for approximately ${t} words (give or take 10%). ` +
      `Do NOT pad with filler or invent facts to hit this number — fidelity to the user's input always wins. ` +
      `If the input is too sparse to support ${t} words faithfully, write a shorter, accurate document with bracketed placeholders rather than padding.`
  }

  // Pull the most relevant central acts based on the user's facts +
  // document type, and inject them as a grounded reference block.
  // The model is instructed (in CITATION_MANDATE) to cite from this
  // block using the FULL official names. For sparse / unusual matters
  // findApplicableLaws returns [] and the block is omitted.
  const lawsBlock = buildLawsPromptBlock(`${documentType} ${details}`, 4)

  const readyLabel = nonFiling ? 'professional, ready-to-use' : 'complete, court-ready'
  const userMessage = `Draft a ${readyLabel} ${documentType.replace(/_/g, ' ')}${courtLabel}${langNote} using the following user-provided case details. These details are AUTHORITATIVE — reproduce names, dates, addresses, amounts and numbers exactly as written below.

══════ USER-PROVIDED CASE DETAILS (verbatim — do not alter) ══════
${details}
══════ END OF USER-PROVIDED CASE DETAILS ══════

${lawsBlock}
Jurisdiction: ${jurisdictionNote}
${styleNote}${lengthInstruction}

REMINDER: Any name, date, address, amount, FIR number, cheque number, or other particular not present above must be a bracketed placeholder, NOT invented content. Cite every statute by its FULL official name and EXACT section / article number per the CITATION RULES.${
  language && language !== 'english'
    ? `\n\nLANGUAGE CHECK (do this before you finish): the whole document — every heading, averment, ground, the prayer and the verification — must be in ${language === 'bilingual' ? 'English with the required Hindi sections' : language}. If any part drifted into English, rewrite that part. Only Act names, section numbers, citations and the user's own names/figures stay in English.`
    : ''
}${
  opts.isPro === false
    ? ''
    : `\n\nPRO DRAFT: this is for a practising advocate. Argue every ground fully (proposition → application to these facts → consequence in law), and write in the elevated register defined above — plain workmanlike prose is not acceptable at this tier.`
}`

  try {
    const text = await generateCourtDocument([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ], maxTokens, 0.1, { isPro: opts.isPro, documentType, advisory: NO_PLEADING_STYLE_TYPES.has(documentType), detailsExcerpt: String(details || '').slice(0, 1200) })  // lower temperature → less invention
    return text || fallback(documentType, details)
  } catch (err) {
    // Surface refusal, rate-limit and auth conditions to the caller so the
    // route can return a clear, actionable message (and NOT persist the raw
    // undrafted template as if it were a real draft). Only genuinely
    // unexpected failures fall through to the verbatim-input fallback.
    if (err?.code === 'AI_REFUSAL' || err?.code === 'GROQ_RATE_LIMIT' || err?.code === 'GROQ_AUTH') throw err
    console.error('Groq generateLegalDocument error:', err)
    return fallback(documentType, details)
  }
}

// ─── Generate Merits & Demerits conclusion ─────────────────────────
// Pro users get a deeper, longer analysis. Free users get a brief summary.
export async function generateMeritsDemerits(documentType, content, templateData = {}, court = null, opts = {}) {
  const isTNcourt = court && (court.startsWith('MADRAS_HC') || court.startsWith('MADURAI_BENCH') || court.startsWith('TN_'))
  const courtCtx  = isTNcourt ? 'Tamil Nadu / Madras HC'
    : court ? court.replace(/_/g, ' ') : 'Indian courts'

  const templateSummary = Object.entries(templateData || {})
    .filter(([, v]) => v?.toString().trim())
    .slice(0, 12)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const isFree = opts.isPro === false
  const depthInstruction = isFree
    ? 'Under each heading, provide 2-3 specific, accurate bullet points (one sentence each). Reference sections by number only. Cite a precedent only if you are certain it is real and on-point. Keep the entire analysis under 300 words.'
    : 'Under each heading, provide 4-6 detailed numbered points. Each point should cite a specific section, rule, or precedent where applicable. Aim for 700-900 words total.'

  try {
    const text = await chatComplete([
      {
        role: 'system',
        content: `You are a highly experienced Senior Advocate specializing in ${courtCtx} jurisdiction. You are tasked with providing a frank, objective legal assessment of a generated legal document. Structure your response using EXACTLY these section headers:\n\n## MERITS\n## DEMERITS\n## LEGAL RISKS\n## RECOMMENDATIONS\n\n${depthInstruction}\n\nBe direct, honest, and legally precise. Reference applicable Indian law sections where relevant. The conclusion is for the client's and advocate's internal use. Never fabricate citations.`,
      },
      {
        role: 'user',
        content: `Please analyze the following ${documentType.replace(/_/g, ' ')} and provide a structured conclusion covering its merits, demerits, legal risks, and recommendations.\n\nCASE DETAILS:\n${templateSummary}\n\nGENERATED DOCUMENT SUMMARY (first 2000 chars):\n${(content || '').substring(0, 2000)}\n\nProvide a balanced, honest legal analysis.`,
      },
    ], isFree ? 450 : 2200, 0.2, { isPro: opts.isPro })
    return text || null
  } catch (err) {
    console.error('Groq generateMeritsDemerits error:', err)
    return null
  }
}

// ─── Pro AI Case Assistant (multi-turn chatbot) ────────────────────
// Conversational helper that:
//   • Answers the user's case-strategy questions
//   • Suggests favorable IPC / CrPC / IT-Act / NI-Act / etc. sections
//     that strengthen the user's side
//   • Surfaces real Indian precedents that apply
//
// Inputs:
//   messages       — array of { role: 'user'|'assistant', content: string }
//   draftContext   — optional { documentType, court, title, content, templateData }
//
// Subject to FIDELITY_MANDATE: never invent fake sections / fake cases.
// If unsure, the assistant says so plainly.
const ASSISTANT_SYSTEM = `You are LexForge AI's Case Assistant — a Senior-Advocate-grade
chatbot helping a paying Pro-tier Indian advocate strategize on a live case.

YOUR JOB:
1. Answer questions about the case clearly and concisely.
2. Proactively suggest IPC / CrPC / Constitution / NI Act / IT Act / Contract
   Act / Evidence Act / special-statute SECTIONS that FAVOR the user's side.
   For each suggested section, explain WHY it applies in one sentence.
3. Cite REAL Indian Supreme Court / High Court precedents (case name + year +
   citation) only when you are certain. If unsure, say "I'm not sure of a
   specific precedent on this point — recommend cross-checking on Indian
   Kanoon / SCC Online before relying on it."
4. Be direct. No hedging, no fluff, no Latin maxims unless they fit naturally.
5. If the user's question is outside Indian law (e.g., US law), say so and
   redirect.

HARD RULES:
- NEVER fabricate a section number, case citation, or statute name.
- NEVER give the answer a defendant's lawyer would prefer if the user is
  drafting for the petitioner / complainant side (and vice versa) — always
  argue for the user's stated side.
- Keep answers under 400 words unless the user explicitly asks for more.
- When suggesting IPC sections, prefer giving 2-4 strong ones with reasoning
  over a long list of weak ones.

FORMAT:
- Use short paragraphs.
- For section suggestions, format as:
    **Section X, [Statute name]** — one-sentence relevance.
- For precedent citations, format as:
    *Case name, [year] citation* — one-sentence ratio.`

export async function caseAssistant(messages, draftContext = null, opts = {}) {
  // Build a context preamble from the live draft (if any).
  let contextBlock = ''
  if (draftContext) {
    const dt = (draftContext.documentType || '').replace(/_/g, ' ')
    const court = draftContext.court || 'unspecified'
    const title = draftContext.title || ''
    const tdata = draftContext.templateData
      ? Object.entries(draftContext.templateData)
          .filter(([, v]) => v?.toString().trim())
          .slice(0, 15)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join('\n')
      : ''
    const excerpt = (draftContext.content || '').substring(0, 1500)
    contextBlock = `\n\n─── CURRENT CASE CONTEXT ───\nDocument type: ${dt}\nCourt: ${court}\nTitle: ${title}\n${tdata ? `Key facts:\n${tdata}\n` : ''}${excerpt ? `Document excerpt (first 1500 chars):\n${excerpt}\n` : ''}─── END CONTEXT ───`
  }

  // Sanitize incoming messages — only user/assistant roles, trim long content.
  const safeMessages = (Array.isArray(messages) ? messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)  // last 12 turns max
    .map(m => ({ role: m.role, content: m.content.substring(0, 4000) }))

  if (safeMessages.length === 0) {
    return 'Hi! I\'m your Case Assistant. Ask me anything about your case — I can suggest favorable IPC / CrPC sections, surface relevant precedents, and help you frame arguments. What would you like help with?'
  }

  // Pull a relevant-laws block based on the user's latest question +
  // the live document context so the chat answer cites correct sections.
  const lastUserMsg = [...safeMessages].reverse().find(m => m.role === 'user')?.content || ''
  const lawsBlock = buildLawsPromptBlock(
    `${lastUserMsg} ${draftContext?.documentType || ''} ${draftContext?.title || ''}`,
    6,
  )

  try {
    const text = await chatComplete([
      { role: 'system', content: ASSISTANT_SYSTEM + CITATION_MANDATE + contextBlock + (lawsBlock ? `\n\n${lawsBlock}` : '') },
      ...safeMessages,
    ], 1200, 0.3, { isPro: true })  // assistant always uses Pro models
    return text || 'Sorry, I couldn\'t generate a response. Please try rephrasing.'
  } catch (err) {
    console.error('caseAssistant error:', err)
    if (err?.code === 'AI_REFUSAL') {
      return 'I can\'t help with that specific request. Please rephrase or check your case details for inappropriate language.'
    }
    return 'The assistant is temporarily unavailable. Please try again in a moment.'
  }
}

// ─── Analyze legal issue ──────────────────────────────────────────
/**
 * Analyse a legal issue.
 *
 * This function used to ask the model for "key precedents with citations"
 * and print whatever came back. A language model has no case database —
 * asked to recall citations it produces plausible-looking ones that do not
 * exist. Users reported exactly that: real-sounding case names with wrong
 * citations. For a lawyer that is worse than useless, because a fabricated
 * citation carried into a filing is a professional disaster.
 *
 * So the model is no longer the source of case law. Judgments are retrieved
 * first from the real index and passed in here as `cases`; the model may
 * only discuss what it has been handed, and is forbidden from naming
 * anything else. When nothing was retrieved it must say so rather than
 * fill the gap from memory.
 *
 * Statutes are different and stay with the model, bounded: `acts` comes
 * from the local corpus in lib/indian-laws.js, and section numbers are far
 * more stable in training data than case citations. The retrieved Acts are
 * still supplied so it works from the list rather than recall.
 *
 * @param issue  the user's question
 * @param opts   { court, cases: [{title, court, date, citation}], acts: [] }
 */
export async function analyzeLegalIssue(issue, opts = {}) {
  // Back-compat: this used to be called as analyzeLegalIssue(issue, court).
  const o = typeof opts === 'string' ? { court: opts } : (opts || {})
  const { court = null, cases = [], acts = [], userId = null } = o

  const courtCtx = court
    ? ` The matter is before ${String(court).replace(/_/g, ' ')}.`
    : ''

  const caseBlock = cases.length
    ? 'VERIFIED JUDGMENTS — these were retrieved from a real case-law index.\n' +
      'You may discuss ONLY these. Refer to them exactly as titled.\n\n' +
      cases.map((c, i) =>
        `[${i + 1}] ${c.title}\n    Court: ${c.court || 'not stated'}` +
        `${c.date ? `\n    Date: ${c.date}` : ''}` +
        `${c.citation ? `\n    Citation: ${c.citation}` : ''}`
      ).join('\n\n')
    : 'NO JUDGMENTS WERE RETRIEVED for this issue.'

  const actBlock = acts.length
    ? 'APPLICABLE STATUTES from the verified library:\n' +
      acts.map(a =>
        `- ${a.fullName || a.shortName}` +
        (a.sections?.length ? `\n    ${a.sections.map(s => `${s.n}: ${s.desc}`).join('\n    ')}` : '')
      ).join('\n')
    : 'No statutes were matched automatically.'

  const rules = cases.length
    ? '- Discuss ONLY the judgments listed above, by their exact titles.\n' +
      '- Do NOT name, invent or recall any other case, however well known.\n' +
      '- Do NOT invent or complete a citation. If a citation is not given above, do not state one.'
    : '- Cite NO case law whatsoever. None was retrieved.\n' +
      '- Under the "Supporting judgments" heading write exactly: ' +
      '"No judgments were retrieved for this issue. Search case law directly before relying on any precedent."\n' +
      '- Do NOT fall back on cases you remember. A remembered citation is a fabricated one.'

  try {
    const text = await chatComplete([
      {
        role: 'system',
        content:
`You are an experienced Indian legal analyst advising a practising advocate.${courtCtx}

${caseBlock}

${actBlock}

ABSOLUTE RULES ON CASE LAW — these override everything else:
${rules}
- Never state a case name, citation, year, judge or bench that does not appear above.
- It is far better to give no authority than a wrong one.

Structure the answer under these headings, in plain text, no markdown:
LEGAL ANALYSIS
APPLICABLE LAW
SUPPORTING JUDGMENTS
RECOMMENDED COURSE OF ACTION

Under APPLICABLE LAW give exact Act names and section numbers. For criminal
matters note the 2024 change: IPC to BNS 2023, CrPC to BNSS 2023, Evidence
Act to BSA 2023 — old code for offences before 01.07.2024, new code after.
Be concise and practical.`,
      },
      { role: 'user', content: `Analyse this legal issue under Indian law:\n\n${issue}` },
    ], 1800, 0.15, { userId, operation: 'analyze' })

    return text || 'Analysis unavailable. Please check your GROQ_API_KEY.'
  } catch (err) {
    console.error('Groq analyzeLegalIssue error:', err)
    return 'Analysis unavailable. Please check your GROQ_API_KEY.'
  }
}

// ─── Turn a lawyer's case description into a case-law search query ──
//
// The gap this closes: a lawyer describes a matter the way it happened
// ("my client's cheque bounced and the other side is now claiming the
// signature was forged"), but a case-law index ranks on the language
// judgments are written in ("dishonour of cheque section 138 rebuttal
// of presumption section 139 forged signature"). Searching the raw
// narrative returns noise.
//
// So the model does one job only: restate the facts as the legal issue,
// in the vocabulary a judgment would use. It deliberately does NOT
// answer the question or pick authorities — that is what the search
// index is for, and a model inventing case names is exactly the
// hallucination this feature exists to avoid.
export async function buildCaseSearchQuery(details, { userId = null } = {}) {
  const parts = [
    details.facts && `FACTS:\n${details.facts}`,
    details.reliefSought && `RELIEF SOUGHT: ${details.reliefSought}`,
    details.documentType && `MATTER TYPE: ${String(details.documentType).replace(/_/g, ' ')}`,
    details.court && `COURT: ${String(details.court).replace(/_/g, ' ')}`,
    details.actsInvolved && `ACTS/SECTIONS THE LAWYER ALREADY HAS IN MIND: ${details.actsInvolved}`,
  ].filter(Boolean).join('\n\n')

  const fallback = String(details.facts || '')
    .replace(/\s+/g, ' ')
    .split(' ').slice(0, 30).join(' ')
    .trim()

  try {
    const text = await chatComplete([
      {
        role: 'system',
        content:
          'You convert an Indian lawyer\'s description of their case into a search query for a database of Indian judgments.\n\n' +
          'Return ONLY the query text. No preamble, no explanation, no quotes, no bullet points.\n\n' +
          'Rules:\n' +
          '- 8 to 25 words.\n' +
          '- Use the vocabulary that appears in judgments: doctrines, statutory phrases, and the names and section numbers of Acts.\n' +
          '- Include section numbers where the facts clearly point to one (e.g. "Section 138 Negotiable Instruments Act").\n' +
          '- Strip all party names, dates, amounts, addresses and case numbers. They narrow the search to nothing.\n' +
          '- Do NOT name any judgment, citation or case. You are writing a query, not answering it.\n' +
          '- If the facts are too vague to identify a legal issue, return the key legal nouns only.',
      },
      { role: 'user', content: parts || String(details.facts || '') },
    ], 120, 0.15, { userId, operation: 'query' })

    const cleaned = String(text || '')
      .replace(/^["'`\s]+|["'`\s]+$/g, '')
      .replace(/^(query|search)\s*:\s*/i, '')
      .split('\n')[0]
      .trim()

    // A model that ignored the word limit produced something unusable
    // as a query; the raw facts search better than a paragraph does.
    return (cleaned && cleaned.split(/\s+/).length <= 40) ? cleaned : fallback
  } catch (err) {
    console.error('[groq] buildCaseSearchQuery:', err?.message)
    return fallback
  }
}

// ─── Extract case details from uploaded/pasted document ───────────
// SERVICE-AWARE: for each of the 20 document types we feed the model
// the EXACT field schema the intake form expects (lib/document-fields
// .js), so a folder / single-file upload pre-fills the correct fields
// for THAT specific service — instead of returning arbitrarily-named
// keys the form can't map. Used by /api/extract for both the "Paste
// Document" and "Upload Folder / File" intake methods.
//
// Bound by the same input-fidelity rule as the rest of the app: only
// pull values that actually appear in the source text — never invent.
export async function extractDocumentDetails(documentType, rawText) {
  try {
    const source = String(rawText || '')
    // Sample large folder uploads — keep the head (parties, cause-title)
    // and the tail (prayer / relief / signatures), which is where the
    // most form-relevant detail usually sits.
    const sampled = source.length > 9000
      ? source.slice(0, 6500) + '\n\n[…middle of source omitted for length…]\n\n' + source.slice(-2500)
      : source

    const schema    = fieldSchemaForPrompt(documentType)
    const fieldDefs = DOC_FIELDS[documentType] || []
    const keyList   = fieldDefs.map(f => f.name)

    // When we know the document type's schema, force the model to return
    // JSON keyed by the EXACT field names that type's form uses.
    const sys = schema
      ? `You are a precise legal-document intake parser for Indian legal drafting.
You are given the raw text of one or more case documents and a TARGET document type.
Your job is to extract the details needed to fill that document type's intake form.

STRICT RULES:
- Return ONLY a raw JSON object — no markdown, no commentary, no code fences.
- Use EXACTLY these JSON keys, and no others:
${keyList.map(k => `    "${k}"`).join('\n')}
- For every key, put the value found in the source text as a plain string.
- If a detail is genuinely NOT present in the source, use an empty string "" for that key — do NOT guess, invent or hallucinate names, dates, numbers or citations.
- Reproduce names, dates, addresses, amounts and case/FIR numbers EXACTLY as written in the source.
- For long / narrative fields, write a full, faithful paragraph (or numbered points) drawn only from the source.`
      : `You are a legal document parser. Extract structured case details from the provided legal document text. Return ONLY a valid JSON object — no explanation, no markdown — with field names and string values extracted from the document.`

    const usr = schema
      ? `TARGET DOCUMENT TYPE: ${documentType.replace(/_/g, ' ')}

FIELD SCHEMA (key: kind — label. guidance):
${schema}

SOURCE DOCUMENT TEXT:
"""
${sampled}
"""

Return the JSON object now, using exactly the keys listed above.`
      : `Document Type: ${documentType}\n\nExtract all relevant details from this text and return a JSON object:\n\n${sampled.substring(0, 4000)}\n\nReturn only valid JSON with string values.`

    const raw = await chatComplete([
      { role: 'system', content: sys },
      { role: 'user',   content: usr },
    ], 1800, 0.1)
    if (!raw) return {}

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return {}
    let parsed
    try { parsed = JSON.parse(match[0]) } catch (_e) { return {} }
    if (!parsed || typeof parsed !== 'object') return {}

    // Normalise the model output: coerce non-string values to strings,
    // drop empties, and — when we have a schema — keep only the keys the
    // form actually uses (silently discard any hallucinated extras).
    const allowed = keyList.length ? new Set(keyList) : null
    const out = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (allowed && !allowed.has(k)) continue
      let val = v
      if (Array.isArray(val)) {
        val = val
          .map(item => (item && typeof item === 'object') ? Object.values(item).join(' — ') : String(item))
          .filter(Boolean)
          .join('\n')
      } else if (val && typeof val === 'object') {
        val = Object.values(val).map(String).filter(Boolean).join('\n')
      } else if (val == null) {
        val = ''
      } else {
        val = String(val)
      }
      val = val.trim()
      if (val) out[k] = val
    }
    return out
  } catch (err) {
    console.error('Groq extractDocumentDetails error:', err)
    return {}
  }
}

// ─── Generate SHORT case brief from a folder/pile of case documents ──
// Different from generateLegalDocument(CASE_BRIEF, ...) which produces
// a full Senior-Advocate IRAC. This produces a CONDENSED, executive-style
// brief — meant to be read in 2 minutes by a lawyer scanning a new file.
//
// Subject to FIDELITY_MANDATE: do not invent facts or citations not
// present in the source materials.
// Build the system + user messages used by both the blocking and the
// streaming case-brief generators.  Kept as a single helper so both
// variants stay in lock-step.
export function buildCaseBriefMessages(rawText, opts = {}) {
  // Cap input to keep latency and cost predictable. We split smartly so
  // we keep the head and tail of large piles (often the FIR + judgment).
  // Budget scales with the user's plan because Groq enforces a per-minute
  // token cap (TPM) that's much tighter for free accounts:
  //   • free  → ~6K TPM on 8B-instant   → very small slice
  //   • pro   → 70B context allows ~45K chars
  // `opts.shrink` (0..1) lets the retry path further compress the input
  // when we trip a rate-limit and have to fall back.
  const isFree = opts.isPro === false
  const shrink = typeof opts.shrink === 'number' && opts.shrink > 0 && opts.shrink < 1
    ? opts.shrink
    : 1

  // Build the sampled "trimmed" view of the source.
  // ───────────────────────────────────────────────
  // Free Groq (12K TPM):
  //   For long docs we take 12 windows of ~600 chars each, spread EVENLY
  //   across the entire document — so the brief draws facts from start,
  //   middle, AND end (covers roughly the whole file, not just the first
  //   3 pages).  Total input: ~7K chars (~5-6K tokens Hindi) + ~1K system
  //   + 1K max_tokens = ~8K total tokens → fits comfortably in 12K TPM.
  //
  // Paid Groq:
  //   Full 30K HEAD + 15K TAIL slice (no need to sample — the model has
  //   plenty of context window and TPM).
  let trimmed
  if (isFree) {
    const WINDOW_COUNT = Math.max(1, Math.floor(12 * shrink))
    const WINDOW_CHARS = Math.max(200, Math.floor(600 * shrink))
    const text         = rawText || ''
    if (text.length <= WINDOW_COUNT * WINDOW_CHARS + 500) {
      // Short enough to send in full
      trimmed = text
    } else {
      // Evenly-spaced windows — start, middle, end and everything between.
      const denom  = Math.max(1, WINDOW_COUNT - 1)
      const pieces = []
      for (let i = 0; i < WINDOW_COUNT; i++) {
        const start = Math.floor((i * (text.length - WINDOW_CHARS)) / denom)
        pieces.push(
          `══ Section ${i + 1} of ${WINDOW_COUNT} (chars ${start}-${start + WINDOW_CHARS}) ══\n` +
          text.slice(start, start + WINDOW_CHARS)
        )
      }
      trimmed = pieces.join('\n\n')
    }
  } else {
    const HEAD = Math.max(800, Math.floor(30_000 * shrink))
    const TAIL = Math.max(400, Math.floor(15_000 * shrink))
    trimmed = rawText.length > (HEAD + TAIL + 200)
      ? rawText.slice(0, HEAD) + '\n\n[…middle of folder truncated for brevity…]\n\n' + rawText.slice(-TAIL)
      : rawText
  }

  const courtCtx = opts.court
    ? ` Apply ${opts.court.replace(/_/g, ' ')} jurisdiction conventions where relevant.`
    : ''
  const language = opts.language || 'english'
  const langDirective =
    language === 'hindi'
      ? '\n\nIMPORTANT: Draft the entire brief in court-standard Hindi (Devanagari). Keep statutory section numbers and Act names in their original English form per court convention.'
      : language === 'bilingual'
        ? '\n\nIMPORTANT: Draft the brief in English, but provide the SUMMARY and KEY ARGUMENTS sections also in Hindi (Devanagari) immediately below their English versions, marked "(हिन्दी)".'
        : ''

  const system = FIDELITY_MANDATE + `

You are a Senior Advocate reading a fresh case file for the first time.
Your job is to produce a SHORT, executive-style case brief that a busy
lawyer can read in 2 minutes and immediately understand:
  • what the matter is about
  • who the parties are
  • what's already happened procedurally
  • what the legal issues are
  • the likely strategy

DO NOT produce a full IRAC academic brief. Be punchy, concrete, and
reference ONLY facts and citations that actually appear in the source
materials provided. Where a fact is missing, write "[not found in
file]" — never invent.${courtCtx}${langDirective}

OUTPUT STRUCTURE (use these exact section headers, in this order):

# CASE BRIEF — SHORT
**Read time: ~2 minutes**

## 1. PARTIES
A 1-line description of each party as they appear in the file.

## 2. NATURE OF DISPUTE
2-3 sentences describing what the case is fundamentally about.

## 3. CHRONOLOGY
A bullet list of the key dated events extracted from the file
(date in DD/MM/YYYY format where available — quote the file's date format).

## 4. LEGAL ISSUES
Numbered list of 2-5 precise legal questions arising on these facts.

## 5. APPLICABLE LAW
Sections / Acts / Articles actually cited or clearly engaged. Use the
canonical form "Section X of <Act Name>, <Year>". Do NOT invent.

## 6. EVIDENCE & DOCUMENTS ON RECORD
Bullet list of the documents present in the folder, with a one-line
note on what each contributes to the case.

## 7. PROCEDURAL POSTURE
Where the matter currently stands — last hearing, last order, next date
(if mentioned). If not mentioned, write "Not mentioned in file".

## 8. STRENGTHS
3-5 specific points that favour our side. Tie each to a fact in the file.

## 9. WEAKNESSES / RISKS
3-5 specific concerns. Tie each to a fact in the file.

## 10. RECOMMENDED NEXT STEPS
A short bullet list of concrete next actions (file, draft, demand,
challenge, settle, etc.).

LENGTH: 700–1,100 words total. Tight, no padding. No marketing fluff.
TONE:   Senior-Advocate-to-junior. Direct. No pomp.`

  const user = `══════ CASE FILE — CONTENTS OF UPLOADED FOLDER ══════
The text below is from the user-uploaded case folder/file.  It may
appear as either: (a) one continuous block of text, (b) several files
delimited by "══════ FILE: <name> ══════", or (c) several sampled
"══ Section N of M (chars X-Y) ══" snippets taken at even intervals
across a very long document.  In case (c), the snippets are NOT
contiguous — they're a structured sampling so you can see the start,
middle and end of the file in one prompt.  Use whatever you can read
as ground truth.

${trimmed}

══════ END OF CASE FILE ══════

Now produce the SHORT case brief per the structure given. Remember:
do not invent facts, dates, sections, or citations that are not in
the file above. Use bracketed "[not found in file]" placeholders
where necessary.`

  return { system, user }
}

export async function generateShortCaseBrief(rawText, opts = {}) {
  if (!rawText || rawText.trim().length < 60) {
    return 'Insufficient content in the uploaded folder to draft a brief. Please ensure the folder contains readable text (.pdf with embedded text, .docx, .txt).'
  }
  const { system, user } = buildCaseBriefMessages(rawText, opts)

  try {
    const text = await chatComplete([
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ], opts.isPro === false ? 2200 : 4000, 0.15, { isPro: opts.isPro })
    return text || 'Unable to generate brief — please try again.'
  } catch (err) {
    if (err?.code === 'AI_REFUSAL') throw err
    console.error('Groq generateShortCaseBrief error:', err)
    return 'Unable to generate brief due to a backend error. Please try again.'
  }
}

// ─────────────────────────────────────────────────────────────────
//  Streaming variant — pushes token-level deltas through `onDelta`
//  as the model writes them, so the UI can render the brief in real
//  time at the same place. Returns the full text once finished.
//  Falls back through the same model list as `chatComplete()`.
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
//  Helpers for the long / chunked brief pipeline
// ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Pick N evenly-spaced reading windows from a long document.  When the
// document is short enough to read in full, returns N consecutive
// chunks instead.  Each window is { label, content }.
function pickWindows(text, count, windowSize) {
  const t = text || ''
  if (t.length <= count * windowSize) {
    // Fits inside the budget — read all of it as consecutive slices.
    const slice = Math.ceil(t.length / count)
    return Array.from({ length: count }, (_, i) => ({
      label:   `Section ${i + 1} of ${count}`,
      content: t.slice(i * slice, (i + 1) * slice),
    }))
  }
  const windows = []
  const denom   = Math.max(1, count - 1)
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * (t.length - windowSize)) / denom)
    windows.push({
      label:   `Section ${i + 1} of ${count}`,
      content: t.slice(start, start + windowSize),
    })
  }
  return windows
}

// Extract a compact factual digest from one window. Used as the "map"
// step of the long-document brief pipeline. max_tokens kept very small
// so the request comfortably fits a free-tier TPM bucket.
async function extractWindowFacts({ content, label }, model, isFree) {
  const system = `Paralegal task. Below is ONE PART of a longer case file. Extract a tight factual digest of what's in THIS PART ONLY. Use these labels (skip any with no info):
PARTIES:
DATES & EVENTS:
DOCUMENTS REFERENCED:
LEGAL PROVISIONS:
KEY FACTS:
COURT / PROCEDURAL POSTURE:

No invention. No conclusions. Just facts. Max ~100 words. If unreadable, return "(no usable facts in this section)".`
  const user = `══ ${label} ══\n${content}\n══ END ══\n\nExtract.`
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
    model,
    temperature: 0.1,
    max_tokens: isFree ? 250 : 600,
  })
  return completion.choices?.[0]?.message?.content?.trim() || ''
}

// Map-reduce brief for documents too large for a single request under
// the user's TPM budget.  Walks the WHOLE document in 4–6 windows
// (free) or 6–8 windows (pro), extracts a fact ledger from each, then
// streams the final synthesized brief from the ledger.
//
// Progress is reported in-band via [[META]]{...}[[/META]] markers so
// the client can show "Reading section 3/5…" without a separate channel.
export async function generateLongCaseBriefStream(rawText, opts = {}, onDelta) {
  const isFree     = opts.isPro === false
  const modelList  = opts.isPro ? PRO_MODELS : FREE_MODELS
  const extModel   = modelList[0]
  // Free tier (12K TPM on 70B) must fit ALL work in ~35s on Vercel Hobby's
  // 60s cap (Hindi tokens cost ~2.5x English, so we leave 25s headroom):
  // 3 windows × 2.5K chars (~2K tokens/call) + 3s spacing + 4s cooldown
  // + 800-token synthesis stream.
  const windowSize     = isFree ?  2_500 : 10_000
  const windowCount    = isFree ?      3 :       7
  const paceMs         = isFree ?  3_000 :   1_500
  const preSynthDelay  = isFree ?  4_000 :   1_000
  const synthMaxTokens = isFree ?    800 :   4_000
  // Hard time budget — if we approach the function timeout, bail out of
  // extraction early and synthesise with whatever ledger we've built.
  const HARD_BUDGET_MS = isFree ? 38_000 : 250_000
  const tStart = Date.now()

  const emitMeta = (obj) => {
    if (onDelta) onDelta(`[[META]]${JSON.stringify(obj)}[[/META]]`)
  }

  const windows = pickWindows(rawText, windowCount, windowSize)
  console.log(`[brief] chunked mode: ${windows.length} windows × ${windowSize}c, isFree=${isFree}, model=${extModel}`)
  emitMeta({ kind: 'init', total: windows.length, chars: rawText.length, mode: 'chunked' })

  // Phase 1 — extract a fact ledger from each window, paced to fit TPM.
  const facts = []
  for (let i = 0; i < windows.length; i++) {
    // Time-budget guard — if we're getting close to the function timeout,
    // bail out of extraction and synthesise with the ledger built so far.
    const elapsed = Date.now() - tStart
    if (elapsed > HARD_BUDGET_MS) {
      console.warn(`[brief] elapsed=${elapsed}ms > ${HARD_BUDGET_MS}ms — skipping remaining extraction windows`)
      emitMeta({ kind: 'budget', message: `Time budget reached — synthesising from ${facts.length}/${windows.length} sections.` })
      break
    }

    emitMeta({ kind: 'extract', current: i + 1, total: windows.length, label: windows[i].label })
    console.log(`[brief] extract window ${i + 1}/${windows.length} (elapsed=${Date.now() - tStart}ms)`)

    let attempt = 0
    let digest  = ''
    while (attempt < 2) {
      try {
        digest = await extractWindowFacts(windows[i], extModel, isFree)
        console.log(`[brief]   window ${i + 1} OK, ${digest.length}c facts`)
        break
      } catch (err) {
        const status = err?.status || err?.response?.status
        const msg    = err?.message || ''
        if (status === 401 || status === 403 || msg.includes('API key')) {
          const e = new Error('Invalid GROQ_API_KEY. Please check your .env.local file.')
          e.code = 'GROQ_AUTH'
          throw e
        }
        if (status === 429 || status === 413 || /rate_limit|tokens per minute|TPM|Request too large/i.test(msg)) {
          attempt += 1
          // shorter cooldown so we don't burn the whole budget
          const waitMs = 8_000
          emitMeta({ kind: 'wait', seconds: 8, reason: 'rate-limit cooldown' })
          await sleep(waitMs)
          continue
        }
        // unknown failure on this window — note and continue with what we have
        console.warn(`[brief] window ${i + 1} extraction failed:`, msg.slice(0, 200))
        digest = `(extraction failed for this section: ${msg.slice(0, 80)})`
        break
      }
    }
    facts.push(`══ PART ${i + 1}/${windows.length} ══\n${digest || '(no usable facts in this section)'}`)
    if (i < windows.length - 1) await sleep(paceMs)
  }

  // Always have at least one entry so synthesis can run even if every
  // window failed.
  if (facts.length === 0) {
    facts.push('══ PART 1/1 ══\n(All section extractions failed. The case file content was likely too dense for the current AI quota. Brief will be based on raw text instead.)')
  }

  // Cool-down before final synthesis so the TPM bucket has time to refill.
  emitMeta({ kind: 'cooldown', seconds: Math.round(preSynthDelay / 1000) })
  console.log(`[brief] cooldown ${preSynthDelay}ms before synthesis (elapsed=${Date.now() - tStart}ms)`)
  await sleep(preSynthDelay)

  // Phase 2 — synthesise the final brief from the ledger.
  emitMeta({ kind: 'synthesize', label: 'Drafting final brief from full-document ledger' })
  console.log(`[brief] synthesis start (elapsed=${Date.now() - tStart}ms, ledger=${facts.join('\n\n').length}c)`)

  const ledger      = facts.join('\n\n')
  const baseMessages = buildCaseBriefMessages(ledger, { ...opts, shrink: 1 })
  const synthSystem  = baseMessages.system +
    '\n\nNOTE: The content below is a FACT LEDGER compiled by reading ' + windows.length +
    ' sections spread across the ENTIRE case file. Treat each "PART x/N" block as ' +
    'ground truth — do NOT invent facts that are not in the ledger. The brief should ' +
    'reflect facts from across all parts, not just the first.'

  let lastErr = null
  let attemptIdx = 0
  for (const { shrink, maxTokens } of [
    { shrink: 1.0, maxTokens: synthMaxTokens },
    { shrink: 0.5, maxTokens: Math.max(800, Math.floor(synthMaxTokens * 0.7)) },
    { shrink: 0.25, maxTokens: 700 },
  ]) {
    const synth = shrink < 1
      ? buildCaseBriefMessages(ledger, { ...opts, shrink })
      : { user: baseMessages.user }

    for (const model of modelList) {
      try {
        console.log(`[brief] synthesis attempt shrink=${shrink} model=${model} maxTokens=${maxTokens}`)
        const stream = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: synthSystem },
            { role: 'user',   content: synth.user },
          ],
          model,
          temperature: 0.15,
          max_tokens: maxTokens,
          stream: true,
        })

        let full = ''
        let firstTokenLogged = false
        for await (const chunk of stream) {
          const delta = chunk?.choices?.[0]?.delta?.content || ''
          if (!delta) continue
          if (!firstTokenLogged) {
            console.log(`[brief]   synth first token at elapsed=${Date.now() - tStart}ms`)
            firstTokenLogged = true
          }
          full += delta
          if (onDelta) {
            try { onDelta(delta) } catch (_) {}
          }
        }
        console.log(`[brief]   synth done, ${full.length}c body, elapsed=${Date.now() - tStart}ms`)
        if (full && full.trim().length > 10) {
          if (isRefusal(full)) {
            const err = new Error(
              'The AI could not generate this brief. Please check that the case file does not contain offensive language and try again.'
            )
            err.code = 'AI_REFUSAL'
            throw err
          }
          emitMeta({ kind: 'done' })
          return full
        }
      } catch (err) {
        if (err?.code === 'AI_REFUSAL') throw err
        lastErr = err
        const status = err?.status || err?.response?.status
        const msg    = err?.message || ''
        if (status === 429 || status === 413 || /rate_limit|tokens per minute|TPM|Request too large/i.test(msg)) {
          // wait then break to outer shrink loop
          await sleep(12_000)
          break
        }
      }
    }
    attemptIdx++
  }

  if (lastErr) {
    const msg = lastErr?.message || 'Brief synthesis failed.'
    if (/rate_limit|tokens per minute|TPM/i.test(msg)) {
      const e = new Error(
        'The free-tier Groq quota is exhausted even with chunking. Wait ~60 seconds and try again, or upgrade to Groq Dev tier for higher limits.'
      )
      e.code = 'GROQ_RATE_LIMIT'
      throw e
    }
    throw lastErr
  }
  throw new Error('Failed to synthesise final brief from the ledger.')
}

export async function generateShortCaseBriefStream(rawText, opts = {}, onDelta) {
  if (!rawText || rawText.trim().length < 60) {
    const msg = 'Insufficient content in the uploaded folder to draft a brief. Please ensure the folder contains readable text (.pdf with embedded text, .docx, .txt).'
    if (onDelta) onDelta(msg)
    return msg
  }

  // ── App-tier vs Groq-tier decoupling ──
  // `opts.isPro` reflects the user's tier inside this product (admin flag,
  // paid plan, promo).  It does NOT mean the GROQ_API_KEY has a paid Groq
  // plan attached to it — that depends on the Groq account behind the key.
  // Set `process.env.GROQ_PAID_TIER=1` on the deployment ONLY when the Groq
  // key is upgraded to Dev tier or higher; otherwise we keep request size
  // tuned to the free-Groq TPM cap (≈12K TPM) regardless of who the user is.
  const groqPaid = process.env.GROQ_PAID_TIER === '1'

  // Chunked map-reduce is disabled by default on Vercel Hobby (60s cap).
  // Enable only when BOTH the Groq key is paid AND we're confident the
  // function can run the full pipeline (Vercel Pro = 300s).
  if (groqPaid && process.env.ENABLE_LONG_BRIEF === '1' && opts.isPro && rawText.length > 60_000) {
    return generateLongCaseBriefStream(rawText, opts, onDelta)
  }

  // For the single-call path, request size is bounded by the GROQ tier,
  // not the app tier.  So even an admin/Pro user on a free Groq key gets
  // the small-slice budget that fits in free-Groq's TPM bucket.
  const sizingIsPro = groqPaid && opts.isPro
  const isFree   = !sizingIsPro
  const baseMax  = isFree ? 1000 : 4000

  // On free Groq we use a single model. Falling through to the second one
  // after a rate-limit just trips a SECOND rate-limit in the same minute
  // and turns a transient 60s wait into a hard failure. On paid Groq we
  // keep both.
  const modelList = sizingIsPro
    ? PRO_MODELS
    : [FREE_MODELS[0]]

  // Single attempt only.  Free-tier TPM resets on a 60s rolling window;
  // if the first call rate-limits, additional retries in the same minute
  // just keep failing — better to tell the user "wait 30s and click
  // again" than to burn the function timeout on doomed retries.
  const attempts = [
    { shrink: 1.0, maxTokens: baseMax },
  ]

  // Quick sanity check on the env key shape so we fail fast with a clear
  // log line instead of a 60s hang when the key is wrong.
  const apiKey = process.env.GROQ_API_KEY || ''
  if (!apiKey || !apiKey.startsWith('gsk_')) {
    console.error(`[brief] FATAL: GROQ_API_KEY missing or malformed (len=${apiKey.length})`)
    const e = new Error('GROQ_API_KEY is missing or invalid on the server. Open Vercel → Settings → Environment Variables and confirm GROQ_API_KEY starts with "gsk_". Then redeploy.')
    e.code = 'GROQ_AUTH'
    throw e
  }

  const tBriefStart = Date.now()
  console.log(`[brief] single-call path: isFree=${isFree}, chars=${rawText.length}, models=${modelList.join(',')}`)

  let lastErr = null
  for (const { shrink, maxTokens } of attempts) {
    // Force the message builder to use the same effective tier as our
    // model+token budget above — otherwise admins get a 45K-char prompt
    // sent to a free-Groq key, which times out.
    const { system, user } = buildCaseBriefMessages(rawText, { ...opts, isPro: sizingIsPro, shrink })

    for (const model of modelList) {
      try {
        console.log(`[brief] calling Groq: model=${model} shrink=${shrink} maxTokens=${maxTokens} elapsed=${Date.now() - tBriefStart}ms`)
        // Wrap the model call in a hard 30s timeout so we never hang the
        // function until Vercel kills it.  If Groq goes silent we want a
        // real error to propagate, not a buffered nothing.
        const ac = new AbortController()
        const tid = setTimeout(() => ac.abort(), 30_000)

        let stream
        try {
          stream = await groq.chat.completions.create(
            {
              messages: [
                { role: 'system', content: system },
                { role: 'user',   content: user   },
              ],
              model,
              temperature: 0.15,
              max_tokens: maxTokens,
              stream: true,
            },
            { signal: ac.signal },
          )
        } finally {
          clearTimeout(tid)
        }

        let full = ''
        let firstTokenAt = 0
        for await (const chunk of stream) {
          const delta = chunk?.choices?.[0]?.delta?.content || ''
          if (!delta) continue
          if (!firstTokenAt) {
            firstTokenAt = Date.now()
            console.log(`[brief]   first token from ${model} at +${firstTokenAt - tBriefStart}ms`)
          }
          full += delta
          if (onDelta) {
            try { onDelta(delta) } catch (_) { /* consumer hung up — ignore */ }
          }
        }
        console.log(`[brief]   done ${model}: ${full.length}c body, took ${Date.now() - tBriefStart}ms`)

        if (full && full.trim().length > 10) {
          if (isRefusal(full)) {
            const err = new Error(
              'The AI could not generate this brief. Please check that the case file ' +
              'does not contain offensive, abusive, or inappropriate language, and try again.'
            )
            err.code = 'AI_REFUSAL'
            throw err
          }
          return full
        }
        console.warn(`[Groq stream] ${model} returned empty stream, trying next`)
      } catch (err) {
        if (err?.code === 'AI_REFUSAL') throw err
        lastErr = err
        const msg    = err?.message || ''
        const status = err?.status || err?.response?.status

        // Auth → bail immediately, no point retrying
        if (status === 401 || status === 403 || msg.includes('API key')) {
          const e = new Error('Invalid GROQ_API_KEY. Please check your .env.local file.')
          e.code = 'GROQ_AUTH'
          throw e
        }

        // Rate limit / request too large → break out of model loop and let
        // the outer attempts loop retry with a smaller payload.
        if (status === 413 || status === 429 || msg.includes('rate_limit') || msg.includes('Request too large') || msg.includes('tokens per minute') || msg.includes('TPM')) {
          console.warn(`[Groq stream] ${model} rate-limited / too large — will shrink input and retry`)
          break  // break inner model loop, continue outer attempts loop
        }

        console.warn(`[Groq stream] ${model} error: ${msg}`)
        continue
      }
    }
  }

  // All attempts exhausted. Surface a user-friendly message for rate limits.
  if (lastErr) {
    const msg    = lastErr?.message || ''
    const status = lastErr?.status || lastErr?.response?.status
    if (status === 429 || status === 413 || msg.includes('tokens per minute') || msg.includes('TPM') || msg.includes('rate_limit')) {
      const e = new Error(
        'Your Groq free-tier quota is exhausted for the next minute. Please wait 60 seconds and click Generate again — it will work. (If this keeps happening, upgrade Groq to the Dev tier — it is free with a credit card and gives you 5× the per-minute quota.)'
      )
      e.code = 'GROQ_RATE_LIMIT'
      throw e
    }
  }
  throw lastErr || new Error('All models failed to generate the case brief.')
}

// ─── Future-Lawyer: AI Legal Q&A for students ─────────────────────
// Answer a single legal question with Indian-law context and citations.
// Designed to be safe for student use: short, exam-friendly, cites the
// canonical section/act, flags when the answer would benefit from a
// professional advocate.
export async function answerLegalQuestion(question, opts = {}) {
  if (!question || question.trim().length < 5) {
    return 'Please ask a more specific question.'
  }
  const system = `You are a senior Indian advocate explaining a legal concept to a law student.
Rules:
• Indian law only (Constitution, IPC/BNS, CrPC/BNSS, CPC, Evidence Act, IT Act, state laws, leading SC/HC judgments).
• Always cite specific sections in canonical form "Section X of <Full Act Name>, <Year>" and at least one leading case (party names + year) where applicable.
• Structure: (1) Direct one-paragraph answer  (2) Key statutory provisions  (3) Leading judgments  (4) Practical example or exam-tip
• Max ~400 words. No fluff. No disclaimers about "consult a lawyer" beyond ONE short closing line.
• Never invent citations. If unsure, write "[verify in latest edition of <book>]" rather than fabricating.`
  const user = `Question: ${question.trim()}`
  try {
    const text = await chatComplete([
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ], 1200, 0.25, { isPro: opts.isPro })
    return text || 'No answer generated. Please try again.'
  } catch (err) {
    console.error('Groq answerLegalQuestion error:', err)
    return 'Unable to answer right now. Please try again in a moment.'
  }
}

// ─── Future-Lawyer: Moot Court Memorial Outline ───────────────────
// Build a structured memorial outline from a moot problem statement.
// Returns a markdown document the student can adapt for either side.
export async function buildMootMemorial({ problem, side = 'petitioner', moot = '', isPro = false }) {
  if (!problem || problem.trim().length < 60) {
    return 'Please paste the full moot problem (at least 60 characters).'
  }
  const sideLabel = side === 'respondent' ? 'RESPONDENT / DEFENCE'
                  : side === 'prosecution' ? 'PROSECUTION'
                  : 'PETITIONER / APPLICANT'
  const mootCtx = moot ? `\nMOOT COMPETITION: ${moot}` : ''
  const system = `You are coaching a law student drafting a moot court memorial for the ${sideLabel} side.${mootCtx}

Produce a high-quality MEMORIAL OUTLINE in markdown with these sections, in order:

## I. STATEMENT OF JURISDICTION
1–2 sentences citing the exact constitutional/statutory clause that gives the chosen forum jurisdiction.

## II. STATEMENT OF FACTS
Tight chronological narrative drawn ONLY from the moot problem. 150–250 words. No invention.

## III. ISSUES RAISED
Numbered list of 2–4 precise legal questions. Phrase as "Whether..."

## IV. SUMMARY OF ARGUMENTS
Two-line summary per issue.

## V. ARGUMENTS ADVANCED
For each issue, a structured argument:
• Sub-heading "Argument 1: ..."
• 2-3 supporting points
• At least one statutory provision (Section X of <Act>, Year) per argument
• Where a precedent would strengthen the argument, write the placeholder
  "[FIND AUTHORITY — <the proposition it must support>]" rather than naming
  a case. See the citation rule at the end.

## VI. PRAYER
Standard "In light of the above…" closing with 2-3 specific reliefs.

Rules:
• Indian law only.
• Argue ONLY for ${sideLabel}. The opposing side is the adversary.
• Persuasive but accurate. No hallucinated facts.
• ~900–1300 words total.

═══════ CITATION RULE — OVERRIDES EVERYTHING ABOVE ═══════
Do NOT name any judgment, party names or year unless you are certain both
that the case exists and that it decides the point. If you are not certain,
write "[FIND AUTHORITY — <proposition>]" instead. Never complete a citation
(reporter, volume, page) from memory.

Statutory provisions are different: cite Acts and section numbers normally.

This matters more here than anywhere else in the app. A memorial is
submitted to judges who know the field, and moot courts penalise a
fabricated citation harshly — it reads as dishonesty rather than error,
and it is the student's name on it. An outline with three placeholders
the student fills in from a real database is worth far more to them than
one with three invented authorities.
═══════ END CITATION RULE ═══════`
  const user = `MOOT PROBLEM:\n${problem.trim()}`
  try {
    const text = await chatComplete([
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ], isPro ? 4000 : 2000, 0.25, { isPro })
    return text || 'No memorial generated. Please try again.'
  } catch (err) {
    console.error('Groq buildMootMemorial error:', err)
    return 'Unable to build memorial right now. Please try again.'
  }
}

// ─── Analyze positive points in a case ───────────────────────────
export async function analyzePositivePoints(caseDetails, documentType = '', court = null) {
  const courtCtx = court ? ` in ${court.replace(/_/g, ' ')} jurisdiction` : ' in Indian courts'
  const courtPrecedents = court
    ? `${court.replace(/_/g, ' ')} and Supreme Court of India cases`
    : 'relevant High Court and Supreme Court of India cases'
  try {
    const text = await chatComplete([
      {
        role: 'system',
        content: `You are a highly experienced Senior Advocate${courtCtx}. Your task is to thoroughly analyze the provided case details and identify every possible positive argument, legal strength, and tactical advantage available to the client. Structure your analysis as follows:

**POSITIVE LEGAL ARGUMENTS** — List every strong legal argument available with relevant sections and case law citations.
**FACTUAL STRENGTHS** — Identify facts in the case that strongly support the client's position.
**PROCEDURAL ADVANTAGES** — Any procedural grounds, limitation issues, jurisdictional advantages.
**RELEVANT PRECEDENTS** — ${courtPrecedents} that support the client's position.
**SUGGESTED ADDITIONS TO DOCUMENT** — Specific clauses, grounds or arguments that should be incorporated into the document to strengthen it.
**RISK ASSESSMENT** — Brief note on any weak points and how to mitigate them.

Use precise, authoritative legal English. Cite specific sections of IPC/CrPC/CPC/Constitution and applicable statutes wherever relevant.`,
      },
      {
        role: 'user',
        content: `Analyze the following ${documentType ? documentType.replace(/_/g, ' ') : 'case'} details and identify all positive points, strengths, and arguments:\n\n${caseDetails}\n\nProvide a comprehensive analysis of every advantage available to the client.`,
      },
    ], 2500, 0.2)
    return text || 'Analysis unavailable.'
  } catch (err) {
    console.error('Groq analyzePositivePoints error:', err)
    return 'Analysis unavailable. Please check your GROQ_API_KEY.'
  }
}

// ─── Analyze court order — extract directions, dates, next steps ──
export async function analyzeCourtOrder(orderText, court = null) {
  const courtCtx = court ? ` for ${court.replace(/_/g, ' ')}` : ''
  try {
    const raw = await chatComplete([
      {
        role: 'system',
        content: `You are an expert Indian advocate${courtCtx}. Read the provided court order carefully and return a JSON object with EXACTLY these keys:
{
  "summary": "1-2 sentence plain English summary of what the court has done",
  "directions": ["array of specific directions/orders given by the court"],
  "complianceDates": [{"description": "what is due", "date": "date string if mentioned", "urgent": true/false}],
  "nextDate": "next hearing date if mentioned, else null",
  "nextDateNote": "what the next date is for",
  "immediateActions": ["list of things to do immediately"],
  "documentsNeeded": ["list of documents that need to be drafted/filed next"],
  "favorablePoints": ["points in the order that are favorable to the party"],
  "adversePoints": ["points that are adverse or need attention"],
  "orderType": "stay_granted | stay_refused | bail_granted | bail_refused | notice_issued | case_decided | adjourned | compliance_required | other"
}
Return ONLY the JSON object, no other text.`,
      },
      {
        role: 'user',
        content: `Analyze this court order and extract all key information:\n\n${orderText.substring(0, 4000)}`,
      },
    ], 2000, 0.1)
    if (!raw) return { summary: 'Analysis unavailable.', directions: [], immediateActions: [], documentsNeeded: [] }
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    return { summary: raw, directions: [], immediateActions: [], documentsNeeded: [] }
  } catch (err) {
    console.error('Groq analyzeCourtOrder error:', err)
    return { summary: 'Analysis failed. Check API key.', directions: [], immediateActions: [], documentsNeeded: [] }
  }
}

// ─── Generate amended document ────────────────────────────────────
export async function generateAmendedDocument(originalContent, amendments, documentType, court = null, language = 'english') {
  const systemPrompt = buildSystemPrompt(documentType, court, language)
  try {
    const text = await generateCourtDocument([
      {
        role: 'system',
        content: systemPrompt + ` You are amending an existing legal document. Make ONLY the requested changes while preserving the structure, style, and all unchanged portions of the original document, including its closing verification and signature block. Mark changed sections clearly.`,
      },
      {
        role: 'user',
        content: `ORIGINAL DOCUMENT:\n${originalContent.substring(0, 3000)}\n\nAMENDMENTS REQUESTED:\n${amendments}\n\nGenerate the complete amended document incorporating these changes, including its full closing (verification and signature/execution block). Mark each changed section with [AMENDED] tag.`,
      },
    ], 6000, 0.2, { documentType })
    return text || originalContent
  } catch (err) {
    console.error('Groq generateAmendedDocument error:', err)
    return originalContent
  }
}

// ─── Generate fresh application after rejection ───────────────────
export async function generateFreshApplication(rejectionOrderText, documentType, court = null, language = 'english', additionalGrounds = '') {
  const systemPrompt = buildSystemPrompt(documentType, court, language)
  try {
    const text = await generateCourtDocument([
      {
        role: 'system',
        content: systemPrompt + ` The previous application was rejected. Your task is to draft a FRESH application that specifically addresses and overcomes the grounds of rejection. Incorporate new legal arguments, additional case laws, and fresh grounds not raised earlier. Make it stronger and more persuasive than the original. It must be a complete, fileable document — do not stop before its verification and signature block.`,
      },
      {
        role: 'user',
        content: `REJECTION ORDER:\n${rejectionOrderText.substring(0, 2000)}\n\nADDITIONAL GROUNDS/FACTS:\n${additionalGrounds}\n\nDraft a complete fresh ${documentType.replace(/_/g, ' ')} that squarely addresses the rejection grounds and presents a stronger case. Include "CHANGED CIRCUMSTANCES" and "FRESH GROUNDS" sections prominently, and end with the full verification and signature block.`,
      },
    ], 6000, 0.25, { documentType })
    return text || fallback(documentType, rejectionOrderText)
  } catch (err) {
    console.error('Groq generateFreshApplication error:', err)
    return fallback(documentType, rejectionOrderText)
  }
}

// ─── Generate appeal from judgment ───────────────────────────────
export async function generateAppeal(judgmentText, appealType, court = null, language = 'english', additionalGrounds = '') {
  const courtName = court ? court.replace(/_/g, ' ') : 'the relevant High Court'
  const appealPrompt = `You are a highly experienced appellate advocate in Indian courts. Draft a complete ${appealType} with: (1) Appellate court header, (2) Appeal number block, (3) Appellant and Respondent details, (4) IMPUGNED JUDGMENT — court, date, brief operative part, (5) GROUNDS OF APPEAL — numbered, each identifying specific legal error: (a) Error of law, (b) Perverse findings, (c) Misreading of evidence, (d) Non-consideration of material evidence, (e) Jurisdictional error, (f) Violation of natural justice; (6) QUESTIONS OF LAW framed for admission, (7) PRAYER — set aside/modify/remand the impugned judgment; (8) Application for condonation of delay if applicable; (9) Verification and advocate signature. Cite Supreme Court and ${courtName} precedents on appellate jurisdiction. Do not stop before the verification and signature block — the document must be complete and fileable.`
  try {
    const text = await generateCourtDocument([
      { role: 'system', content: appealPrompt + (court ? courtAddendum(court) : '') + languageAddendum(language) },
      {
        role: 'user',
        content: `IMPUGNED JUDGMENT/ORDER:\n${judgmentText.substring(0, 2500)}\n\nADDITIONAL GROUNDS:\n${additionalGrounds}\n\nDraft a complete ${appealType} challenging this judgment/order. Identify every legal error, frame strong grounds of appeal, and end with the full verification and advocate signature block.`,
      },
    ], 6000, 0.25, { documentType: 'PETITION' })
    return text || fallback(appealType, judgmentText)
  } catch (err) {
    console.error('Groq generateAppeal error:', err)
    return fallback(appealType, judgmentText)
  }
}

// ─── Generate counter affidavit / reply ──────────────────────────
export async function generateCounter(oppositePartyDoc, documentType, court = null, language = 'english', clientPosition = '') {
  const counterPrompt = `You are a senior Indian advocate. Draft a comprehensive Counter Affidavit / Reply to the opposite party's application/petition. Structure: (1) Court header and case details, (2) "COUNTER AFFIDAVIT / REPLY ON BEHALF OF [PARTY]", (3) PRELIMINARY OBJECTIONS — jurisdiction, maintainability, limitation, locus standi, (4) REPLY ON MERITS — address each paragraph of the original application point by point ("Para X of the petition is denied/admitted..."), (5) ADDITIONAL FACTS — facts not mentioned by opposite party that support your client, (6) LEGAL SUBMISSIONS — applicable law, precedents distinguishing opposite party's cases, (7) PRAYER — dismiss the petition/application with costs; (8) Verification. Be precise, comprehensive, and strategically counter every point. Do not stop before the verification clause — the document must be complete and fileable.`
  try {
    const text = await generateCourtDocument([
      { role: 'system', content: counterPrompt + (court ? courtAddendum(court) : '') + languageAddendum(language) },
      {
        role: 'user',
        content: `OPPOSITE PARTY'S DOCUMENT:\n${oppositePartyDoc.substring(0, 2500)}\n\nCLIENT'S POSITION / ADDITIONAL FACTS:\n${clientPosition}\n\nDraft a complete counter affidavit/reply addressing every point raised, ending with the full verification clause.`,
      },
    ], 6000, 0.25, { documentType: 'PETITION' })
    return text || fallback('COUNTER_AFFIDAVIT', oppositePartyDoc)
  } catch (err) {
    console.error('Groq generateCounter error:', err)
    return fallback('COUNTER_AFFIDAVIT', oppositePartyDoc)
  }
}

// ─── Generate compliance report / affidavit ───────────────────────
export async function generateComplianceReport(orderText, complianceDetails, court = null, language = 'english') {
  const compliancePrompt = `You are a senior Indian advocate. Draft a Compliance Report / Compliance Affidavit to be filed in response to a court order directing compliance. Include: (1) Court header and case number, (2) Title: "COMPLIANCE REPORT / AFFIDAVIT", (3) Reference to the order whose compliance is being reported, (4) COMPLIANCE STATUS — step by step actions taken, (5) DOCUMENTS ANNEXED — list of proof documents, (6) STATUS OF EACH DIRECTION — address each direction from the order individually, (7) If partial compliance: reason for non-compliance and timeline for full compliance, (8) Prayer: accept the compliance report; (9) Verification by authorized person. Be factual and precise. Do not stop before the verification clause — the document must be complete and fileable.`
  try {
    const text = await generateCourtDocument([
      { role: 'system', content: compliancePrompt + (court ? courtAddendum(court) : '') + languageAddendum(language) },
      {
        role: 'user',
        content: `COURT ORDER:\n${orderText.substring(0, 2000)}\n\nCOMPLIANCE DETAILS:\n${complianceDetails}\n\nDraft a complete compliance report/affidavit, ending with the full verification clause.`,
      },
    ], 4500, 0.2, { documentType: 'PETITION' })
    return text || fallback('COMPLIANCE_REPORT', complianceDetails)
  } catch (err) {
    console.error('Groq generateComplianceReport error:', err)
    return fallback('COMPLIANCE_REPORT', complianceDetails)
  }
}

// ─── Fallback ─────────────────────────────────────────────────────
// Returned when every model in chatComplete() fails (deprecation, rate
// limits, network outage, missing API key, etc.). Keeps the user's input
// verbatim so a draft is always saved + a file is always downloadable.
function fallback(type, details) {
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  const docName = String(type || 'DOCUMENT').replace(/_/g, ' ').toUpperCase()
  return [
    docName,
    '',
    'Date: ' + date,
    '',
    '──────────────────────────────────────────────────',
    'CASE PARTICULARS (as supplied by the user — verbatim)',
    '──────────────────────────────────────────────────',
    '',
    String(details || '').trim() || '[No details supplied]',
    '',
    '──────────────────────────────────────────────────',
    '',
    '[NOTE: AI generation was unavailable when this document was',
    ' produced. Your case particulars are reproduced exactly so this',
    ' draft is still usable. Check that GROQ_API_KEY is set correctly',
    ' in .env.local and that you have a working internet connection,',
    ' then regenerate for the full court-formatted draft.]',
    '',
    'Generated by LexForge AI',
  ].join('\n')
}
