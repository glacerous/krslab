import { LocalizedText } from "./onboarding/content";

export type ChangelogTag = "new" | "improved" | "fix" | "milestone";

export interface ChangelogHighlight {
    tag: ChangelogTag;
    text: LocalizedText;
}

export interface ChangelogEntry {
    version: string;
    date: string; // ISO YYYY-MM-DD
    title: LocalizedText;
    note?: LocalizedText;
    milestone?: boolean;
    highlights: ChangelogHighlight[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "0.2.0",
        date: "2026-11-13",
        title: {
            en: "Video guides & release notes",
            id: "Video panduan & catatan rilis",
        },
        note: {
            en: "Recorded two quick videos so you can see the whole flow — from pasting BIMA to shuffling rules — without guessing.",
            id: "Bikin dua video singkat biar langsung kebayang alurnya — dari tempel tabel BIMA sampai acak jadwal pakai aturan.",
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
                    en: "Advanced walkthrough covering rules, auto-schedule, plans, and custom courses",
                    id: "Video lanjutan: aturan, susun otomatis, plan, dan matkul sendiri",
                },
            },
            {
                tag: "new",
                text: {
                    en: "This release notebook and the /changelog timeline",
                    id: "Panel catatan rilis ini dan halaman linimasa /changelog",
                },
            },
        ],
    },
    {
        version: "0.1.0",
        date: "2026-11-08",
        title: {
            en: "The workspace revamp",
            id: "Perombakan ruang kerja",
        },
        note: {
            en: "Rebuilt the studio around one calm canvas. Dropped the cluttered popups, sped up card dragging, and started every new session clean.",
            id: "Bangun ulang ruang kerja jadi satu kanvas yang lebih tenang. Pop-up yang numpuk dibuang, geser kartu lebih mulus, dan sesi baru langsung rapi.",
        },
        highlights: [
            {
                tag: "improved",
                text: {
                    en: "Unified workspace with a clean blank-slate welcome screen",
                    id: "Ruang kerja terpadu dengan layar sambutan yang bersih",
                },
            },
            {
                tag: "improved",
                text: {
                    en: "Streamlined Rules drawer with 4 direct controls and blueprint styling",
                    id: "Panel Aturan disederhanakan jadi 4 kontrol langsung dengan gaya blueprint",
                },
            },
            {
                tag: "improved",
                text: {
                    en: "Keyboard navigation on schedule cards plus reduced-motion support",
                    id: "Navigasi keyboard di kartu jadwal serta dukungan reduced-motion",
                },
            },
        ],
    },
    {
        version: "milestone",
        date: "2026-01-23",
        milestone: true,
        title: {
            en: "1,000 users in two weeks",
            id: "1.000 pengguna dalam dua minggu",
        },
        note: {
            en: "Shipped the first version right before KRS war in January. Watching over a thousand students build clash-free schedules and share screenshots made every late night worth it.",
            id: "Rilis versi pertama pas menjelang perang KRS Januari kemarin. Liat lebih dari seribu mahasiswa nyusun jadwal bebas bentrok dan bagikan hasilnya bikin semua begadang kerasa banget.",
        },
        highlights: [],
    },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG[0]?.version ?? "0.2.0";
