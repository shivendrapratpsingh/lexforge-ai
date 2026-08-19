// The robots parser decides what the harvest is allowed to fetch, so a
// bug here is either a policy breach or a feature that silently refuses
// to work. Both have happened.
import { robotsAllows, _resetRobotsCache } from '../lib/legal-data/robots.js'

let fails = 0
const check = (n, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${got} want ${want}`}`)
}

// India Code's real policy, live. Its robots.txt returns 502 during the
// migration, in which case the fallback rules apply — either way the
// answers below must hold, which is the point of testing both paths
// through the same call.
const r = async (u) => (await robotsAllows(u)).allowed

// The rule is /discover. It matches the old interface's search page.
check('the disallowed search page is refused',
  await r('https://indiacode.gov.in/discover?query=x'), false)
check('and its subpaths',
  await r('https://indiacode.gov.in/discover/foo'), false)
check('/simple-search is refused',
  await r('https://indiacode.gov.in/simple-search?q=x'), false)

// This is the one that matters. /server/api/discover/browses contains
// the word but does not begin with the rule, so no policy refuses it —
// and a naive "does the URL mention discover" guard would have blocked
// the Act sync outright.
check('the REST browse index is allowed despite sharing a word',
  await r('https://indiacode.gov.in/server/api/discover/browses/dateissued/items?scope=abc'), true)
check('plain object reads are allowed',
  await r('https://indiacode.gov.in/server/api/core/collections'), true)
check('handle pages are allowed',
  await r('https://indiacode.gov.in/handle/123456789/2'), true)
check('bitstream downloads are allowed',
  await r('https://indiacode.gov.in/server/api/core/bitstreams/abc/content'), true)

const detail = await robotsAllows('https://indiacode.gov.in/server/api/core/collections')
console.log(`\nrobots.txt was ${detail.readable ? 'read live' : 'unreadable — the last published policy was applied instead'}`)

_resetRobotsCache()
console.log(fails ? `\n${fails} FAILED` : 'robots is honoured correctly')
process.exitCode = fails ? 1 : 0
