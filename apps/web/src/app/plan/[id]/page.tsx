"use client";

import { useAppStore, Subject } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Users, MapPin, Clock, Calendar, ChevronDown, ChevronUp, AlertTriangle, Check, Zap, Settings2, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { checkClassConflict } from "@krs/engine";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { toast } from "sonner";

export default function PlanDetailPage() {
    const params = useParams();
    const id = params.id as string;
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
    }, [activeClassesForGrid, plan, ds]);

    const conflictCount = useMemo(() => Object.keys(conflicts).length, [conflicts]);

    if (!plan || !ds) return <div className="p-20 text-center font-bold uppercase text-muted-foreground/30 tracking-widest">Blueprint Instance Missing</div>;

    const handleSelectClass = (subjectId: string, classId: string, sName: string, cName: string) => {
        const currentSelected = plan.selectedClassBySubjectId[subjectId];
        const newMapping = { ...plan.selectedClassBySubjectId };

        if (currentSelected === classId) {
            delete newMapping[subjectId];
            toast.info("Class De-selected", { description: `${sName} Section ${cName}` });
        } else {
            newMapping[subjectId] = classId;
            toast.success("Class Selected", { description: `${sName} Section ${cName}` });
        }

        updatePlan(plan.id, { selectedClassBySubjectId: newMapping });
    };

    const allSelectedCount = Object.keys(plan.selectedClassBySubjectId).length;
    const totalRequiredCount = selectedSubjects.length;

    return (
        <div className="h-screen flex flex-col no-scrollbar overflow-hidden animate-in fade-in duration-500">
            <header className="px-8 py-6 shrink-0 bg-background/80 backdrop-blur-md z-20 border-b border-border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center border border-border">
                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="text-[10px] uppercase font-bold text-muted-foreground/60 hover:text-primary transition-soft tracking-wider">Dashboard</Link>
                            <ChevronRight className="w-3 h-3 text-muted-foreground/20" />
                            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Configuration</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black tracking-tight text-foreground leading-none">{plan.name}</h2>
                            <div className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">{ds.name}</span>
                            <div className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
                            <Link
                                href={`/plan/create?planId=${plan.id}`}
                                className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none hover:underline"
                            >
                                Modify Subjects
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    {conflictCount > 0 ? (
                        <div className="px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-full flex items-center gap-2 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                            <span className="text-[9px] font-bold text-destructive uppercase tracking-widest leading-none">Conflicts: {conflictCount}</span>
                        </div>
                    ) : (
                        allSelectedCount === totalRequiredCount && totalRequiredCount > 0 && (
                            <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">Optimal Selection</span>
                            </div>
                        )
                    )}

                    <div className="text-right hidden xl:block border-l border-border pl-5">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground/40 tracking-widest leading-none mb-1">Items Sync</p>
                        <p className="text-[13px] font-black text-foreground tabular-nums leading-none">{allSelectedCount} / {totalRequiredCount}</p>
                    </div>

                    <Link
                        href={`/view?planId=${plan.id}`}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-black transition-soft text-[11px] uppercase tracking-widest border shrink-0",
                            allSelectedCount === totalRequiredCount && conflictCount === 0
                                ? "bg-primary border-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95"
                                : "bg-muted text-muted-foreground/40 border-border cursor-not-allowed"
                        )}
                        onClick={(e) => {
                            if (allSelectedCount !== totalRequiredCount || conflictCount > 0) {
                                e.preventDefault();
                                toast.error("Configuration Check Failed", { description: "Finalize all selections for visualization." });
                            }
                        }}
                    >
                        View Grid <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
                {/* Left: Component List */}
                <div className="w-full xl:w-[420px] flex-1 xl:flex-none border-b xl:border-b-0 xl:border-r border-border overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar bg-card/10 transition-colors">
                    {selectedSubjects.map(subject => {
                        const selectedClassId = plan.selectedClassBySubjectId[subject.subjectId];
                        return (
                            <SubjectAccordion
                                key={subject.subjectId}
                                subject={subject}
                                selectedClassId={selectedClassId}
                                onSelectClass={(cId: string, cName: string) => handleSelectClass(subject.subjectId, cId, subject.name, cName)}
                                conflicts={conflicts}
                            />
                        );
                    })}
                </div>

                {/* Right: Live Frame */}
                <div className="flex-1 bg-muted/10 p-4 md:p-8 xl:p-10 flex flex-col min-w-0 overflow-hidden relative transition-colors">
                    <div className="mb-6 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-primary" fill="currentColor" />
                            <h3 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                Live Interface Preview
                            </h3>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden rounded-xl border border-border shadow-2xl transition-all duration-300">
                        <ScheduleGrid
                            selectedClasses={activeClassesForGrid}
                            conflicts={conflicts}
                            compact
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface SubjectAccordionProps {
    subject: Subject;
    selectedClassId: string | undefined;
    onSelectClass: (cId: string, cName: string) => void;
    conflicts: Record<string, boolean>;
}

