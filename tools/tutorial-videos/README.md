# Tutorial Video Sources

Animated HTML sources and Playwright render script for KRSlab's self-hosted tutorial videos.

## Requirements

- Node.js 18+
- `playwright-core` (available in workspace dependencies) and Google Chrome
- `ffmpeg` on `PATH`

## Re-rendering

Run from this directory (or pass full paths):

```bash
node render.mjs tutorial1.html tutorial1.mp4 60
node render.mjs tutorial2.html tutorial2.mp4 60
```

## Compressing for `apps/web/public/tutorials/`

- Full videos: `tutorial-1.mp4`, `tutorial-2.mp4` (H.264, `yuv420p`, CRF 24, `-preset slow`, `-movflags +faststart`, AAC `96k`)
- Posters: `tutorial-1-poster.jpg`, `tutorial-2-poster.jpg` (1280px wide, `-q:v 3`)
- Previews: `tutorial-1-preview.mp4`, `tutorial-2-preview.mp4` (6s silent loop, 640px wide, 24fps, CRF 28, `-an`, `-movflags +faststart`)
