"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useSonner } from "sonner";
import { LATEST_CHANGELOG_ENTRY } from "@/lib/changelog";
import { getTranslation, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ReleaseAnnouncementCardProps {
    isOpen: boolean;
    language: Language;
    onOpenWhatsNew: () => void;
    onDismiss: () => void;
}

export function ReleaseAnnouncementCard({
    isOpen,
    language,
    onOpenWhatsNew,
    onDismiss,
}: ReleaseAnnouncementCardProps) {
    const t = getTranslation(language);
    const entry = LATEST_CHANGELOG_ENTRY;
    const { toasts } = useSonner();
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [saveData, setSaveData] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
        setSaveData(Boolean(conn?.saveData));
        const onChange = () => setPrefersReducedMotion(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    if (!isOpen || !entry) return null;

    const hasActiveToasts = toasts.length > 0;
    const media = entry.media;
    const posterSrc = media ? (media.type === "video" ? media.poster ?? "" : media.src) : "";
    const shouldAnimateVideo = Boolean(media?.type === "video" && !prefersReducedMotion && !saveData);

    return (
        <aside
            aria-label={entry.title[language]}
            className={cn(
                "fixed z-[90] inset-x-3 sm:inset-x-auto sm:right-4 sm:w-[360px] bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-2xl overflow-hidden transition-[bottom] duration-150",
                hasActiveToasts ? "bottom-24 sm:bottom-24" : "bottom-3 sm:bottom-4",
                !prefersReducedMotion && "animate-in fade-in slide-in-from-bottom-2 duration-150"
            )}
        >
            {media && (
                <div className="relative aspect-video bg-[#f3f3f0] dark:bg-[#141416] border-b border-[#e6e6e3] dark:border-[#2e2e34] overflow-hidden">
                    {shouldAnimateVideo ? (
                        <video
                            src={media.src}
                            poster={media.poster}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="none"
                            aria-label={media.alt[language]}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={posterSrc}
                            alt={media.alt[language]}
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
            )}

            <div className="p-4 space-y-3">
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none">
                            {entry.badge ? entry.badge[language] : `v${entry.version}`}
                        </span>
                        {!media && (
                            <button
                                type="button"
                                onClick={onDismiss}
                                aria-label={t.dismiss}
                                title={t.dismiss}
                                className="p-1 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <h3 className="text-[14.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight leading-snug">
                        {entry.title[language]}
                    </h3>
                    <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed line-clamp-2">
                        {entry.summary[language]}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                        type="button"
                        onClick={onOpenWhatsNew}
                        className="btn-tactile-dark px-3 py-1.5 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.seeWhatsNew}</span>
                    </button>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                    >
                        {t.dismiss}
                    </button>
                </div>
            </div>
        </aside>
    );
}
