# Changelog Media Tooling

Generates self-hosted clips, posters, and milestone cards for `apps/web/public/changelog/`.

## Requirements

- Node.js 18+
- `@playwright/test` (workspace dependency) + Chromium (`npx playwright install chromium`)
- `ffmpeg` and `ffprobe` on `PATH`

## Usage

1. Start the production app (`pnpm --filter web build && pnpm --filter web start -p 3099`).
2. Capture raw clips:
   ```bash
   node tools/changelog-media/capture.mjs http://127.0.0.1:3099
   ```
3. Encode MP4s, posters, and optional share GIFs (`tools/changelog-media/out/share/`):
   ```bash
   node tools/changelog-media/encode.mjs
   ```
4. Render the milestone card (`milestone-632.webp` and `milestone-632.jpg`):
   ```bash
   node tools/changelog-media/render-card.mjs
   ```
