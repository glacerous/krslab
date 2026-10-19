"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    ArrowLeft,
    User,
    Sun,
    Moon,
    FileSpreadsheet,
    Sparkles,
    Check,
    Cloud
} from "lucide-react";
import { toast } from "sonner";

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
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#f9f9f8] dark:bg-[#121214] bg-dot-matrix flex flex-col justify-between p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200 select-none">
            {/* Top Navigation Bar */}
            <header className="max-w-5xl w-full mx-auto px-4 sm:px-6 flex items-center justify-between shrink-0">
                {/* Brand & Local Privacy Note */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] font-bold text-sm flex items-center justify-center font-mono shadow-sm">
                        K
                    </div>
                    <span className="font-semibold text-[16px] text-[#141413] dark:text-[#f4f4f6] tracking-tight">
                        krslab
                    </span>
                    <span className="hidden sm:inline-block font-doodle font-bold text-[13.5px] text-[#5b82a6] dark:text-[#7dd3fc] ml-2">
                        {t.localNote}
                    </span>
                </div>

                {/* Step indicator & Skip setup */}
                <div className="flex items-center gap-4">
                    <div className="font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] tracking-wide">
                        {t.onboardingStep} 0{currentStep} {t.onboardingOf} 03
                    </div>
                    <button
                        type="button"
                        onClick={handleComplete}
                        className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors cursor-pointer"
                    >
                        {t.skipSetup}
                    </button>
                </div>
            </header>

            {/* Main Stage: Asymmetric Editorial Split (Left: Step Questions; Right: Live Mini-Studio) */}
            <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                {/* LEFT COLUMN: 1 Focused Step at a Time */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                    {currentStep === 1 && (
                        <div key="step-1" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Header */}
                            <div>
                                <span className="font-doodle text-[17px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block mb-1">
                                    {t.step1Eyebrow}
                                </span>
                                <h1 className="text-[26px] sm:text-[30px] font-bold text-[#141413] dark:text-[#f4f4f6] tracking-tight leading-tight">
                                    {t.step1Headline}
                                </h1>
                                <p className="text-[14px] text-[#6e6e77] dark:text-[#a1a1aa] mt-2 leading-relaxed">
                                    {t.step1Sub}
                                </p>
                            </div>

                            {/* Two Visual Theme Cards (Side-by-Side) */}
                            <div className="grid grid-cols-2 gap-3.5">
                                {/* Card A: Warm Paper */}
                                <div
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden group",
                                        !isDarkMode
                                            ? "border-[#141413] dark:border-[#f4f4f6] ring-2 ring-[#141413] dark:ring-[#f4f4f6] bg-white shadow-md"
                                            : "border-[#d8d8d4] dark:border-[#2e2e34] bg-white/60 dark:bg-[#1a1a1d] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    {/* Mini visual mockup inside card */}
                                    <div className="w-full h-20 rounded-xl bg-[#f9f9f8] border border-[#e6e6e3] p-2 flex flex-col justify-between mb-3 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <span className="w-8 h-2 rounded bg-[#e2e2de]" />
                                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <div className="h-9 rounded-lg bg-white border border-[#dcdcd6] p-1 flex flex-col justify-center shadow-2xs">
                                                <div className="w-10 h-1.5 rounded bg-[#141413]" />
                                                <div className="w-6 h-1 rounded bg-[#a1a1aa] mt-1" />
                                            </div>
                                            <div className="h-9 rounded-lg bg-amber-50/80 border border-amber-300/80 p-1 flex flex-col justify-center">
                                                <div className="w-8 h-1.5 rounded bg-amber-800" />
                                                <div className="w-5 h-1 rounded bg-amber-600 mt-1" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[14.5px] text-[#141413] dark:text-[#f4f4f6]">
                                                {t.warmPaperTitle}
                                            </h3>
                                            {!isDarkMode && (
                                                <div className="w-4 h-4 rounded-full bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5 leading-snug">
                                            {t.warmPaperSub}
                                        </p>
                                    </div>
                                </div>

                                {/* Card B: Dark Ink */}
                                <div
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden group",
                                        isDarkMode
                                            ? "border-[#141413] dark:border-[#f4f4f6] ring-2 ring-[#141413] dark:ring-[#f4f4f6] bg-[#1c1c1f] shadow-md"
                                            : "border-[#d8d8d4] dark:border-[#2e2e34] bg-white/60 dark:bg-[#1a1a1d] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    {/* Mini visual mockup inside card */}
                                    <div className="w-full h-20 rounded-xl bg-[#161618] border border-[#27272a] p-2 flex flex-col justify-between mb-3 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <span className="w-8 h-2 rounded bg-[#333338]" />
                                            <Moon className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <div className="h-9 rounded-lg bg-[#222226] border border-[#3f3f46] p-1 flex flex-col justify-center">
                                                <div className="w-10 h-1.5 rounded bg-[#f4f4f6]" />
                                                <div className="w-6 h-1 rounded bg-[#71717a] mt-1" />
                                            </div>
                                            <div className="h-9 rounded-lg bg-amber-500/[0.12] border border-amber-400/80 p-1 flex flex-col justify-center">
                                                <div className="w-8 h-1.5 rounded bg-amber-300" />
                                                <div className="w-5 h-1 rounded bg-amber-500 mt-1" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-[14.5px] text-[#141413] dark:text-[#f4f4f6]">
                                                {t.darkInkTitle}
                                            </h3>
                                            {isDarkMode && (
                                                <div className="w-4 h-4 rounded-full bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5 leading-snug">
                                            {t.darkInkSub}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Language Selector with curved arrow & doodle note */}
                            <div className="pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[12.5px] font-semibold text-[#141413] dark:text-[#f4f4f6]">
                                        Language / Bahasa
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLanguage("en")}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
                                            language === "en"
                                                ? "btn-tactile-dark"
                                                : "btn-tactile-light"
                                        )}
                                    >
                                        English
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLanguage("id")}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
                                            language === "id"
                                                ? "btn-tactile-dark"
                                                : "btn-tactile-light"
                                        )}
                                    >
                                        Bahasa Indonesia
                                    </button>

                                    <div className="flex items-center gap-1.5 ml-1 text-[#5b82a6] dark:text-[#7dd3fc]">
                                        <svg className="w-4 h-4 stroke-current fill-none stroke-[2] -rotate-12" viewBox="0 0 20 20">
                                            <path d="M 3 10 Q 10 3 17 9" strokeLinecap="round" />
                                            <path d="M 12 8 L 17 9 L 15 14" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="font-doodle text-[13.5px] font-bold leading-none select-none">
                                            {t.switchesInstantlyNote}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Step Footer */}
                            <div className="pt-4 flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="btn-tactile-dark px-6 py-2.5 rounded-xl text-[13.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                                >
                                    <span>{t.continueBtn}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div key="step-2" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Header */}
                            <div>
                                <span className="font-doodle text-[17px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block mb-1">
                                    {t.step2Eyebrow}
                                </span>
                                <h1 className="text-[26px] sm:text-[30px] font-bold text-[#141413] dark:text-[#f4f4f6] tracking-tight leading-tight">
                                    {t.step2Headline}
                                </h1>
                                <p className="text-[14px] text-[#6e6e77] dark:text-[#a1a1aa] mt-2 leading-relaxed">
                                    {t.step2Sub}
                                </p>
                            </div>

                            {/* 3 Workload Option Cards */}
                            <div className="space-y-3">
                                {/* Option 1: 20 SKS */}
                                <div
                                    onClick={() => setMaxSks(20)}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 text-left group",
                                        maxSks === 20
                                            ? "border-[#141413] dark:border-[#f4f4f6] ring-2 ring-[#141413] dark:ring-[#f4f4f6] bg-white dark:bg-[#1c1c1f] shadow-md"
                                            : "border-[#d8d8d4] dark:border-[#2e2e34] bg-white/60 dark:bg-[#1a1a1d] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-[14.5px] text-[#141413] dark:text-[#f4f4f6]">
                                                {t.loadBalancedTitle}
                                            </h3>
                                        </div>
                                        <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5 leading-snug">
                                            {t.loadBalancedSub}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                        maxSks === 20
                                            ? "bg-[#141413] dark:bg-[#f4f4f6] border-[#141413] dark:border-[#f4f4f6] text-white dark:text-[#141413]"
                                            : "border-[#d4d4d0] dark:border-[#3f3f46]"
                                    )}>
                                        {maxSks === 20 && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>

                                {/* Option 2: 24 SKS (Recommended) */}
                                <div
                                    onClick={() => setMaxSks(24)}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 text-left group relative",
                                        maxSks === 24
                                            ? "border-[#141413] dark:border-[#f4f4f6] ring-2 ring-[#141413] dark:ring-[#f4f4f6] bg-white dark:bg-[#1c1c1f] shadow-md"
                                            : "border-[#d8d8d4] dark:border-[#2e2e34] bg-white/60 dark:bg-[#1a1a1d] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-[14.5px] text-[#141413] dark:text-[#f4f4f6]">
                                                {t.loadFullTitle}
                                            </h3>
                                            <span className="font-doodle text-[12.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full leading-none">
                                                {t.recommendedBadge}
                                            </span>
                                        </div>
                                        <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5 leading-snug">
                                            {t.loadFullSub}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                        maxSks === 24
                                            ? "bg-[#141413] dark:bg-[#f4f4f6] border-[#141413] dark:border-[#f4f4f6] text-white dark:text-[#141413]"
                                            : "border-[#d4d4d0] dark:border-[#3f3f46]"
                                    )}>
                                        {maxSks === 24 && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>

                                {/* Option 3: Unlimited */}
                                <div
                                    onClick={() => setMaxSks(99)}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 text-left group",
                                        maxSks === 99
                                            ? "border-[#141413] dark:border-[#f4f4f6] ring-2 ring-[#141413] dark:ring-[#f4f4f6] bg-white dark:bg-[#1c1c1f] shadow-md"
                                            : "border-[#d8d8d4] dark:border-[#2e2e34] bg-white/60 dark:bg-[#1a1a1d] hover:border-neutral-400 dark:hover:border-neutral-600"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-[14.5px] text-[#141413] dark:text-[#f4f4f6]">
                                                {t.loadUnlimitedTitle}
                                            </h3>
                                        </div>
                                        <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5 leading-snug">
                                            {t.loadUnlimitedSub}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                        maxSks === 99
                                            ? "bg-[#141413] dark:bg-[#f4f4f6] border-[#141413] dark:border-[#f4f4f6] text-white dark:text-[#141413]"
                                            : "border-[#d4d4d0] dark:border-[#3f3f46]"
                                    )}>
                                        {maxSks === 99 && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>
                            </div>

                            {/* Step Footer */}
                            <div className="pt-4 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="btn-tactile-light px-4 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>{t.backBtn}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="btn-tactile-dark px-6 py-2.5 rounded-xl text-[13.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                                >
                                    <span>{t.continueBtn}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div key="step-3" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Header */}
                            <div>
                                <span className="font-doodle text-[17px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block mb-1">
                                    {t.step3Eyebrow}
                                </span>
                                <h1 className="text-[26px] sm:text-[30px] font-bold text-[#141413] dark:text-[#f4f4f6] tracking-tight leading-tight">
                                    {t.step3Headline}
                                </h1>
                                <p className="text-[14px] text-[#6e6e77] dark:text-[#a1a1aa] mt-2 leading-relaxed">
                                    {t.step3Sub}
                                </p>
                            </div>

                            {/* Two Starting Paths */}
                            <div className="space-y-3">
                                {/* Path A: Paste BIMA schedule (Primary Card) */}
                                <div
                                    onClick={handleImport}
                                    className="p-4 sm:p-5 rounded-2xl border border-[#141413] dark:border-[#f4f4f6] bg-white dark:bg-[#1c1c1f] shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-4 text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center shrink-0 text-[#141413] dark:text-[#f4f4f6]">
                                        <FileSpreadsheet className="w-5 h-5 text-[#5b82a6] dark:text-[#7dd3fc]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-[15px] text-[#141413] dark:text-[#f4f4f6] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {t.pasteBimaTitle}
                                        </h3>
                                        <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5 leading-snug">
                                            {t.pasteBimaSub}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[#141413] dark:text-[#f4f4f6] shrink-0 group-hover:translate-x-1 transition-transform" />
                                </div>

                                {/* Path B: Explore sample courses (Secondary Card) */}
                                <div
                                    onClick={handleExplore}
                                    className="p-4 sm:p-5 rounded-2xl border border-[#d8d8d4] dark:border-[#2e2e34] bg-white/70 dark:bg-[#1a1a1d] hover:border-[#141413]/40 dark:hover:border-white/40 transition-all cursor-pointer flex items-center justify-between gap-4 text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center shrink-0 text-[#141413] dark:text-[#f4f4f6]">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-[15px] text-[#141413] dark:text-[#f4f4f6]">
                                                {t.exploreSampleTitle}
                                            </h3>
                                            <span className="font-doodle text-[13px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                                {t.tryIn1ClickBadge}
                                            </span>
                                        </div>
                                        <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5 leading-snug">
                                            {t.exploreSampleSub}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[#6e6e77] dark:text-[#a1a1aa] group-hover:text-[#141413] dark:group-hover:text-[#f4f4f6] shrink-0 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>

                            {/* Dedicated Cloud Sync Section */}
                            <div className="mt-6 pt-5 border-t border-[#e6e6e3] dark:border-[#2e2e34] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/[0.08] flex items-center justify-center shrink-0 text-[#6e6e77] dark:text-[#a1a1aa]">
                                        <Cloud className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc]" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[13px] font-semibold text-[#141413] dark:text-[#f4f4f6] truncate">
                                            {t.syncTitle}
                                        </div>
                                        <div className="text-[11.5px] text-[#6e6e77] dark:text-[#a1a1aa] truncate">
                                            {t.syncSub}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.info("Cloud sync is coming soon! All your data is saved locally on this device.");
                                        }}
                                        className="btn-tactile-light px-3.5 py-1.5 rounded-xl text-[12px] font-medium cursor-pointer"
                                    >
                                        <User className="w-3.5 h-3.5 mr-1 inline" />
                                        <span>{t.signInBtn}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="text-right -mt-3">
                                <span className="font-doodle text-[12.5px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                    {t.syncComingSoonBadge}
                                </span>
                            </div>

                            {/* Step Footer */}
                            <div className="pt-2 flex items-center justify-start">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="btn-tactile-light px-4 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>{t.backBtn}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Live Interactive Mini-Studio Preview Card */}
                <div className="lg:col-span-5 hidden lg:block">
                    <div className="relative">
                        {/* Little Doodle Arrow & Note pointing at preview */}
                        <div className="absolute -top-7 right-3 flex items-center gap-1.5 text-[#5b82a6] dark:text-[#7dd3fc]">
                            <span className="font-doodle text-[15px] font-bold select-none">
                                {t.liveDeskPreviewNote}
                            </span>
                            <svg className="w-4 h-4 stroke-current fill-none stroke-[2] rotate-45" viewBox="0 0 20 20">
                                <path d="M 10 2 L 10 16" strokeLinecap="round" />
                                <path d="M 5 11 L 10 16 L 15 11" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        {/* Mini Studio Canvas Frame */}
                        <div className={cn(
                            "rounded-3xl border transition-all duration-300 p-5 shadow-2xl relative overflow-hidden",
                            isDarkMode
                                ? "bg-[#161618] border-[#2e2e34] text-[#f4f4f6]"
                                : "bg-[#fcfcfa] border-[#dcdcd6] text-[#141413]"
                        )}>
                            {/* Mini Header Bar */}
                            <div className={cn(
                                "flex items-center justify-between pb-3 mb-3 border-b transition-colors",
                                isDarkMode ? "border-[#27272a]" : "border-[#e6e6e3]"
                            )}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[12px] font-bold font-mono tracking-tight">
                                        krslab · {language === "id" ? "Rencana 1" : "Plan 1"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[10.5px] font-mono font-semibold",
                                        isDarkMode
                                            ? "bg-white/[0.08] text-[#f4f4f6]"
                                            : "bg-neutral-100 text-[#141413]"
                                    )}>
                                        18 / {maxSks === 99 ? "∞" : maxSks} SKS
                                    </span>
                                </div>
                            </div>

                            {/* Mini SKS Meter Progress */}
                            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-[#27272a] mb-4 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{
                                        width: maxSks === 99 ? "35%" : `${Math.min(100, (18 / maxSks) * 100)}%`
                                    }}
                                />
                            </div>

                            {/* Mini Week Grid */}
                            <div className="space-y-2">
                                {/* Day Headers */}
                                <div className="grid grid-cols-5 gap-1.5 text-center">
                                    {[t.mon, t.tue, t.wed, t.thu, t.fri].map((day, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "py-1 rounded-md text-[10px] font-semibold tracking-wider font-mono uppercase",
                                                isDarkMode
                                                    ? "bg-[#202024] text-[#a1a1aa]"
                                                    : "bg-neutral-100 text-[#6e6e77]"
                                            )}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Simulated Grid Slots & Cards */}
                                <div className="grid grid-cols-5 gap-1.5 h-48 py-1 relative">
                                    {/* Mon Column */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className={cn(
                                            "rounded-xl p-2 border border-b-[2px] transition-all shadow-sm",
                                            isDarkMode
                                                ? "bg-[#1c1c1f] border-[#323238] border-b-[#42424a]"
                                                : "bg-white border-[#dcdcd6] border-b-[#c6c6be]"
                                        )}>
                                            <span className={cn(
                                                "px-1 py-0.2 rounded text-[8.5px] font-bold inline-block mb-1",
                                                isDarkMode ? "bg-[#2a2a30] text-[#f4f4f6]" : "bg-[#f3f3f0] text-[#141413]"
                                            )}>
                                                IF-A
                                            </span>
                                            <div className="text-[10px] font-semibold leading-tight truncate">
                                                Web Dev
                                            </div>
                                            <div className="text-[8.5px] font-mono text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                                08:00
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tue Column */}
                                    <div className="flex flex-col gap-1.5 pt-6">
                                        <div className={cn(
                                            "rounded-xl p-2 border border-b-[2px] transition-all shadow-sm",
                                            isDarkMode
                                                ? "bg-[#1c1c1f] border-[#323238] border-b-[#42424a]"
                                                : "bg-white border-[#dcdcd6] border-b-[#c6c6be]"
                                        )}>
                                            <span className={cn(
                                                "px-1 py-0.2 rounded text-[8.5px] font-bold inline-block mb-1",
                                                isDarkMode ? "bg-[#2a2a30] text-[#f4f4f6]" : "bg-[#f3f3f0] text-[#141413]"
                                            )}>
                                                IF-B
                                            </span>
                                            <div className="text-[10px] font-semibold leading-tight truncate">
                                                Database
                                            </div>
                                            <div className="text-[8.5px] font-mono text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                                10:30
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wed Column: Translucent Ghost Swap Zone */}
                                    <div className="flex flex-col gap-1.5 pt-2">
                                        <div className={cn(
                                            "rounded-xl p-2 border border-dashed transition-all",
                                            isDarkMode
                                                ? "bg-amber-500/[0.12] border-amber-400/80 text-[#f4f4f6]"
                                                : "bg-amber-50/90 border-amber-500 text-[#141413]"
                                        )}>
                                            <span className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                                                + swap slot
                                            </span>
                                            <div className="text-[9.5px] font-medium leading-tight">
                                                Kelas IF-C
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thu Column */}
                                    <div className="flex flex-col gap-1.5 pt-10">
                                        <div className={cn(
                                            "rounded-xl p-2 border border-b-[2px] transition-all shadow-sm",
                                            isDarkMode
                                                ? "bg-[#1c1c1f] border-[#323238] border-b-[#42424a]"
                                                : "bg-white border-[#dcdcd6] border-b-[#c6c6be]"
                                        )}>
                                            <span className={cn(
                                                "px-1 py-0.2 rounded text-[8.5px] font-bold inline-block mb-1",
                                                isDarkMode ? "bg-[#2a2a30] text-[#f4f4f6]" : "bg-[#f3f3f0] text-[#141413]"
                                            )}>
                                                IF-A
                                            </span>
                                            <div className="text-[10px] font-semibold leading-tight truncate">
                                                AI & ML
                                            </div>
                                            <div className="text-[8.5px] font-mono text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                                13:00
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fri Column */}
                                    <div className="flex flex-col gap-1.5 pt-3">
                                        <div className={cn(
                                            "rounded-xl p-2 border border-b-[2px] transition-all shadow-sm",
                                            isDarkMode
                                                ? "bg-[#1c1c1f] border-[#323238] border-b-[#42424a]"
                                                : "bg-white border-[#dcdcd6] border-b-[#c6c6be]"
                                        )}>
                                            <span className={cn(
                                                "px-1 py-0.2 rounded text-[8.5px] font-bold inline-block mb-1",
                                                isDarkMode ? "bg-[#2a2a30] text-[#f4f4f6]" : "bg-[#f3f3f0] text-[#141413]"
                                            )}>
                                                IF-D
                                            </span>
                                            <div className="text-[10px] font-semibold leading-tight truncate">
                                                Networks
                                            </div>
                                            <div className="text-[8.5px] font-mono text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                                09:00
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Quiet Status */}
            <footer className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 shrink-0 flex items-center justify-between text-[12px] text-[#6e6e77] dark:text-[#a1a1aa]">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>v2.4 · {isDarkMode ? t.darkInkTitle : t.warmPaperTitle}</span>
                </div>
                <div>
                    krslab workspace
                </div>
            </footer>
        </div>
    );
}
