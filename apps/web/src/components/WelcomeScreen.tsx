"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

interface WelcomeScreenProps {
    isOpen: boolean;
    onImportTable: () => void;
    onExploreSample: () => void;
    onSkip?: () => void;
}

export function WelcomeScreen({ isOpen, onImportTable, onExploreSample, onSkip }: WelcomeScreenProps) {
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
        if (onSkip) {
            onSkip();
        }
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

    // Primary CTA button styles: dark ink in light mode, crisp warm white with glow in dark mode
    const primaryCtaClass = "bg-[#141413] text-white hover:bg-[#27272a] dark:bg-[#f4f4f6] dark:text-[#141413] dark:hover:bg-white dark:shadow-[0_2px_12px_rgba(255,255,255,0.12)] transition-all px-4 py-2 rounded-xl text-[13.5px] font-medium shadow-xs cursor-pointer";

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#f9f9f8] dark:bg-[#121214] bg-dot-matrix flex flex-col justify-center items-center py-12 px-6 animate-in fade-in duration-200 select-none">
            {/* Unified Max-Width Container (No 300px Empty Gap!) */}
            <div className="w-full max-w-[520px] mx-auto flex flex-col my-auto">
                {/* Top Navigation Bar — sits directly 32px (mb-8) above the step content */}
                <header className="flex items-center justify-between mb-8">
                    {/* Custom Brand Logo */}
                    <BrandLogo />

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

                {/* Main Stage Content */}
                <main className="flex flex-col justify-center">
                    {/* ========================================================= */}
                    {/* Step 1 of 3: Welcome, Language & Theme                    */}
                    {/* ========================================================= */}
                    {currentStep === 1 && (
                        <div key="step-1" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Greeting & Headline */}
                            <div>
                                <span className="font-doodle text-[22px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] mb-1 block leading-none">
                                    {t.greetingDoodle}
                                </span>
                                <h1 className="text-[26px] font-semibold tracking-tight text-[#141413] dark:text-[#f4f4f6] leading-snug">
                                    {t.step1Headline}
                                </h1>
                                <p className="text-[15px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed mt-2">
                                    {t.step1IntroPre}
                                    <span className="nexvyn-dash text-[#141413] dark:text-[#f4f4f6] font-medium">
                                        {t.step1IntroHighlight}
                                    </span>
                                    {t.step1IntroPost}
                                </p>
                            </div>

                            {/* Tactile Visual Swatch Pickers */}
                            <div className="pt-1 flex items-center justify-between gap-4">
                                <div className="space-y-4">
                                    {/* Language Row */}
                                    <div>
                                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] mb-2 block leading-none">
                                            {t.languageLabelDoodle}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLanguage("en")}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer",
                                                    language === "en"
                                                        ? "bg-[#141413] text-white dark:bg-[#f4f4f6] dark:text-[#141413] shadow-sm"
                                                        : "bg-white dark:bg-[#1c1c1f] border border-[#dcdcd6] dark:border-[#2e2e34] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-white"
                                                )}
                                            >
                                                English
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLanguage("id")}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer",
                                                    language === "id"
                                                        ? "bg-[#141413] text-white dark:bg-[#f4f4f6] dark:text-[#141413] shadow-sm"
                                                        : "bg-white dark:bg-[#1c1c1f] border border-[#dcdcd6] dark:border-[#2e2e34] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-white"
                                                )}
                                            >
                                                Bahasa Indonesia
                                            </button>
                                        </div>
                                    </div>

                                    {/* Appearance / Theme Row */}
                                    <div>
                                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] mb-2 block leading-none">
                                            {t.appearanceLabelDoodle}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTheme("light")}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-[14px] font-medium flex items-center gap-2 transition-all cursor-pointer",
                                                    !isDarkMode
                                                        ? "bg-[#141413] text-white dark:bg-[#f4f4f6] dark:text-[#141413] shadow-sm"
                                                        : "bg-white dark:bg-[#1c1c1f] border border-[#dcdcd6] dark:border-[#2e2e34] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-white"
                                                )}
                                            >
                                                <span className="w-3.5 h-3.5 rounded-full bg-[#f9f9f8] border border-[#dcdcd6] flex items-center justify-center shrink-0">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                </span>
                                                <span>Warm Paper</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTheme("dark")}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-xl text-[14px] font-medium flex items-center gap-2 transition-all cursor-pointer",
                                                    isDarkMode
                                                        ? "bg-[#141413] text-white dark:bg-[#f4f4f6] dark:text-[#141413] shadow-sm"
                                                        : "bg-white dark:bg-[#1c1c1f] border border-[#dcdcd6] dark:border-[#2e2e34] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-white"
                                                )}
                                            >
                                                <span className="w-3.5 h-3.5 rounded-full bg-[#18181b] border border-[#3f3f46] flex items-center justify-center shrink-0">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                                </span>
                                                <span>Dark Ink</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right-Hand Hand-Drawn Closing Bracket `]` & Doodle Note */}
                                <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-2 self-center">
                                    <svg width="12" height="52" viewBox="0 0 12 52" fill="none" className="text-[#5b82a6] dark:text-[#7dd3fc] shrink-0">
                                        <path d="M2 2 C6 2, 7 8, 7 20 C7 24, 10 25.5, 11 26 C10 26.5, 7 28, 7 32 C7 44, 6 50, 2 50" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                    </svg>
                                    <div className="font-doodle text-[16.5px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] leading-[1.15] select-none whitespace-nowrap">
                                        <div>{t.switchesLiveLine1}</div>
                                        <div>{t.switchesLiveLine2}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Step Footer: Continue → */}
                            <div className="mt-8 pt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className={primaryCtaClass}
                                >
                                    {t.continueBtn}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* Step 2 of 3: Semester SKS Workload                        */}
                    {/* ========================================================= */}
                    {currentStep === 2 && (
                        <div key="step-2" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Headline */}
                            <div>
                                <span className="font-doodle text-[21px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] mb-1 block leading-none">
                                    {t.step2Doodle}
                                </span>
                                <h2 className="text-[26px] font-semibold tracking-tight text-[#141413] dark:text-[#f4f4f6] leading-snug">
                                    {t.step2Headline}
                                </h2>
                                <p className="text-[14.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed mt-1">
                                    {t.step2Desc}
                                </p>
                            </div>

                            {/* Tactile Selectable Rows */}
                            <div className="space-y-2.5 pt-1">
                                {/* 20 SKS */}
                                <div
                                    onClick={() => setMaxSks(20)}
                                    className={cn(
                                        "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                        maxSks === 20
                                            ? "bg-white dark:bg-[#1c1c1f] border-[#141413] dark:border-[#f4f4f6] shadow-sm"
                                            : "bg-white/60 dark:bg-[#18181b]/60 border-[#e6e6e3] dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    <div>
                                        <span className={cn(
                                            "font-medium text-[15px]",
                                            maxSks === 20 ? "text-[#141413] dark:text-[#f4f4f6]" : "text-[#141413] dark:text-[#f4f4f6]"
                                        )}>
                                            20 SKS
                                        </span>
                                        <span className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] ml-2">
                                            {"— "}{t.step2Cap20}
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
                                    className={cn(
                                        "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                        maxSks === 24
                                            ? "bg-white dark:bg-[#1c1c1f] border-[#141413] dark:border-[#f4f4f6] shadow-sm"
                                            : "bg-white/60 dark:bg-[#18181b]/60 border-[#e6e6e3] dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    <div>
                                        <span className="font-medium text-[15px] text-[#141413] dark:text-[#f4f4f6]">
                                            24 SKS
                                        </span>
                                        <span className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] ml-2">
                                            {"— "}{t.step2Cap24}
                                        </span>
                                    </div>
                                    {maxSks === 24 ? (
                                        <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                            {t.selectedDoodle}
                                        </span>
                                    ) : (
                                        <span className="font-doodle text-[14px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                            {t.recommendedDoodle}
                                        </span>
                                    )}
                                </div>

                                {/* Unlimited */}
                                <div
                                    onClick={() => setMaxSks(99)}
                                    className={cn(
                                        "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                        maxSks === 99
                                            ? "bg-white dark:bg-[#1c1c1f] border-[#141413] dark:border-[#f4f4f6] shadow-sm"
                                            : "bg-white/60 dark:bg-[#18181b]/60 border-[#e6e6e3] dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    <div>
                                        <span className="font-medium text-[15px] text-[#141413] dark:text-[#f4f4f6]">
                                            {language === "id" ? "Tanpa Batas" : "Unlimited"}
                                        </span>
                                        <span className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] ml-2">
                                            {"— "}{t.step2CapUnlimited}
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
                            <div className="mt-8 pt-4 flex items-center justify-between">
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
                                    className={primaryCtaClass}
                                >
                                    {t.continueBtn}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* Step 3 of 3: How to Start                                 */}
                    {/* ========================================================= */}
                    {currentStep === 3 && (
                        <div key="step-3" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Headline */}
                            <div>
                                <span className="font-doodle text-[21px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] mb-1 block leading-none">
                                    {t.step3Doodle}
                                </span>
                                <h2 className="text-[26px] font-semibold tracking-tight text-[#141413] dark:text-[#f4f4f6] leading-snug">
                                    {t.step3Headline}
                                </h2>
                                <p className="text-[14.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed mt-1">
                                    {t.step3Subtitle}
                                </p>
                            </div>

                            {/* Start Rows with Warm Hover Lift */}
                            <div className="space-y-2">
                                {/* Row 1: Paste Schedule */}
                                <div
                                    onClick={handleImport}
                                    className="p-3.5 rounded-xl border border-[#e6e6e3] dark:border-[#2e2e34] bg-white/70 dark:bg-[#18181b]/70 hover:bg-white dark:hover:bg-[#1c1c1f] hover:border-[#141413] dark:hover:border-[#f4f4f6] flex items-center justify-between cursor-pointer transition-all hover:translate-x-0.5 group shadow-2xs"
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
                                    className="p-3.5 rounded-xl border border-[#e6e6e3] dark:border-[#2e2e34] bg-white/70 dark:bg-[#18181b]/70 hover:bg-white dark:hover:bg-[#1c1c1f] hover:border-[#141413] dark:hover:border-[#f4f4f6] flex items-center justify-between cursor-pointer transition-all hover:translate-x-0.5 group shadow-2xs"
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
        </div>
    );
}
