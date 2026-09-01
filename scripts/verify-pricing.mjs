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

// Buying a year does not buy a percentage off the total. It buys a
// LOWER MONTHLY RATE, paid once for twelve months — which is why the
// yearly figure is twelve times the annual rate, not a discount on the
// monthly one.
const seatM = rupees(INSTITUTION_SEAT.monthlyPaise)
const seatY = rupees(INSTITUTION_SEAT.yearlyPaise)

check('direct monthly is ₹2,250', m, 2250)
check('direct yearly is ₹24,000', y, 24000)
check('the yearly price is ₹2,000 a month for twelve months', y, 2000 * 12)
check('a college seat is ₹2,000 a month', seatM, 2000)
check('a college seat-year is ₹21,600', seatY, 21600)
check('the seat-year is ₹1,800 a month for twelve months', seatY, 1800 * 12)

// The reason the structure exists: a college that funds it pays less
// per head than a student buying alone. If that ever inverts, a college
// has no commercial reason to sign.
check('a college pays less per head than an individual, monthly', seatM < m, true)
check('a college pays less per head than an individual, yearly', seatY < y, true)
check('committing to a year always costs less per month', y / 12 < m, true)
check('the student plan is gone', planFor('student'), null)
check('only two plans are sold', Object.keys(PLANS).length, 2)
check('no plan is gated on an institution', Object.values(PLANS).some(p => p.requiresInstitution), false)

console.log(`\nindividual  ₹${m}/mo  ·  ₹${y}/yr (₹${Math.round(y/12)}/mo)`)
console.log(`per seat    ₹${rupees(INSTITUTION_SEAT.monthlyPaise)}/mo  ·  ₹${rupees(INSTITUTION_SEAT.yearlyPaise)}/yr`)
console.log(`300 seats   ₹${(300*rupees(INSTITUTION_SEAT.yearlyPaise)).toLocaleString('en-IN')}/yr`)
console.log(fails ? `\n${fails} FAILED` : '\nprices agree everywhere')
process.exitCode = fails ? 1 : 0
