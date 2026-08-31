// ─────────────────────────────────────────────────────────────────
//  Builds the faculty user manual as a real .docx.
//
//  Written as a script rather than a hand-made file so it can be
//  regenerated when the app changes: every service, nav path and
//  document type below was read out of the app itself, and when one
//  moves this is the one place to correct it.
//
//    node scripts/build-manual.mjs
//
//  Output: docs/LexForge-AI-User-Manual.docx
// ─────────────────────────────────────────────────────────────────
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, HeadingLevel, Header, Footer,
  PageNumber, PageBreak, LevelFormat, ShadingType, convertInchesToTwip,
} from 'docx'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ─── Palette ──────────────────────────────────────────────────────
// Print colours, not the app's screen colours: the app is dark-on-gold,
// which on white paper reads as washed out. These are the same hues
// pulled down to something that survives a black-and-white printer.
const GOLD = 'A87C0F'
const INK = '1A1713'
const MUTED = '5C574E'
const RULE = 'D8CFB8'
const WASH = 'FAF7F0'
const DANGER = 'A6362B'

const SERIF = 'Georgia'
const SANS = 'Calibri'

// ─── Building blocks ──────────────────────────────────────────────
let listInstance = 0

const text = (t, o = {}) => new TextRun({ text: t, font: o.font || SANS, size: o.size || 21, color: o.color || INK, bold: o.bold, italics: o.italics })

/** Body paragraph. Accepts a string or an array of TextRuns. */
function p(content, o = {}) {
  return new Paragraph({
    children: typeof content === 'string' ? [text(content, o)] : content,
    spacing: { after: o.after ?? 140, line: 300 },
    alignment: o.align,
    indent: o.indent,
  })
}

/** Chapter title — starts a new page. */
function h1(title, kicker) {
  const out = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      children: [new TextRun({ text: kicker.toUpperCase(), font: SANS, size: 17, bold: true, color: GOLD, characterSpacing: 60 })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: title, font: SERIF, size: 40, bold: true, color: INK })],
      spacing: { after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: GOLD, space: 8 } },
    }),
    new Paragraph({ text: '', spacing: { after: 140 } }),
  ]
  return out
}

/** Section heading. */
const h2 = (t) => new Paragraph({
  children: [new TextRun({ text: t, font: SERIF, size: 27, bold: true, color: INK })],
  spacing: { before: 320, after: 120 },
  keepNext: true,
})

/** Sub-heading. */
const h3 = (t) => new Paragraph({
  children: [new TextRun({ text: t, font: SANS, size: 22, bold: true, color: GOLD })],
  spacing: { before: 220, after: 90 },
  keepNext: true,
})

/** Numbered steps. Each call restarts at 1. */
function steps(items) {
  listInstance++
  const n = listInstance
  return items.map(item => new Paragraph({
    children: typeof item === 'string' ? [text(item)] : item,
    numbering: { reference: 'steps', level: 0, instance: n },
    spacing: { after: 90, line: 290 },
  }))
}

/** Bullet list. */
function bullets(items, level = 0) {
  listInstance++
  const n = listInstance
  return items.map(item => new Paragraph({
    children: typeof item === 'string' ? [text(item)] : item,
    numbering: { reference: 'bullets', level, instance: n },
    spacing: { after: 80, line: 290 },
  }))
}

/**
 * The "how to get there" box. This is the thing the manual exists for —
 * the teacher's actual question is never "what does Act Search do", it
 * is "where is it", so the path gets its own visual slot on every page
 * rather than being buried in a sentence.
 */
function path(...routes) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 18, color: GOLD },
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: WASH },
        margins: { top: 130, bottom: 130, left: 180, right: 180 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'HOW TO GET THERE', font: SANS, size: 15, bold: true, color: GOLD, characterSpacing: 50 })],
            spacing: { after: 70 },
          }),
          ...routes.map((r, i) => new Paragraph({
            children: [new TextRun({ text: r, font: SANS, size: 21, color: INK, bold: i === 0 })],
            spacing: { after: i === routes.length - 1 ? 0 : 50 },
          })),
        ],
      })],
    })],
  })
}

/** A call-out for the things that cause support emails. */
function note(label, body, tone = 'gold') {
  const c = tone === 'danger' ? DANGER : GOLD
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: c },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: c },
      left: { style: BorderStyle.SINGLE, size: 4, color: c },
      right: { style: BorderStyle.SINGLE, size: 4, color: c },
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        margins: { top: 130, bottom: 130, left: 180, right: 180 },
        children: [new Paragraph({
          children: [
            new TextRun({ text: label + '  ', font: SANS, size: 21, bold: true, color: c }),
            new TextRun({ text: body, font: SANS, size: 21, color: INK }),
          ],
          spacing: { line: 290 },
        })],
      })],
    })],
  })
}

