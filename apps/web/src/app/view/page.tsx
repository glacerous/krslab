"use client";

import { useAppStore } from "@/lib/store";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, Suspense, useState, useEffect, useRef } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Share2, Printer, FileJson, Dna, Check, XCircle, FlaskConical, CalendarX, Clock, Layers, Trash2, Zap, Download, ChevronDown, Send, X, MapPin } from "lucide-react";
import { checkClassConflict, Rule, Section } from "@krs/engine";
import Link from "next/link";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { RulesLab } from "@/components/RulesLab";
import { SavedVariants } from "@/components/SavedVariants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
import { createPortal } from "react-dom";


const dayShort = (day: string) => {
    const map: Record<string, string> = {
        "Senin": "SEN",
        "Selasa": "SEL",
        "Rabu": "RAB",
        "Kamis": "KAM",
        "Jumat": "JUM",
        "Sabtu": "SAB",
        "Minggu": "MIN"
    };
    return map[day] || day.toUpperCase().slice(0, 3);
};

function ViewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const {
        plans, datasources, activePlanId,
        generateVariantsForPlan, setActiveVariantIndex, applyActiveVariantToPlan,
        setRulesForPlan, toggleFreezeSubject,
        saveActiveVariant, setActiveSavedVariant, updatePlan, setPreviewOverride,
        isGenerating
    } = useAppStore();

    const planId = searchParams.get("planId") || activePlanId;
    const plan = plans.find(p => p.id === planId);
    const ds = datasources.find(d => d.id === plan?.datasourceId);

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    const variantsCount = plan?.generatedVariants?.length ?? 0;
    const isGeneratedPreview = useMemo(() => {
        const idx = plan?.activeVariantIndex;
        return idx !== null && idx !== undefined &&
            variantsCount > 0 &&
            idx >= 0 && idx < variantsCount;
    }, [plan?.activeVariantIndex, variantsCount]);

    const isSavedPreview = !!plan?.activeSavedVariantId && !!plan?.savedVariants?.find(s => s.id === plan.activeSavedVariantId);
    const isPreview = isGeneratedPreview || isSavedPreview;

    const effectiveMapping = useMemo(() => {
        if (!plan) return {};
        let mapping = { ...plan.selectedClassBySubjectId };

        if (isSavedPreview) {
            const saved = plan.savedVariants?.find(s => s.id === plan.activeSavedVariantId);
            if (saved) mapping = { ...mapping, ...saved.mapping };
        } else if (isGeneratedPreview && plan.generatedVariants) {
            const variant = plan.generatedVariants[plan.activeVariantIndex!];
            if (variant) mapping = { ...mapping, ...variant };
        }

        if (isPreview && plan.previewOverrides) {
            mapping = { ...mapping, ...plan.previewOverrides };
        }

        return mapping;
    }, [plan, isSavedPreview, isGeneratedPreview, isPreview]);

    const selectedClasses = useMemo(() => {
        if (!plan || !ds) return [];

        return Object.entries(effectiveMapping)
            .map(([subId, classId]) => {
                const sub = ds.subjects.find(s => s.subjectId === subId);
                const cls = sub?.classes.find(c => c.classId === classId);
                if (!cls) return null;
                return { ...cls, subjectId: subId, subjectName: sub?.name, subjectCode: sub?.code };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);
    }, [effectiveMapping, ds, plan]);

    const conflicts = useMemo(() => {
        const res: Record<string, boolean> = {};
        if (!selectedClasses) return res;
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

    const generatedDiffs = useMemo(() => {
        if (!isGeneratedPreview || !plan || !ds) return [];
        const variantMapping = plan.generatedVariants![plan.activeVariantIndex!];
        const baseMapping = plan.selectedClassBySubjectId;

        const diffs: { subject: string; from: string; to: string }[] = [];
        Object.entries(variantMapping).forEach(([subId, classId]) => {
            const baseClassId = baseMapping[subId];
            if (baseClassId !== classId) {
                const sub = ds.subjects.find(s => s.subjectId === subId);
                const fromClass = sub?.classes.find(c => c.classId === baseClassId)?.className || "None";
                const toClass = sub?.classes.find(c => c.classId === classId)?.className || "Unknown";
                diffs.push({
                    subject: sub?.name || subId,
                    from: fromClass,
                    to: toClass
                });
            }
        });
        return diffs;
    }, [isGeneratedPreview, plan, ds]);

    const selectedSubject = useMemo(() => {
        if (!selectedSubjectId || !ds) return null;
        return ds.subjects.find((s) => s.subjectId === selectedSubjectId);
    }, [selectedSubjectId, ds]);

    // Handle ESC to close subject drawer
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedSubjectId(null);
        };
        if (selectedSubjectId) {
            window.addEventListener("keydown", handleEsc);
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [selectedSubjectId]);

    const activePlan = useMemo(() => plans.find((p) => p.id === activePlanId), [plans, activePlanId]);

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

    const handleExportImage = async () => {
        const node = document.getElementById("krs-grid-capture");
        if (!node) return;

        toast.loading("Capturing Grid...", { id: "export-image" });

        try {
            const htmlToImage = await import("html-to-image");
            const dataUrl = await htmlToImage.toPng(node, {
                pixelRatio: 2,
                backgroundColor: "#050505", // Matches theme
                filter: (node: Node) => {
                    // Filter out zoom controls if they appear in capture
                    const el = node as HTMLElement;
                    return !el.classList?.contains('zoom-controls');
                }
            });

            const link = document.createElement("a");
            link.download = `KRSlab-${plan?.name || "Schedule"}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Image Exported", { id: "export-image" });
        } catch (err) {
            console.error("Export failed", err);
            toast.error("Export Failed", { id: "export-image" });
        }
    };

    const handleGenerate = (e?: React.MouseEvent) => {
        if (!plan || isGenerating) return;
        const inGridCount = Object.keys(plan.selectedClassBySubjectId).length;
        if (inGridCount === 0) {
            if (!e?.shiftKey) {
                toast.error("Empty Grid", { description: "Select subjects into the grid first." });
            }
            return;
        }

        const isDeterministic = e?.shiftKey === true;
        const mappingToUse = effectiveMapping;

        if (isDeterministic) {
            console.group("%c[REPRO MODE] Running 3x Deterministic Cycles", "background: #700; color: #fff; font-weight: bold; padding: 2px 4px;");
            const fixedSeed = 12345;
            const results: number[] = [];

            for (let i = 1; i <= 3; i++) {
                const { count } = generateVariantsForPlan(plan.id, {
                    target: 10,
                    maxAttempts: 10000,
                    seed: fixedSeed,
                    freezeSeedMapping: mappingToUse
                });
                results.push(count);
                console.log(`Cycle ${i} Result: ${count} variants`);
            }

            const allSame = results.every(v => v === results[0]);
            if (!allSame) {
                console.error("NON-DETERMINISM DETECTED!", results);
            } else {
                console.log("Determinism check passed for 3 iterations.");
            }
            console.groupEnd();

            // Set index for the last run
            setActiveVariantIndex(plan.id, results[2] > 0 ? 0 : null);
            return;
        }

        // Normal Generation with new seed
        const { count, failureSummary, blockerSubjects } = generateVariantsForPlan(plan.id, {
            target: 10,
            maxAttempts: 10000,
            seed: Date.now(),
            freezeSeedMapping: mappingToUse
        });

        if (count > 0) {
            setActiveVariantIndex(plan.id, 0); // Enter preview mode on success
            toast.success("Variants Generated", { id: "variants-generated", description: `Found ${count} variants.` });
        } else {
            const topRules = (failureSummary || [])
                .map(f => {
                    const rule = plan.rules?.find(r => r.id === f.ruleId);
                    if (!rule) return null;
                    if (rule.label) return rule.label;
                    switch (rule.type) {
                        case "noDay": return `No Day (${rule.days?.join(", ")})`;
                        case "timeWindow": return "Overlap Restricted";
                        case "maxDaysPerWeek": return `Max ${rule.maxDays} Days`;
                        default: return rule.type;
                    }
                })
                .filter(Boolean);

            const blockerTexts = (blockerSubjects || []).map(b => b.subjectName);

            toast.error("No Solutions Found", {
                id: "variants-generated",
                description: `Try disabling one rule. Found ${blockerTexts.length} blockers.`
            });
            setActiveVariantIndex(plan.id, null); // Exit preview on failure
        }
    };

    const handleApply = () => {
        if (!plan) return;
        applyActiveVariantToPlan(plan.id);
        setActiveVariantIndex(plan.id, null);
        setActiveSavedVariant(plan.id, null);
        toast.success("Variant Applied", { id: "variant-applied", description: "Schedule update complete." });
    };

    const handleExitPreview = () => {
        if (!plan) return;
        setActiveVariantIndex(plan.id, null);
        setActiveSavedVariant(plan.id, null);
    };



    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden font-sans selection:bg-primary/20">
            {/* ABSOLUTE STABLE HEADER */}
            <header className="h-20 shrink-0 flex items-center justify-between px-8 border-b border-border bg-card/50 backdrop-blur-md z-[60] shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <h1 className="text-[20px] font-black tracking-tighter text-foreground flex items-center gap-2">
                            KRSLAB <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Master Grid</span>
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {plan.selectedSubjectIds.length} Matakuliah Terpilih
                        </p>
                    </div>

                    <div className="h-10 w-[1px] bg-border/50 mx-2" />

                    {/* CORE ACTIONS CLUSTER */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsRulesOpen(true)}
                            className={cn(
                                "bg-card hover:bg-muted border border-border px-4 py-2.5 rounded-lg flex items-center gap-3 transition-soft active:scale-95 group shadow-sm",
                                (plan?.rules?.length ?? 0) > 0 ? "text-primary border-primary/20 bg-primary/5" : "text-foreground"
                            )}
                        >
                            <div className="relative">
                                <FlaskConical className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
                                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-card shadow-sm">
                                    {plan.rules?.filter(r => r.enabled).length || 0}
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Rules</span>
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={cn(
                                "bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-2.5 rounded-lg flex items-center gap-3 transition-soft active:scale-95 shadow-lg shadow-primary/20",
                                isGenerating && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Zap className={cn("w-4 h-4 fill-primary-foreground", isGenerating && "animate-pulse")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isGenerating ? "Processing..." : "Generate"}
                            </span>
                        </button>

                        <SavedVariants
                            plan={plan}
                            datasource={ds}
                            isOpen={isArchiveOpen}
                            onOpenChange={setIsArchiveOpen}
                        />

                        {variantsCount > 0 && (
                            <div className="ml-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                    {variantsCount} Variants Lab
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* EXPORT / SECONDARY CLUSTER */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportImage}
                        className="bg-muted hover:bg-muted-foreground/10 text-foreground px-5 py-2.5 rounded-lg flex items-center gap-3 transition-soft active:scale-95 border border-border/50 font-black text-[10px] uppercase tracking-widest"
                    >
                        <Download className="w-4 h-4 opacity-50" /> Export PNG
                    </button>
                </div>
            </header>

            {/* CONTEXT BAR - SECONDARY ROW BELOW HEADER */}
            {isPreview && (
                <div className={cn(
                    "h-14 shrink-0 border-b flex items-center justify-between px-8 z-50 animate-in slide-in-from-top duration-300",
                    isSavedPreview ? "bg-amber-500/5 border-amber-500/20" : "bg-primary/5 border-primary/20"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 shadow-sm",
                            isSavedPreview ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"
                        )}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            {isSavedPreview ? "Previewing Saved Archive" : `Previewing Variant ${plan.activeVariantIndex! + 1} / ${variantsCount}`}
                        </div>

                        {/* Navigation only for generated variants */}
                        {isGeneratedPreview && (
                            <div className="flex gap-2 border-l border-primary/10 pl-4 items-center">
                                <button
                                    onClick={() => {
                                        setActiveVariantIndex(plan!.id, (plan!.activeVariantIndex! - 1 + variantsCount) % variantsCount);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-primary/10 text-primary rounded-md transition-soft bg-background border border-primary/20"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveVariantIndex(plan!.id, (plan!.activeVariantIndex! + 1) % variantsCount);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-primary/10 text-primary rounded-md transition-soft bg-background border border-primary/20"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                                {/* Save Button */}
                                <button
                                    onClick={() => {
                                        if (!isPreview) {
                                            toast.error("Enter preview to save.", { id: "save-variant" });
                                            return;
                                        }
                                        saveActiveVariant(plan.id);
                                        toast.success("Variant Archived", { id: "save-variant" });
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md font-black text-[9px] uppercase tracking-widest transition-soft border shadow-sm",
                                        "bg-background text-foreground border-border hover:bg-muted"
                                    )}
                                >
                                    <Bookmark className="w-3 h-3" /> Save Archive
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExitPreview}
                            className="bg-background hover:bg-muted text-foreground px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-soft border border-border shadow-sm active:scale-95"
                        >
                            Exit Preview
                        </button>
                        <button
                            onClick={handleApply}
                            className={cn(
                                "text-white px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-soft shadow-md active:scale-95 flex items-center gap-2",
                                isSavedPreview ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            <Check className="w-4 h-4" /> Apply to Plan
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area with Dynamic Padding */}
            <div className={cn(
                "flex-1 overflow-hidden animate-in slide-in-from-bottom-5 duration-700 relative transition-[padding] duration-500 ease-in-out",
                (selectedSubjectId || isRulesOpen || isArchiveOpen) ? "pr-[400px]" : "pr-0"
            )}>
                <div id="krs-grid-capture" className="h-full rounded-xl border border-border overflow-hidden realistic-shadow transition-colors bg-card">
                    <ScheduleGrid
                        selectedClasses={selectedClasses}
                        conflicts={conflicts}
                        frozenSubjectIds={plan?.frozenSubjectIds ?? []}
                        onToggleFreeze={(subId) => plan && toggleFreezeSubject(plan.id, subId)}
                        onBlockClick={(subId) => setSelectedSubjectId(subId)}
                    />
                </div>
            </div>

            {/* Quick Adjust Sheet - Portalled to avoid clipping */}
            {selectedSubjectId && selectedSubject && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[100] animate-in fade-in duration-300 pointer-events-none"
                >
                    <div className="absolute inset-0 bg-black/5 transition-opacity pointer-events-none" />
                    <div
                        className="absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 z-[110] pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedSubject.code}</span>
                                <h3 className="font-black text-[14px] uppercase tracking-tight text-foreground truncate max-w-[200px]">{selectedSubject.name}</h3>
                            </div>
                            <button onClick={() => setSelectedSubjectId(null)} className="p-2 hover:bg-muted rounded-lg transition-soft">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {/* Section Selector */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Section</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {selectedSubject.classes.map((cls) => {
                                        const isSelected = effectiveMapping[selectedSubjectId] === cls.classId;
                                        return (
                                            <button
                                                key={cls.classId}
                                                onClick={() => {
                                                    const isFrozen = (plan.frozenSubjectIds ?? []).includes(selectedSubjectId);
                                                    if (isFrozen) {
                                                        toast.error("Subject is frozen", { description: "Unfreeze to change class.", id: "quick-adjust-toast" });
                                                        return;
                                                    }

                                                    if (isPreview) {
                                                        setPreviewOverride(plan.id, selectedSubjectId, cls.classId);
                                                        toast.success("Preview Override Set", { id: "quick-adjust-toast" });
                                                    } else {
                                                        updatePlan(plan.id, {
                                                            selectedClassBySubjectId: {
                                                                ...plan.selectedClassBySubjectId,
                                                                [selectedSubjectId]: cls.classId
                                                            }
                                                        });
                                                        toast.success("Section Updated", { id: "quick-adjust-toast" });
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full text-left p-4 rounded-xl border transition-soft flex items-start justify-between group",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary shadow-sm"
                                                        : "bg-card border-border hover:border-primary/30 hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className={cn("text-[11px] font-black uppercase tracking-tight", isSelected ? "text-primary" : "text-foreground")}>
                                                        Kelas {cls.className}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-muted-foreground/60 mb-2.5">{cls.lecturers?.[0] || "No Lecturer"}</span>

                                                    {/* Schedule Info */}
                                                    <div className="space-y-1.5 pt-2.5 border-t border-border/5">
                                                        {cls.meetings && cls.meetings.length > 0 ? (
                                                            <>
                                                                {cls.meetings.slice(0, 2).map((m, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50">
                                                                        <Clock className="w-3 h-3 opacity-40 shrink-0" />
                                                                        <span className="shrink-0">{dayShort(m.day)} {m.start}—{m.end}</span>
                                                                        {m.room && (
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <span className="opacity-20">•</span>
                                                                                <MapPin className="w-3 h-3 opacity-40 shrink-0" />
                                                                                <span className="truncate">{m.room}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {cls.meetings.length > 2 && (
                                                                    <p className="text-[9px] font-black text-muted-foreground/25 uppercase tracking-widest pl-5 mt-1">
                                                                        +{cls.meetings.length - 2} more meetings
                                                                    </p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p className="text-[10px] font-medium text-muted-foreground/30 italic">Schedule unavailable</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-3" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>



                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Freeze subject</span>
                                    <span className="text-[9px] font-bold text-muted-foreground/60">Lock this choice in all generations</span>
                                </div>
                                <button
                                    onClick={() => {
                                        toggleFreezeSubject(plan.id, selectedSubjectId);
                                        const isFrozen = (plan.frozenSubjectIds ?? []).includes(selectedSubjectId);
                                        toast.success(isFrozen ? "Unfrozen" : "Frozen", { id: "quick-adjust-toast" });
                                    }}
                                    className={cn(
                                        "w-10 h-6 rounded-full transition-colors relative",
                                        (plan.frozenSubjectIds ?? []).includes(selectedSubjectId) ? "bg-cyan-500" : "bg-muted-foreground/20"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                                        (plan.frozenSubjectIds ?? []).includes(selectedSubjectId) ? "left-5" : "left-1"
                                    )} />
                                </button>
                            </div>
                        </div>

                        {/* BOTTOM CLOSE BUTTON */}
                        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
                            <button
                                onClick={() => setSelectedSubjectId(null)}
                                className="w-full py-3 bg-muted hover:bg-muted-foreground/10 text-foreground border border-border/50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-soft"
                            >
                                Close Adjustments
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <RulesLab
                isOpen={isRulesOpen}
                onClose={() => setIsRulesOpen(false)}
                rules={plan?.rules ?? []}
                onUpdateRules={(rules) => plan && setRulesForPlan(plan.id, rules)}
                onGenerate={handleGenerate}
            />
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

