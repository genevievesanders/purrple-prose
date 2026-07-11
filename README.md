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