/** Two-column reference table: term on the left, meaning on the right. */
function table(headers, rows, widths = [32, 68]) {
  const cell = (t, o = {}) => new TableCell({
    width: { size: o.w, type: WidthType.PERCENTAGE },
    shading: o.head ? { type: ShadingType.CLEAR, fill: WASH } : undefined,
    margins: { top: 90, bottom: 90, left: 140, right: 140 },
    children: [new Paragraph({
      children: [new TextRun({
        text: t, font: SANS, size: o.head ? 18 : 20,
        bold: o.head || o.strong, color: o.head ? GOLD : INK,
        characterSpacing: o.head ? 40 : 0,
      })],
      spacing: { line: 280 },
    })],
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((hd, i) => cell(hd.toUpperCase(), { head: true, w: widths[i] })),
      }),
      ...rows.map(r => new TableRow({
        children: r.map((c, i) => cell(c, { w: widths[i], strong: i === 0 })),
      })),
    ],
  })
}

// ─── Content ──────────────────────────────────────────────────────
const body = []

// ── Cover ────────────────────────────────────────────────────────
body.push(
  new Paragraph({ text: '', spacing: { after: 2600 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'LEXFORGE AI', font: SERIF, size: 64, bold: true, color: INK, characterSpacing: 90 })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '⚖', font: SERIF, size: 40, color: GOLD })],
    spacing: { after: 240 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'User Manual for Faculty', font: SERIF, size: 34, color: MUTED, italics: true })],
    spacing: { after: 100 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Every service in the app, and how to reach it', font: SANS, size: 21, color: MUTED })],
    spacing: { after: 700 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 14 } },
    children: [new TextRun({ text: 'lexforge-ai.vercel.app', font: SANS, size: 22, bold: true, color: GOLD })],
    spacing: { before: 300, after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'support.lexforge@gmail.com', font: SANS, size: 19, color: MUTED })],
  }),
)

// ── How to read this ─────────────────────────────────────────────
body.push(
  ...h1('How to read this manual', 'Start here'),
  p('This manual covers every service in LexForge AI. It is written for a teacher who wants to use all of them — in chambers, in class, and with a batch of students.'),
  p('Each service is set out the same way:'),
  ...bullets([
    [text('What it does', { bold: true }), text(' — in one or two lines.')],
    [text('How to get there', { bold: true }), text(' — a boxed click path. This is what you will actually look for, so it is never buried in a paragraph.')],
    [text('How to use it', { bold: true }), text(' — numbered steps.')],
    [text('Worth knowing', { bold: true }), text(' — the thing that is not obvious until it goes wrong.')],
  ]),
  p('Where a service is useful in teaching rather than in practice, there is a short teaching note. You do not have to read the manual in order — Chapter 1 and the contents below are enough to find anything.'),
  h2('What is in here'),
  table(['Chapter', 'Covers'], [
    ['1  Before you start', 'Signing in, the compulsory first-time setup, moving around, free and Pro'],
    ['2  Dashboard', 'The home screen'],
    ['3  Drafting', 'New Document, the four ways to give it your facts, My Documents'],
    ['4  Research', 'Act Search, Case Law & Case Status, Legal Research, Case Assistant'],
    ['5  Practice tools', 'The six analysers, Clients, Court Dates'],
    ['6  Teaching services', 'Study & Learn, Future Lawyer'],
    ['7  My College', 'For faculty co-ordinators — students, batches, usage'],
    ['8  Your account', 'Name, password, recovery, plan, data'],
    ['Appendices', 'All 20 document types, all 7 languages, what to do when something breaks'],
  ], [28, 72]),
)

