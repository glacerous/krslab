"use client";

import { useAppStore } from "@/lib/store";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { AlertCircle, ChevronLeft, Download, Share2 } from "lucide-react";
import { checkClassConflict } from "@krs/engine";
import Link from "next/link";
import { ScheduleGrid } from "@/components/ScheduleGrid";

export default function ViewPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { plans, datasources, activePlanId } = useAppStore();

    const planId = searchParams.get("planId") || activePlanId;
    const plan = plans.find(p => p.id === planId);
    const ds = datasources.find(d => d.id === plan?.datasourceId);

    const selectedClasses = useMemo(() => {
        if (!plan || !ds) return [];
        return Object.entries(plan.selectedClassBySubjectId)
            .map(([subId, classId]) => {
                const sub = ds.subjects.find(s => s.subjectId === subId);
                const cls = sub?.classes.find(c => c.classId === classId);
                if (!cls) return null;
                return { ...cls, subjectName: sub?.name, subjectCode: sub?.code };
            })
            .filter(Boolean);
    }, [plan, ds]);

    const conflicts = useMemo(() => {
        const res: Record<string, boolean> = {};
        for (let i = 0; i < selectedClasses.length; i++) {
            for (let j = i + 1; j < selectedClasses.length; j++) {
                if (checkClassConflict(selectedClasses[i]!, selectedClasses[j]!)) {
                    res[selectedClasses[i]!.classId] = true;
                    res[selectedClasses[j]!.classId] = true;
                }
            }
        }
        return res;
    }, [selectedClasses]);

    if (!plan || !ds) return (
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 opacity-50">
            <AlertCircle className="w-16 h-16" />
            <p className="text-xl font-bold">No plan selected or plan not found.</p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:underline">Go to Plans</Link>
        </div>
    );

    return (
        <div className="p-8 h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black">{plan.name} — Schedule</h2>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{ds.name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 border rounded-xl font-bold text-sm shadow-sm hover:bg-zinc-50 transition-all">
                        <Download className="w-4 h-4" /> Export Image
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all">
                        <Share2 className="w-4 h-4" /> Share Plan
                    </button>
                </div>
            </header>

            <ScheduleGrid
                selectedClasses={selectedClasses}
                conflicts={conflicts}
            />
        </div>
    );
}
