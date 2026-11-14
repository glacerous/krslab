# Contributing to KRSlab

KRSlab is open source under the [MIT License](./LICENSE). Contributions, parser fixes for new Indonesian campus portals, bug reports, and UI improvements are welcome.

## Local Setup

Requirements: Node.js 20+ and `pnpm`.

```bash
pnpm install
pnpm --filter @krs/engine build
pnpm --filter web dev
```

Open `http://localhost:3000`.

### Optional: Short Share Links (`/v/[id]`)

Short links store payloads in Upstash Redis. Local development works without it (the app falls back to `/view#s=...`), or you can copy `apps/web/.env.example` to `apps/web/.env.local` and fill in your Upstash REST credentials.

## Project Layout

- `apps/web`: Next.js 14 App Router UI, schedule grid, share viewer (`/view`, `/v/[id]`), and local Zustand store.
- `packages/engine`: Campus portal table parser (`BIMA`, `SIAKAD`, `SiakadCloud`, `SIMASTER`, `SIAK-NG`, `SIX`, `SIAM`, CSV/TSV), conflict checker, and constraint solver.

## Checks Before Opening a PR

```bash
pnpm -r exec tsc --noEmit
pnpm --filter @krs/engine test
pnpm --filter web lint
pnpm --filter web build
```

## Reporting Bugs & Contact

- Open a [GitHub Issue](https://github.com/glacerous/krslab/issues)
- Or reach out directly on X / Twitter: [@thefuturehold](https://x.com/thefuturehold)
