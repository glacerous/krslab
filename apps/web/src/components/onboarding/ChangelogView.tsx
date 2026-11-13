"use client";

import Link from "next/link";
import { useAppStore, AppStore } from "@/lib/store";
import { CHANGELOG } from "@/lib/changelog";
import { getTranslation } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { ChangelogMedia } from "@/components/changelog/ChangelogMedia";
import { cn } from "@/lib/utils";
import { switchLanguageWithTransition } from "@/lib/theme-transition";

export function ChangelogView() {
    const language = useAppStore((s: AppStore) => s.language);
    const setLanguage = useAppStore((s: AppStore) => s.setLanguage);
    const t = getTranslation(language);

    return (
        <div className="h-full overflow-y-auto bg-[#f9f9f8] dark:bg-[#121211] bg-dot-matrix">
            <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14 space-y-10">
                <header className="flex items-center justify-between gap-4">
                    <Link href="/" aria-label="KRSlab Home" className="inline-flex items-center">
                        <BrandLogo height={32} />
                    </Link>

                    <div className="flex items-center gap-4 text-[13px]">
                        <button
                            type="button"
                            onClick={() => switchLanguageWithTransition(language === "en" ? "id" : "en", language, setLanguage)}
                            className="text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                            aria-label="Toggle language between English and Indonesian"
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
                        <Link
                            href="/"
                            className="btn-tactile-light px-3 py-1.5 rounded-lg text-[12.5px] font-medium"
                        >
                            {t.backToWorkspace}
                        </Link>
                    </div>
                </header>

                <div className="space-y-1.5">
                    <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none">
                        lab notes
                    </span>
                    <h1 className="text-[26px] font-semibold tracking-tight text-[#141413] dark:text-[#f4f4f6]">
                        {t.changelogTitle}
                    </h1>
                    <p className="text-[14px] text-[#6e6e77] dark:text-[#a1a1aa]">
                        {t.changelogSubtitle}
                    </p>
                </div>

                <div className="relative pl-6 border-l border-[#e6e6e3] dark:border-[#2e2e34] space-y-10">
                    {CHANGELOG.map((entry, idx) => (
                        <article key={entry.version} className="relative space-y-2.5">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "absolute -left-[29.5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-[#f9f9f8] dark:ring-[#121211]",
                                    entry.kind === "milestone"
                                        ? "bg-amber-500"
                                        : idx === 0
                                          ? "bg-[#5b82a6] dark:bg-[#7dd3fc]"
                                          : "bg-[#d4d4d0] dark:bg-[#3e3e46]"
                                )}
                            />

                            <div className="flex items-baseline justify-between gap-4">
                                <span
                                    className={cn(
                                        entry.kind === "milestone"
                                            ? "font-doodle text-[18px] font-bold text-amber-600 dark:text-amber-400"
                                            : "font-doodle text-[17px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]"
                                    )}
                                >
                                    {entry.badge ? entry.badge[language] : `v${entry.version}`}
                                </span>
                                <time
                                    dateTime={entry.date}
                                    className="font-mono text-[12px] text-[#8a8a94] dark:text-[#71717a]"
                                >
                                    {entry.date}
                                </time>
                            </div>

                            <h2 className="text-[18px] font-semibold tracking-tight text-[#141413] dark:text-[#f4f4f6]">
                                {entry.title[language]}
                            </h2>

                            {entry.media && (
                                <div className="pt-0.5">
                                    <ChangelogMedia
                                        media={entry.media}
                                        lang={language}
                                        mode={entry.kind === "milestone" ? "card" : "frame"}
                                        title={entry.title[language]}
                                    />
                                </div>
                            )}

                            <p className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed">
                                {entry.summary[language]}
                            </p>

                            {entry.highlights.length > 0 && (
                                <ul className="pt-1 space-y-1.5">
                                    {entry.highlights.map((item, i) => (
                                        <li
                                            key={i}
                                            className="flex items-baseline gap-2.5 text-[13.5px] text-[#141413] dark:text-[#f4f4f6] leading-relaxed"
                                        >
                                            <span className="font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] shrink-0">
                                                ·
                                            </span>
                                            <span>{item.text[language]}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
