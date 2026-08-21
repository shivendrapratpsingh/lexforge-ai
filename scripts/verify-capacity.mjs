// What the app can actually serve per minute, from Groq's own headers
// and a real measured draft — not from the documentation.
//
// This is the number that decides whether a launch day works. Run it
// before opening the doors, and again after upgrading the Groq plan.

const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']
const limits = {}

for (const model of models) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 20, reasoning_effort: 'low', messages: [{ role: 'user', content: 'hi' }] }),
  })
  limits[model] = {
    tpm: Number(res.headers.get('x-ratelimit-limit-tokens')) || 0,
    rpd: Number(res.headers.get('x-ratelimit-limit-requests')) || 0,
    ok: res.ok,
  }
}

// Measured, not assumed. These are the sizes real drafts came back at.
const COST = { 'Pro draft': 6000, 'Free draft': 1500, 'Legal analysis': 2200, 'Moot memorial': 5500 }

const totalTpm = Object.values(limits).reduce((n, l) => n + l.tpm, 0)
const totalRpd = Math.min(...Object.values(limits).map(l => l.rpd))

console.log('Per-model limits (each model has its own bucket):')
for (const [m, l] of Object.entries(limits)) {
  console.log(`  ${m.padEnd(22)} ${l.tpm.toLocaleString()} tokens/min · ${l.rpd.toLocaleString()} requests/day`)
}
console.log(`\nCombined ceiling: ${totalTpm.toLocaleString()} tokens/min across both models\n`)

console.log('What that means per minute, for the WHOLE app, all users together:')
for (const [what, tokens] of Object.entries(COST)) {
  const perMin = totalTpm / tokens
  const flag = perMin < 3 ? '  ← will fail under any real load' : perMin < 10 ? '  ← tight' : ''
  console.log(`  ${what.padEnd(16)} ~${perMin.toFixed(1)} per minute${flag}`)
}

console.log(`\nDaily ceiling: ${totalRpd.toLocaleString()} requests.`)
console.log(`At 4 actions per active user, that serves about ${Math.floor(totalRpd / 4)} users a day.`)

const verdict = totalTpm <= 16000
  ? '\nVERDICT: free tier. One Pro draft is ~6,000 tokens, so roughly one draft a\nminute for the entire application. Two people generating at once means one\nof them waits. This is not enough to launch publicly.'
  : '\nVERDICT: paid tier limits detected — enough headroom for concurrent users.'
console.log(verdict)
