# KRS Plan

Aplikasi perencanaan jadwal KRS (Kartu Rencana Studi) yang cerdas, menggunakan engine khusus untuk deteksi bentrok dan optimasi jadwal.

## Tech Stack
- **Monorepo**: pnpm workspaces
- **Framework**: Next.js (App Router)
- **Engine**: `krsplan-engine` (logic core)
- **Wrapper**: `@krs/engine` (adapter & helper)
- **State**: Zustand
- **Parsing**: PapaParse
- **UI**: TailwindCSS

## Prasyarat
- Node.js & pnpm (disarankan menggunakan `npx pnpm` jika pnpm tidak terinstall di PATH)

## Instalasi & Menjalankan

1. **Install Dependencies**
   ```bash
   npx pnpm install
   ```

2. **Build Engine**
   Hal ini wajib dilakukan karena aplikasi web bergantung pada build artifact dari engine.
   ```bash
   npx pnpm build
   ```

3. **Running Development**
   ```bash
   npx pnpm dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

## Struktur Repo
- `packages/krsplan-engine`: Logika utama scheduling (external repo).
- `packages/engine`: Wrapper untuk integrasi web dan parsing CSV BIMA.
- `apps/web`: Aplikasi web Next.js.

## Fitur MVP
- [x] Upload CSV dari BIMA.
- [x] Pencarian mata kuliah.
- [x] Visualisasi jadwal dalam bentuk Grid.
- [x] Deteksi bentrok otomatis (Badge Conflict).
- [x] Plan Generator (Hingga 3 opsi rencana jadwal).
- [x] Export hasil rencana ke JSON.
