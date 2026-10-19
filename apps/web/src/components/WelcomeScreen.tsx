"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
    isOpen: boolean;
    onImportTable: () => void;
    onExploreSample: () => void;
}

export function WelcomeScreen({ isOpen, onImportTable, onExploreSample }: WelcomeScreenProps) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    const {
        language,
        setLanguage,
        maxSks,
        setMaxSks,
        setHasCompletedWelcome
    } = useAppStore();

    const { theme, setTheme } = useTheme();
    const t = useMemo(() => getTranslation(language), [language]);

    if (!isOpen) return null;

    const handleComplete = () => {
        setHasCompletedWelcome(true);
    };

    const handleImport = () => {
        setHasCompletedWelcome(true);
        onImportTable();
    };

    const handleExplore = () => {
        setHasCompletedWelcome(true);
        onExploreSample();
    };

    const isDarkMode = theme === "dark";

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#f9f9f8] dark:bg-[#121214] bg-dot-matrix flex flex-col justify-between py-8 px-6 animate-in fade-in duration-200 select-none">
            {/* Top Navigation Bar — aligned to the same max-w-[500px] vertical column */}
            <header className="max-w-[500px] w-full mx-auto flex items-center justify-between shrink-0">
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] font-bold text-xs flex items-center justify-center font-mono shadow-xs">
                        K
                    </div>
                    <span className="font-semibold text-[15px] text-[#141413] dark:text-[#f4f4f6] tracking-tight">
                        krslab
                    </span>
                </div>

                {/* Step indicator & Skip */}
                <div className="flex items-center gap-4">
                    <span className="font-mono text-[13px] text-[#6e6e77] dark:text-[#a1a1aa]">
                        0{currentStep} / 03
                    </span>
                    <button
                        type="button"
                        onClick={handleComplete}
                        className="text-[13px] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors cursor-pointer"
                    >
                        {t.skipSetup}
                    </button>
                </div>
            </header>

            {/* Main Stage: Single Centered Editorial Column (max-w-[500px]) */}
            <main className="max-w-[500px] w-full mx-auto my-auto py-8 flex flex-col justify-center">
                {/* Step 1 of 3: Editorial Welcome + Language & Paper Style */}
                {currentStep === 1 && (
                    <div key="step-1" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Paragraph 1: Title & Subtitle */}
                        <div>
                            <h1 className="text-[15px] font-medium text-[#141413] dark:text-[#f4f4f6]">
                                {t.welcomeTitle}
                            </h1>
                            <div className="text-[14.5px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                {t.welcomeSubtitle}
                            </div>
                        </div>

                        {/* Paragraph 2: Editorial Intro with nexvyn-dash */}
                        <p className="text-[14.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed">
                            {t.welcomeDescPre}
                            <span className="text-[#141413] dark:text-[#f4f4f6] font-medium nexvyn-dash">
                                {t.welcomeDescHighlight}
                            </span>
                            {t.welcomeDescPost}
                        </p>

                        {/* Unboxed Inline Preference Rows with Nexvyn's Right-Hand Bracket `]` */}
                        <div className="pt-2 flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
                            <div className="space-y-2.5 text-[14.5px]">
                                {/* Line 1: Language */}
                                <div>
                                    <span className="text-[#6e6e77] dark:text-[#a1a1aa]">{t.languageInline} </span>
                                    <button
                                        type="button"
                                        onClick={() => setLanguage("en")}
                                        className={cn(
                                            "transition-colors cursor-pointer",
                                            language === "en"
                                                ? "nexvyn-dash text-[#141413] dark:text-[#f4f4f6] font-medium"
                                                : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                        )}
                                    >
                                        English
                                    </button>
                                    <span className="text-[#a1a1aa] dark:text-[#52525b]"> / </span>
                                    <button
                                        type="button"
                                        onClick={() => setLanguage("id")}
                                        className={cn(
                                            "transition-colors cursor-pointer",
                                            language === "id"
                                                ? "nexvyn-dash text-[#141413] dark:text-[#f4f4f6] font-medium"
                                                : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                        )}
                                    >
                                        Bahasa Indonesia
                                    </button>
                                </div>

                                {/* Line 2: Appearance */}
                                <div>
                                    <span className="text-[#6e6e77] dark:text-[#a1a1aa]">{t.appearanceInline} </span>
                                    <button
                                        type="button"
                                        onClick={() => setTheme("light")}
                                        className={cn(
                                            "transition-colors cursor-pointer",
                                            !isDarkMode
                                                ? "nexvyn-dash text-[#141413] dark:text-[#f4f4f6] font-medium"
                                                : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                        )}
                                    >
                                        Warm Paper
                                    </button>
                                    <span className="text-[#a1a1aa] dark:text-[#52525b]"> / </span>
                                    <button
                                        type="button"
                                        onClick={() => setTheme("dark")}
                                        className={cn(
                                            "transition-colors cursor-pointer",
                                            isDarkMode
                                                ? "nexvyn-dash text-[#141413] dark:text-[#f4f4f6] font-medium"
                                                : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                        )}
                                    >
                                        Dark Ink
                                    </button>
                                </div>
                            </div>

                            {/* Hand-drawn closing bracket `]` and Gaegu doodle note */}
                            <div className="flex items-center gap-1.5 shrink-0 pl-1">
                                <svg width="12" height="44" viewBox="0 0 12 44" fill="none" className="text-[#5b82a6] dark:text-[#7dd3fc] shrink-0">
                                    <path d="M2 2 C6 2, 7 6, 7 16 C7 20, 10 21.5, 11 22 C10 22.5, 7 24, 7 28 C7 38, 6 42, 2 42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                                <div className="font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] leading-[1.1] select-none whitespace-nowrap">
                                    <div>{t.switchesLiveLine1}</div>
                                    <div>{t.switchesLiveLine2}</div>
                                </div>
                            </div>
                        </div>

                        {/* Step Footer: Continue → */}
                        <div className="mt-9 pt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="btn-tactile-dark px-4 py-2 rounded-xl text-[13.5px] font-medium text-white dark:text-[#141413] cursor-pointer shadow-xs hover:opacity-95 transition-opacity"
                            >
                                {t.continueBtn}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2 of 3: Semester SKS Limit (Clean Typographic List — No Big Radio Boxes) */}
                {currentStep === 2 && (
                    <div key="step-2" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Header */}
                        <div>
                            <h2 className="text-[15px] font-medium text-[#141413] dark:text-[#f4f4f6]">
                                {t.step2Title}
                            </h2>
                            <p className="text-[14.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed mt-1">
                                {t.step2Desc}
                            </p>
                        </div>

                        {/* Borderless Option Rows */}
                        <div className="space-y-1 pt-1">
                            {/* 20 SKS */}
                            <div
                                onClick={() => setMaxSks(20)}
                                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-neutral-200/40 dark:hover:bg-white/[0.04] flex items-baseline justify-between cursor-pointer transition-colors"
                            >
                                <div>
                                    <span className={cn(
                                        "font-medium text-[14.5px]",
                                        maxSks === 20
                                            ? "nexvyn-dash text-[#141413] dark:text-[#f4f4f6]"
                                            : "text-[#141413] dark:text-[#f4f4f6]"
                                    )}>
                                        20 SKS
                                    </span>
                                    <span className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa]">
                                        {" — "}{t.step2Cap20}
                                    </span>
                                </div>
                                {maxSks === 20 && (
                                    <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                        {t.selectedDoodle}
                                    </span>
                                )}
                            </div>

                            {/* 24 SKS */}
                            <div
                                onClick={() => setMaxSks(24)}
                                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-neutral-200/40 dark:hover:bg-white/[0.04] flex items-baseline justify-between cursor-pointer transition-colors"
                            >
                                <div>
                                    <span className={cn(
                                        "font-medium text-[14.5px]",
                                        maxSks === 24
                                            ? "nexvyn-dash text-[#141413] dark:text-[#f4f4f6]"
                                            : "text-[#141413] dark:text-[#f4f4f6]"
                                    )}>
                                        24 SKS
                                    </span>
                                    <span className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa]">
                                        {" — "}{t.step2Cap24}
                                    </span>
                                </div>
                                {maxSks === 24 ? (
                                    <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                        {t.selectedDoodle}
                                    </span>
                                ) : (
                                    <span className="font-doodle text-[14px] text-[#8e8e93] dark:text-[#636366]">
                                        {t.defaultDoodle}
                                    </span>
                                )}
                            </div>

                            {/* Unlimited */}
                            <div
                                onClick={() => setMaxSks(99)}
                                className="py-2.5 px-3 -mx-3 rounded-xl hover:bg-neutral-200/40 dark:hover:bg-white/[0.04] flex items-baseline justify-between cursor-pointer transition-colors"
                            >
                                <div>
                                    <span className={cn(
                                        "font-medium text-[14.5px]",
                                        maxSks === 99
                                            ? "nexvyn-dash text-[#141413] dark:text-[#f4f4f6]"
                                            : "text-[#141413] dark:text-[#f4f4f6]"
                                    )}>
                                        {language === "id" ? "Tanpa Batas" : "Unlimited"}
                                    </span>
                                    <span className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa]">
                                        {" — "}{t.step2CapUnlimited}
                                    </span>
                                </div>
                                {maxSks === 99 && (
                                    <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                        {t.selectedDoodle}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Step Footer: ← Back and Continue → */}
                        <div className="mt-9 pt-4 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors cursor-pointer"
                            >
                                {t.backBtn}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="btn-tactile-dark px-4 py-2 rounded-xl text-[13.5px] font-medium text-white dark:text-[#141413] cursor-pointer shadow-xs hover:opacity-95 transition-opacity"
                            >
                                {t.continueBtn}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 of 3: Load Your Courses (Exact nexvyn.dev runeicons List Style) */}
                {currentStep === 3 && (
                    <div key="step-3" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Section Header with Sketchy Note Icon */}
                        <div className="font-doodle text-[20px] font-bold text-[#6e6e77] dark:text-[#a1a1aa] flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6e6e77] dark:text-[#a1a1aa]">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="8" y1="13" x2="16" y2="13" />
                                <line x1="8" y1="17" x2="13" y2="17" />
                            </svg>
                            <span>{t.step3Header}</span>
                        </div>

                        {/* Two Borderless Action Rows (runeicons layout) */}
                        <div className="space-y-1.5">
                            {/* Row 1: Paste Schedule */}
                            <div
                                onClick={handleImport}
                                className="group py-2.5 px-3 -mx-3 rounded-xl hover:bg-neutral-200/40 dark:hover:bg-white/[0.04] flex items-center justify-between cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-9 h-9 rounded-[10px] bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 tracking-wider shadow-2xs">
                                        CSV
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[14.5px] font-medium text-[#141413] dark:text-[#f4f4f6] group-hover:underline">
                                            {t.step3ImportTitle}
                                        </div>
                                        <div className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] truncate">
                                            {t.step3ImportDesc}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[15px] text-[#6e6e77] dark:text-[#a1a1aa] group-hover:text-[#141413] dark:group-hover:text-[#f4f4f6] group-hover:translate-x-0.5 transition-all shrink-0 ml-3">
                                    →
                                </span>
                            </div>

                            {/* Row 2: Explore Sample */}
                            <div
                                onClick={handleExplore}
                                className="group py-2.5 px-3 -mx-3 rounded-xl hover:bg-neutral-200/40 dark:hover:bg-white/[0.04] flex items-center justify-between cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-9 h-9 rounded-[10px] bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs shrink-0 tracking-wider">
                                        TRY
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[14.5px] font-medium text-[#141413] dark:text-[#f4f4f6] group-hover:underline flex items-center flex-wrap">
                                            <span>{t.step3SampleTitle}</span>
                                            <span className="font-doodle font-bold text-[#5b82a6] dark:text-[#7dd3fc] text-[13.5px] ml-2">
                                                {t.step3SampleDoodle}
                                            </span>
                                        </div>
                                        <div className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] truncate">
                                            {t.step3SampleDesc}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[15px] text-[#6e6e77] dark:text-[#a1a1aa] group-hover:text-[#141413] dark:group-hover:text-[#f4f4f6] group-hover:translate-x-0.5 transition-all shrink-0 ml-3">
                                    →
                                </span>
                            </div>
                        </div>

                        {/* Cloud Sync Footer Note */}
                        <div className="mt-8 pt-4 border-t border-[#e6e6e3] dark:border-[#27272a] text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed">
                            {t.cloudSyncPre}
                            <span className="nexvyn-dash text-[#141413] dark:text-[#f4f4f6] font-medium">
                                {t.cloudSyncHighlight}
                            </span>
                            {t.cloudSyncPost}
                        </div>

                        {/* Step Footer: ← Back */}
                        <div className="mt-8 flex items-center justify-start">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors cursor-pointer"
                            >
                                {t.backBtn}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
