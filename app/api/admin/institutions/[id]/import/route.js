// POST /api/admin/institutions/[id]/import — a college's student list.
// GET  ...?template=1 — the spreadsheet to send them.
//
// One file, and every student on it has an account. This is the whole
// college onboarding: no codes, nothing for a student to type but the
// email and password their college gave them.
//
// The uploaded file is parsed in memory and discarded. It holds student
// names, emails and passwords in the clear, and there is no version of
// this feature where keeping that on a disk is worth it.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { parseStudentSheet, applyStudentImport } from '@/lib/student-import'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Enough for any single college, small enough that a mistaken upload of
// a video file is refused before it is read.
const MAX_BYTES = 5 * 1024 * 1024
const MAX_STUDENTS = 2000

async function guard() {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isAdmin(session)) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { session }
}

/** The template a college fills in. Headings the parser is certain to read. */
export async function GET(req) {
  const g = await guard(); if (g.error) return g.error

  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Students')

  ws.columns = [
    { header: 'Name', key: 'name', width: 28 },
    { header: 'Email', key: 'email', width: 34 },
    { header: 'Password', key: 'password', width: 18 },
    { header: 'Roll No', key: 'roll', width: 16 },
    { header: 'Batch', key: 'batch', width: 20 },
  ]
  ws.getRow(1).font = { bold: true }
  ws.addRow({ name: 'Ravi Kumar', email: 'ravi.kumar@example.com', password: 'Ravi@2027', roll: 'BA101', batch: 'BA LLB 2027' })
  ws.addRow({ name: 'Sunita Rao', email: 'sunita.rao@example.com', password: 'Sunita#27', roll: 'BA102', batch: 'BA LLB 2027' })

  const notes = wb.addWorksheet('How to fill this in')
  ;[
    ['Only Email is required. Everything else helps but can be left blank.'],
    [''],
    ['Password  — what the student types the first time. They are made to change'],
    ['            it immediately, so it does not need to be secret or memorable.'],
    ['            Leave it blank and one is generated for you.'],
    ['Batch     — used to group students, e.g. "is the third year using it".'],
    [''],
    ['Delete the two example rows before sending.'],
    [''],
    ['IMPORTANT: students not on the list you upload lose access. Send the'],
    ['whole current list each time, not just the new students.'],
  ].forEach(r => notes.addRow(r))
  notes.getColumn(1).width = 78

  return new NextResponse(Buffer.from(await wb.xlsx.writeBuffer()), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="lexforge-student-list-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(req, { params }) {
  const g = await guard(); if (g.error) return g.error

  try {
    const { id } = await params
    const form = await req.formData()
    const file = form.get('file')
    const batch = String(form.get('batch') || '').trim() || null
    // Parse and report without touching anything, so a college can see
    // what an upload will do before it does it.
    const dryRun = String(form.get('dryRun') || '') === '1'

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Attach a .xlsx or .csv file.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'That file is over 5 MB. A student list should be a few hundred kilobytes.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const inst = await prisma.institution.findUnique({ where: { id } })
    if (!inst) return NextResponse.json({ error: 'Institution not found.' }, { status: 404 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseStudentSheet(buffer, file.name || '')

    if (!parsed.students.length) {
      return NextResponse.json({
        error: 'No usable rows found in that file.',
        errors: parsed.errors.slice(0, 20),
      }, { status: 400 })
    }
    if (parsed.students.length > MAX_STUDENTS) {
      return NextResponse.json({ error: `That is ${parsed.students.length} students. The limit is ${MAX_STUDENTS} in one upload.` }, { status: 400 })
    }

    // A seat limit is only a limit if it is checked before the accounts
    // exist, not after they are billed.
    if (inst.seats > 0 && parsed.students.length > inst.seats) {
      return NextResponse.json({
        error: `The list has ${parsed.students.length} students but ${inst.name} has ${inst.seats} seats. Raise the seat count or shorten the list.`,
      }, { status: 400 })
    }

    if (dryRun) {
      const emails = parsed.students.map(s => s.email)
      const [known, members] = await Promise.all([
        prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true, institutionId: true } }),
        prisma.user.findMany({ where: { institutionId: id }, select: { email: true } }),
      ])
      const onList = new Set(emails)
      const knownEmails = new Set(known.map(k => k.email))
      return NextResponse.json({
        dryRun: true,
        rowsRead: parsed.rowsRead,
        willCreate: parsed.students.filter(s => !knownEmails.has(s.email)).length,
        willLink: known.filter(k => k.institutionId !== id).length,
        willRemove: members.filter(m => !onList.has(m.email)).length,
        removing: members.filter(m => !onList.has(m.email)).map(m => m.email).slice(0, 50),
        errors: parsed.errors,
        headings: parsed.headings,
      })
    }

    const result = await applyStudentImport({
      institutionId: id, students: parsed.students, batch, prisma, bcrypt,
    })

    // The record of what happened. Not the file — only the counts and
    // the problems, so "our third year lost access on Tuesday" has an
    // answer.
    await prisma.studentImport.create({
      data: {
        institutionId: id,
        filename: String(file.name || 'upload').slice(0, 200),
        uploadedBy: g.session.user.email,
        batch,
        rowsRead: parsed.rowsRead,
        created: result.created,
        relinked: result.relinked,
        updated: result.updated,
        removed: result.removed,
        skipped: parsed.errors.length,
        errors: parsed.errors.length ? parsed.errors.slice(0, 100) : undefined,
      },
    })

    console.log(`[import] ${inst.name}: +${result.created} new, ${result.relinked} linked, ${result.removed} removed`)

    return NextResponse.json({
      ok: true,
      ...result,
      rowsRead: parsed.rowsRead,
      errors: parsed.errors,
      // Shown once. Generated passwords exist nowhere else, so if this
      // response is closed without copying them, those students need a
      // reset rather than a lookup.
      credentials: result.credentials,
    })
  } catch (err) {
    if (err?.code === 'BAD_FILE' || err?.code === 'NO_EMAIL_COLUMN') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[admin/institutions/import]', err)
    return NextResponse.json({ error: 'Could not read that file.' }, { status: 500 })
  }
}
