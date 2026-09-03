// Calls every model the app names, the way the app calls it. This is
// the check that was missing when Groq retired the Llama models and
// three features went down without a single error anyone saw.
import { activeProviders, clientFor, chainStatus } from '../lib/ai.js'
import { PRO_MODELS, FREE_MODELS } from '../lib/groq.js'

// Every provider in AI_PROVIDERS that has a key, and every model it
// names — because a fallback nobody has ever called is not a fallback.
console.table(chainStatus())
const providers = activeProviders()
if (!providers.length) {
  console.error('NO PROVIDER  set GEMINI_API_KEY or GROQ_API_KEY')
  process.exit(1)
}
const groq = clientFor(providers[0])
const models = [...new Set([...PRO_MODELS, ...FREE_MODELS])]
let fails = 0

console.log('models the app will call:', models.join(', '), '\n')

for (const model of models) {
  try {
    const c = await groq.chat.completions.create({
      model,
      max_tokens: 1500,
      reasoning_effort: 'low',
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    })
    const text = (c.choices?.[0]?.message?.content || '').trim()
    const ok = text.length > 0
    if (!ok) fails++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${model} → ${JSON.stringify(text.slice(0, 40))}`)
  } catch (e) {
    fails++
    console.log(`FAIL  ${model} → ${e?.error?.error?.code || e.message}`)
  }
}

// The quiz route asks for JSON mode as well, which is a separate thing a
// model can fail to support.
try {
  const c = await groq.chat.completions.create({
    model: PRO_MODELS[0],
    max_tokens: 1500,
    reasoning_effort: 'low',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: 'Return JSON: {"ok": true}' }],
  })
  const parsed = JSON.parse(c.choices?.[0]?.message?.content || '{}')
  const ok = parsed.ok === true
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  JSON mode on ${PRO_MODELS[0]} (used by the quiz route)`)
} catch (e) {
  fails++
  console.log(`FAIL  JSON mode → ${e.message}`)
}

console.log(fails ? `\n${fails} FAILED` : '\nevery model the app names answers')
process.exitCode = fails ? 1 : 0
