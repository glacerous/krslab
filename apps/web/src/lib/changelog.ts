import { LocalizedText } from "./onboarding/content";

export type ChangelogTag = "new" | "improved" | "fix" | "milestone";
export type ChangelogKind = "release" | "milestone";

export interface ChangelogMedia {
    type: "video" | "image";
    src: string;
    poster?: string;
    alt: LocalizedText;
    aspect: "16/9" | "4/3" | "1.91/1";
    durationSec?: number;
}

export interface ChangelogHighlight {
    tag: ChangelogTag;
    text: LocalizedText;
}

export interface ChangelogEntry {
    version: string;
    date: string; // ISO YYYY-MM-DD
    kind: ChangelogKind;
    badge?: LocalizedText;
    title: LocalizedText;
    summary: LocalizedText;
    highlights: ChangelogHighlight[];
    media?: ChangelogMedia;
    announce?: boolean;
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "0.3.0",
        date: "2026-11-14",
        kind: "release",
        announce: true,
        badge: { en: "v0.3.0, latest", id: "v0.3.0, terbaru" },
        title: {
            en: "Short schedule links & unified Share menu",
            id: "Link jadwal singkat & menu Bagikan baru",
        },
        summary: {
            en: "Share any KRS plan with a short /v/... link, export to PNG, clipboard, calendar (.ics), or text from one Share menu, and move your workspace across devices.",
            id: "Bagikan rencana KRS lewat link singkat /v/..., ekspor ke PNG, clipboard, kalender (.ics), atau teks dari satu menu Bagikan, dan pindahkan workspace antar perangkat.",
        },
        highlights: [
            {
                tag: "new",
                text: {
                    en: "Short /v/... schedule links with a read-only viewer and safe Copy to Workspace",
                    id: "Link singkat /v/... dengan tampilan hanya lihat dan Salin ke Ruang Kerja yang aman",
                },
            },
            {
                tag: "new",
                text: {
                    en: "Unified Share menu: Copy Schedule Link, Download PNG, Copy Image, Calendar (.ics), and Copy KRS List",
                    id: "Menu Bagikan terpadu: Salin Link Jadwal, Unduh PNG, Salin Gambar, Kalender (.ics), dan Salin Daftar KRS",
                },
            },
            {
                tag: "new",
                text: {
                    en: "Workspace transfer link & .json backup/restore inside Preferences",
                    id: "Link transfer workspace & backup/pulihkan .json di menu Preferensi",
                },
            },
        ],
    },
    {
        version: "0.2.0",
        date: "2026-11-13",
        kind: "release",
        announce: true,
        badge: { en: "v0.2.0", id: "v0.2.0" },
        title: {
            en: "Video guides & release notes",
            id: "Video panduan & catatan rilis",
        },
        summary: {
            en: "Recorded two quick videos so you can see the whole flow, from pasting BIMA to shuffling rules, without guessing.",
            id: "Bikin dua video singkat biar langsung kebayang alurnya, dari tempel BIMA sampai acak jadwal pakai aturan.",
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
        media: {
            type: "video",
            src: "/changelog/v0-2-0-intro.mp4",
            poster: "/changelog/v0-2-0-intro-poster.jpg",
            alt: {
                en: "Intro card opening the 1-minute video tutorial with chapters",
                id: "Kartu intro membuka video tutorial 1 menit beserta daftar bagian",
            },
            aspect: "16/9",
            durationSec: 8,
        },
    },
    {
        version: "0.1.0",
        date: "2026-11-08",
        kind: "release",
        badge: { en: "v0.1.0, revamp", id: "v0.1.0, perombakan" },
        title: {
            en: "The workspace revamp",
            id: "Perombakan ruang kerja",
        },
        summary: {
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
        media: {
            type: "video",
            src: "/changelog/v0-1-0-drag.mp4",
            poster: "/changelog/v0-1-0-drag-poster.jpg",
            alt: {
                en: "Dragging a clashing course card onto a dashed alternative slot",
                id: "Menyeret kartu jadwal bentrok ke slot alternatif bertitik",
            },
            aspect: "16/9",
            durationSec: 8,
        },
    },
    {
        version: "milestone-632",
        date: "2026-01-21",
        kind: "milestone",
        badge: { en: "★ milestone", id: "★ pencapaian" },
        title: {
            en: "632 visitors in the first week",
            id: "632 pengunjung di minggu pertama",
        },
        summary: {
            en: "5,623 page views in 7 days, 99% from Indonesia, with a peak above 150 visitors in a single day.",
            id: "5.623 tampilan halaman dalam 7 hari, 99% dari Indonesia, dengan puncak lebih dari 150 pengunjung dalam sehari.",
        },
        highlights: [],
        media: {
            type: "image",
            src: "/changelog/milestone-632.webp",
            alt: {
                en: "KRSlab milestone card: 632 visitors in 7 days, 5,623 page views, 99% Indonesia",
                id: "Kartu pencapaian KRSlab: 632 pengunjung dalam 7 hari, 5.623 tampilan halaman, 99% Indonesia",
            },
            aspect: "1.91/1",
        },
    },
    {
        version: "0.0.1",
        date: "2026-01-13",
        kind: "release",
        badge: { en: "v0.0.1, first launch", id: "v0.0.1, rilis perdana" },
        title: {
            en: "The very first version of KRSlab",
            id: "Versi pertama KRSlab",
        },
        summary: {
            en: "First public release before January KRS season: a rough BIMA table parser, conflict checker, and weekly grid running 100% in the browser.",
            id: "Rilis publik pertama menjelang KRS Januari: parser tabel BIMA sederhana, cek bentrok, dan grid mingguan yang jalan 100% di browser.",
        },
        highlights: [],
    },
];

export const LATEST_CHANGELOG_ENTRY = CHANGELOG[0];
export const LATEST_CHANGELOG_VERSION = LATEST_CHANGELOG_ENTRY?.version ?? "0.2.0";
