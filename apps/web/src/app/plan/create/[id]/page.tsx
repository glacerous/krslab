"use client";

import { useAppStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, LayoutGrid, Users, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkClassConflict } from "@krs/engine";

export default function PlanDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { plans, datasources, updatePlan } = useAppStore();

    const plan = plans.find(p => p.id === id);
    const ds = datasources.find(d => d.id === plan?.datasourceId);

    const selectedSubjects = useMemo(() => {
        if (!plan || !ds) return [];
        return ds.subjects.filter(s => plan.selectedSubjectIds.includes(s.subjectId));
    }, [plan, ds]);

    const conflicts = useMemo(() => {
        if (!plan || !ds) return {};
        const res: Record<string, boolean> = {};

        // Map of selected class IDs for quick access
        const selectedClasses = Object.entries(plan.selectedClassBySubjectId)
            .map(([subId, classId]) => {
                const sub = ds.subjects.find(s => s.subjectId === subId);
                return sub?.classes.find(c => c.classId === classId);
            })
            .filter(Boolean);

        for (let i = 0; i < selectedClasses.length; i++) {
            for (let j = i + 1; j < selectedClasses.length; j++) {
                if (checkClassConflict(selectedClasses[i]!, selectedClasses[j]!)) {
                    res[selectedClasses[i]!.classId] = true;
                    res[selectedClasses[j]!.classId] = true;
                }
            }
        }
        return res;
    }, [plan, ds]);

    if (!plan || !ds) return <div>Plan not found</div>;

    const handleSelectClass = (subjectId: string, classId: string) => {
        const newMapping = { ...plan.selectedClassBySubjectId, [subjectId]: classId };
        updatePlan(plan.id, { selectedClassBySubjectId: newMapping });
    };

    const hasConflicts = Object.keys(conflicts).length > 0;
    const allSelected = selectedSubjects.every(s => plan.selectedClassBySubjectId[s.subjectId]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{plan.name}</h2>
                    <p className="text-zinc-500">Selection from: <span className="font-bold text-zinc-900 dark:text-zinc-100">{ds.name}</span></p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push(`/view?planId=${plan.id}`)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-md",
                            allSelected && !hasConflicts
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        )}
                        disabled={!allSelected || hasConflicts}
                    >
                        GO TO VISUAL VIEW <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="space-y-8">
                {selectedSubjects.map(subject => {
                    const selectedClassId = plan.selectedClassBySubjectId[subject.subjectId];

                    return (
                        <div key={subject.subjectId} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded font-mono text-xs font-bold">{subject.code}</span>
                                <h3 className="text-xl font-black">{subject.name}</h3>
                                <span className="text-sm font-bold text-blue-600">{subject.sks} SKS</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {subject.classes.map(cls => {
                                    const isSelected = selectedClassId === cls.classId;
                                    const isConflicting = conflicts[cls.classId];

                                    return (
                                        <div
                                            key={cls.classId}
                                            onClick={() => handleSelectClass(subject.subjectId, cls.classId)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group",
                                                isSelected
                                                    ? isConflicting
                                                        ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-lg shadow-red-500/10"
                                                        : "border-blue-600 bg-blue-50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10"
                                                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-black",
                                                    isSelected ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                                )}>
                                                    CLASS {cls.className}
                                                </span>
                                                {isConflicting && isSelected && (
                                                    <span className="text-red-500 animate-pulse font-black text-[10px] uppercase tracking-tighter flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Conflict
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {cls.meetings.map((m, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                            <Clock className="w-3 h-3 text-zinc-400" />
                                                            {m.day}, {m.start} - {m.end}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                                            <MapPin className="w-3 h-3 text-zinc-400" />
                                                            {m.room}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex items-start gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                                                    <Users className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
                                                    <span className="text-[10px] text-zinc-500 leading-tight">
                                                        {cls.lecturers.join(", ") || "No lecturer listed"}
                                                    </span>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className={cn(
                                                    "absolute top-0 right-0 p-1 rounded-bl-lg text-white",
                                                    isConflicting ? "bg-red-500" : "bg-blue-600"
                                                )}>
                                                    <CheckCircle2 className="w-4 h-4" />
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

            {hasConflicts && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-full font-black flex items-center gap-3 shadow-2xl animate-bounce">
                    <AlertCircle className="w-6 h-6" />
                    POTENTIAL CONFLICT DETECTED IN SELECTION!
                </div>
            )}
        </div>
    );
}
