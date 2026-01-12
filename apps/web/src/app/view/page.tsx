"use client";

import { useAppStore } from "@/lib/store";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, Suspense } from "react";
import { AlertCircle, ChevronLeft, Share2, Clipboard, Printer, FileJson } from "lucide-react";
import { checkClassConflict } from "@krs/engine";
import Link from "next/link";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ViewContent() {
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
        <div className="h-screen flex flex-col items-center justify-center space-y-10 bg-background transition-colors">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center border border-dashed border-border transition-colors">
                <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-xl font-black text-foreground uppercase tracking-tight">Access Restricted</p>
                <p className="text-sm font-medium text-muted-foreground max-w-sm">Please select a valid blueprint from the console.</p>
            </div>
            <Link href="/" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-primary/90 transition-soft active:scale-95 shadow-sm">
                Return to Dashboard
            </Link>
        </div>
    );

    const handleCopyJson = () => {
        const data = {
            planName: plan.name,
            datasource: ds.name,
            selections: selectedClasses.map(c => ({
                subject: c?.subjectName,
                class: c?.className,
                meetings: c?.meetings
            }))
        };
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        toast.success("Blueprint Exported", { description: "Schema copied to system buffer." });
    };

    return (
        <div className="p-4 md:p-6 h-screen flex flex-col no-scrollbar overflow-hidden animate-in fade-in duration-500 bg-background transition-colors">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 shrink-0 pb-4 border-b border-border/50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-muted-foreground/10 transition-soft group"
                    >
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Master Grid</span>
                            <div className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-wider transition-colors">{ds.name}</span>
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-foreground transition-colors">{plan.name} Architecture</h2>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleCopyJson}
                        className="flex items-center gap-2.5 bg-muted border border-border px-5 py-2.5 rounded-lg font-bold text-[10px] text-muted-foreground uppercase tracking-widest hover:bg-muted-foreground/10 transition-soft"
                    >
                        <FileJson className="w-3.5 h-3.5 opacity-40" /> Export JSON
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2.5 bg-muted border border-border px-5 py-2.5 rounded-lg font-bold text-[10px] text-muted-foreground uppercase tracking-widest hover:bg-muted-foreground/10 transition-soft"
                    >
                        <Printer className="w-3.5 h-3.5 opacity-40" /> Print
                    </button>
                    <button className="flex items-center gap-2.5 bg-primary px-6 py-2.5 rounded-lg font-bold text-[10px] text-primary-foreground uppercase tracking-widest shadow-sm hover:bg-primary/90 transition-soft">
                        <Share2 className="w-3.5 h-3.5" /> Broadcast
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden animate-in slide-in-from-bottom-5 duration-700">
                <div className="h-full rounded-xl border border-border overflow-hidden realistic-shadow transition-colors bg-card">
                    <ScheduleGrid
                        selectedClasses={selectedClasses}
                        conflicts={conflicts}
                    />
                </div>
            </div>
        </div>
    );
}

export default function ViewPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="w-32 h-1 bg-muted overflow-hidden rounded-full">
                    <div className="h-full bg-primary animate-progress-buffer w-1/2" />
                </div>
            </div>
        }>
            <ViewContent />
        </Suspense>
    );
}
