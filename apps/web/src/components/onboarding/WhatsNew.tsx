"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ArrowUpRight } from "lucide-react";
import { CHANGELOG, ChangelogTag, LATEST_CHANGELOG_VERSION } from "@/lib/changelog";
import { getTranslation, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface WhatsNewProps {
    isOpen: boolean;
    language: Language;
    onClose: () => void;
    onMarkSeen: (version: string) => void;
}

const TAG_STYLES: Record<ChangelogTag, string> = {
    new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    improved: "bg-sky-500/10 text-[#5b82a6] dark:text-[#7dd3fc] border-sky-500/25",
    fix: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
};

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

    const getTagLabel = (tag: ChangelogTag) => {
        if (tag === "new") return t.tagNew;
        if (tag === "improved") return t.tagImproved;
        return t.tagFix;
    };

    return createPortal(
        <div className="fixed inset-0 z-[120] animate-in fade-in duration-150">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px] cursor-pointer"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="whats-new-title"
                className="absolute top-0 right-0 h-full w-[410px] max-w-[92vw] bg-white dark:bg-[#1c1c1f] border-l border-[#e6e6e3] dark:border-[#2e2e34] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-[125]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 px-6 border-b border-[#e6e6e3] dark:border-[#2e2e34] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#18181b] shrink-0">
                    <div>
                        <h2
                            id="whats-new-title"
                            className="text-[16px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight"
                        >
                            {t.whatsNewTitle}
                        </h2>
                        <p className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                            {t.whatsNewSubtitle}
                        </p>
                    </div>
                    <button
                        ref={closeBtnRef}
                        type="button"
                        onClick={onClose}
                        aria-label={t.dismiss}
                        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] flex items-center justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {CHANGELOG.map((entry) => (
                        <section key={entry.version} className="space-y-3">
                            <div className="flex items-baseline justify-between border-b border-[#e6e6e3] dark:border-[#2e2e34] pb-1.5">
                                <span className="font-mono text-[13px] font-bold text-[#141413] dark:text-[#f4f4f6]">
                                    v{entry.version}
                                </span>
                                <time
                                    dateTime={entry.date}
                                    className="font-mono text-[11.5px] text-[#6e6e77] dark:text-[#a1a1aa]"
                                >
                                    {entry.date}
                                </time>
                            </div>
                            <ul className="space-y-2.5">
                                {entry.highlights.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                                        <span
                                            className={cn(
                                                "text-[10.5px] font-semibold px-1.5 py-0.5 rounded border shrink-0 mt-0.5",
                                                TAG_STYLES[item.tag]
                                            )}
                                        >
                                            {getTagLabel(item.tag)}
                                        </span>
                                        <span className="text-[#141413] dark:text-[#f4f4f6]">
                                            {item.text[language]}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                <div className="p-4 px-6 border-t border-[#e6e6e3] dark:border-[#2e2e34] bg-[#fbfbfa] dark:bg-[#18181b] shrink-0">
                    <Link
                        href="/changelog"
                        onClick={onClose}
                        className="btn-tactile-light min-h-[44px] sm:min-h-0 w-full px-3.5 py-2 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-1.5"
                    >
                        <span>{t.fullHistory}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    );
}
