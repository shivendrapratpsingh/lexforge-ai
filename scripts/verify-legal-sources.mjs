// Are the live legal data sources answering?
//
// The research, case-law and moot-authority features are grounded on
// these. When one goes quiet nothing crashes — the app just quietly
// stops finding cases, which is worse than a crash because nobody
// notices until a user does.
//
// Run this locally and the keyed sources will report NO KEY: the Kanoon
// and eCourts keys live in Vercel, and `vercel env pull` redacts them.
// That is a local configuration fact, not an outage. To test them for
// real, run this where the keys are.
import { kanoonConfigured } from '../lib/legal-data/config.js'

const report = []

async function probe(name, fn, { configured = true, hint = '' } = {}) {
  if (!configured) {
    report.push(`NO KEY  ${name}  — ${hint}`)
    return
  }
  const t = Date.now()
  try {
    report.push(`UP      ${name}  (${Date.now() - t}ms)  ${await fn()}`)
  } catch (e) {
    report.push(`DOWN    ${name}  ${e?.message}`)
  }
}

const { ecourtsConfigured } = await import('../lib/legal-data/config.js')

await probe('Indian Kanoon — search', async () => {
  const { searchJudgments } = await import('../lib/legal-data/indiankanoon.js')
  const out = await searchJudgments({ query: 'dishonour of cheque forged signature defence' })
  if (!out.results.length) throw new Error('answered but found nothing')
  const first = out.results[0]
  return `${out.results.length} results, e.g. "${first.title.slice(0, 50)}" (${first.court})`
}, { configured: kanoonConfigured(), hint: 'set INDIANKANOON_TOKEN to test' })

await probe('Indian Kanoon — query relaxation', async () => {
  const { searchJudgments } = await import('../lib/legal-data/indiankanoon.js')
  // The exact query that returned zero before relaxQuery existed.
  const out = await searchJudgments({ query: 'section 138 negotiable instruments act rebuttal of presumption' })
  if (!out.results.length) throw new Error('still finds nothing even after relaxing')
  return `${out.results.length} results${out.relaxed ? ` after relaxing to "${out.searchedFor}"` : ' without relaxing'}`
}, { configured: kanoonConfigured(), hint: 'same key as above' })

// India Code needs no key at all — this one is a real check anywhere.
await probe('India Code — Act feed', async () => {
  const { fetchCollectionFeed, COLLECTIONS } = await import('../lib/legal-data/indiacode.js')
  const acts = await fetchCollectionFeed(COLLECTIONS[0])
  if (!acts?.length) throw new Error('feed answered with no acts')
  const a = acts[0]
  return `${acts.length} acts, newest "${String(a.shortTitle).slice(0, 45)}" (${a.actYear}, no. ${a.actNumber || '—'})`
})

await probe('eCourts — CNR lookup', async () => {
  const { caseByCnr } = await import('../lib/legal-data/ecourts.js')
  const out = await caseByCnr('DLCT010000012024')
  return out?.cnr ? `returned case ${out.cnr}` : 'answered, but with no case for that CNR'
}, { configured: ecourtsConfigured(), hint: 'set ECOURTS_API_BASE and ECOURTS_API_KEY to test — never called successfully yet' })

console.log(report.join('\n'))
console.log('\nNO KEY is a local fact, not an outage. DOWN is a real problem.')
