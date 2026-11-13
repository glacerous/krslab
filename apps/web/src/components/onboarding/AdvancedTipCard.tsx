"use client";

import { useEffect, useState } from "react";
import { X, Play } from "lucide-react";
import { useSonner } from "sonner";
import { getTranslation, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AdvancedTipCardProps {
    isOpen: boolean;
    language: Language;
    onWatchAdvanced: () => void;
    onDismiss: () => void;
}

export function AdvancedTipCard({
    isOpen,
    language,
    onWatchAdvanced,
    onDismiss,
}: AdvancedTipCardProps) {
    const t = getTranslation(language);
    const { toasts } = useSonner();
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const onChange = () => setPrefersReducedMotion(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    if (!isOpen) return null;

    const hasActiveToasts = toasts.length > 0;

    return (
        <aside
            aria-label={t.advancedTipTitle}
            className={cn(
                "fixed z-[90] inset-x-3 sm:inset-x-auto sm:right-4 sm:w-[340px] bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-2xl p-4 transition-[bottom] duration-150",
                hasActiveToasts ? "bottom-24 sm:bottom-24" : "bottom-3 sm:bottom-4",
                !prefersReducedMotion && "animate-in fade-in slide-in-from-bottom-2 duration-150"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <span className="font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none">
                        pro tip
                    </span>
                    <h3 className="text-[14px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight">
                        {t.advancedTipTitle}
                    </h3>
                    <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed">
                        {t.advancedTipBody}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label={t.dismiss}
                    title={t.dismiss}
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-center shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
                <button
                    type="button"
                    onClick={onWatchAdvanced}
                    className="btn-tactile-dark min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5"
                >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{t.watchAdvancedTutorial}</span>
                </button>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="min-h-[44px] sm:min-h-0 px-2 py-1.5 text-[12px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors ml-auto"
                >
                    {t.dismiss}
                </button>
            </div>
        </aside>
    );
}