// ── 1. Before you start ──────────────────────────────────────────
body.push(
  ...h1('Before you start', 'Chapter 1'),

  h2('1.1  Where the app lives'),
  p([
    text('LexForge AI runs in a web browser at '),
    text('lexforge-ai.vercel.app', { bold: true }),
    text('. There is nothing to install. It works on a laptop, a tablet and a phone, and the phone layout is a proper app layout, not a shrunken website.'),
  ]),
  p('On a phone you can add it to your home screen — open the site in Chrome or Safari, use the browser menu, and choose "Add to Home Screen". It then opens like any other app.'),

  h2('1.2  Your first sign-in'),
  p('If your college added you, your account already exists. Your username is the email address the college listed, and your first password is the one the college gave you.'),
  ...steps([
    'Open the site and choose Sign in.',
    'Enter your email address and the password the college gave you.',
    'A setup screen appears. You cannot skip it — nothing else in the app opens until it is finished.',
    'Enter your full name. This is the name that appears on your dashboard and on every document you generate, so put it in the form you would want on a filing.',
    'Choose a new password of your own. The college does not keep it and cannot see it.',
    'Choose a security question and type an answer.',
    'You land on the Dashboard.',
  ]),
  note('Do not rush step 6.', 'The security question is the only way back into your account. There is no reset link sent to your email — if you forget your password, the app asks your security question and nothing else. Pick a question whose answer will not change and will not be spelled two different ways.', 'danger'),

  h2('1.3  One device at a time'),
  p('Signing in on a second device signs you out of the first. This is deliberate: a college pays for one seat per person, and a shared login would be one login used by a whole batch.'),
  p('In practice it means: if you sign in on the classroom desktop, your phone signs out. Sign in again on the phone when you need it. Nothing is lost — your documents live on the server, not the device.'),

  h2('1.4  Finding your way around'),
  p([text('On a laptop', { bold: true }), text(' — the menu button (☰) at the top left opens the side panel. Everything in the app is in it, grouped into sections:')]),
  ...bullets([
    [text('Lawyer', { bold: true }), text(' — Dashboard, New Document, My Documents, Clients, Court Dates, Legal Tools, Legal Research, Case Law & Status, Act Search, Study & Learn')],
    [text('Future Lawyer', { bold: true }), text(' — Services (the student hub)')],
    [text('Faculty', { bold: true }), text(' — My college. This section only appears if you have been made your college\'s co-ordinator.')],
    [text('You', { bold: true }), text(' — Account')],
  ]),
  p([text('On a phone', { bold: true }), text(' — there is a fixed bar along the bottom with five slots: Dashboard, Drafts, the gold ✦ button in the middle (New Document), Court Dates, and ⋯ More. Everything else is behind More.')]),
  p([text('Everywhere', { bold: true }), text(' — a floating 💬 button sits at the bottom right of every screen. That is the Case Assistant (chapter 4.4).')]),

  h2('1.5  Free and Pro'),
  p('Every service is listed for everybody, but some carry a PRO badge. What the badge means:'),
  table(['Plan', 'What you get'], [
    ['Free', 'All 20 document types and all 7 languages, but only 2 generated documents per calendar month. Act Search, Study & Learn and Future Lawyer are fully open.'],
    ['Pro', 'Unlimited documents, longer drafts, and the services marked PRO: Clients, Court Dates, Legal Tools, Legal Research, Case Law & Status, and the Case Assistant.'],
  ], [18, 82]),
  p('If your college has an active plan, you are Pro automatically for as long as that plan runs — you do not pay and you do not enter card details. You can confirm this at any time: ☰ → You → Account → Plan & usage, where it will show PRO next to your plan name.'),
  note('If a service you expect is locked,', 'check ☰ → You → Account → College. If it does not name your college, your account is not linked to the college plan yet. That is a two-minute fix at our end — email support.', 'gold'),
)

// ── 2. Dashboard ─────────────────────────────────────────────────
body.push(
  ...h1('Dashboard', 'Chapter 2'),
  p('The home screen. It answers one question — what needs my attention today — and gets out of the way.'),
  path('☰ → Lawyer → Dashboard', 'Phone: bottom bar → Dashboard'),
  h2('What is on it'),
  ...bullets([
    [text('Three counters', { bold: true }), text(' — total documents, how many are finalised, and how many clients you have. The clients counter is a link.')],
    [text('Next hearing', { bold: true }), text(' — the soonest entry from Court Dates.')],
    [text('Deadlines', { bold: true }), text(' — anything falling in the next seven days, in red, with the document it belongs to.')],
    [text('Recent documents', { bold: true }), text(' — click one to reopen and keep editing.')],
    [text('Quick links', { bold: true }), text(' — straight into Case Law & Status, Legal Research and the Moot Court Memorial Builder.')],
  ]),
  note('Teaching note.', 'The Dashboard is the screen to put on the projector at the start of a demonstration. It shows a practice as a working system — matters, dates, documents — rather than as a series of one-off drafts, and that framing is the thing students most often have not seen.'),
)

