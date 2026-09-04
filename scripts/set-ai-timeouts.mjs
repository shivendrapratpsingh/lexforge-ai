// -----------------------------------------------------------------
//  Move the AI routes' function ceiling, all nine together.
//
//  Full filings were measured at 98-232 seconds. Vercel kills a Hobby
//  function at 60, so on Hobby the longest and most valuable drafts
//  cannot finish - and writing 300 there buys nothing while risking the
//  deployment being rejected for exceeding the plan limit.
//
//  The nine routes are found by their AI_TIMEOUT_ROUTE marker rather
//  than by a list kept in here, so a new AI route opts in by carrying
//  the marker and none can be silently left behind.
//
//    npm run timeouts:pro     -> 300  (after upgrading to Vercel Pro)
//    npm run timeouts:hobby   ->  60  (the Hobby ceiling)
//
//  Commit the result. maxDuration has to be a literal in the source,
//  which is why this is a codemod and not an environment variable.
// -----------------------------------------------------------------
import { readFileSync, writeFileSync, globSync } from 'node:fs'

const MARKER = 'AI_TIMEOUT_ROUTE'
const ALLOWED = [60, 300]
const LINE = /^export const maxDuration = ([0-9]+)$/m

const want = Number(process.argv[2])
if (!ALLOWED.includes(want)) {
  console.error('usage: node scripts/set-ai-timeouts.mjs <' + ALLOWED.join('|') + '>')
  process.exit(2)
}

let changed = 0, already = 0

for (const f of globSync('app/api/**/route.js')) {
  const src = readFileSync(f, 'utf8')
  if (!src.includes(MARKER)) continue

  const m = LINE.exec(src)
  if (!m) {
    console.error('  !! ' + f + ' carries the marker but exports no maxDuration')
    process.exitCode = 1
    continue
  }
  if (Number(m[1]) === want) { already++; continue }

  writeFileSync(f, src.replace(LINE, 'export const maxDuration = ' + want), 'utf8')
  console.log('  ' + String(want).padStart(3) + '  ' + f)
  changed++
}

const total = changed + already
if (!total) {
  console.error('No route carries the ' + MARKER + ' marker. Nothing changed.')
  process.exit(1)
}
console.log('')
console.log(changed + ' changed, ' + already + ' already at ' + want + '  (' + total + ' AI routes)')
if (want === 300) {
  console.log('')
  console.log('300 requires Vercel Pro. On Hobby the deployment may be rejected')
  console.log('for exceeding the plan limit - run timeouts:hobby to go back.')
}
