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

// A year is billed as twelve months at the annual monthly rate, not as
// a percentage off the total.
const seatM = rupees(INSTITUTION_SEAT.monthlyPaise)
const seatY = rupees(INSTITUTION_SEAT.yearlyPaise)
const foundM = rupees(INSTITUTION_SEAT.foundingMonthlyPaise)
const foundY = rupees(INSTITUTION_SEAT.foundingYearlyPaise)

check('direct monthly is ₹251', m, 251)
check('direct yearly is ₹3,012', y, 251 * 12)
check('a college seat is ₹250 a month', seatM, 250)
check('a college seat-year is ₹3,000', seatY, 250 * 12)
check('the founding seat is ₹150 a month', foundM, 150)
check('the founding seat-year is ₹1,800', foundY, 150 * 12)

// The founding rate is a real discount or it is not a programme worth
// naming — and it must sit below the list rate it is discounting.
check('the founding rate is below the list rate', foundM < seatM, true)

// The reason the structure exists: a college that funds it pays less
// per head than a student buying alone. If that ever inverts, a college
// has no commercial reason to sign.
check('a college pays less per head than an individual, monthly', seatM < m, true)
check('a college pays less per head than an individual, yearly', seatY < y, true)
// This used to require a year to cost strictly LESS per month. It no
// longer does, and that is a decision rather than a regression: the
// yearly rate was deliberately set equal to the monthly one. What still
// has to hold is that a year is never WORSE value than paying monthly —
// if that ever inverts, a yearly plan is a trap.
//
// It is worth saying plainly that at parity nobody has a reason to
// choose yearly, so this passing is not the same as the yearly plan
// doing its job. PRICE_YEARLY_PAISE introduces a discount when wanted.
check('a year is never worse value than paying monthly', y / 12 <= m, true)
check('a seat-year is never worse value than paying monthly', seatY / 12 <= seatM, true)
check('the student plan is gone', planFor('student'), null)
check('only two plans are sold', Object.keys(PLANS).length, 2)
check('no plan is gated on an institution', Object.values(PLANS).some(p => p.requiresInstitution), false)

console.log(`\nindividual  ₹${m}/mo  ·  ₹${y}/yr (₹${Math.round(y/12)}/mo)`)
console.log(`per seat    ₹${seatM}/mo  ·  ₹${seatY}/yr`)
console.log(`founding    ₹${foundM}/mo  ·  ₹${foundY}/yr`)
console.log(`300 seats   ₹${(300*rupees(INSTITUTION_SEAT.yearlyPaise)).toLocaleString('en-IN')}/yr`)
console.log(fails ? `\n${fails} FAILED` : '\nprices agree everywhere')
process.exitCode = fails ? 1 : 0
