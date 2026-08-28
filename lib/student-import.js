// ─────────────────────────────────────────────────────────────────
//  Reading a college's student spreadsheet.
//
//  A college sends one file and every student on it gets an account.
//  That is the whole onboarding — no codes to read out, nothing for a
//  student to type but their email and the password the college gave
//  them.
//
//  Three things shape this file.
//
//  1. Colleges send whatever they have. Column headings will be "Email",
//     "email id", "E-Mail", "Student Email" or "MAIL". Rows will have
//     blanks in the middle, a title row above the headings, and a total
//     at the bottom. So headings are matched loosely and junk rows are
//     skipped rather than treated as failure.
//
//  2. The passwords in this file are chosen by the college and visible
//     to anyone who opens it. They are hashed the moment they are read
//     and the file is never written to disk. Every imported account is
//     also flagged to set its own password at first login, so the one in
//     the spreadsheet stops working as soon as the student arrives.
//
//  3. Nothing here writes to the database. Parsing and applying are
//     separate so the caller can show a college what an upload will do
//     before it does it.
// ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

// Every spelling of a heading seen in the wild, normalised to one key.
const COLUMNS = {
  email:    ['email', 'emailid', 'emailaddress', 'mail', 'mailid', 'studentemail', 'email'],
  password: ['password', 'passwd', 'pass', 'temporarypassword', 'initialpassword', 'defaultpassword'],
  name:     ['name', 'studentname', 'fullname', 'student'],
  roll:     ['roll', 'rollno', 'rollnumber', 'registrationno', 'regno', 'enrolmentno', 'enrollmentno', 'usn'],
  batch:    ['batch', 'year', 'class', 'course', 'semester', 'section'],
}

const normaliseHeading = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '')

function mapHeadings(row) {
  const map = {}
  row.forEach((cell, i) => {
    const key = normaliseHeading(cell)
    if (!key) return
    for (const [field, spellings] of Object.entries(COLUMNS)) {
      // Exact first, then contains — "Student Email ID" should match
      // email without also matching name.
      if (map[field] === undefined && (spellings.includes(key) || spellings.some(sp => key === sp))) {
        map[field] = i
      }
    }
  })
  // Second pass, looser, only for fields still missing.
  row.forEach((cell, i) => {
    const key = normaliseHeading(cell)
    if (!key) return
    for (const [field, spellings] of Object.entries(COLUMNS)) {
      if (map[field] === undefined && spellings.some(sp => key.includes(sp))) map[field] = i
    }
  })
  return map
}

/**
 * Turn a sheet into rows of values. Handles .xlsx and .csv, because
 * roughly half of what arrives will be a CSV named .xlsx or the reverse.
 */
async function readSheet(buffer, filename = '') {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()

  // The extension is a claim; the first two bytes are a fact. Every
  // .xlsx is a zip and every zip starts "PK". Trusting the name instead
  // meant an xlsx sent as .csv was fed to the CSV reader, which did not
  // throw — it produced a sheet of binary garbage, and the failure
  // surfaced much later as "no email column found".
  const isZip = buffer.length > 1 && buffer[0] === 0x50 && buffer[1] === 0x4B

  try {
    if (isZip) {
      await wb.xlsx.load(buffer)
    } else {
      const { Readable } = await import('node:stream')
      await wb.csv.read(Readable.from(buffer.toString('utf8')))
    }
  } catch {
    throw Object.assign(
      new Error('That file could not be read as a spreadsheet. Save it as .xlsx or .csv and try again.'),
      { code: 'BAD_FILE' }
    )
  }

  const sheet = wb.worksheets[0]
  if (!sheet) throw Object.assign(new Error('The file has no sheets in it.'), { code: 'BAD_FILE' })

  const rows = []
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = []
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      let v = cell.value
      // A cell holding an email arrives as a hyperlink object, and a
      // formula cell arrives as { formula, result }.
      if (v && typeof v === 'object') v = v.text ?? v.result ?? v.hyperlink ?? v.richText?.map(r => r.text).join('') ?? ''
      values[col - 1] = v == null ? '' : String(v).trim()
    })
    rows.push(values)
  })
  return rows
}

/**
 * Parse a spreadsheet into students. Reads nothing from the database and
 * writes nothing anywhere — the caller decides what to do with it.
 *
 * Returns { students, errors, headings, rowsRead }.
 */
