"use client";

import Link from "next/link";
import { useAppStore, AppStore } from "@/lib/store";
import { CHANGELOG, ChangelogTag } from "@/lib/changelog";
import { getTranslation } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const TAG_STYLES: Record<ChangelogTag, string> = {
    new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    improved: "bg-sky-500/10 text-[#5b82a6] dark:text-[#7dd3fc] border-sky-500/25",
    fix: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
};

export function ChangelogView() {
    const language = useAppStore((s: AppStore) => s.language);
    const setLanguage = useAppStore((s: AppStore) => s.setLanguage);
    const t = getTranslation(language);

    const getTagLabel = (tag: ChangelogTag) => {
        if (tag === "new") return t.tagNew;
        if (tag === "improved") return t.tagImproved;
        return t.tagFix;
    };

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
                            onClick={() => setLanguage(language === "en" ? "id" : "en")}
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
                        release notes
                    </span>
                    <h1 className="text-[26px] font-semibold tracking-tight text-[#141413] dark:text-[#f4f4f6]">
                        {t.changelogTitle}
                    </h1>
                    <p className="text-[14px] text-[#6e6e77] dark:text-[#a1a1aa]">
                        {t.changelogSubtitle}
                    </p>
                </div>

                <div className="space-y-6">
                    {CHANGELOG.map((entry) => (
                        <article
                            key={entry.version}
                            className="bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl p-6 space-y-4 shadow-sm"
                        >
                            <div className="flex items-baseline justify-between border-b border-[#e6e6e3] dark:border-[#2e2e34] pb-2.5">
                                <h2 className="font-mono text-[15px] font-bold text-[#141413] dark:text-[#f4f4f6]">
                                    v{entry.version}
                                </h2>
                                <time
                                    dateTime={entry.date}
                                    className="font-mono text-[12px] text-[#6e6e77] dark:text-[#a1a1aa]"
                                >
                                    {entry.date}
                                </time>
                            </div>
                            <ul className="space-y-3">
                                {entry.highlights.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
                                        <span
                                            className={cn(
                                                "text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 mt-0.5",
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
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