// ── 3. Drafting ──────────────────────────────────────────────────
body.push(
  ...h1('Drafting', 'Chapter 3'),
  p('This is the heart of the app. Everything else supports it.'),

  h2('3.1  New Document'),
  p('Generates a complete, court-ready Indian legal document from facts you supply. Twenty document types, every Indian court, seven languages.'),
  path('☰ → Lawyer → New Document', 'Phone: the gold ✦ button in the middle of the bottom bar'),

  h3('Step 1 — Pick the document type'),
  p('Twenty tiles: Legal Notice, Bail Application, Writ Petition, Affidavit, Vakalatnama, Contract, PIL, RTI Application, Consumer Complaint, Divorce Petition, Rent Agreement, Sale Deed, Cheque Bounce Notice, and more. The full list with descriptions is in Appendix A.'),

  h3('Step 2 — Choose how you will give it the facts'),
  p('Four ways in. This choice matters more than it looks, so pick deliberately:'),
  table(['Method', 'When to use it'], [
    ['Fill Form', 'You have the facts in front of you. Structured fields, fastest route. This is the default.'],
    ['Smart Q&A', 'The AI asks one question at a time and waits. Slower, but you cannot leave anything out — and it is the mode to demonstrate in class.'],
    ['Paste Document', 'You already have a similar document as text. Paste it and the AI pulls the details out into the form.'],
    ['Upload Folder / File', 'You have a case folder, a Word file, or a scanned PDF. The AI reads all of it and fills the form from the contents.'],
  ], [26, 74]),

  h3('Step 3 — Fill in the details'),
  ...steps([
    'The fields change depending on the document type you picked. A Bail Application asks for the FIR number, the sections, and the date of custody; a Rent Agreement asks about the premises and the rent.',
    'Fields marked with a red asterisk are required.',
    'If you have already added the person under Clients, choose them and their name, father\'s name, age and address fill in by themselves.',
    'Review whatever the AI filled in for you if you used Paste or Upload. It is a starting point, not a finished intake.',
  ]),

  h3('Step 4 — Court and language'),
  ...steps([
    'Choose the court. The list covers the Supreme Court, all twenty-five High Courts including their benches, national tribunals, state forums, and district courts across India.',
    'Choose the language. Seven are available — English, Hindi, Bilingual, Urdu, Tamil, Telugu and Kannada. Appendix B says which court each suits.',
    'Press Generate.',
  ]),
  p('Generation takes somewhere between thirty and ninety seconds and shows a progress screen while it works. What comes back is a full document, not an outline, and it is editable on the spot.'),

  h3('What you can do with the result'),
  ...bullets([
    'Edit it in place, paragraph by paragraph.',
    'Copy the whole thing to the clipboard.',
    'Save it — it then appears under My Documents.',
    'Export it as PDF, Word (.docx) or plain text.',
  ]),
  note('Worth knowing.', 'The export is properly formatted for filing, not a raw text dump — the cause title and the court name are centred, section headings are set apart, and numbered paragraphs stay left-aligned with their numbering intact.'),
  note('Teaching note.', 'Smart Q&A is the mode to use in front of a class. Students watch the app ask, in order, for exactly the facts a bail application needs — the FIR number, the sections, the date of custody, the grounds — before a single line of the document appears. That sequence is the lesson. The finished draft is almost incidental.'),

  h2('3.2  Case Brief from a folder'),
  p('A particular combination worth calling out on its own, because it is the one that surprises people.'),
  ...steps([
    'New Document → choose Case Brief as the type.',
    'Choose Upload Folder / File as the method.',
    'Upload the whole case folder — pleadings, orders, correspondence, scanned PDFs, all of it at once.',
    'The AI reads every file and produces a short executive brief: parties, chronology, issues, strengths, weaknesses and next steps.',
  ]),
  p('On a large folder this runs in chunks and shows progress as it goes. It is the fastest way to get on top of a file you have just been handed.'),

  h2('3.3  My Documents'),
  p('Everything you have generated, in one list.'),
  path('☰ → Lawyer → My Documents', 'Phone: bottom bar → Drafts'),
  ...bullets([
    [text('Open and edit', { bold: true }), text(' — change any paragraph and save.')],
    [text('Version history', { bold: true }), text(' — every save is kept. Open the history panel and restore any earlier version. Nothing you write is ever lost by overwriting.')],
    [text('Clone', { bold: true }), text(' — duplicate a document as the starting point for another one.')],
    [text('Export', { bold: true }), text(' — PDF, Word or plain text, from the buttons at the top of the document.')],
  ]),
  note('Teaching note.', 'Clone is the assignment-setting tool. Build one model draft with a deliberate flaw in it, clone it for the batch, and set the exercise as "find what is wrong with this and fix it". Version history then shows you what each student actually changed.'),
)

