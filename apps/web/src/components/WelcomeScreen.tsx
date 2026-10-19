"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, User, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

interface WelcomeScreenProps {
    isOpen: boolean;
    onImportTable: () => void;
    onExploreSample: () => void;
}

export function WelcomeScreen({ isOpen, onImportTable, onExploreSample }: WelcomeScreenProps) {
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

    const handleImport = () => {
        setHasCompletedWelcome(true);
        onImportTable();
    };

    const handleExplore = () => {
        setHasCompletedWelcome(true);
        onExploreSample();
    };

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-dot-matrix flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-[520px] mx-auto text-left select-none py-8">
                {/* 1. Brand Mark & Local Guarantee Doodle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#141413] dark:bg-[#f4f4f0] text-white dark:text-[#141413] font-bold text-sm flex items-center justify-center font-mono shadow-sm">
                            K
                        </div>
                        <span className="font-semibold text-[15px] text-[#141413] dark:text-[#f4f4f0] tracking-tight">
                            krslab
                        </span>
                    </div>

                    <span className="font-doodle font-bold text-[14px] text-[#5b82a6] dark:text-[#7da2c4] select-none text-right">
                        {t.localNote}
                    </span>
                </div>

                {/* 2. Headline & Sub-paragraph */}
                <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#141413] dark:text-[#f4f4f0] tracking-tight mt-5 leading-snug">
                    {t.welcomeHeadline}
                </h1>
                <p className="text-[14px] sm:text-[14.5px] text-[#6e6e77] dark:text-[#a1a19a] leading-relaxed mt-2.5">
                    {t.welcomeSub}
                </p>

                {/* 3. Clean Typographic Preference Rows (No Box-in-Box Slop!) */}
                <div className="mt-7 space-y-5">
                    {/* Row 1 — Language / Bahasa */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#e6e6e3] dark:border-[#2e2e2b]">
                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7da2c4] leading-none">
                            {t.rowLanguage}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setLanguage("en")}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
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
                                    "px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
                                    language === "id"
                                        ? "btn-tactile-dark"
                                        : "btn-tactile-light"
                                )}
                            >
                                Bahasa Indonesia
                            </button>
                        </div>
                    </div>

                    {/* Row 2 — Paper Theme / Tema Kanvas */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#e6e6e3] dark:border-[#2e2e2b]">
                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7da2c4] leading-none">
                            {t.rowAppearance}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                                    theme === "light"
                                        ? "btn-tactile-dark"
                                        : "btn-tactile-light"
                                )}
                            >
                                <Sun className="w-3.5 h-3.5 text-amber-500" />
                                <span>Warm Paper</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer",
                                    theme === "dark"
                                        ? "btn-tactile-dark"
                                        : "btn-tactile-light"
                                )}
                            >
                                <Moon className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7da2c4]" />
                                <span>Dark Ink</span>
                            </button>
                        </div>
                    </div>

                    {/* Row 3 — Semester SKS Cap / Batas SKS */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#e6e6e3] dark:border-[#2e2e2b]">
                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7da2c4] leading-none">
                            {t.rowSksLimit}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {[20, 22, 24, 99].map((cap) => (
                                <button
                                    key={cap}
                                    type="button"
                                    onClick={() => setMaxSks(cap)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-[13px] font-mono transition-all cursor-pointer",
                                        maxSks === cap
                                            ? "btn-tactile-dark font-bold"
                                            : "btn-tactile-light"
                                    )}
                                >
                                    {cap === 99 ? "Unlimited" : `${cap} SKS`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 4 — Cloud Sync / Account Placeholder (Sign-in slot) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#e6e6e3] dark:border-[#2e2e2b]">
                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7da2c4] leading-none">
                            {t.rowCloudSync}
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    toast.info("Cloud sync is coming soon! All your data is saved locally on this browser.");
                                }}
                                className="btn-tactile-light px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer text-[#141413] dark:text-[#f4f4f0]"
                            >
                                <User className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7da2c4]" />
                                <span>Sign in to sync across devices</span>
                            </button>
                        </div>
                    </div>
                    <div className="text-right -mt-2">
                        <span className="font-doodle text-[13px] font-bold text-[#5b82a6] dark:text-[#7da2c4]">
                            {t.cloudSyncNote}
                        </span>
                    </div>
                </div>

                {/* 4. Bottom Entry Actions */}
                <div className="mt-9 pt-6 border-t border-[#e6e6e3] dark:border-[#2e2e2b] flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={handleExplore}
                        className="group text-[13.5px] font-medium text-[#141413] dark:text-[#f4f4f0] flex items-center gap-1.5 cursor-pointer"
                    >
                        <span className="nexvyn-dash group-hover:text-amber-600 transition-colors">
                            {t.exploreSampleBtn}
                        </span>
                        <span className="font-doodle text-[14.5px] font-bold text-[#5b82a6] dark:text-[#7da2c4]">
                            {t.tryStudioNote}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleImport}
                        className="btn-tactile-dark px-5 py-2.5 rounded-xl text-[13.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                        <span>{t.importTableBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
