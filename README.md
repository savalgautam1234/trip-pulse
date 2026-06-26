# Trip Pulse — 30Sundays

AI-powered daily check-in tool for Trip Managers. Built with Next.js 14, Supabase, Prisma, Claude API, and Twilio.

---

## Deploy in ~10 minutes

### Step 1 — Supabase (database)

1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → Copy **Connection string** (Transaction mode, port 6543) → `DATABASE_URL`
3. Copy **Direct connection** (port 5432) → `DIRECT_URL`

### Step 2 — Twilio WhatsApp

1. [twilio.com/console](https://console.twilio.com) → Account SID + Auth Token
2. Messaging → Try it out → Send a WhatsApp Message → note the sandbox number
3. Set `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` (sandbox) or your approved number

### Step 3 — Anthropic API

1. [console.anthropic.com](https://console.anthropic.com) → API Keys → New key
2. Set as `ANTHROPIC_API_KEY`

### Step 4 — Google OAuth (optional)

1. [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0
2. Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Step 5 — Deploy to Vercel

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init"
gh repo create trip-pulse --public --push

# 2. Import on Vercel
# vercel.com → New Project → Import from GitHub

# 3. Add all environment variables in Vercel dashboard:
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
DATABASE_URL=...
DIRECT_URL=...
ANTHROPIC_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
GOOGLE_CLIENT_ID=...        (optional)
GOOGLE_CLIENT_SECRET=...    (optional)

# 4. After first deploy, run migrations:
npx prisma db push

# 5. Seed initial users:
node prisma/seed.js
```

### Step 6 — Log in

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@30sundays.com | admin123 |
| Trip Manager | rahul@30sundays.com | tm123 |

**Change passwords immediately after first login.**

---

## Local development

```bash
cp .env.example .env.local
# Fill in your values

npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth
│   │   ├── trips/                # CRUD trips
│   │   ├── checkin/              # AI generation + DB persist
│   │   ├── whatsapp/             # Twilio send
│   │   └── admin/stats/          # Admin aggregates
│   ├── login/                    # Auth page
│   ├── dashboard/                # TM interface
│   │   └── trips/[id]/           # Trip detail + generator
│   └── admin/                    # Admin dashboard
├── components/
│   ├── ui/Providers.tsx          # SessionProvider
│   └── dashboard/Sidebar.tsx     # Nav sidebar
├── lib/
│   ├── prisma.ts                 # DB client
│   ├── auth.ts                   # NextAuth config
│   └── utils.ts                  # Helpers
└── types/index.ts                # Shared types
```

## Features

- **Auth** — Email/password + Google OAuth, role-based (TM / Admin)
- **Trips** — Create, view, track status (On Track / Needs Attention / Issue Flagged)
- **AI check-ins** — Claude generates WhatsApp messages in English / Hindi / Hinglish
- **WhatsApp send** — One-click Twilio delivery to couple's number
- **History** — All check-ins persisted, viewable per trip
- **Admin** — Team overview, TM load, recent check-ins, action stats
