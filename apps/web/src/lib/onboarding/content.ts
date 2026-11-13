export type TutorialVideoId = "start" | "advanced";

export interface LocalizedText {
    en: string;
    id: string;
}

export interface VideoChapter {
    at: number;
    title: LocalizedText;
}

export interface TutorialVideo {
    id: TutorialVideoId;
    src: string;
    poster: string;
    preview: string;
    durationSec: number;
    title: LocalizedText;
    blurb: LocalizedText;
    chapters: VideoChapter[];
}

export const ONBOARDING_STORAGE_KEYS = {
    introSeen: "krs_intro_seen",
    seenVersion: "krs_seen_version",
    tipAdvancedSeen: "krs_tip_advanced_seen",
} as const;

export const VIDEOS: TutorialVideo[] = [
    {
        id: "start",
        src: "/tutorials/tutorial-1.mp4",
        poster: "/tutorials/tutorial-1-poster.jpg",
        preview: "/tutorials/tutorial-1-preview.mp4",
        durationSec: 69,
        title: {
            en: "Get started in 1 minute",
            id: "Mulai dalam 1 menit",
        },
        blurb: {
            en: "Copy your BIMA schedule, pick courses, fix clashes, and export a PNG.",
            id: "Salin jadwal dari BIMA, pilih matkul, atasi bentrok, lalu ekspor PNG.",
        },
        chapters: [
            { at: 4, title: { en: "Log in to BIMA", id: "Login ke BIMA" } },
            { at: 8, title: { en: "Open Lecturer Schedule", id: "Buka Jadwal Dosen" } },
            { at: 11, title: { en: "Pick your semester", id: "Pilih semester" } },
            { at: 16, title: { en: "Copy the table", id: "Salin tabelnya" } },
            { at: 25, title: { en: "Open KRSlab", id: "Buka KRSlab" } },
            { at: 30, title: { en: "Import the table", id: "Impor tabelnya" } },
            { at: 40, title: { en: "Pick your courses", id: "Pilih mata kuliah" } },
            { at: 51, title: { en: "Clash? Drag the card", id: "Bentrok? Seret kartunya" } },
            { at: 58, title: { en: "Export as PNG", id: "Export jadi PNG" } },
        ],
    },
    {
        id: "advanced",
        src: "/tutorials/tutorial-2.mp4",
        poster: "/tutorials/tutorial-2-poster.jpg",
        preview: "/tutorials/tutorial-2-preview.mp4",
        durationSec: 92,
        title: {
            en: "Advanced: rules, auto-schedule & plans",
            id: "Lanjutan: aturan, auto-schedule & plan",
        },
        blurb: {
            en: "Set day/time rules, shuffle valid layouts, manage sources & plans, or add custom courses.",
            id: "Atur hari libur & jam kuliah, acak susunan otomatis, kelola sumber & plan, atau tambah matkul sendiri.",
        },
        chapters: [
            { at: 5, title: { en: "Set your rules", id: "Atur aturan" } },
            { at: 25, title: { en: "Auto-Schedule & Shuffle", id: "Auto-Schedule" } },
            { at: 39, title: { en: "Schedule sources", id: "Sumber jadwal" } },
            { at: 47, title: { en: "Try another plan", id: "Coba plan lain" } },
            { at: 67, title: { en: "Custom courses", id: "Matkul sendiri" } },
        ],
    },
];

export function getTutorialVideo(id: TutorialVideoId): TutorialVideo {
    return VIDEOS.find((v) => v.id === id) ?? VIDEOS[0];
}
