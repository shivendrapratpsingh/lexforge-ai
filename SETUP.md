# LexForge AI — Complete Setup Guide

Follow these steps **in order** every time you start fresh or on a new machine.

---

## STEP 1 — Fill in your API keys

Open `.env.local` in the project folder and fill in all 4 values:

### 1a. AUTH_SECRET
Open **Command Prompt** and run:
```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output and paste it as the value for `AUTH_SECRET`.

### 1b. DATABASE_URL
1. Go to https://neon.tech and create a free account
2. Create a new project
3. On the dashboard, click **"Connection string"** (make sure it says `postgresql://`)
4. Copy and paste it as `DATABASE_URL`

### 1c. GROQ_API_KEY
1. Go to https://console.groq.com
2. Sign up for a free account
3. Click **API Keys** → **Create API Key**
4. Copy and paste it as `GROQ_API_KEY`

### 1d. NEXTAUTH_URL and AUTH_URL
Leave both as `http://localhost:3000` for local development.

---

## STEP 2 — Install dependencies

Open **Command Prompt** in the project folder (where `package.json` is) and run:
```
npm install
```
Wait for it to finish (may take 1–2 minutes).

---

## STEP 3 — Push database schema to Neon

This creates all the tables in your Neon database:
```
npx prisma db push
```
You should see: `✓ Your database is now in sync with your Prisma schema.`

---

## STEP 4 — Start the app

```
npm run dev
```

Open your browser and go to: **http://localhost:3000**

---

## STEP 5 — Use the app

1. Click **"Get Started Free"** → fill in name, email, password → **Create Account**
2. You'll be redirected to the Dashboard automatically
3. Click **"Generate Document"** in the sidebar or dashboard
4. Select a document type, fill in the fields, click **"Generate with AI"**
5. Wait 10–25 seconds → document is generated and saved
6. Download as PDF, DOCX, or TXT using the buttons at the top

---

## Common Problems

### "Invalid email or password"
- Make sure you registered first (click "Create Account" not "Sign In")
- Check that DATABASE_URL is correct and `npx prisma db push` was run

### App crashes on start
- Check that all 4 values in `.env.local` are filled in (no placeholder text)
- Make sure `npm install` was run

### AI generation fails / shows fallback text
- Check that GROQ_API_KEY starts with `gsk_`
- Verify the key is active at https://console.groq.com

### Port 3000 already in use
Run: `netstat -ano | findstr :3000` then `taskkill /PID <number> /F`

---

## File Structure (what each file does)

```
lexforge-ai/
├── app/
│   ├── page.js                    ← Landing page (public)
│   ├── layout.js                  ← Root layout (SessionProvider)
│   ├── globals.css                ← Dark gold theme styles
│   ├── (auth)/
│   │   ├── login/page.js          ← Sign in page
│   │   └── register/page.js       ← Create account page
│   ├── (dashboard)/
│   │   ├── layout.js              ← Sidebar navigation layout
│   │   ├── dashboard/page.js      ← Stats + recent docs
│   │   ├── new-draft/page.js      ← Generate document wizard
│   │   ├── drafts/page.js         ← All documents grid
│   │   ├── drafts/[id]/page.js    ← Single document viewer
│   │   └── research/page.js       ← Case law + AI analysis
│   └── api/
│       ├── auth/register/         ← POST: Create user account
│       ├── auth/[...nextauth]/    ← NextAuth sign in/out handler
│       ├── drafts/                ← GET list, POST generate
│       ├── drafts/[id]/           ← GET, PATCH, DELETE single draft
│       ├── export/[id]/[format]/  ← GET: Export as pdf/docx/txt
│       └── legal/analyze/         ← GET: AI legal analysis
├── components/
│   ├── Providers.js               ← SessionProvider wrapper
│   ├── DraftActions.js            ← Export/Finalize/Delete buttons
│   └── SignOutButton.js           ← Sign out button
├── lib/
│   ├── auth.js                    ← NextAuth config (JWT + Credentials)
│   ├── prisma.js                  ← Prisma client singleton
│   ├── groq.js                    ← Groq AI document generation
│   └── utils.js                   ← Document types, case laws, helpers
├── prisma/schema.prisma           ← Database schema
├── auth.config.js                 ← Edge-safe auth config (for middleware)
├── middleware.js                  ← Route protection
├── next.config.ts                 ← Next.js config
└── .env.local                     ← YOUR API KEYS (never commit this)
```