// ── 4. Research ──────────────────────────────────────────────────
body.push(
  ...h1('Research', 'Chapter 4'),
  p('Four services, and the difference between them matters.'),

  h2('4.1  Act Search'),
  p('Find the Act that governs a problem, read its key sections, and see which document you would actually file.'),
  path('☰ → Lawyer → Act Search'),
  p('Two ways to search, and the first is the useful one:'),
  ...bullets([
    [text('Describe the problem in ordinary words', { bold: true }), text(' — "my tenant will not vacate after the lease ended", "a cheque I received has bounced". You do not need to know the name of the Act. That is the point.')],
    [text('Or name the Act', { bold: true }), text(' — if you already know it.')],
  ]),
  p('What comes back: the Act, its key sections in plain summary, a link to the official text on India Code, and — the part students find most useful — which document this would translate into if you were filing.'),
  p('Searching, the key sections and the link to the official text are all open on the free plan. Two buttons inside a result — "See a sample" and "Judgments" — are Pro.'),

  h2('4.2  Case Law and Case Status'),
  p('Live court data. Three tabs on one screen.'),
  path('☰ → Lawyer → Case Law & Status', 'Marked PRO'),
  table(['Tab', 'What it does'], [
    ['Judgments', 'Search judgments of the Supreme Court, the High Courts and the tribunals. Full-text search, so a query like "section 45 PMLA twin conditions bail" works. Optional filter by court.'],
    ['Case status', 'Enter a CNR number and get the live status of a pending case — stage, next date, the bench. The CNR is the sixteen-character number printed on any cause list or order sheet.'],
    ['Acts', 'New and amended Acts. This is checked every morning, so it shows what has actually changed recently.'],
  ], [22, 78]),

  h2('4.3  Legal Research'),
  p('Search landmark case law, and get a written analysis of a legal issue.'),
  path('☰ → Lawyer → Legal Research', 'Marked PRO'),
  p('The screen has two panels.'),
  ...bullets([
    [text('Case Law Database', { bold: true }), text(' — type to filter as you go. When you want more than the shelf, the "Search full index" button runs a live search across the real corpus.')],
    [text('AI Legal Analysis', { bold: true }), text(' — describe an issue in a paragraph, in ordinary English, and get a structured analysis of the position.')],
  ]),
  note('This is the important part.', 'Judgments are retrieved from the real case-law index. The AI is not allowed to write a citation. Every judgment relied on is listed underneath the analysis with a link to the original, and if the index returns nothing verified, the app says so in plain words rather than inventing something that sounds right. If you are teaching students to check authority, show them this screen and the reason it is built this way.'),

  h2('4.4  Case Assistant'),
  p('A chat assistant that sits on every screen in the app.'),
  path('The floating 💬 button, bottom right of any screen', 'Marked PRO'),
  ...steps([
    'Click the 💬 button. A chat panel opens over whatever you were doing.',
    'Ask about a document or an issue in ordinary English.',
    'If it recognises the kind of document you need, it offers to start that draft for you — one click and you are in New Document with the type already chosen.',
  ]),
  note('Worth knowing.', 'The Case Assistant will not give you a case citation, and this is on purpose. Citations come only from Case Law & Status or Legal Research, where they are retrieved from a real index and linked. Keeping the conversational assistant out of the citation business is what stops it from producing a case name that reads perfectly and does not exist.'),
)

// ── 5. Practice tools ────────────────────────────────────────────
body.push(
  ...h1('Practice tools', 'Chapter 5'),
  p('Three services for running matters rather than drafting them. All marked PRO.'),

  h2('5.1  Legal Tools — the six analysers'),
  p('Each takes a document you paste in and gives back something usable.'),
  path('☰ → Lawyer → Legal Tools'),
  table(['Tool', 'Paste in → get back'], [
    ['Order Analyzer', 'A court order → the directions in it, compliance dates, immediate actions, the documents you need, and the favourable and adverse points.'],
    ['Document Amendment', 'An existing document plus what you want changed → the updated version.'],
    ['Fresh Application', 'A previous rejection order plus what has changed since → a fresh bail application or petition on the new grounds.'],
    ['Appeal Generator', 'The impugned judgment → an appeal petition with the grounds set out. Choose High Court, Supreme Court (SLP), Sessions or Revision.'],
    ['Counter / Reply', 'The other side\'s document plus your client\'s position → a counter affidavit or reply.'],
    ['Compliance Report', 'The order you have complied with plus what you did → a compliance affidavit or report.'],
  ], [26, 74]),
  ...steps([
    'Open Legal Tools and pick one of the six.',
    'Choose the court, and the document type where the tool asks for one.',
    'Paste the source document into the large box. The fields marked with an asterisk are required.',
    'Add the extra context the tool asks for — changed circumstances, your client\'s position, what you did to comply.',
    'Generate. The result can be saved straight into My Documents.',
  ]),
  note('Teaching note.', 'The Order Analyzer is the single best classroom demonstration in the app. Paste a real order and it separates what the court directed from what follows for the lawyer — and the gap between those two things is precisely what students do not yet see when they read a judgment.'),

  h2('5.2  Clients'),
  p('A record for each person you act for, which then feeds the drafting form.'),
  path('☰ → Lawyer → Clients'),
  ...bullets([
    [text('+ Add Client', { bold: true }), text(' — name, father\'s name, Aadhaar, phone, district, photograph.')],
    [text('CSV Template', { bold: true }), text(' — download the template, fill it, upload it back to add many at once.')],
    [text('Find people', { bold: true }), text(' — search by name, Aadhaar or phone; filter by district; sort by recent, name or number of documents.')],
    [text('Open a client', { bold: true }), text(' — their documents, attachments and payments in one place.')],
  ]),
  p('The payoff is in New Document: pick the client and their details fill themselves into the form, in the right fields for that document type.'),

  h2('5.3  Court Dates'),
  p('Hearings and deadlines, feeding the Dashboard.'),
  path('☰ → Lawyer → Court Dates', 'Phone: bottom bar → Court Dates'),
  ...steps([
    'Enter a title or case name.',
    'Choose the type: Hearing, Compliance, Filing, Order or Deadline. Each has its own colour in the list.',
    'Add the case number, and the document ID if the date belongs to something you have drafted.',
    'Add notes, and save.',
  ]),
  p('Anything within the next seven days then shows on the Dashboard in red, and the soonest hearing shows as "next hearing".'),
)

