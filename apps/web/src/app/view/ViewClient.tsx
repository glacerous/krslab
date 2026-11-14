"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, Copy, FolderDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { checkClassConflict } from "@krs/engine";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { decodeSharePayload, SharePayload } from "@/lib/share";
import { useAppStore } from "@/lib/store";

export function ViewClient() {
    const router = useRouter();
    const language = useAppStore((s) => s.language);
    const importSharedPlan = useAppStore((s) => s.importSharedPlan);
    const importWorkspaceBackup = useAppStore((s) => s.importWorkspaceBackup);

    const [status, setStatus] = useState<"loading" | "ready" | "invalid">("loading");
    const [payload, setPayload] = useState<SharePayload | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
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
    }, []);

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
                ? `"${payload.name}" disalin ke ruang kerjamu!`
                : `"${payload.name}" copied to your workspace!`
        );
        router.push("/");
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
        router.push("/");
    };

    if (status === "loading") {
        return (
            <div className="h-screen flex items-center justify-center bg-[#fafaf9] dark:bg-[#0e0e11]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-[#141413] dark:border-[#f4f4f6] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-[#6e6e77] dark:text-[#a1a1aa]">
                        {language === "id" ? "Membuka jadwal..." : "Loading shared schedule..."}
                    </span>
                </div>
            </div>
        );
    }

    if (status === "invalid" || !payload) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#fafaf9] dark:bg-[#0e0e11]">
                <div className="max-w-md space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6" />
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
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] flex items-center justify-center shrink-0">
                            <FolderDown className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-[#141413] dark:text-[#f4f4f6]">
                                {language === "id" ? "Transfer Ruang Kerja KRSlab" : "Transfer KRSlab Workspace"}
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
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#e6e6e3] dark:border-[#2a2a32] text-sm font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
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
            <header className="shrink-0 border-b border-[#e6e6e3] dark:border-[#1e1e24] bg-white/95 dark:bg-[#141418]/95 backdrop-blur px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href="/"
                        className="w-8 h-8 rounded-lg bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] flex items-center justify-center font-bold text-sm shrink-0"
                        title="KRSlab"
                    >
                        K
                    </Link>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="text-sm sm:text-base font-semibold text-[#141413] dark:text-[#f4f4f6] truncate">
                                {payload.name}
                            </h1>
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.08] text-[11px] font-mono font-medium text-[#141413] dark:text-[#f4f4f6] shrink-0">
                                {totalSks} SKS
                            </span>
                        </div>
                        <p className="text-[11.5px] text-[#6e6e77] dark:text-[#a1a1aa] truncate">
                            {payload.sourceName} · {payload.subjects.length} {language === "id" ? "matkul" : "courses"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e6e6e3] dark:border-[#2a2a32] text-xs sm:text-sm font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{language === "id" ? "Buat Jadwalku Sendiri" : "Create My Own"}</span>
                        <span className="sm:hidden">{language === "id" ? "Buat" : "Create"}</span>
                    </Link>
                    <button
                        type="button"
                        onClick={handleCopyPlanToWorkspace}
                        disabled={isImporting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === "id" ? "Salin ke Ruang Kerja" : "Copy to Workspace"}</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden">
                <ScheduleGrid
                    selectedClasses={planClasses}
                    conflicts={conflicts}
                    allSubjects={payload.subjects}
                    activeDatasourceName={payload.sourceName}
                    activePlanName={payload.name}
                />
            </main>
        </div>
    );
}
