// Every email the app can send, rendered and checked.
//
// A broken template is invisible until a real customer gets a blank
// receipt, so this renders each one and looks for the failure modes that
// actually happen: an unrendered ${placeholder}, an empty body, a
// subject that says "undefined".
import {
  mailConfigured, mailProvider, mailFrom,
  passwordChangedEmail, paymentReceiptEmail, planExpiringEmail,
} from '../lib/mail.js'

let fails = 0
const bad = (why) => { fails++; console.log(`FAIL  ${why}`) }

function check(label, mail, mustContain = []) {
  const problems = []
  if (!mail.subject) problems.push('no subject')
  if (/undefined|null|NaN/.test(mail.subject)) problems.push(`subject says "${mail.subject}"`)
  if (!mail.text || mail.text.length < 40) problems.push('text body too short')
  if (!mail.html || mail.html.length < 100) problems.push('html body too short')
  if (/\$\{/.test(mail.html)) problems.push('unrendered ${} left in html')
  if (/undefined|NaN/.test(mail.text)) problems.push('text body says undefined/NaN')
  for (const m of mustContain) {
    if (!mail.text.includes(m)) problems.push(`text is missing "${m}"`)
  }
  if (problems.length) { problems.forEach(p => bad(`${label}: ${p}`)); return }
  console.log(`PASS  ${label} — "${mail.subject}"`)
}

const end = new Date('2026-09-20')

check('password changed', passwordChangedEmail({ name: 'Ravi' }))
check('password changed (no name)', passwordChangedEmail({}))
check('password changed by admin', passwordChangedEmail({ name: 'Ravi', byAdmin: true }))

check('payment receipt', paymentReceiptEmail({
  name: 'Ravi', planLabel: 'Monthly', amountPaise: 49900, currentEnd: end, paymentId: 'pay_ABC123',
}), [
  '₹499',                 // the amount, formatted in rupees
  '20 September 2026',         // the end date, spelled out
  'pay_ABC123',                // the id a refund query needs
  'does NOT renew',            // the thing they must not be surprised by
])

// A UPI payment credited by the webhook may have no payment id to hand.
check('payment receipt (no payment id)', paymentReceiptEmail({
  name: 'Ravi', planLabel: 'Yearly', amountPaise: 499000, currentEnd: end,
}), ['₹4,990'])

check('plan expiring', planExpiringEmail({
  name: 'Ravi', planLabel: 'Monthly', currentEnd: end,
}), ['20 September 2026', 'free plan'])

// Indian digit grouping — a lakh must not print as 100,000.
const lakh = paymentReceiptEmail({ planLabel: 'Institutional', amountPaise: 10000000, currentEnd: end })
if (!lakh.text.includes('₹1,00,000')) bad(`rupee formatting is not Indian: ${lakh.text.match(/Amount:.*/)?.[0]}`)
else console.log('PASS  amounts use Indian digit grouping')

console.log(`\nmail is ${mailConfigured() ? `configured via ${mailProvider()}, from ${mailFrom()}` : 'NOT CONFIGURED — nothing will actually send'}`)
console.log(fails ? `\n${fails} FAILED` : 'every template renders')
process.exitCode = fails ? 1 : 0
