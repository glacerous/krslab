# KRSlab

[![CI](https://github.com/glacerous/krslab/actions/workflows/ci.yml/badge.svg)](https://github.com/glacerous/krslab/actions/workflows/ci.yml)
[![Live App](https://img.shields.io/badge/app-krslab.vercel.app-141413)](https://krslab.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Open-source university course (KRS) schedule planner built for Indonesian campus portals. Paste a course table from your campus portal, inspect clashes on a weekly grid, generate conflict-free schedules with custom rules, and share plans via a short link.

## How it works

1. **Local-first workspace:** Course sources, plans, locked sections, and solver rules live in browser `localStorage` via Zustand (`apps/web/src/lib/store.ts`). No account is required.
2. **Client-side parser & solver (`@krs/engine`):** Table parsing, clash detection, and schedule generation run directly in the browser (`packages/engine/src`).
3. **Link sharing (`/v/[id]` & `/view`):** Clicking **Bagikan -> Salin Link Jadwal** compresses the plan with `deflate-raw` and stores it in Upstash Redis (`POST /api/share`) to return a short `/v/<id>` URL. If Redis is not configured, it falls back to a self-contained `/view#s=...` URL.

## Supported inputs

- Campus portal tables copied from **BIMA**, **SIAKAD**, **SiakadCloud**, **SIMASTER**, **SIAK-NG**, **SIX**, and **SIAM**
- Spreadsheet / delimited text (**Excel**, **CSV**, **TSV**)
- Manual course & class builder inside the app

## Local development

Requirements: Node.js 20+ and `pnpm`.

```bash
pnpm install
pnpm --filter @krs/engine build
pnpm --filter web dev
```

Open `http://localhost:3000`.

### Optional: short share links (`/v/[id]`)

Copy `apps/web/.env.example` to `apps/web/.env.local` and add your Upstash Redis REST credentials if you want to test `/api/share` and `/v/[id]` locally:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Without these variables, sharing automatically falls back to `/view#s=...`.

## Scripts

```bash
pnpm -r exec tsc --noEmit     # Typecheck all workspaces
pnpm --filter @krs/engine test # Run parser and solver tests (Vitest)
pnpm --filter web lint         # Lint Next.js app
pnpm --filter web build        # Production build + changelog media check
```

## Project structure

```text
apps/
  web/
    src/app/          # Studio (/), share viewer (/view, /v/[id]), /api/share, /changelog
    src/components/   # ScheduleGrid, CoursePanel, DataModal, RulesModal, CustomCourseModal
    src/lib/          # Zustand store, share encoding, Upstash Redis client, PNG/ICS export, i18n
packages/
  engine/
    src/              # Portal table parser, time/day conflict checker, constraint solver
tools/                # Asset and media utilities
```

## Contributing & contact

Contributions, parser fixes for campus portals, and bug reports are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a PR.

- **Bug reports & questions:** [@thefuturehold on X (Twitter)](https://x.com/thefuturehold) or [GitHub Issues](https://github.com/glacerous/krslab/issues)
- **License:** [MIT](./LICENSE)
