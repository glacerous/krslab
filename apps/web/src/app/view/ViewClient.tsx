"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Copy, FolderDown, Moon, SlidersHorizontal, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { checkClassConflict } from "@krs/engine";
import { BrandLogo } from "@/components/BrandLogo";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { decodeSharePayload, SharePayload } from "@/lib/share";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { switchThemeWithTransition, switchLanguageWithTransition } from "@/lib/theme-transition";
import { cn } from "@/lib/utils";

export function ViewClient({ initialPayload }: { initialPayload?: SharePayload | null } = {}) {
    const language = useAppStore((s) => s.language);
    const setLanguage = useAppStore((s) => s.setLanguage);
    const maxSks = useAppStore((s) => s.maxSks);
    const importSharedPlan = useAppStore((s) => s.importSharedPlan);
    const importWorkspaceBackup = useAppStore((s) => s.importWorkspaceBackup);
    const { theme, setTheme } = useTheme();
    const t = translations[language] || translations.en;

    const [status, setStatus] = useState<"loading" | "ready" | "invalid">(
        initialPayload === undefined ? "loading" : initialPayload ? "ready" : "invalid"
    );
    const [payload, setPayload] = useState<SharePayload | null>(initialPayload ?? null);
    const [isImporting, setIsImporting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isPrefsOpen, setIsPrefsOpen] = useState(false);
    const [prefsCoords, setPrefsCoords] = useState<{ top: number; left: number } | null>(null);
    const prefsBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updatePrefsCoords = useCallback(() => {
        if (!prefsBtnRef.current) return;
        const rect = prefsBtnRef.current.getBoundingClientRect();
        const width = 260;
        const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
        setPrefsCoords({ top: rect.bottom + 8, left });
    }, []);

    useEffect(() => {
        if (!isPrefsOpen) return;
        updatePrefsCoords();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsPrefsOpen(false);
        };
        window.addEventListener("resize", updatePrefsCoords);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("resize", updatePrefsCoords);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isPrefsOpen, updatePrefsCoords]);

    useEffect(() => {
        if (initialPayload !== undefined) return;
        let cancelled = false;
        const hash = window.location.hash;
        const match = hash.match(/s=([^&]+)/);
        if (!match?.[1]) {
            setStatus("invalid");
            return;
        }
        decodeSharePayload(decodeURIComponent(match[1])).then((decoded) => {
            if (cancelled) return;
            if (!decoded) {
                setStatus("invalid");
                return;
            }
            setPayload(decoded);
            setStatus("ready");
        });
        return () => {
            cancelled = true;
        };
    }, [initialPayload]);

    const planClasses = useMemo(() => {
        if (!payload || payload.t !== "plan") return [];
        return payload.subjects
            .map((sub) => {
                const cId = payload.selectedClassBySubjectId[sub.subjectId];
                const cls = sub.classes.find((c) => c.classId === cId) ?? sub.classes[0];
                if (!cls) return null;
                return {
                    ...cls,
                    subjectId: sub.subjectId,
                    subjectName: sub.name,
                    subjectCode: sub.code
                };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);
    }, [payload]);

    const conflicts = useMemo(() => {
        const res: Record<string, boolean> = {};
        for (let i = 0; i < planClasses.length; i++) {
            for (let j = i + 1; j < planClasses.length; j++) {
                if (checkClassConflict(planClasses[i]!, planClasses[j]!)) {
                    res[planClasses[i]!.classId] = true;
                    res[planClasses[j]!.classId] = true;
                }
            }
        }
        return res;
    }, [planClasses]);

    const totalSks = useMemo(() => {
        if (!payload || payload.t !== "plan") return 0;
        return payload.subjects.reduce((sum, s) => sum + (s.sks || 0), 0);
    }, [payload]);

    const handleCopyPlanToWorkspace = () => {
        if (!payload || payload.t !== "plan" || isImporting) return;
        setIsImporting(true);
        importSharedPlan({
            name: payload.name,
            sourceName: payload.sourceName,
            subjects: payload.subjects,
            selectedClassBySubjectId: payload.selectedClassBySubjectId
        });
        toast.success(
            language === "id"
                ? `"${payload.name}" disalin! Membuka ruang kerja di tab baru...`
                : `"${payload.name}" copied! Opening workspace in a new tab...`
        );
        const targetUrl = `/?from=shared&action=copied&name=${encodeURIComponent(payload.name)}`;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        setIsImporting(false);
    };

    const handleImportWorkspace = () => {
        if (!payload || payload.t !== "workspace" || isImporting) return;
        setIsImporting(true);
        const res = importWorkspaceBackup({
            datasources: payload.datasources,
            plans: payload.plans
        });
        toast.success(
            language === "id"
                ? `Berhasil mengimpor ${res.importedPlans} rencana & ${res.importedDatasources} sumber data!`
                : `Imported ${res.importedPlans} plans & ${res.importedDatasources} sources!`
        );
        const targetUrl = `/?from=shared&action=workspace`;
        window.open(targetUrl, "_blank", "noopener,noreferrer");
        setIsImporting(false);
    };

    if (status === "loading") {
        return (
            <div className="h-screen flex items-center justify-center bg-[#fafaf9] dark:bg-[#0e0e11]">
                <div className="flex flex-col items-center gap-3">
                    <BrandLogo height={34} />
                    <span className="font-doodle text-base text-[#6e6e77] dark:text-[#a1a1aa]">
                        {language === "id" ? "membuka jadwal..." : "loading shared schedule..."}
                    </span>
                </div>
            </div>
        );
    }

    if (status === "invalid" || !payload) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#fafaf9] dark:bg-[#0e0e11]">
                <div className="max-w-md space-y-4">
                    <div className="flex justify-center">
                        <BrandLogo height={38} />
                    </div>
                    <h1 className="text-xl font-semibold text-[#141413] dark:text-[#f4f4f6]">
                        {language === "id" ? "Link jadwal tidak valid atau rusak" : "Invalid or broken schedule link"}
                    </h1>
                    <p className="text-sm text-[#6e6e77] dark:text-[#a1a1aa]">
                        {language === "id"
                            ? "Pastikan seluruh tautan tersalin utuh, atau buat jadwalmu sendiri di KRSlab."
                            : "Make sure the full URL was copied, or start your own schedule in KRSlab."}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                        {language === "id" ? "Buka KRSlab" : "Open KRSlab"}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    if (payload.t === "workspace") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#fafaf9] dark:bg-[#0e0e11]">
                <div className="w-full max-w-lg rounded-2xl border border-[#e6e6e3] dark:border-[#24242b] bg-white dark:bg-[#141418] p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between gap-3">
                        <BrandLogo height={28} />
                        <span className="font-doodle text-[14px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20">
                            {language === "id" ? "transfer ruang kerja" : "workspace transfer"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-[#141413] dark:text-[#f4f4f6] flex items-center justify-center shrink-0">
                            <FolderDown className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-[#141413] dark:text-[#f4f4f6]">
                                {language === "id" ? "Impor Data & Rencana Jadwal" : "Import Sources & Schedule Plans"}
                            </h1>
                            <p className="text-xs text-[#6e6e77] dark:text-[#a1a1aa]">
                                {payload.datasources.length} {language === "id" ? "sumber data" : "sources"} · {payload.plans.length} {language === "id" ? "rencana jadwal" : "plans"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {payload.plans.map((p) => (
                            <div
                                key={p.id}
                                className="px-3.5 py-2.5 rounded-xl border border-[#e6e6e3] dark:border-[#24242b] bg-[#fafaf9] dark:bg-[#18181f] flex items-center justify-between gap-2"
                            >
                                <span className="text-sm font-medium text-[#141413] dark:text-[#f4f4f6] truncate">
                                    {p.name}
                                </span>
                                <span className="text-xs font-mono text-[#6e6e77] dark:text-[#a1a1aa] shrink-0">
                                    {(p.selectedSubjectIds ?? []).length} {language === "id" ? "matkul" : "courses"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={handleImportWorkspace}
                            disabled={isImporting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Copy className="w-4 h-4" />
                            {language === "id" ? "Impor ke Perangkat Ini" : "Import to This Device"}
                        </button>
                        <Link
                            href="/"
                            className="btn-tactile-light inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[#141413] dark:text-[#f4f4f6]"
                        >
                            {language === "id" ? "Buka Studio" : "Open Studio"}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#fafaf9] dark:bg-[#0c0c0e] overflow-hidden">
            <header className="h-auto lg:h-14 border-b border-[#e6e6e3] dark:border-[#26262e] bg-[#fafaf9] dark:bg-[#141418] px-3 sm:px-6 py-2 lg:py-0 flex flex-wrap lg:flex-nowrap items-center justify-between gap-x-2 gap-y-2 z-20 shrink-0">
                {/* 1. Left Group: Brand / Source / Plan */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity mr-0.5 sm:mr-1" title="KRSlab">
                        <BrandLogo height={30} />
                    </Link>

                    <span className="text-[#d8d8d4] dark:text-[#3e3e3a] text-sm select-none shrink-0">/</span>

                    <span
                        className="text-[13px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] truncate max-w-[110px] sm:max-w-[180px]"
                        title={payload.sourceName}
                    >
                        {payload.sourceName}
                    </span>

                    <span className="text-[#d8d8d4] dark:text-[#3e3e3a] text-sm select-none shrink-0">/</span>

                    <span
                        className="text-[13px] font-semibold text-[#141413] dark:text-[#f4f4f0] border-b-[1.5px] border-dashed border-amber-500/80 pb-[1px] truncate max-w-[140px] sm:max-w-[240px]"
                        title={payload.name}
                    >
                        {payload.name}
                    </span>

                    <span className="hidden sm:inline-flex font-doodle text-[13px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20 shrink-0 leading-none ml-1">
                        {language === "id" ? "dibagikan" : "shared"}
                    </span>
                </div>

                {/* 2. Right Group: SKS, Create My Own, Copy to Workspace, Preferences */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
                    <div
                        className="flex items-baseline gap-0.5 sm:gap-1 select-none"
                        title={language === "id" ? "Total SKS terpilih" : "Total selected SKS"}
                    >
                        <span className="font-mono text-[11.5px] sm:text-[12.5px] tabular-nums text-[#141413] dark:text-[#f4f4f0]">
                            {totalSks}/{maxSks === 99 ? "∞" : maxSks}
                        </span>
                        <span className="font-doodle text-[15px] sm:text-[17px] font-bold text-[#6e6e77] dark:text-[#a1a1aa]">sks</span>
                    </div>

                    <Link
                        href="/?from=shared&action=new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-tactile-light px-2.5 sm:px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] dark:text-[#f4f4f0] flex items-center gap-1.5 transition-all"
                    >
                        <span className="hidden sm:inline">{language === "id" ? "Buat Jadwalku Sendiri" : "Create My Own"}</span>
                        <span className="sm:hidden">{language === "id" ? "Buat" : "Create"}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#6e6e77] dark:text-[#a1a1aa]" />
                    </Link>

                    <button
                        type="button"
                        onClick={handleCopyPlanToWorkspace}
                        disabled={isImporting}
                        className="btn-tactile-dark text-white px-3 sm:px-3.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === "id" ? "Salin ke Ruang Kerja" : "Copy to Workspace"}</span>
                    </button>

                    <button
                        ref={prefsBtnRef}
                        type="button"
                        onClick={() => {
                            if (!isPrefsOpen) updatePrefsCoords();
                            setIsPrefsOpen((prev) => !prev);
                        }}
                        className={cn(
                            "btn-tactile-light p-1.5 sm:p-2 rounded-lg text-[#141413] dark:text-[#f4f4f0] flex items-center justify-center transition-all",
                            isPrefsOpen && "bg-neutral-200/80 dark:bg-[#2e2e2b]"
                        )}
                        title={t.preferences}
                        aria-label={t.preferences}
                        aria-expanded={isPrefsOpen}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#6e6e77] dark:text-[#a1a1aa]" />
                    </button>
                </div>
            </header>

            {mounted && isPrefsOpen && prefsCoords && createPortal(
                <div className="fixed inset-0 z-[9998] pointer-events-auto">
                    <div
                        className="fixed inset-0 z-[9998] bg-transparent"
                        onClick={() => setIsPrefsOpen(false)}
                    />
                    <div
                        style={{
                            position: "fixed",
                            top: `${prefsCoords.top}px`,
                            left: `${prefsCoords.left}px`,
                        }}
                        className="w-[260px] max-w-[calc(100vw-16px)] bg-white dark:bg-[#1c1c1f] border border-[#e2e2de] dark:border-[#2e2e34] rounded-xl shadow-2xl p-3 z-[9999] animate-in fade-in zoom-in-95 duration-100 flex flex-col text-left space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-1.5">
                            <div className="text-[10.5px] font-semibold text-[#6e6e77] dark:text-[#a1a1aa] uppercase tracking-wider">
                                {t.languageLabel}
                            </div>
                            <div className="grid grid-cols-2 gap-1 p-0.5 bg-neutral-100 dark:bg-[#141416] rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => switchLanguageWithTransition("en", language, setLanguage)}
                                    className={cn(
                                        "py-1 text-[12px] font-medium rounded-md transition-all text-center",
                                        language === "en"
                                            ? "bg-white dark:bg-[#27272a] text-[#141413] dark:text-[#f4f4f6] shadow-xs"
                                            : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                    )}
                                >
                                    English (EN)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchLanguageWithTransition("id", language, setLanguage)}
                                    className={cn(
                                        "py-1 text-[12px] font-medium rounded-md transition-all text-center",
                                        language === "id"
                                            ? "bg-white dark:bg-[#27272a] text-[#141413] dark:text-[#f4f4f6] shadow-xs"
                                            : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                    )}
                                >
                                    Indonesia (ID)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-[10.5px] font-semibold text-[#6e6e77] dark:text-[#a1a1aa] uppercase tracking-wider">
                                {t.appearanceLabel}
                            </div>
                            <div className="grid grid-cols-2 gap-1 p-0.5 bg-neutral-100 dark:bg-[#141416] rounded-lg">
                                <button
                                    type="button"
                                    onClick={(e) => switchThemeWithTransition("light", theme, setTheme, e)}
                                    className={cn(
                                        "py-1 text-[12px] font-medium rounded-md transition-all flex items-center justify-center gap-1.5",
                                        theme !== "dark"
                                            ? "bg-white dark:bg-[#27272a] text-[#141413] dark:text-[#f4f4f6] shadow-xs"
                                            : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                    )}
                                >
                                    <Sun className="w-3 h-3" />
                                    <span>{t.themeWarmPaper}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => switchThemeWithTransition("dark", theme, setTheme, e)}
                                    className={cn(
                                        "py-1 text-[12px] font-medium rounded-md transition-all flex items-center justify-center gap-1.5",
                                        theme === "dark"
                                            ? "bg-white dark:bg-[#27272a] text-[#141413] dark:text-[#f4f4f6] shadow-xs"
                                            : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                    )}
                                >
                                    <Moon className="w-3 h-3" />
                                    <span>{t.themeDarkInk}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <main className="flex-1 overflow-hidden">
                <ScheduleGrid
                    selectedClasses={planClasses}
                    conflicts={conflicts}
                    allSubjects={payload.subjects}
                    activeDatasourceName={payload.sourceName}
                    activePlanName={payload.name}
                    readOnly
                />
            </main>
        </div>
    );
}