// ── 6. Teaching services ─────────────────────────────────────────
body.push(
  ...h1('Teaching services', 'Chapter 6'),
  p('Two hubs built for students rather than for practice. Both are open on the free plan, which means you can set work for a whole batch whether or not every student is on the college plan yet.'),

  h2('6.1  Study & Learn'),
  path('☰ → Lawyer → Study & Learn', 'Also reachable from Future Lawyer → Landmark Judgments & Doctrines'),
  p('Four tabs across the top.'),
  table(['Tab', 'What it holds'], [
    ['Landmark Judgments', 'Curated Supreme Court and High Court judgments. Search by case name, area of law, doctrine, or the fact pattern.'],
    ['Legal Principles', 'The core doctrines, searchable by doctrine, area or keyword.'],
    ['AI Tutor', 'Ask a topic and get it explained at length — for example, "Explain the basic structure doctrine and the cases that built it."'],
    ['Quiz & Flashcards', 'Type a topic — "Article 21", "bail under CrPC", "contract" — and the app generates questions on it.'],
  ], [26, 74]),
  note('Teaching note.', 'The quiz tab generates fresh questions each time from a topic you type. That makes it usable as a five-minute revision opener at the start of a class without any preparation, and it means two students sitting together do not get the same paper.'),

  h2('6.2  Future Lawyer'),
  p('The student hub — a grid of services for law students, judiciary aspirants and CLAT candidates.'),
  path('☰ → Future Lawyer → Services'),

  h3('AI Legal Q&A'),
  p('Ask any Indian law question and get an answer backed by the statutory provision, the leading judgments, and a note on how the point tends to be examined. Reach it from the Future Lawyer grid, or directly.'),

  h3('Moot Court Memorial Builder'),
  ...steps([
    'Open Future Lawyer → Moot Court Memorial Builder.',
    'Name the competition if you want it on the memorial — optional.',
    'Choose the side: Petitioner / Applicant, Respondent / Defence, or Prosecution.',
    'Paste the full moot proposition into the box.',
    'Generate. You get a memorial outline — statement of facts, issues, arguments, and prayer — plus suggested authorities.',
  ]),
  note('Teaching note.', 'Set the memorial builder as the first draft, not the final one. Have students mark up what the AI got wrong — a weak issue framing, an argument that does not follow, a prayer that asks for relief the court cannot grant. Correcting a competent-looking draft is a harder and more useful exercise than starting from a blank page, and it teaches the scepticism they will need anyway.'),

  h3('Career Roadmap'),
  p('Six tracks laid out year by year through the degree, with what to do in each year and where each one leads: Litigation Practice, Corporate and Law-Firm Career, Judicial Services, LLM Abroad and Academia, Civil Services, and In-House Counsel.'),
  p('This is the page to project during a careers session. It answers the question first-year students actually ask, which is not "what is the law" but "what happens to me after this".'),

  h3('Coming later'),
  p('Two cards on the grid are marked coming soon and are not live yet: Internships & Placements, and CLAT / Judicial Exam Prep. They are visible so you know they are planned — do not build a class around them yet.'),
)

