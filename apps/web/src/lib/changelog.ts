import { LocalizedText } from "./onboarding/content";

export type ChangelogTag = "new" | "improved" | "fix";

export interface ChangelogHighlight {
    tag: ChangelogTag;
    text: LocalizedText;
}

export interface ChangelogEntry {
    version: string;
    date: string; // ISO YYYY-MM-DD
    highlights: ChangelogHighlight[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "0.2.0",
        date: "2026-11-13",
        highlights: [
            {
                tag: "new",
                text: {
                    en: "Video tutorials: a 1-minute getting-started video and an advanced one (rules, auto-schedule, plans, custom courses)",
                    id: "Video tutorial: video mulai cepat 1 menit dan video lanjutan (aturan, susun otomatis, plan, matkul sendiri)",
                },
            },
            {
                tag: "new",
                text: {
                    en: "What's new panel and full changelog page to follow updates",
                    id: "Panel Yang baru dan halaman catatan rilis untuk mengikuti pembaruan",
                },
            },
        ],
    },
    {
        version: "0.1.0",
        date: "2026-11-11",
        highlights: [
            {
                tag: "improved",
                text: {
                    en: "Smoother schedule grid dragging and faster rendering",
                    id: "Geser kartu jadwal di kanvas lebih mulus dan responsif",
                },
            },
            {
                tag: "improved",
                text: {
                    en: "Streamlined Rules drawer with unified controls and cleaner blueprint styling",
                    id: "Panel Aturan disederhanakan dengan kontrol terpadu dan tampilan blueprint yang lebih rapi",
                },
            },
            {
                tag: "improved",
                text: {
                    en: "Keyboard navigation across schedule cards and alternative class slots",
                    id: "Navigasi keyboard penuh untuk kartu jadwal dan slot kelas alternatif",
                },
            },
            {
                tag: "improved",
                text: {
                    en: "Respects reduced-motion system preferences across animations",
                    id: "Mengikuti preferensi reduced-motion sistem pada semua animasi",
                },
            },
            {
                tag: "fix",
                text: {
                    en: "Welcome screen now starts with a clean blank workspace",
                    id: "Layar sambutan kini memulai ruang kerja kosong yang rapi",
                },
            },
        ],
    },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG[0]?.version ?? "0.2.0";
