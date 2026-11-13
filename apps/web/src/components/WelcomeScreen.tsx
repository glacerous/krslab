"use client";

import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { switchThemeWithTransition, switchLanguageWithTransition } from "@/lib/theme-transition";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { getTutorialVideo } from "@/lib/onboarding/content";
import { getTranslation } from "@/lib/i18n";

interface WelcomeScreenProps {
    isOpen: boolean;
    onContinue: () => void;
    onWatchIntro?: () => void;
}

export function WelcomeScreen({ isOpen, onContinue, onWatchIntro }: WelcomeScreenProps) {
    const {
        language,
        setLanguage,
        setHasCompletedWelcome
    } = useAppStore();

    const { theme, setTheme } = useTheme();
    const previewRef = useRef<HTMLDivElement>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [disableAutoPreview, setDisableAutoPreview] = useState(false);

    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
        setDisableAutoPreview(reduced || Boolean(conn?.saveData));
        const el = previewRef.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setIsPreviewVisible(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setIsPreviewVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [isOpen]);

    if (!isOpen) return null;

    const t = getTranslation(language);
    const introVideo = getTutorialVideo("start");

    const isDarkMode = theme === "dark";

    const handleContinueInBrowser = () => {
        setHasCompletedWelcome(true);
        onContinue();
    };

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#f9f9f8] dark:bg-[#121214] bg-dot-matrix flex flex-col justify-between p-6 animate-in fade-in duration-200 select-none">
            {/* 1. Top Header Bar: Brand Logo & Quiet Inline Toggles */}
            <header className="max-w-3xl w-full mx-auto flex items-center justify-between pt-2">
                {/* Brand Mark */}
                <BrandLogo height={36} />

                {/* Quiet Toggles */}
                <div className="flex items-center gap-2.5 text-[13px] text-[#6e6e77] dark:text-[#a1a1aa]">
                    {/* EN / ID live language toggle */}
                    <button
                        type="button"
                        aria-label="Toggle language between English and Indonesian"
                        onClick={() => switchLanguageWithTransition(language === "en" ? "id" : "en", language, setLanguage)}
                        className="hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors cursor-pointer"
                        title="Toggle language (EN / ID)"
                    >
                        {language === "en" ? (
                            <>
                                <span className="font-semibold text-[#141413] dark:text-[#f4f4f6]">EN</span> / ID
                            </>
                        ) : (
                            <>
                                EN / <span className="font-semibold text-[#141413] dark:text-[#f4f4f6]">ID</span>
                            </>
                        )}
                    </button>

                    <span className="text-[#dcdcd6] dark:text-[#38383e]">·</span>

                    {/* Warm Paper / Dark Ink live theme toggle */}
                    <button
                        type="button"
                        aria-label="Toggle appearance between Warm Paper and Dark Ink"
                        onClick={(e) => switchThemeWithTransition(isDarkMode ? "light" : "dark", theme, setTheme, e)}
                        className="hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors cursor-pointer"
                        title="Toggle appearance"
                    >
                        {isDarkMode ? (
                            <span className="inline-flex items-center gap-1.5">
                                <Moon className="w-3.5 h-3.5" />
                                <span>{t.themeDarkInk}</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5">
                                <Sun className="w-3.5 h-3.5" />
                                <span>{t.themeWarmPaper}</span>
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* 2. Center Welcome Block (max-w-[440px]) */}
            <main className="max-w-[440px] w-full mx-auto my-auto py-6">
                {/* Doodle Eyebrow */}
                <span className="font-doodle text-[20px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] mb-1 block leading-none">
                    {language === "id"
                        ? "selamat datang di studio jadwalmu"
                        : "welcome to your schedule studio"}
                </span>

                {/* Headline */}
                <h1 className="text-[24px] font-semibold tracking-tight leading-snug text-[#141413] dark:text-[#f4f4f6]">
                    {language === "id"
                        ? "Susun KRS semestermu tanpa pusing bentrok."
                        : "Plan your semester KRS without the clashes."}
                </h1>

                {/* Subtext */}
                <p className="text-[14px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed mt-2 mb-5">
                    {language === "id" ? (
                        <>
                            Tempel tabel jadwal kampusmu, geser kelas di kanvas, dan temukan setiap kombinasi{" "}
                            <span className="text-[#141413] dark:text-white font-medium nexvyn-dash">
                                bebas bentrok
                            </span>
                            .
                        </>
                    ) : (
                        <>
                            Import your campus schedule table, drag classes around the grid, and find every{" "}
                            <span className="text-[#141413] dark:text-white font-medium nexvyn-dash">
                                conflict-free
                            </span>{" "}
                            combination.
                        </>
                    )}
                </p>

                {/* 3. Two Unboxed Typographic Entry Rows (Separated by Hairlines, Zero Card Boxes) */}
                <div className="divide-y divide-[#e6e6e3] dark:divide-[#27272c] border-y border-[#e6e6e3] dark:border-[#27272c]">
                    {/* Row 1 — Local Browser Workspace (Primary Interactive Row) */}
                    <div
                        id="welcome-continue-btn"
                        role="button"
                        tabIndex={0}
                        onClick={handleContinueInBrowser}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleContinueInBrowser();
                            }
                        }}
                        className="group py-4 flex items-baseline justify-between cursor-pointer transition-colors"
                    >
                        <div className="flex items-baseline gap-3.5">
                            <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] w-5 shrink-0">
                                01
                            </span>
                            <div>
                                <div className="text-[15px] font-semibold text-[#141413] dark:text-[#f4f4f6] group-hover:underline underline-offset-4 flex items-center flex-wrap">
                                    <span>
                                        {language === "id" ? "Lanjut di Browser" : "Continue in Browser"}
                                    </span>
                                    <span className="font-doodle text-[16.5px] font-bold text-emerald-700 dark:text-emerald-400 ml-2">
                                        100% local
                                    </span>
                                </div>
                                <p className="text-[13px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                    {language === "id"
                                        ? "Tersimpan di perangkatmu · langsung mulai panduan"
                                        : "Stays on your device · starts with interactive tour"}
                                </p>
                            </div>
                        </div>
                        <span className="text-[15px] text-[#6e6e77] group-hover:text-[#141413] dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-4">
                            →
                        </span>
                    </div>

                    {/* Row 2 — Cloud Sync Account (Coming Soon Row) */}
                    <div className="py-4 flex items-baseline justify-between opacity-60 select-none">
                        <div className="flex items-baseline gap-3.5">
                            <span className="font-doodle text-[19px] font-bold text-[#6e6e77] w-5 shrink-0">
                                02
                            </span>
                            <div>
                                <div className="text-[15px] font-medium text-[#6e6e77] dark:text-[#a1a1aa]">
                                    {language === "id" ? "Masuk ke Cloud Sync" : "Sign in to Cloud Sync"}
                                </div>
                                <p className="text-[13px] text-[#a1a1aa] dark:text-[#71717a] mt-0.5">
                                    {language === "id"
                                        ? "Simpan dan sinkronkan rencana jadwal lintas perangkat"
                                        : "Save and sync your schedule plans across devices"}
                                </p>
                            </div>
                        </div>
                        <span className="font-doodle text-[16.5px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] shrink-0 ml-4">
                            {language === "id" ? "segera hadir" : "coming soon"}
                        </span>
                    </div>
                </div>

                {/* 4. Lazy 1-minute intro preview & link */}
                {onWatchIntro && (
                    <div ref={previewRef} className="mt-5">
                        <button
                            type="button"
                            onClick={onWatchIntro}
                            className="group btn-tactile-light w-full flex items-center gap-4 p-2.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 text-left cursor-pointer"
                        >
                            <div className="relative w-40 sm:w-[196px] aspect-video rounded-lg overflow-hidden border border-[#e6e6e3] dark:border-[#2e2e34] bg-[#f9f9f8] dark:bg-[#141416] shrink-0">
                                {disableAutoPreview ? (
                                    <img
                                        src={introVideo.poster}
                                        alt={introVideo.title[language]}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <video
                                        src={isPreviewVisible ? introVideo.preview : undefined}
                                        poster={introVideo.poster}
                                        muted
                                        loop
                                        playsInline
                                        autoPlay={isPreviewVisible}
                                        preload="none"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/15 transition-colors"
                                >
                                    <span className="w-9 h-9 rounded-full bg-[#141413]/90 dark:bg-[#f4f4f0]/95 text-white dark:text-[#141413] shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-3.5 h-3.5 translate-x-0.5 fill-current" viewBox="0 0 16 16">
                                            <path d="M4 2.8v10.4L13 8 4 2.8z" />
                                        </svg>
                                    </span>
                                </div>
                                <span
                                    aria-hidden="true"
                                    className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#141413]/85 text-white font-mono text-[10px] leading-none tracking-tight"
                                >
                                    1:09
                                </span>
                            </div>

                            <div className="min-w-0 flex-1 space-y-1 pr-1">
                                <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none">
                                    {language === "id" ? "video panduan · 1 menit" : "quick video · 1 min"}
                                </span>
                                <div className="text-[14px] font-semibold text-[#141413] dark:text-[#f4f4f6] flex items-center justify-between gap-2">
                                    <span className="group-hover:underline underline-offset-4">
                                        {language === "id" ? "Lihat cara kerjanya" : "See how it works"}
                                    </span>
                                    <span className="text-[#6e6e77] group-hover:text-[#141413] dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
                                        →
                                    </span>
                                </div>
                                <p className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] leading-snug">
                                    {language === "id"
                                        ? "Tempel BIMA / SIAKAD, geser bentrok, ekspor PNG."
                                        : "Paste BIMA / SIAKAD, drag clashes, export PNG."}
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                {/* 5. Subtle Doodle Note Below with Curved SVG Arrow */}
                <div className="mt-4 flex items-center gap-2 font-doodle text-[17px] text-[#5b82a6] dark:text-[#7dd3fc] -rotate-1 select-none">
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="shrink-0">
                        <path
                            d="M2 11C6 4 12 3 17 5M17 5L13 2M17 5L14 9"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span>
                        {language === "id"
                            ? "tanpa perlu akun, langsung masuk!"
                            : "no account needed, jump right in!"}
                    </span>
                </div>
            </main>

            {/* Empty bottom space to balance vertical flex centering */}
            <footer className="max-w-3xl w-full mx-auto opacity-0 pointer-events-none pb-2 text-[12px]">
                krslab
            </footer>
        </div>
    );
}