export async function parseStudentSheet(buffer, filename = '') {
  const rows = await readSheet(buffer, filename)
  if (!rows.length) {
    throw Object.assign(new Error('The sheet is empty.'), { code: 'BAD_FILE' })
  }

  // The heading row is not always the first — colleges put a title, a
  // logo, or a blank line above it. Find the first row that names an
  // email column, within the first ten.
  let headingRow = -1
  let map = {}
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const candidate = mapHeadings(rows[i])
    if (candidate.email !== undefined) { headingRow = i; map = candidate; break }
  }

  if (headingRow === -1) {
    throw Object.assign(
      new Error('No email column found. The sheet needs a heading row with a column called Email, and ideally Password, Name and Roll No.'),
      { code: 'NO_EMAIL_COLUMN' }
    )
  }

  const students = []
  const errors = []
  const seen = new Set()

  for (let i = headingRow + 1; i < rows.length; i++) {
    const row = rows[i]
    const at = i + 1                                  // 1-indexed, as the college sees it
    const email = String(row[map.email] || '').trim().toLowerCase()

    // Blank rows, and the "TOTAL: 47" line colleges put at the bottom,
    // are normal in a real spreadsheet and not errors worth reporting.
    // A row genuinely missing an email has a name, a roll number and a
    // batch beside the gap; a footer has one stray cell.
    const populated = row.filter(c => String(c || '').trim()).length
    if (!email && populated < 2) continue
    if (!email) { errors.push({ row: at, problem: 'no email' }); continue }
    if (!EMAIL_RE.test(email)) { errors.push({ row: at, problem: `"${email}" is not a valid email` }); continue }
    if (seen.has(email)) { errors.push({ row: at, problem: `${email} appears more than once` }); continue }
    seen.add(email)

    const password = map.password !== undefined ? String(row[map.password] || '').trim() : ''
    if (password && password.length < 6) {
      errors.push({ row: at, problem: `password for ${email} is under 6 characters` })
      continue
    }

    students.push({
      email,
      password: password || null,   // null => generate one
      name: map.name !== undefined ? String(row[map.name] || '').trim() || null : null,
      roll: map.roll !== undefined ? String(row[map.roll] || '').trim() || null : null,
      batch: map.batch !== undefined ? String(row[map.batch] || '').trim() || null : null,
    })
  }

  return {
    students,
    errors,
    headings: Object.keys(map),
    rowsRead: rows.length - headingRow - 1,
  }
}

// For students whose row had no password column. Avoids 0/O and 1/l,
// because this ends up read aloud or copied off a screen.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
export function generatePassword(length = 10) {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out
}

// ─────────────────────────────────────────────────────────────────
//  Applying a parsed sheet.
//
//  Four things can happen to a student, and they are counted separately
//  because a college asks about them separately:
//
//    created   — no account existed; one is made
//    relinked  — they already had a LexForge account; it joins the college
//    updated   — already a member; name, roll or batch refreshed
//    removed   — was a member, is not on this list any more
//
//  Removal unlinks. It never deletes an account or a single document.
//  A college that uploads the wrong file cuts off access for an hour;
//  a college that uploads the wrong file and loses a student's moot
//  memorial is a different kind of story.
// ─────────────────────────────────────────────────────────────────

export async function applyStudentImport({
  institutionId, students, batch = null, prisma, bcrypt,
}) {
  const now = new Date()
  const emails = students.map(s => s.email)

  const existing = await prisma.user.findMany({
    where: { OR: [{ email: { in: emails } }, { institutionId }] },
    select: { id: true, email: true, institutionId: true, name: true, batch: true },
  })
  const byEmail = new Map(existing.map(u => [u.email, u]))
  const onList = new Set(emails)

  let created = 0, relinked = 0, updated = 0
  const credentials = []

  for (const s of students) {
    const found = byEmail.get(s.email)
    const rowBatch = s.batch || batch

    if (!found) {
      // The password the college typed, hashed at the same cost as one
      // set through the app. The plaintext never reaches the database.
      const plain = s.password || generatePassword()
      await prisma.user.create({
        data: {
          email: s.email,
          name: s.name || s.email.split('@')[0],
          password: await bcrypt.hash(plain, 12),
          institutionId,
          batch: rowBatch,
          role: 'student',
          // Deliberately NOT tier:'pro'. Access comes from the college
          // being active, checked at request time — so when a trial ends
          // the student loses Pro, which is the entire point of a trial.
          // Stamping 'pro' on the row instead made access permanent and
          // unrevokable, and a trial that cannot end is a giveaway.
          tier: 'free',
          // Set their own password and a security question before they
          // reach the app: the college knows the one on the spreadsheet,
          // and an account with no security question has no way back.
          mustOnboard: true,
          passwordChangedAt: now,
        },
      })
      credentials.push({ email: s.email, password: plain, generated: !s.password })
      created++
      continue
    }

    if (found.institutionId !== institutionId) {
      // Somebody who signed up on their own before their college did.
      // Their password is theirs and is not touched — they already know
      // it, and overwriting it with one off a spreadsheet would lock
      // them out of their own account.
      // tier is left alone: someone who already pays keeps their own
      // subscription, and someone who does not gets access from the
      // college for as long as the college is active.
      await prisma.user.update({
        where: { id: found.id },
        data: { institutionId, batch: rowBatch },
      })
      relinked++
      continue
    }

    if ((s.name && s.name !== found.name) || (rowBatch && rowBatch !== found.batch)) {
      await prisma.user.update({
        where: { id: found.id },
        data: { ...(s.name ? { name: s.name } : {}), ...(rowBatch ? { batch: rowBatch } : {}) },
      })
      updated++
    }
  }

  // Anyone who was a member and is not on the new list. Unlinked, not
  // deleted — every draft, client and hearing they recorded survives,
  // and re-uploading them restores access.
  const dropped = existing.filter(u => u.institutionId === institutionId && !onList.has(u.email))
  if (dropped.length) {
    await prisma.user.updateMany({
      where: { id: { in: dropped.map(u => u.id) } },
      data: { institutionId: null, batch: null },
    })
  }

  return {
    created, relinked, updated,
    removed: dropped.length,
    removedEmails: dropped.map(u => u.email),
    // Returned once, to the person who uploaded, so they can pass on the
    // generated ones. Never stored.
    credentials,
  }
}