// ── 7. My College ────────────────────────────────────────────────
body.push(
  ...h1('My College', 'Chapter 7'),
  p('For faculty co-ordinators. This chapter does not apply to every teacher — only to the one person at the college who looks after the batch.'),
  path('☰ → Faculty → My college'),
  note('If you cannot see it,', 'the Faculty section only appears once your account has been marked as your college\'s co-ordinator. That is set at our end after the college confirms who it is. Email support and it is done the same day.'),

  h2('What the screen shows'),
  ...bullets([
    [text('The plan', { bold: true }), text(' — your college\'s name, whether the plan is active, and the date it runs until. If it is not active, it says so in red, and students cannot join.')],
    [text('Signed up', { bold: true }), text(' — how many of the students on your list have actually logged in. This is usually the number worth watching in the first fortnight.')],
    [text('Active this month', { bold: true }), text(' — how many used the app in the last thirty days.')],
    [text('Documents made', { bold: true }), text(' — total generated by your students.')],
    [text('By batch', { bold: true }), text(' — the same numbers broken down, so you can see that BA LLB 2027 is using it and BA LLB 2028 is not.')],
    [text('The student list', { bold: true }), text(' — every student, with a coloured dot showing who has been active this month, and a faculty marker next to staff accounts.')],
  ]),

  h2('Adding students'),
  p('Students are added by spreadsheet, in a batch. There is no one-at-a-time route, and that is deliberate — a batch of sixty added by hand is sixty chances to mistype an email address.'),
  ...steps([
    'Prepare an Excel file with a row for each student and these columns: email, password, name, batch.',
    'Send it in, or upload it if you have console access.',
    'Every student in the file gets an account immediately.',
    'Each student sets their own name, their own password and their own security question the first time they sign in. The password you put in the spreadsheet is only for that first login.',
  ]),
  note('Send the whole list every time.', 'When you add fifteen students in March, send the full current list — the original names and the fifteen new ones — not just the fifteen. The import reads the file as the state of the batch, so a partial list is read as a shrunken batch.', 'danger'),

  h2('When a trial ends'),
  p('If your college is on a one-month trial, Pro access stops on the day the trial ends. Nothing is deleted: the accounts stay, the documents stay, and the moment the college converts to a paid plan every student has Pro again with no action from them and no second sign-up.'),
)

// ── 8. Account ───────────────────────────────────────────────────
body.push(
  ...h1('Your account', 'Chapter 8'),
  path('☰ → You → Account'),
  p('Seven sections, top to bottom.'),
  table(['Section', 'What it is for'], [
    ['Your details', 'Your full name — the one that appears on your dashboard and on your drafts. Your email is shown but cannot be changed; it is your login.'],
    ['Change password', 'Current password, new password, confirm.'],
    ['Account recovery', 'Choose a security question and set an answer, confirmed with your password. Do this if you have not already — see the warning below.'],
    ['Plan & usage', 'Free or Pro, and how many documents you have generated this month.'],
    ['College', 'Which college you are linked to. If you are not linked to one, this is where you join.'],
    ['Language & notifications', 'The language of the interface, and whether you get email and push notifications.'],
    ['Download everything', 'Export all your data — every document, client and court date — in one file.'],
    ['Delete this account', 'Permanent. It does what it says.'],
  ], [26, 74]),
  note('Set the security question.', 'The password reset does not send a link to your email. It asks your security question, and if there is no question on the account there is no way back in. If you are not sure whether yours is set, open Account → Account recovery now — it takes twenty seconds and it is the difference between a locked-out account and a two-minute reset.', 'danger'),
)

// ── Appendix A ───────────────────────────────────────────────────
body.push(
  ...h1('The twenty document types', 'Appendix A'),
  p('All twenty are available on the free plan. The free limit is on how many documents you generate in a month, not on which kinds.'),
  table(['Type', 'What it produces'], [
    ['Legal Notice', 'Formal notice demanding action or remedy under Indian law'],
    ['Case Brief', 'Structured IRAC summary of legal arguments and precedents'],
    ['Contract', 'Legally binding agreement — property, service, business'],
    ['Petition', 'Civil or criminal petition to district or subordinate courts'],
    ['Memorandum', 'Legal analysis, opinion and actionable recommendations'],
    ['Writ Petition', 'High Court writ under Article 226 — Certiorari, Mandamus, Habeas Corpus'],
    ['Vakalatnama', 'Authority letter appointing an advocate to appear in court'],
    ['Bail Application', 'Regular or anticipatory bail under CrPC — district court or High Court'],
    ['Stay Application', 'Urgent stay or injunction against an order or proceeding'],
    ['Affidavit', 'Sworn statement of facts for court or official use'],
    ['PIL', 'Public Interest Litigation — High Court under Article 226'],
    ['RTI Application', 'Application under the Right to Information Act, 2005'],
    ['Consumer Complaint', 'Complaint to a Consumer Forum under the Consumer Protection Act, 2019'],
    ['Divorce Petition', 'Under the Hindu Marriage Act or the Special Marriage Act'],
    ['Rent Agreement', 'Residential or commercial rental or lease agreement'],
    ['Sale Deed', 'Property sale or conveyance deed under the Transfer of Property Act'],
    ['Cheque Bounce Notice', 'Notice under Section 138 of the Negotiable Instruments Act'],
    ['Legal Opinion', 'Formal legal opinion or advice memorandum on a legal question'],
    ['FIR Complaint', 'Written complaint to a police station under Section 154 CrPC'],
    ['Email Draft', 'Professional or legal email, ready to paste into Gmail or Outlook'],
  ], [30, 70]),
)

