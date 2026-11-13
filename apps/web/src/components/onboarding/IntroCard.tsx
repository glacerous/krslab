"use client";

import { useEffect, useState } from "react";
import { X, Play, Compass } from "lucide-react";
import { useSonner } from "sonner";
import { getTutorialVideo } from "@/lib/onboarding/content";
import { getTranslation, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface IntroCardProps {
    isOpen: boolean;
    language: Language;
    onWatchVideo: () => void;
    onStartTour: () => void;
    onDismiss: () => void;
}

export function IntroCard({
    isOpen,
    language,
    onWatchVideo,
    onStartTour,
    onDismiss,
}: IntroCardProps) {
    const t = getTranslation(language);
    const video = getTutorialVideo("start");
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
            aria-label={t.introCardTitle}
            className={cn(
                "fixed z-[90] inset-x-3 sm:inset-x-auto sm:right-4 sm:w-[360px] bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-2xl overflow-hidden transition-[bottom] duration-150",
                hasActiveToasts ? "bottom-24 sm:bottom-24" : "bottom-3 sm:bottom-4",
                !prefersReducedMotion && "animate-in fade-in slide-in-from-bottom-2 duration-150"
            )}
        >
            {/* Preview media */}
            <div className="relative aspect-video bg-[#f3f3f0] dark:bg-[#141416] border-b border-[#e6e6e3] dark:border-[#2e2e34] overflow-hidden">
                {prefersReducedMotion ? (
                    <img
                        src={video.poster}
                        alt={video.title[language]}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <video
                        src={video.preview}
                        poster={video.poster}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        className="w-full h-full object-cover"
                    />
                )}

                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label={t.dismiss}
                    title={t.dismiss}
                    className="absolute top-2 right-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-lg bg-white/90 dark:bg-[#1c1c1f]/90 text-[#141413] dark:text-[#f4f4f6] border border-[#e6e6e3] dark:border-[#2e2e34] shadow-sm hover:bg-white dark:hover:bg-[#27272a] transition-colors flex items-center justify-center"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div className="space-y-1">
                    <span className="font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none">
                        1 min guide
                    </span>
                    <h3 className="text-[14.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight leading-snug">
                        {t.introCardTitle}
                    </h3>
                    <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed line-clamp-2">
                        {t.introCardBody}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                        type="button"
                        onClick={onWatchVideo}
                        className="btn-tactile-dark min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5"
                    >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t.introWatchVideo}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onStartTour}
                        className="btn-tactile-light min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5"
                    >
                        <Compass className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc]" />
                        <span>{t.introInteractiveTour}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="min-h-[44px] sm:min-h-0 px-2 py-1.5 text-[12px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors ml-auto"
                    >
                        {t.dismiss}
                    </button>
                </div>
            </div>
        </aside>
    );
}
