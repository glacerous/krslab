"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Users, MapPin, Clock, Calendar, Layout } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { checkClassConflict } from "@krs/engine";
import { ScheduleGrid } from "@/components/ScheduleGrid";

export default function PlanDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { plans, datasources, updatePlan } = useAppStore();

    const plan = plans.find(p => p.id === id);
    const ds = datasources.find(d => d.id === plan?.datasourceId);

    const selectedSubjects = useMemo(() => {
        if (!plan || !ds) return [];
        return ds.subjects.filter(s => plan.selectedSubjectIds.includes(s.subjectId));
    }, [plan, ds]);

    const activeClassesForGrid = useMemo(() => {
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
        if (!plan || !ds) return {};
        const res: Record<string, boolean> = {};

        const selectedClasses = activeClassesForGrid;

        for (let i = 0; i < selectedClasses.length; i++) {
            for (let j = i + 1; j < selectedClasses.length; j++) {
                if (checkClassConflict(selectedClasses[i]!, selectedClasses[j]!)) {
                    res[selectedClasses[i]!.classId] = true;
                    res[selectedClasses[j]!.classId] = true;
                }
            }
        }
        return res;
    }, [activeClassesForGrid]);

    if (!plan || !ds) return <div className="p-20 text-center">Plan not found</div>;

    const handleSelectClass = (subjectId: string, classId: string) => {
        const currentSelected = plan.selectedClassBySubjectId[subjectId];
        const newMapping = { ...plan.selectedClassBySubjectId };

        if (currentSelected === classId) {
            // Unselect if same
            delete newMapping[subjectId];
        } else {
            // Select new
            newMapping[subjectId] = classId;
        }

        updatePlan(plan.id, { selectedClassBySubjectId: newMapping });
    };

    const hasConflicts = Object.keys(conflicts).length > 0;
    const allSelectedCount = Object.keys(plan.selectedClassBySubjectId).length;
    const totalRequiredCount = selectedSubjects.length;

    return (
        <div className="h-screen flex flex-col">
            <header className="p-6 border-b bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/" className="text-[10px] uppercase font-black text-zinc-400 hover:text-blue-600 transition-colors">Plans</Link>
                        <ChevronRight className="w-3 h-3 text-zinc-300" />
                        <span className="text-[10px] uppercase font-black text-blue-600">Configure</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black tracking-tight">{plan.name}</h2>
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 rounded text-[10px] font-bold text-zinc-500">{ds.name}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black uppercase text-zinc-400">Progress</p>
                        <p className="text-sm font-black">{allSelectedCount} / {totalRequiredCount} Classes Selected</p>
                    </div>
                    <Link
                        href={`/view?planId=${plan.id}`}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black transition-all shadow-lg text-sm",
                            allSelectedCount === totalRequiredCount && !hasConflicts
                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                        )}
                        onClick={(e) => {
                            if (allSelectedCount !== totalRequiredCount || hasConflicts) e.preventDefault();
                        }}
                    >
                        <Calendar className="w-5 h-5" />
                        FULL VIEW
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Class Selection List */}
                <div className="w-1/2 lg:w-2/5 border-r overflow-y-auto p-6 space-y-10 bg-zinc-50/30 dark:bg-zinc-950/30">
                    {selectedSubjects.map(subject => {
                        const selectedClassId = plan.selectedClassBySubjectId[subject.subjectId];

                        return (
                            <div key={subject.subjectId} className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 bg-transparent sticky top-0 z-10 backdrop-blur-sm">
                                    <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-2 py-0.5 rounded font-mono text-[10px] font-black">{subject.code}</span>
                                    <h3 className="text-lg font-black truncate">{subject.name}</h3>
                                    <span className="text-[10px] font-bold text-blue-600 ml-auto whitespace-nowrap">{subject.sks} SKS</span>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {subject.classes.map(cls => {
                                        const isSelected = selectedClassId === cls.classId;
                                        const isConflicting = conflicts[cls.classId];

                                        return (
                                            <div
                                                key={cls.classId}
                                                onClick={() => handleSelectClass(subject.subjectId, cls.classId)}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group flex flex-col justify-between",
                                                    isSelected
                                                        ? isConflicting
                                                            ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-md shadow-red-500/10"
                                                            : "border-blue-600 bg-blue-50 dark:bg-blue-900/10 shadow-md shadow-blue-500/10"
                                                        : "border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 bg-white dark:bg-zinc-950"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                        isSelected ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
                                                    )}>
                                                        {cls.className}
                                                    </span>
                                                    {isConflicting && isSelected && (
                                                        <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    {cls.meetings.map((m, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-[10px]">
                                                            <div className="flex items-center gap-1.5 font-bold text-zinc-600 dark:text-zinc-400">
                                                                <Clock className="w-3 h-3 text-blue-500/50" />
                                                                {m.day}, {m.start}-{m.end}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-zinc-400">
                                                                <MapPin className="w-3 h-3" />
                                                                {m.room}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {isSelected && (
                                                    <div className={cn(
                                                        "absolute top-0 right-0 p-1 rounded-bl-xl text-white",
                                                        isConflicting ? "bg-red-500" : "bg-blue-600"
                                                    )}>
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Live Preview Grid */}
                <div className="flex-1 bg-white dark:bg-zinc-900 p-6 flex flex-col min-w-0 overflow-hidden relative">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tight">
                            <Layout className="w-4 h-4 text-blue-600" />
                            Live Schedule Preview
                        </h3>
                        {hasConflicts && (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> CONFLICT DETECTED
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <ScheduleGrid
                            selectedClasses={activeClassesForGrid}
                            conflicts={conflicts}
                            compact
                        />
                    </div>

                    {!hasConflicts && allSelectedCount === totalRequiredCount && totalRequiredCount > 0 && (
                        <div className="absolute inset-x-0 bottom-10 flex justify-center pointer-events-none">
                            <div className="bg-green-600 text-white px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 animate-bounce pointer-events-auto">
                                <CheckCircle2 className="w-5 h-5" />
                                ALL SET! READY TO SAVE
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
