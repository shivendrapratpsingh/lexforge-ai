# LexForge AI

AI-powered Indian legal document drafting platform built with Next.js 16,
next-auth v5, Prisma + Postgres, and Groq's Llama 3.x models.

LexForge generates court-ready drafts (Legal Notices, Petitions, Writ
Petitions, Bail Applications, Affidavits, Vakalatnamas, Contracts, RTI,
Divorce, Sale Deeds, Cheque-bounce, FIRs, Consumer Complaints, Legal
Opinions, and more) in under 30 seconds. The AI is bound by an absolute
input-fidelity mandate, so the document reflects your exact details — no
fabricated names, dates, or citations.

## Features

- 19 Indian legal document types with type-specific intake forms
- Llama 3.3 70B (Pro) / Llama 3.1 8B (Free) generation via Groq
- PDF / DOCX / TXT export
- Draft history, version control, and finalize/lock workflow
- Clients, Court Dates, Legal Tools, Research suite (Pro)
- Floating AI Case Assistant chatbot (Pro)
- Full Admin Console with platform stats, user/draft moderation, Pro
  toggle, free-quota cap, global + per-email Pro promotions

## Quick start

1.  Install dependencies

    ```bash
    npm install
    ```

2.  Configure environment

    ```bash
    cp .env.example .env.local
    cp .env.example .env          # Prisma CLI reads .env
    ```

    Fill in `DATABASE_URL` (free Postgres at https://neon.tech),
    `AUTH_SECRET` (`openssl rand -base64 32`), `NEXTAUTH_URL`, and
    `GROQ_API_KEY` (free at https://console.groq.com).

3.  Initialize the database

    ```bash
    npx prisma db push
    ```

    On Windows you can also run `SETUP.bat` / `FIX.bat`.

4.  Run

    ```bash
    npm run dev
    ```

    Open http://localhost:3000.

## Admin access

The platform admin is hard-coded in `lib/admin.js`:

```js
export const ADMIN_EMAIL = 'pratapsinghshivendra21@gmail.com'
```

Register and log in with that email and you'll automatically:

- See the **Admin Console** link in the sidebar
- Reach `/admin` (it redirects non-admins back to `/dashboard`)
- Always have full Pro access regardless of the Pro toggle or your
  `User.tier` value

To transfer admin to a different person, change `ADMIN_EMAIL` in
`lib/admin.js`, redeploy, and have them register that email.

### What the admin can control

The Admin Console (`/admin`) exposes every operational lever:

- **Platform Stats** — total / Pro / free / suspended users, draft counts
  (today / 7d / month), clients, court dates
- **System Settings** — global Pro Enforcement toggle and the monthly
  free-tier draft cap
- **Global Pro Promotion** — open Pro to *everyone* during a date window
- **Individual Pro Grants** — give a specific email Pro for a window
  (works even before they've registered)
- **Users** — upgrade / downgrade tier, suspend / unsuspend, delete
- **All Drafts** — view and delete any user's drafts

## Pro tier

Five independent paths to Pro, evaluated in this order:

1. The hard-coded admin email (always Pro)
2. `User.tier === 'pro'` in the database (set via Admin Console -> Users)
3. An active **Global Pro Promotion** window
4. An active **Individual Pro Grant** for the logged-in email
5. Pro Enforcement is OFF (default) — every signed-in user gets Pro
   features

When all promo windows expire, users revert to whatever
`User.tier` says, so paying Pro accounts are never accidentally downgraded.

What Pro adds is defined in `lib/pro-features.js`:

- 2-3x longer, court-ready drafts with Index / Annexure / verification
- Real Supreme Court / High Court citations (5+ per issue)
- Stronger AI model (Llama 3.3 70B vs 8B)
- AI Case Assistant chatbot (`/api/assistant`)
- Premium document types (Writ, PIL, Bail, Divorce, Contract, Sale Deed)
- Clients / Court Dates / Legal Tools / Research suite
- Unlimited monthly drafts

## Project structure

```
app/
  page.js                  Landing page (redirects logged-in users to /dashboard)
  (auth)/                  Login + register
  (dashboard)/             Authenticated app
    dashboard/             Stats overview + recent drafts
    new-draft/             Document type picker + intake form
    drafts/                Draft list + per-draft editor
    clients/, court-dates/, tools/, research/   (Pro)
    upgrade/               Pricing / benefits page
    admin/                 Admin Console (admin email only)
  api/                     Route handlers
    drafts/                Generate + CRUD
    admin/                 Admin-only endpoints
    assistant/             Pro Case Assistant chatbot
    me/                    Session-info for client components
lib/
  admin.js                 isAdmin / hasProAccess / promo logic
  auth.js                  next-auth configuration
  groq.js                  AI prompt assembly + FIDELITY_MANDATE
  pro-features.js          Pro feature matrix per document type
  system-config.js         Cached SystemConfig getter
  prisma.js                Prisma client singleton
  utils.js                 DOCUMENT_TYPES + helpers
  validation.js            Junk-value detection (rejects "NA", "no", etc.)
components/
  AdminConsole.js, AssistantWidget.js, SidebarNav.js, ...
prisma/
  schema.prisma
```

## Input fidelity

The AI is bound by `FIDELITY_MANDATE` in `lib/groq.js`, which forces it to:

- Use the user's input verbatim (no paraphrasing of names, dates, amounts)
- Never invent facts, parties, dates, or case citations
- Use `[BRACKETED PLACEHOLDERS]` for missing fields
- Cite only real, well-known judgments — prefer 0 citations to 1 fabricated one

`/api/drafts/route.js` further sanitises the input by stripping common
junk values (`"NA"`, `"no"`, `"don't know"`, `"-"`, etc.) before they ever
reach the prompt, and rejects requests where every field is junk.

## Tech stack

- Next.js 16 (App Router) + React 18
- next-auth v5 (credentials)
- Prisma 5 + PostgreSQL
- Groq SDK (Llama 3.1 8B / 3.3 70B)
- bcryptjs for passwords
- jsPDF + docx for exports

## Scripts

```
npm run dev                # next dev
npm run build              # prisma generate && next build
npm run start              # next start (production)
npm run lint               # next lint
```

## License

Proprietary — for internal / educational use.
