// Prices appear on a public page, in a checkout, on an invoice and in a
// receipt. They have to agree, and the discounts have to be the
// discounts that were promised.
process.env.RAZORPAY_KEY_ID = 'rzp_test_x'
process.env.RAZORPAY_KEY_SECRET = 'y'
const { PLANS, INSTITUTION_SEAT, rupees, planFor } = await import('../lib/billing.js')

let fails = 0
const check = (n, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${got} want ${want}`}`)
}

const m = rupees(PLANS.monthly.amountPaise)
const y = rupees(PLANS.yearly.amountPaise)

check('monthly is ₹420', m, 420)
check('yearly is ₹4,032', y, 4032)
check('yearly is exactly 20% off twelve months', y, Math.round(m * 12 * 0.8))
check('a seat costs the same as an individual month', rupees(INSTITUTION_SEAT.monthlyPaise), 420)
check('a seat-year is exactly 30% off twelve months', rupees(INSTITUTION_SEAT.yearlyPaise), Math.round(m * 12 * 0.7))
check('the student plan is gone', planFor('student'), null)
check('only two plans are sold', Object.keys(PLANS).length, 2)
check('no plan is gated on an institution', Object.values(PLANS).some(p => p.requiresInstitution), false)

console.log(`\nindividual  ₹${m}/mo  ·  ₹${y}/yr (₹${Math.round(y/12)}/mo)`)
console.log(`per seat    ₹${rupees(INSTITUTION_SEAT.monthlyPaise)}/mo  ·  ₹${rupees(INSTITUTION_SEAT.yearlyPaise)}/yr`)
console.log(`300 seats   ₹${(300*rupees(INSTITUTION_SEAT.yearlyPaise)).toLocaleString('en-IN')}/yr`)
console.log(fails ? `\n${fails} FAILED` : '\nprices agree everywhere')
process.exitCode = fails ? 1 : 0
