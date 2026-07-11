# Purrple Prose 🐈‍⬛

A creative-writing companion where the AI is a cat that sleeps on the page.
Click it, and it wakes, pads across your screen, and leaves you a story
prompt drawn from your own writing — the front for an orchestrated crew of
specialized sub-agents with persistent memory of your stories.

> **Status: Phase 0 (scaffold).** Full README with architecture decisions,
> tradeoffs, and deploy docs lands in Phase 7.

## Stack

Next.js (App Router) + TypeScript · Postgres + pgvector · Prisma 7 ·
Auth.js · Anthropic API · Inngest · Tailwind CSS · Vitest

## Local setup

```bash
# 1. Database — either:
docker compose up -d                     # Docker
# or:
brew install postgresql@17 pgvector      # Homebrew (macOS)
brew services start postgresql@17
createdb purrple_prose

# 2. Environment
cp .env.example .env                     # then set DATABASE_URL (see comments)

# 3. Install, migrate, run
npm install
npx prisma migrate dev
npm run dev
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run db:migrate` | Prisma migrations |

## Deploy (Vercel)

1. **Import** the GitHub repo in Vercel (framework auto-detects Next.js;
   `vercel.json` supplies the build command, which runs migrations).
2. **Database**: add a Postgres store from the Vercel Marketplace (Neon).
   It must support pgvector (Neon does). This sets `DATABASE_URL`.
3. **Environment variables** (Project → Settings → Environment Variables):
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `CRON_SECRET` — any random string; protects the coach cron endpoint
   - `CLAUDE_CODE_OAUTH_TOKEN` — optional; without it the app runs on the
     clearly-labeled mock AI. Note the Agent SDK spawns a subprocess per
     call, which is slow/fragile on serverless — a direct Anthropic API
     provider (`ANTHROPIC_API_KEY`) is the intended production path.
4. The overnight coach runs via Vercel Cron (`/api/cron/coach`, 6:00 UTC
   daily). Locally, an in-process scheduler does the same job.

## Architecture (so far)

```
src/
  app/               # web layer: routes, server actions, UI
  lib/
    db/              # Prisma client + repositories
    agents/          # AI orchestration layer — see src/lib/agents/README.md
    milwordy/        # million-words-a-year math (pure functions)
    words/           # word counting + daily aggregation (pure functions)
```

The agent layer is framework-agnostic: nothing in `src/lib/agents` imports
from the web layer.