// ── Appendix B ───────────────────────────────────────────────────
body.push(
  ...h1('The seven drafting languages', 'Appendix B'),
  p('Chosen at the last step of New Document. The app does not merely translate the words — each language carries the court vocabulary that language actually uses, so a Kannada petition says ಅರ್ಜಿದಾರ and not a literal rendering of "petitioner".'),
  table(['Language', 'Where it is the right choice'], [
    ['English', 'High Courts and formal proceedings'],
    ['हिन्दी (Hindi)', 'Lower courts and revenue matters'],
    ['Bilingual (EN + HI)', 'English body, Hindi headings and prayer'],
    ['اردو (Urdu)', 'Jammu & Kashmir, and courts keeping records in Urdu'],
    ['தமிழ் (Tamil)', 'Tamil Nadu district courts and local matters'],
    ['తెలుగు (Telugu)', 'Andhra Pradesh and Telangana courts'],
    ['ಕನ್ನಡ (Kannada)', 'Karnataka district and taluk courts'],
  ], [30, 70]),
)

// ── Appendix C ───────────────────────────────────────────────────
body.push(
  ...h1('When something goes wrong', 'Appendix C'),
  table(['What you see', 'What it means and what to do'], [
    ['You were signed out on your own', 'Someone signed in with your account on another device — usually you, on your phone. One device at a time. Just sign in again.'],
    ['A service shows "Upgrade to Pro"', 'You are on the free plan. If your college has a plan, check ☰ → You → Account → College. If it does not name your college, your account is not linked yet — email support.'],
    ['"You have used your documents this month"', 'The free plan allows two generated documents per calendar month. It resets on the first. Pro removes the limit.'],
    ['Generation is slow or fails', 'A busy period. Wait a minute and press Generate again — the form keeps everything you typed, so nothing is retyped.'],
    ['You forgot your password', 'Sign-in screen → Forgot password → answer your security question → set a new one. There is no emailed reset link.'],
    ['You never set a security question', 'Email support before you need it. Once you are locked out there is no self-service route back in.'],
    ['You cannot see "My college"', 'That section is only for faculty co-ordinators. Ask us to mark your account, or ask whoever at your college holds that role.'],
    ['A case citation looks wrong', 'Take it seriously and check it. Citations shown under Legal Research and in Case Law & Status are retrieved from a real index and linked to the original — click the link. The Case Assistant does not give citations at all, by design.'],
  ], [32, 68]),

  h2('Getting help'),
  p([text('Email '), text('support.lexforge@gmail.com', { bold: true }), text('. Include your email address, the name of your college, and what you were doing when it went wrong — a screenshot answers most questions on the first reply.')]),
)

// ─── Assemble ─────────────────────────────────────────────────────
const doc = new Document({
  creator: 'LexForge AI',
  title: 'LexForge AI — User Manual for Faculty',
  description: 'Every service in LexForge AI, and how to reach it.',
  numbering: {
    config: [
      {
        reference: 'steps',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 420, hanging: 300 } }, run: { bold: true, color: GOLD, font: SANS } },
        }],
      },
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '–',
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 420, hanging: 300 } }, run: { color: GOLD, font: SANS } },
        }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(0.9), bottom: convertInchesToTwip(0.9),
          left: convertInchesToTwip(1), right: convertInchesToTwip(1),
        },
      },
      titlePage: true,   // keeps the header and footer off the cover
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: RULE, space: 6 } },
          children: [new TextRun({ text: 'LexForge AI  ·  User Manual for Faculty', font: SANS, size: 16, color: MUTED })],
        })],
      }),
      first: new Header({ children: [] }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 16, color: MUTED })],
        })],
      }),
      first: new Footer({ children: [] }),
    },
    children: body,
  }],
})

const out = join(ROOT, 'docs', 'LexForge-AI-User-Manual.docx')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, await Packer.toBuffer(doc))
console.log('wrote ' + out)
