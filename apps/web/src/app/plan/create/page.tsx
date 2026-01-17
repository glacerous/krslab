"use client";

import { useState, useMemo, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ChevronRight, Database, Search, CheckCircle, ListFilter, Layers, BookCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateBlueprint } from "@/utils/validation";

export default function CreatePlanPage() {
    const router = useRouter();
    const { datasources, addPlan } = useAppStore();

    const [name, setName] = useState("");
    const [isNameTouched, setIsNameTouched] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [selectedDsId, setSelectedDsId] = useState("");
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [breakLimit, setBreakLimit] = useState(false);

    const nameValidation = useMemo(() => validateBlueprint({ name }), [name]);

    const selectedDs = useMemo(() =>
        datasources.find(d => d.id === selectedDsId),
        [datasources, selectedDsId]);

    const filteredSubjects = useMemo(() => {
        if (!selectedDs) return [];
        return selectedDs.subjects.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [selectedDs, searchQuery]);

    const totalSks = useMemo(() => {
        if (!selectedDs) return 0;
        return selectedDs.subjects
            .filter(s => selectedSubjectIds.includes(s.subjectId))
            .reduce((acc, s) => acc + s.sks, 0);
    }, [selectedDs, selectedSubjectIds]);

    const handleToggleSubject = (id: string) => {
        setSelectedSubjectIds(prev => {
            const isRemoving = prev.includes(id);
            return isRemoving ? prev.filter(i => i !== id) : [...prev, id];
        });
    };

    const handleCreate = () => {
        setIsNameTouched(true);
        const validation = validateBlueprint({ name });
        if (!validation.ok) {
            toast.error("Process Aborted", {
                description: validation.errors[0].message,
                id: "blueprint-val-error"
            });
            nameInputRef.current?.focus();
            return;
        }

        if (!selectedDsId || selectedSubjectIds.length === 0) {
            toast.error("Process Aborted", { description: "Source and subjects are required." });
            return;
        }

        if (totalSks > 24 && !breakLimit) {
            toast.error("Limit Exceeded", { description: "You must enable 'Break Limit' to exceed 24 SKS." });
            return;
        }

        const planId = addPlan({
            name,
            datasourceId: selectedDsId,
            selectedSubjectIds,
            selectedClassBySubjectId: {},
        });

        toast.success("Analysis Ready", { description: `Configuring schedule for "${name}"` });
        router.push(`/plan/${planId}`);
    };

    return (
        <div className="h-screen flex flex-col no-scrollbar overflow-hidden animate-in fade-in duration-500">
            <header className="p-8 border-b border-border/50 shrink-0 bg-background/80 backdrop-blur-md z-20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Design Plan</h1>
                    <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Configuration Pipeline</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Settings Sidebar */}
                <div className="w-80 border-r border-border bg-card/10 p-8 overflow-y-auto no-scrollbar space-y-10 transition-colors">
                    <section className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Identity</label>
                            <input
                                ref={nameInputRef}
                                type="text"
                                placeholder="Semester Blueprint Name"
                                className={cn(
                                    "w-full bg-background border px-4 py-2.5 rounded-lg text-[13px] font-medium outline-none transition-soft",
                                    name ? "text-foreground" : "text-foreground/50",
                                    "placeholder:text-muted-foreground/40",
                                    "focus:text-foreground focus:ring-1 focus:ring-primary",
                                    isNameTouched && !nameValidation.ok
                                        ? "border-destructive ring-destructive/20 bg-destructive/5"
                                        : "border-border"
                                )}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (!isNameTouched) setIsNameTouched(true);
                                }}
                                onBlur={() => setIsNameTouched(true)}
                            />
                            {isNameTouched && !nameValidation.ok && (
                                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest flex items-center gap-1.5 ml-1 animate-in slide-in-from-top-1 duration-200">
                                    <AlertCircle className="w-3 h-3" /> {nameValidation.errors[0].message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Infrastructure Source</label>
                            <div className="relative">
                                <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                                <select
                                    className="w-full bg-background border border-border pl-10 pr-10 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-foreground focus:ring-1 focus:ring-primary outline-none transition-soft appearance-none cursor-pointer"
                                    value={selectedDsId}
                                    onChange={(e) => {
                                        setSelectedDsId(e.target.value);
                                        setSelectedSubjectIds([]);
                                    }}
                                >
                                    <option value="" className="bg-card">Select Source</option>
                                    {datasources.map(ds => (
                                        <option key={ds.id} value={ds.id} className="bg-card">{ds.name}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none rotate-90" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1 pt-2">
                            <div className="space-y-0.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Break Limit</label>
                                <p className="text-[8px] text-muted-foreground/40 font-medium leading-none uppercase tracking-tighter italic">Ignore 24 SKS safety cap</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBreakLimit(!breakLimit)}
                                className={cn(
                                    "w-9 h-5 rounded-full transition-all duration-300 relative border shrink-0",
                                    breakLimit
                                        ? "bg-primary border-primary shadow-[0_0_10px_rgba(132,204,22,0.2)]"
                                        : "bg-muted border-border/50"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
                                    breakLimit ? "left-5" : "left-1"
                                )} />
                            </button>
                        </div>
                    </section>

                    <section className="p-6 bg-muted/30 border border-border/50 rounded-xl space-y-5">
                        <div className="text-center space-y-1">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Weight</p>
                            <div className="flex items-center justify-center gap-1.5">
                                <p className={cn("text-3xl font-black tabular-nums transition-colors", totalSks > 24 && !breakLimit ? "text-destructive" : "text-primary")}>{totalSks}</p>
                                <span className="text-[10px] font-black text-muted-foreground opacity-30 uppercase">SKS</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-background/50 border border-border/40 p-3 rounded-lg text-center">
                                <p className="text-[8px] font-bold text-muted-foreground/60 uppercase">Items</p>
                                <p className="text-xs font-black text-foreground">{selectedSubjectIds.length}</p>
                            </div>
                            <div className="bg-background/50 border border-border/40 p-3 rounded-lg text-center">
                                <p className="text-[8px] font-bold text-muted-foreground/60 uppercase">Safe Limit</p>
                                <p className="text-xs font-black text-foreground">24</p>
                            </div>
                        </div>
                    </section>

                    <button
                        onClick={handleCreate}
                        disabled={!selectedDsId || selectedSubjectIds.length === 0 || (totalSks > 24 && !breakLimit)}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-20 text-primary-foreground p-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-soft shadow-lg shadow-primary/10 flex items-center justify-center gap-2 active:scale-95 group overflow-hidden"
                    >
                        Initialize
                        <ChevronRight className="w-4 h-4 transition-soft group-hover:translate-x-1" />
                    </button>
                </div>

                {/* Right: Operations Feed */}
                <div className="flex-1 flex flex-col bg-muted/10 p-8 overflow-hidden transition-colors">
                    <div className="shrink-0 flex items-center justify-between gap-6 mb-8">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter operands by name or designation..."
                                className="w-full h-12 pl-12 pr-6 bg-background border border-border rounded-xl text-[13px] font-medium text-foreground placeholder:text-muted-foreground/20 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-soft"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={!selectedDs}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3 shrink-0">
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest whitespace-nowrap">Subjects: {filteredSubjects.length}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-2 pb-10">
                        {selectedDs ? (
                            filteredSubjects.length > 0 ? (
                                filteredSubjects.map(s => {
                                    const isSelected = selectedSubjectIds.includes(s.subjectId);
                                    return (
                                        <div
                                            key={s.subjectId}
                                            onClick={() => handleToggleSubject(s.subjectId)}
                                            className={cn(
                                                "group p-4 rounded-xl border transition-soft cursor-pointer flex items-center gap-5 bg-card realistic-shadow",
                                                isSelected
                                                    ? "border-primary bg-primary/[0.04] translate-x-1"
                                                    : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-md flex items-center justify-center transition-soft border-2 shrink-0",
                                                isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-muted/50 border-border"
                                            )}>
                                                {isSelected && <BookCheck className="w-3.5 h-3.5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">{s.code}</span>
                                                    <div className="w-1 h-1 bg-muted-foreground/10 rounded-full" />
                                                    <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">{s.sks} SKS</span>
                                                </div>
                                                <h4 className={cn("text-[13px] font-bold transition-soft truncate leading-snug", isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                                    {s.name}
                                                </h4>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground/20 uppercase font-bold text-[10px] tracking-widest">
                                    Search Buffer Empty
                                </div>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10">
                                <ListFilter className="w-14 h-14" strokeWidth={1.5} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Source Standby</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
