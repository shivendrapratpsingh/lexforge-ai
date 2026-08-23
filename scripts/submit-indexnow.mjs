// Tell search engines the site exists, without owning a Search Console.
//
// IndexNow is an open protocol Bing, Yandex, Seznam and Naver all read:
// put a key file at the site root, POST your URLs, and they crawl. No
// account, no verification, no waiting for a crawler to stumble across
// the site by accident.
//
// Google does NOT participate — that one still needs Search Console,
// which needs the owner's Google account. This covers everyone else.
const KEY = process.env.INDEXNOW_KEY
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lexforge-ai.vercel.app').replace(/\/+$/, '')

if (!KEY) {
  console.error('INDEXNOW_KEY is not set. It must match the .txt file in public/.')
  process.exit(1)
}

const host = new URL(SITE).host
const urlList = [
  '/', '/pricing', '/for-colleges', '/contact', '/terms', '/privacy', '/refund', '/register', '/login',
].map(p => SITE + p)

// The key file has to be reachable, or every submission is rejected.
const check = await fetch(`${SITE}/${KEY}.txt`)
if (!check.ok) {
  console.error(`Key file not reachable at ${SITE}/${KEY}.txt (${check.status}). Deploy first.`)
  process.exit(1)
}
console.log(`key file verified at ${SITE}/${KEY}.txt`)

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
})

// 200 accepted, 202 accepted and pending key validation.
console.log(`IndexNow: HTTP ${res.status} — ${res.status === 200 || res.status === 202 ? 'accepted' : await res.text()}`)
console.log(`submitted ${urlList.length} urls for ${host}`)