function SubjectAccordion({ subject, selectedClassId, onSelectClass, conflicts }: SubjectAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedClass = subject.classes.find((c) => c.classId === selectedClassId);

    return (
        <div className={cn(
            "rounded-xl border transition-soft overflow-hidden realistic-shadow flex flex-col h-fit",
            selectedClassId
                ? "bg-primary/[0.04] border-primary/20"
                : "bg-card border-border hover:border-primary/20"
        )}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 text-left flex justify-between items-center group/btn"
            >
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest group-hover/btn:text-primary transition-colors">{subject.code}</span>
                        <div className="w-1 h-1 bg-muted-foreground/10 rounded-full" />
                        <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">{subject.sks} SKS</span>
                    </div>
                    <h4 className="text-[13px] font-bold text-foreground truncate leading-snug">{subject.name}</h4>
                    {selectedClass && !isOpen && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-primary animate-in fade-in slide-in-from-left-1">
                            <Check className="w-3 h-3" strokeWidth={3} />
                            <span className="uppercase tracking-widest">Sec {selectedClass.className}</span>
                        </div>
                    )}
                </div>
                <div className="p-1.5 bg-muted rounded-md group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-soft shrink-0">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 opacity-40" />}
                </div>
            </button>

            {isOpen && (
                <div className="px-5 pb-5 pt-1 space-y-2 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 gap-2 border-t border-border/40 pt-4">
                        {subject.classes.map((cls) => {
                            const isSelected = selectedClassId === cls.classId;
                            const isConflicting = conflicts[cls.classId];

                            return (
                                <div
                                    key={cls.classId}
                                    onClick={() => onSelectClass(cls.classId, cls.className)}
                                    className={cn(
                                        "p-4 rounded-lg border transition-soft cursor-pointer group/item flex flex-col justify-between relative",
                                        isSelected
                                            ? isConflicting
                                                ? "border-destructive bg-destructive/5"
                                                : "border-primary bg-background shadow-sm ring-1 ring-primary/10"
                                            : "border-border/50 bg-muted/10 hover:border-primary/30 hover:bg-muted/30"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-soft",
                                                isSelected ? "border-primary bg-primary" : "border-muted-foreground/20 group-hover/item:border-primary/40"
                                            )}>
                                                {isSelected && <div className="w-1 h-1 bg-primary-foreground rounded-full" />}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                isSelected ? "text-primary" : "text-muted-foreground/60"
                                            )}>
                                                Section {cls.className}
                                            </span>
                                        </div>
                                        {isConflicting && isSelected && (
                                            <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse" />
                                        )}
                                    </div>

                                    <div className="space-y-1.5 pl-6 border-l-2 border-muted/50 ml-2">
                                        {cls.meetings.map((m: any, idxNum: number) => (
                                            <div key={idxNum} className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/80">
                                                    <Clock className="w-3 h-3 text-muted-foreground/30" strokeWidth={3} />
                                                    <span className="uppercase tracking-tighter">{m.day}, {m.start}-{m.end}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground/40 italic ml-4.5">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {m.room}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary/60 border-t border-border/20 pt-1.5 mt-0.5">
                                            <User className="w-2.5 h-2.5" />
                                            <span className="truncate">{cls.lecturers?.join(", ") || "No Lecturer"}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
