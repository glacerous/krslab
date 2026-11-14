"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { CHANGELOG, LATEST_CHANGELOG_VERSION } from "@/lib/changelog";
import { getTranslation, Language } from "@/lib/i18n";
import { ChangelogMedia } from "@/components/changelog/ChangelogMedia";
import { cn } from "@/lib/utils";

interface WhatsNewProps {
    isOpen: boolean;
    language: Language;
    onClose: () => void;
    onMarkSeen: (version: string) => void;
}

export function WhatsNew({ isOpen, language, onClose, onMarkSeen }: WhatsNewProps) {
    const t = getTranslation(language);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const prevFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        onMarkSeen(LATEST_CHANGELOG_VERSION);
        prevFocusRef.current = document.activeElement as HTMLElement | null;
        const raf = window.requestAnimationFrame(() => {
            closeBtnRef.current?.focus();
        });
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener("keydown", onKeyDown, true);
        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener("keydown", onKeyDown, true);
            prevFocusRef.current?.focus?.();
        };
    }, [isOpen, onClose, onMarkSeen]);

    if (!isOpen || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[120] animate-in fade-in duration-150">
            <div
                className="absolute inset-0 bg-neutral-900/25 backdrop-blur-[2px] cursor-pointer"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="whats-new-title"
                className="absolute top-3 bottom-3 right-3 sm:top-4 sm:bottom-4 sm:right-4 w-[440px] sm:w-[460px] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#f9f9f8] dark:bg-[#141418] border border-[#e6e6e3] dark:border-[#2e2e34] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 zoom-in-98 duration-200 z-[125]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-[#e6e6e3] dark:border-[#26262e] bg-white/85 dark:bg-[#18181c]/90 backdrop-blur-xs flex items-start justify-between shrink-0">
                    <div>
                        <span className="font-doodle text-[17px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none mb-1">
                            lab notes
                        </span>
                        <h2
                            id="whats-new-title"
                            className="text-[16px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight"
                        >
                            {t.whatsNewTitle}
                        </h2>
                    </div>
                    <button
                        ref={closeBtnRef}
                        type="button"
                        onClick={onClose}
                        aria-label={t.dismiss}
                        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 hover:bg-neutral-200/70 dark:hover:bg-white/[0.08] rounded-lg transition-colors text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] flex items-center justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <div className="relative pl-5 border-l border-[#dcdcd7] dark:border-[#2e2e36] space-y-7">
                        {CHANGELOG.map((entry, idx) => (
                            <section key={entry.version} className="relative">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "absolute -left-[24.5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#f9f9f8] dark:ring-[#141418]",
                                        entry.kind === "milestone"
                                            ? "bg-amber-500"
                                            : idx === 0
                                              ? "bg-[#5b82a6] dark:bg-[#7dd3fc]"
                                              : "bg-[#c8c8c2] dark:bg-[#3e3e46]"
                                    )}
                                />

                                <div className="flex items-baseline justify-between gap-2">
                                    <span
                                        className={cn(
                                            "font-doodle text-[16px] font-bold leading-none",
                                            entry.kind === "milestone"
                                                ? "text-amber-600 dark:text-amber-400"
                                                : "text-[#5b82a6] dark:text-[#7dd3fc]"
                                        )}
                                    >
                                        {entry.badge ? entry.badge[language] : `v${entry.version}`}
                                    </span>
                                    <time
                                        dateTime={entry.date}
                                        className="font-mono text-[11px] text-[#8a8a94] dark:text-[#71717a]"
                                    >
                                        {entry.date}
                                    </time>
                                </div>

                                <h3 className="text-[16px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight mt-1.5">
                                    {entry.title[language]}
                                </h3>

                                {entry.media && (
                                    <div className="mt-2.5">
                                        <ChangelogMedia
                                            media={entry.media}
                                            lang={language}
                                            mode={entry.kind === "milestone" ? "card" : "frame"}
                                            title={entry.title[language]}
                                        />
                                    </div>
                                )}

                                <p className="mt-2.5 text-[13.5px] text-[#52525b] dark:text-[#a1a1aa] leading-relaxed">
                                    {entry.summary[language]}
                                </p>

                                {entry.highlights.length > 0 && (
                                    <ul className="mt-2.5 space-y-1.5">
                                        {entry.highlights.map((item, i) => (
                                            <li
                                                key={i}
                                                className="flex items-baseline gap-2 text-[13px] text-[#141413]/90 dark:text-[#f4f4f6]/90 leading-snug"
                                            >
                                                <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] shrink-0">
                                                    ·
                                                </span>
                                                <span>{item.text[language]}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-[#e6e6e3] dark:border-[#26262e] bg-white/85 dark:bg-[#18181c]/90 backdrop-blur-xs flex items-center justify-between shrink-0">
                    <span className="font-doodle text-[15px] text-[#6e6e77] dark:text-[#a1a1aa]">
                        built for students
                    </span>
                    <Link
                        href="/changelog"
                        onClick={onClose}
                        className="min-h-[44px] sm:min-h-0 flex items-center gap-1 text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:underline underline-offset-4"
                    >
                        <span>{t.fullHistory}</span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    );
}
