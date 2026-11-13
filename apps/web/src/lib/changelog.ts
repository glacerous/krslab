import { LocalizedText } from "./onboarding/content";

export type ChangelogTag = "new" | "improved" | "fix" | "milestone";

export interface ChangelogHighlight {
    tag: ChangelogTag;
    text: LocalizedText;
}

export interface ChangelogEntry {
    version: string;
    date: string; // ISO YYYY-MM-DD
    badge?: LocalizedText;
    title: LocalizedText;
    note?: LocalizedText;
    milestone?: boolean;
    highlights: ChangelogHighlight[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "0.2.0",
        date: "2026-11-13",
        badge: { en: "v0.2.0 · latest", id: "v0.2.0 · terbaru" },
        title: {
            en: "Video guides & release notes",
            id: "Video panduan & catatan rilis",
        },
        note: {
            en: "Recorded two quick videos so you can see the whole flow — from pasting BIMA to shuffling rules — without guessing.",
            id: "Bikin dua video singkat biar langsung kebayang alurnya — dari tempel BIMA sampai acak jadwal pakai aturan.",
        },
        highlights: [
            {
                tag: "new",
                text: {
                    en: "1-minute getting-started video (BIMA import, clash drag, PNG export)",
                    id: "Video mulai cepat 1 menit (impor BIMA, geser bentrok, ekspor PNG)",
                },
            },
            {
                tag: "new",
                text: {
                    en: "Advanced walkthrough: rules, auto-schedule, plans, custom courses",
                    id: "Video lanjutan: aturan, susun otomatis, plan, matkul sendiri",
                },
            },
            {
                tag: "new",
                text: {
                    en: "This release notebook and /changelog timeline",
                    id: "Panel catatan rilis ini dan linimasa /changelog",
                },
            },
        ],
    },
    {
        version: "0.1.0",
        date: "2026-11-08",
        badge: { en: "v0.1.0 · revamp", id: "v0.1.0 · perombakan" },
        title: {
            en: "The workspace revamp",
            id: "Perombakan ruang kerja",
        },
        note: {
            en: "Rebuilt the studio around one calm canvas. Dropped the cluttered popups, sped up card dragging, and started every session clean.",
            id: "Bangun ulang ruang kerja jadi satu kanvas yang tenang. Pop-up yang numpuk dibuang, geser kartu lebih mulus, dan sesi baru langsung rapi.",
        },
        highlights: [
            {
                tag: "improved",
                text: {
                    en: "Unified workspace with a clean blank-slate welcome screen",
                    id: "Ruang kerja terpadu dengan layar sambutan bersih",
                },
            },
            {
                tag: "improved",
                text: {
                    en: "Streamlined Rules drawer with 4 direct controls",
                    id: "Panel Aturan disederhanakan jadi 4 kontrol langsung",
                },
            },
            {
                tag: "improved",
                text: {
                    en: "Keyboard navigation on schedule cards + reduced-motion support",
                    id: "Navigasi keyboard di kartu jadwal + dukungan reduced-motion",
                },
            },
        ],
    },
    {
        version: "milestone",
        date: "2026-01-27",
        milestone: true,
        badge: { en: "★ milestone", id: "★ pencapaian" },
        title: {
            en: "1,000 users in two weeks",
            id: "1.000 pengguna dalam dua minggu",
        },
        note: {
            en: "Two weeks after going public, over 1,000 students used KRSlab for KRS war. Seeing friends share clash-free screenshots made every late night worth it.",
            id: "Dua minggu setelah rilis ke publik, lebih dari 1.000 mahasiswa pakai KRSlab buat perang KRS. Liat teman-teman bagikan jadwal bebas bentrok bikin semua begadang terbayar.",
        },
        highlights: [],
    },
    {
        version: "0.0.1",
        date: "2026-01-13",
        badge: { en: "v0.0.1 · first launch", id: "v0.0.1 · rilis perdana" },
        title: {
            en: "The very first version of KRSlab",
            id: "Versi pertama KRSlab",
        },
        note: {
            en: "First public release before January KRS season — a rough BIMA table parser, conflict checker, and weekly grid running 100% in the browser.",
            id: "Rilis publik pertama menjelang KRS Januari — parser tabel BIMA sederhana, cek bentrok, dan grid mingguan yang jalan 100% di browser.",
        },
        highlights: [],
    },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG[0]?.version ?? "0.2.0";
