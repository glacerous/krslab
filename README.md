# KRSlab — Smart KRS Planner

A straightforward tool to help you plan your **KRS (Study Plan Card)** without the usual headache. KRSlab takes your BIMA CSV file, analyzes it with a scheduling engine, flags clashes, and suggests workable timetable options so you don’t have to brute-force your semester by hand.

If you’ve ever stared at overlapping classes wondering “how is this even possible,” this exists for that exact moment.

---

## What this project is

KRSlab is a monorepo web application built around three main pieces:

* A **scheduling engine** that reasons about conflicts and valid course combinations
* A thin **wrapper layer** that translates BIMA CSV data into something the engine understands
* A clean **Next.js interface** where you can browse courses, visualize schedules, and export results

The goal is simple: turn messy raw data into a usable plan as quickly as possible.

---

## Tech Stack

* **Monorepo:** pnpm workspaces
* **Frontend:** Next.js (App Router) + TailwindCSS
* **State:** Zustand
* **CSV Parsing:** PapaParse
* **Core Logic:** `krsplan-engine`
* **Adapter Layer:** `@krs/engine`

---

## Getting started

You’ll need **Node.js** installed. If `pnpm` isn’t in your PATH, you can safely use `npx pnpm`.

### 1) Install dependencies

```bash
npx pnpm install
```

### 2) Build the engine

The web app relies on the engine’s build artifacts, so this step is required.

```bash
npx pnpm build
```

### 3) Run development server

```bash
npx pnpm dev
```

Open **http://localhost:3000** in your browser.

---

## Repository structure

```
packages/
  ├── krsplan-engine   # Scheduling logic
  └── engine           # CSV parser + web adapter

apps/
  └── web              # Next.js application
```

---

## MVP Features

* Upload CSV from BIMA
* Search courses quickly
* View schedules in a grid layout
* Automatic conflict detection with visual badges
* Plan generator (up to 3 alternative schedules)
* Export final plan to JSON

---

## Why KRSlab?

Because juggling dozens of courses in a spreadsheet isn’t fun, and doing it manually is a waste of time. KRSlab tries to make that part a little easier.

---

## Contributing

Issues and pull requests are welcome. If you found a bug, have a feature idea, or just want to improve something, feel free to open a discussion or submit a PR.
