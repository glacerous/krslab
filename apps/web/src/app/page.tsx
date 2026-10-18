"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useAppStore, Subject, Plan } from "@/lib/store";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { RulesLab } from "@/components/RulesLab";
import { SavedVariants } from "@/components/SavedVariants";
import { CoursePanel } from "@/components/CoursePanel";
import { DataModal } from "@/components/DataModal";
import { InteractiveTour } from "@/components/InteractiveTour";
import { SAMPLE_BIMA_TEXT } from "@/lib/sample-data";
import { checkClassConflict } from "@krs/engine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
    Download,
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Check,
    AlertTriangle,
    Trash2,
    Calendar,
    ArrowRight,
    AlertCircle,
    Info,
    Sun,
    Moon,
    RotateCw,
    Pencil,
    Copy,
    FileText
} from "lucide-react";
import { createPortal } from "react-dom";

function WorkspaceContent() {
    const {
        datasources,
        plans,
        activePlanId,
        activeDatasourceId,
        setActivePlanId,
        setActiveDatasourceId,
        addPlan,
        updatePlan,
        deletePlan,
        updateDatasource,
        duplicateDatasource,
        deleteDatasource,
        deduplicateDatasources,
        autoSchedulePlan,
        generateCandidateSchedule,
        setRulesForPlan,
        toggleFreezeSubject,
        saveActiveVariant,
        setActiveSavedVariant,
        applyActiveSavedVariantToPlan,
        setSelectedClassForSubject,
        importDatasourceAndCreatePlan,
        isDataModalOpen,
        setIsDataModalOpen,
        isGenerating,
        _hasHydrated,
        setHasHydrated
    } = useAppStore();

    type ActiveOverlay = "none" | "bima-import" | "rules" | "saved" | "tour";

    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>("none");
    const [isPlanMenuOpen, setIsPlanMenuOpen] = useState(false);
    const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
    const [dataModalEditSourceId, setDataModalEditSourceId] = useState<string | null>(null);
    const sourceTriggerRef = useRef<HTMLButtonElement>(null);
    const [sourceMenuCoords, setSourceMenuCoords] = useState<{ top: number; left: number } | null>(null);

    const updateSourceMenuCoords = useCallback(() => {
        if (sourceTriggerRef.current) {
            const rect = sourceTriggerRef.current.getBoundingClientRect();
            const menuWidth = 340;
            const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
            setSourceMenuCoords({
                top: rect.bottom + 6,
                left,
            });
        }
    }, []);

    const handleToggleSourceMenu = () => {
        if (!isSourceMenuOpen) {
            updateSourceMenuCoords();
            setIsSourceMenuOpen(true);
        } else {
            setIsSourceMenuOpen(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isSourceMenuOpen) return;
        window.addEventListener("resize", updateSourceMenuCoords);
        window.addEventListener("scroll", updateSourceMenuCoords, true);
        return () => {
            window.removeEventListener("resize", updateSourceMenuCoords);
            window.removeEventListener("scroll", updateSourceMenuCoords, true);
        };
    }, [isSourceMenuOpen, updateSourceMenuCoords]);

    const [activeTab, setActiveTab] = useState<"selected" | "catalog">("selected");
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [editingPlanName, setEditingPlanName] = useState("");
    const [allowOverload, setAllowOverload] = useState(false);
    const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);

    // Single-Candidate Preview State (do not overwrite plan until explicitly accepted)
    const [previewMapping, setPreviewMapping] = useState<Record<string, string> | null>(null);

    // Grid focused subject (for interactive tour & direct manipulation)
    const [gridFocusedSubjectId, setGridFocusedSubjectId] = useState<string | null>(null);
    const hasDismissedImportRef = useRef(false);

    // Auto-deduplicate any redundant sample sources on mount
    useEffect(() => {
        deduplicateDatasources();
    }, [deduplicateDatasources]);

    // Single source of overlay close logic
    const closeOverlay = useCallback(() => {
        setActiveOverlay("none");
        setIsDataModalOpen(false);
        setDataModalEditSourceId(null);
        hasDismissedImportRef.current = true;
    }, [setIsDataModalOpen]);

    const openOverlay = useCallback((overlay: ActiveOverlay) => {
        setActiveOverlay(overlay);
        if (overlay === "bima-import") {
            setIsDataModalOpen(true);
        } else {
            setIsDataModalOpen(false);
        }
    }, [setIsDataModalOpen]);

    // Sync external store isDataModalOpen changes (e.g., from direct actions)
    useEffect(() => {
        if (isDataModalOpen && activeOverlay !== "bima-import" && !hasDismissedImportRef.current) {
            setActiveOverlay("bima-import");
        } else if (!isDataModalOpen && activeOverlay === "bima-import") {
            setActiveOverlay("none");
        }
    }, [isDataModalOpen, activeOverlay]);

    // Handle ESC key to dismiss any active overlay or dropdowns
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isSourceMenuOpen) {
                    setIsSourceMenuOpen(false);
                }
                if (isMobileCoursesOpen) {
                    setIsMobileCoursesOpen(false);
                }
                if (activeOverlay !== "none") {
                    closeOverlay();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeOverlay, closeOverlay, isMobileCoursesOpen, isSourceMenuOpen]);

    const handleSwitchDatasource = (dsId: string) => {
        setActiveDatasourceId(dsId);
        const existingPlan = plans.find(p => p.datasourceId === dsId);
        if (existingPlan) {
            setActivePlanId(existingPlan.id);
        } else {
            const newPlanId = addPlan({
                name: "Plan 1",
                datasourceId: dsId,
                selectedSubjectIds: [],
                selectedClassBySubjectId: {},
                rules: [],
                savedVariants: [],
                frozenSubjectIds: [],
                previewOverrides: {},
            });
            setActivePlanId(newPlanId);
        }
        toast.success("Switched Schedule Data");
        setIsSourceMenuOpen(false);
    };

    const handleDuplicateDatasource = (dsId: string) => {
        duplicateDatasource(dsId);
        toast.success("Source duplicated");
        setIsSourceMenuOpen(false);
    };

    const handleDeleteDatasource = (ds: any) => {
        if (confirm(`Delete schedule "${ds.name}" and its associated plans?`)) {
            deleteDatasource(ds.id);
            toast.success("Source deleted");
        }
    };

    const handleLoadSample = () => {
        const existingSample = datasources.find(d =>
            d.id.startsWith("sample") || d.name.toLowerCase().includes("sample")
        );
        if (existingSample) {
            handleSwitchDatasource(existingSample.id);
            toast.info("Switched to existing Sample Schedule");
            return;
        }
        const { parseBimaMasterWithDebug } = require("@krs/engine");
        const parsed = parseBimaMasterWithDebug(SAMPLE_BIMA_TEXT);
        const { planId } = importDatasourceAndCreatePlan("Sample UPNYK Informatics", parsed.subjects);
        const sampleSubIds = parsed.subjects.slice(0, 5).map((s: any) => s.subjectId);
        updatePlan(planId, {
            name: "Semester 4",
            selectedSubjectIds: sampleSubIds
        });
        toast.success("Sample Data Loaded!");
        setIsSourceMenuOpen(false);
    };

    // Hover previews from sidebar to grid
    const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);
    const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);

    // Diagnostics from solver
    const [solverDiagnostics, setSolverDiagnostics] = useState<{
        failureSummary?: { ruleId: string; hits: number }[];
        blockerSubjects?: { subjectId: string; subjectName: string; hits?: number; reason?: string }[];
    } | null>(null);

    // Initial hydration and plan resolution
    useEffect(() => {
        setMounted(true);
        setHasHydrated(true);
    }, [setHasHydrated]);

    // Ensure there is always an active plan and datasource if data exists
    useEffect(() => {
        if (!_hasHydrated || datasources.length === 0) return;

        let currentDsId = activeDatasourceId;
        if (!currentDsId || !datasources.some(d => d.id === currentDsId)) {
            currentDsId = datasources[0].id;
            setActiveDatasourceId(currentDsId);
        }

        // Find plans for this datasource
        const dsPlans = plans.filter(p => p.datasourceId === currentDsId);
        if (dsPlans.length === 0) {
            // Auto-create Plan 1 for this datasource
            const newPlanId = addPlan({
                name: "Semester 4",
                datasourceId: currentDsId,
                selectedSubjectIds: [],
                selectedClassBySubjectId: {},
                rules: [],
                savedVariants: []
            });
            setActivePlanId(newPlanId);
        } else if (!activePlanId || !dsPlans.some(p => p.id === activePlanId)) {
            setActivePlanId(dsPlans[0].id);
        }
    }, [_hasHydrated, datasources, activeDatasourceId, plans, activePlanId, setActiveDatasourceId, setActivePlanId, addPlan]);

    // Reset preview candidate whenever active plan changes
    useEffect(() => {
        setPreviewMapping(null);
    }, [activePlanId]);

    // Active Plan and Datasource
    const activePlan = useMemo(() => {
        return plans.find(p => p.id === activePlanId) || null;
    }, [plans, activePlanId]);

    const activeDatasource = useMemo(() => {
        if (!activePlan) {
            return datasources.find(d => d.id === activeDatasourceId) || datasources[0] || null;
        }
        return datasources.find(d => d.id === activePlan.datasourceId) || null;
    }, [activePlan, datasources, activeDatasourceId]);

    // Plans belonging to current datasource
    const currentDatasourcePlans = useMemo(() => {
        if (!activeDatasource) return [];
        return plans.filter(p => p.datasourceId === activeDatasource.id);
    }, [plans, activeDatasource]);

    // Effective Mapping calculation (renders candidate preview when active, else active plan)
    const effectiveMapping = useMemo(() => {
        if (previewMapping) return previewMapping;
        return activePlan?.selectedClassBySubjectId ?? {};
    }, [previewMapping, activePlan?.selectedClassBySubjectId]);

    // Selected classes mapped for the ScheduleGrid in strictly stable DOM order
    const selectedClasses = useMemo(() => {
        if (!activePlan || !activeDatasource) return [];

        // Stable order based on selectedSubjectIds to prevent React DOM re-ordering (insertBefore) which cancels CSS transitions
        const orderedSubjectIds = (activePlan.selectedSubjectIds && activePlan.selectedSubjectIds.length > 0)
            ? activePlan.selectedSubjectIds
            : Object.keys(effectiveMapping).sort();

        return orderedSubjectIds
            .map((subId) => {
                const classId = effectiveMapping[subId];
                if (!classId) return null;
                const sub = activeDatasource.subjects.find(s => s.subjectId === subId);
                const cls = sub?.classes.find(c => c.classId === classId);
                if (!cls) return null;
                return {
                    ...cls,
                    subjectId: subId,
                    subjectName: sub?.name,
                    subjectCode: sub?.code
                };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);
    }, [effectiveMapping, activeDatasource, activePlan]);

    // Conflicts computation
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

    const conflictCount = useMemo(() => {
        // Count unique conflicting subjects
        const conflictingClassIds = new Set(Object.keys(conflicts));
        return selectedClasses.filter(c => conflictingClassIds.has(c.classId)).length;
    }, [conflicts, selectedClasses]);

    // Live SKS calculation
    const totalSks = useMemo(() => {
        if (!activePlan || !activeDatasource) return 0;
        return activeDatasource.subjects
            .filter(s => (activePlan.selectedSubjectIds ?? []).includes(s.subjectId))
            .reduce((acc, s) => acc + s.sks, 0);
    }, [activePlan, activeDatasource]);

    // Handler: Save Current Schedule to Archive
    const handleSaveCurrentSchedule = useCallback(() => {
        if (!activePlan) return;
        saveActiveVariant(activePlan.id);
        toast.success("Schedule saved to archive");
    }, [activePlan, saveActiveVariant]);

    // Handler: Auto-Schedule Solver (Generates a single candidate preview without overwriting plan)
    const handleGenerateOrShuffle = useCallback(() => {
        if (!activePlan || isGenerating) return;

        if ((activePlan.selectedSubjectIds ?? []).length === 0) {
            toast.error("No Courses Selected", {
                id: "solver-toast",
                description: "Select courses in the left panel first to run Auto-Schedule."
            });
            setActiveTab("catalog");
            return;
        }

        const currentlyDisplayed = previewMapping ?? activePlan.selectedClassBySubjectId;

        // Generate a fresh random conflict-free candidate directly
        setSolverDiagnostics(null);
        toast.loading("Finding conflict-free schedule...", { id: "solver-toast" });

        const result = generateCandidateSchedule(activePlan.id, currentlyDisplayed);

        if (result.success && result.candidate) {
            setPreviewMapping(result.candidate);
            toast.success(previewMapping ? "Schedule Candidate Shuffled" : "Schedule Candidate Ready", {
                id: "solver-toast",
                description: "Accept to apply or Shuffle to try another."
            });
        } else {
            setSolverDiagnostics({
                failureSummary: result.failureSummary,
                blockerSubjects: result.blockerSubjects
            });

            toast.error("No Valid Schedule Found", {
                id: "solver-toast",
                description: result.blockerSubjects?.length
                    ? `${result.blockerSubjects.length} courses conflict with locked sections or rules.`
                    : "Try adjusting or relaxing your active rules."
            });
        }
    }, [activePlan, isGenerating, generateCandidateSchedule, previewMapping]);

    // Handler: Explicitly Accept Candidate Preview
    const handleAcceptPreview = useCallback(() => {
        if (!activePlan || !previewMapping) return;
        updatePlan(activePlan.id, { selectedClassBySubjectId: previewMapping });
        setPreviewMapping(null);
        toast.success("Schedule applied", { id: "preview-action" });
    }, [activePlan, previewMapping, updatePlan]);

    // Handler: Explicitly Discard/Cancel Candidate Preview
    const handleCancelPreview = useCallback(() => {
        setPreviewMapping(null);
        toast.info("Preview discarded", { id: "preview-action" });
    }, []);

    // Keyboard shortcuts:
    // When previewing: Enter to accept, Space to shuffle, Escape to cancel
    // When not previewing: Space to generate candidate
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

            if (previewMapping !== null) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleAcceptPreview();
                } else if (e.code === "Space") {
                    e.preventDefault();
                    handleGenerateOrShuffle();
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelPreview();
                }
            } else {
                if (e.code === "Space") {
                    e.preventDefault();
                    handleGenerateOrShuffle();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previewMapping, handleAcceptPreview, handleGenerateOrShuffle, handleCancelPreview]);

    // Handler: Export PNG
    const handleExportImage = async () => {
        const node = document.getElementById("krs-grid-capture");
        if (!node) return;

        toast.loading("Rendering PNG Schedule...", { id: "export-png" });

        try {
            const htmlToImage = await import("html-to-image");
            const dataUrl = await htmlToImage.toPng(node, {
                pixelRatio: 2,
                backgroundColor: "#f9f9f8",
                filter: (node: Node) => {
                    const el = node as HTMLElement;
                    return !el.classList?.contains("zoom-controls");
                }
            });

            const link = document.createElement("a");
            link.download = `KRSlab-${activePlan?.name || "Schedule"}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Schedule Exported as PNG!", { id: "export-png" });
        } catch (err) {
            console.error("Export failed", err);
            toast.error("Failed to export image", { id: "export-png" });
        }
    };

    // Handler: Create New Plan
    const handleCreateNewPlan = () => {
        if (!activeDatasource) return;
        const count = currentDatasourcePlans.length + 1;
        const newPlanId = addPlan({
            name: `Plan ${count}`,
            datasourceId: activeDatasource.id,
            selectedSubjectIds: [],
            selectedClassBySubjectId: {},
            rules: [],
            savedVariants: []
        });
        setActivePlanId(newPlanId);
        toast.success(`Created Plan ${count}`);
    };

    // Handler: Rename Plan
    const handleRenamePlan = (planId: string) => {
        if (!editingPlanName.trim()) {
            setEditingPlanId(null);
            return;
        }
        updatePlan(planId, { name: editingPlanName.trim() });
        setEditingPlanId(null);
        toast.success("Plan Renamed");
    };

    // Handler: Delete Plan
    const handleDeletePlan = (planId: string, planName: string) => {
        if (currentDatasourcePlans.length <= 1) {
            toast.error("Cannot delete the only plan", {
                description: "You must have at least one plan."
            });
            return;
        }
        deletePlan(planId);
        toast.info(`Deleted ${planName}`);
    };

    // ==========================================
    // ONBOARDING / EMPTY STATE (0 Datasources)
    // ==========================================
    if (!_hasHydrated || !mounted) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#f9f9f8]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-[#141413] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-[#6e6e77]">
                        Loading studio...
                    </span>
                </div>
            </div>
        );
    }

    if (datasources.length === 0) {
        return (
            <div className="min-h-screen bg-[#f9f9f8] bg-dot-matrix flex flex-col items-center justify-center p-6 text-[#141413] relative overflow-hidden font-sans">
                <div className="max-w-xl w-full space-y-8 relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
                    {/* Header */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-200/60 border border-[#e6e6e3] text-[#6e6e77] text-xs font-medium">
                            <span>Effortless KRS Schedule Solver</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#141413]">
                            Welcome to KRSlab
                        </h1>
                        <p className="text-sm md:text-base text-[#6e6e77] max-w-md mx-auto leading-relaxed">
                            Pick your courses, set your preferences, and let the automated solver resolve all your class conflicts in 1 click.
                        </p>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {/* Option 1: Sample Data */}
                        <div
                            onClick={() => {
                                const { parseBimaMasterWithDebug } = require("@krs/engine");
                                const parsed = parseBimaMasterWithDebug(SAMPLE_BIMA_TEXT);
                                const { planId } = importDatasourceAndCreatePlan("Sample UPNYK Informatics", parsed.subjects);
                                const sampleSubIds = parsed.subjects.slice(0, 5).map((s: any) => s.subjectId);
                                useAppStore.getState().updatePlan(planId, {
                                    name: "Semester 4",
                                    selectedSubjectIds: sampleSubIds
                                });
                                toast.success("Sample Data Loaded!", {
                                    id: "sample-toast",
                                    description: "5 courses pre-selected. Click Auto-Schedule to see the solver in action!"
                                });
                            }}
                            className="p-6 rounded-2xl bg-white border border-[#e6e6e3] shadow-sm hover:border-[#141413] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-2">
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-[#141413] flex items-center justify-center font-bold">
                                    <Calendar className="w-5 h-5 text-[#141413]" />
                                </div>
                                <h3 className="text-base font-semibold text-[#141413] group-hover:text-black transition-colors">
                                    Try Sample Data
                                </h3>
                                <p className="text-xs text-[#6e6e77] leading-relaxed">
                                    Instantly load a realistic Informatics schedule (Senin–Sabtu) to test the solver without logging into BIMA.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#141413] pt-2">
                                <span>Load Sample Now</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* Option 2: Paste BIMA Data */}
                        <div
                            onClick={() => {
                                setDataModalEditSourceId(null);
                                openOverlay("bima-import");
                            }}
                            className="p-6 rounded-2xl bg-white border border-[#e6e6e3] shadow-sm hover:border-[#141413] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-2">
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-[#141413] flex items-center justify-center font-bold group-hover:text-black transition-colors">
                                    <FileText className="w-5 h-5 text-[#5b82a6]" />
                                </div>
                                <h3 className="text-base font-semibold text-[#141413] group-hover:text-black transition-colors">
                                    Import BIMA Schedule
                                </h3>
                                <p className="text-xs text-[#6e6e77] leading-relaxed">
                                    Copy the &quot;Jadwal Dosen&quot; table from your university BIMA portal and paste it directly.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#6e6e77] group-hover:text-[#141413] pt-2">
                                <span>Paste Table Data</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BIMA Import Modal in Empty State */}
                <DataModal
                    isOpen={activeOverlay === "bima-import"}
                    onClose={closeOverlay}
                    editSourceId={dataModalEditSourceId}
                />
            </div>
        );
    }

    if (!activePlan || !activeDatasource) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#f9f9f8]">
                <AlertCircle className="w-10 h-10 text-[#a1a1aa]" />
                <h3 className="text-base font-semibold text-[#141413]">No Active Plan Selected</h3>
                <button
                    onClick={() => openOverlay("bima-import")}
                    className="btn-tactile-dark px-4 py-2 rounded-lg text-xs font-medium text-white"
                >
                    Manage BIMA Data
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#f9f9f8] overflow-hidden font-sans selection:bg-amber-100">
            {/* ========================================================= */}
            {/* 1. TOP WORKSPACE HEADER & TOOLBAR                         */}
            {/* ========================================================= */}
            <header className="h-14 border-b border-[#e6e6e3] bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 shrink-0 relative z-50 sticky top-0">
                {/* 1. Left Group: Brand & Context & Inline Plan Tabs */}
                <div className="flex items-center gap-2.5 shrink-0 min-w-0">
                    {/* Minimal Dark Squircle Mark + Brand Wordmark */}
                    <div className="flex items-center gap-2 select-none shrink-0">
                        <div className="w-6 h-6 rounded-[7px] bg-[#141413] text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
                            K
                        </div>
                        <span className="text-[14px] font-medium text-[#141413] tracking-tight hidden sm:inline">KRSlab</span>
                    </div>

                    <span className="text-[#d8d8d4] text-sm shrink-0 font-light">/</span>

                    {/* Source Switcher Dropdown Trigger */}
                    <div className="relative shrink-0">
                        <button
                            id="tour-datasource-btn"
                            ref={sourceTriggerRef}
                            type="button"
                            onClick={handleToggleSourceMenu}
                            className="px-2.5 py-1 rounded-lg hover:bg-neutral-100 text-[13.5px] font-medium text-[#141413] flex items-center gap-1.5 transition-colors select-none"
                            title="Click to switch, edit, copy, or import schedule sources"
                        >
                            <span className="max-w-[150px] sm:max-w-[220px] truncate">{activeDatasource.name}</span>
                            <ChevronDown className={cn("w-3 h-3 text-[#a1a1aa] shrink-0 transition-transform duration-150", isSourceMenuOpen && "rotate-180")} />
                        </button>
                    </div>

                    <span className="text-[#d8d8d4] text-xs shrink-0 select-none">|</span>

                    {/* Visible Plan Tabs + + New Plan Button */}
                    <div className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                        {currentDatasourcePlans.slice(0, 4).map((p) => {
                            const isActive = p.id === activePlan.id;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => setActivePlanId(p.id)}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] cursor-pointer transition-all shrink-0 select-none group",
                                        isActive
                                            ? "nexvyn-dash font-semibold text-[#141413] bg-neutral-100/60"
                                            : "font-medium text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100/50"
                                    )}
                                    title={`Plan: ${p.name}`}
                                >
                                    <span className="truncate max-w-[90px]">{p.name}</span>
                                    {isActive && currentDatasourcePlans.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePlan(p.id, p.name);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-600 rounded text-neutral-400 transition-opacity ml-0.5"
                                            title="Delete plan"
                                        >
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Explicit, always-visible + New Plan button */}
                        <button
                            onClick={handleCreateNewPlan}
                            className="px-2 py-1 rounded-md text-[12.5px] font-medium text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100 transition-colors flex items-center gap-1 shrink-0 select-none"
                            title="Create a new schedule plan"
                        >
                            <Plus className="w-3 h-3 text-[#6e6e77]" />
                            <span>New Plan</span>
                        </button>
                    </div>
                </div>

                {/* 2. Center Group: [Rules 0] | [+ Save] [Saved (N)] | [Auto-Schedule] ↖ psst */}
                <div id="tour-solver-bar" className="flex items-center gap-2.5 shrink-0">
                    {/* Rules Button */}
                    <button
                        id="tour-rules-btn"
                        onClick={() => openOverlay("rules")}
                        className="btn-tactile-light px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] flex items-center gap-1.5 transition-all"
                        title="Configure Solver Rules"
                    >
                        <span>Rules</span>
                        <span className="bg-neutral-200/70 text-[#6e6e77] px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                            {activePlan.rules?.filter(r => r.enabled).length || 0}
                        </span>
                    </button>

                    {/* Split/paired Saved action: [+ Save] and [Saved (N)] */}
                    <div className="flex items-center gap-1 bg-[#f3f3f0] p-0.5 rounded-lg border border-[#e6e6e3]">
                        <button
                            onClick={handleSaveCurrentSchedule}
                            className="px-2.5 py-1 rounded-md text-[12.5px] font-medium text-[#141413] hover:bg-white transition-colors flex items-center gap-1 select-none"
                            title="Save current schedule to archive"
                        >
                            <Plus className="w-3 h-3 text-[#5b82a6]" />
                            <span>Save</span>
                        </button>
                        <button
                            onClick={() => openOverlay("saved")}
                            className="px-2.5 py-1 rounded-md text-[12.5px] font-medium text-[#6e6e77] hover:text-[#141413] hover:bg-white transition-colors flex items-center gap-1.5 select-none"
                            title="View Saved Schedules"
                        >
                            <span>Saved</span>
                            <span className="bg-neutral-200/80 text-[#141413] px-1.5 py-0.2 rounded text-[10px] font-mono leading-none">
                                {activePlan.savedVariants?.length ?? 0}
                            </span>
                        </button>
                    </div>

                    <span className="text-[#d8d8d4] text-xs select-none">|</span>

                    {/* Auto-Schedule / Shuffle Button (Static width & position, never expands) */}
                    <div className="flex items-center gap-2">
                        <button
                            id="tour-auto-schedule-btn"
                            onClick={handleGenerateOrShuffle}
                            disabled={isGenerating}
                            className={cn(
                                "px-3.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-all select-none shadow-sm",
                                previewMapping !== null
                                    ? "btn-tactile-light text-[#141413] border-[#d8d8d4]"
                                    : "btn-tactile-dark text-white",
                                isGenerating && "opacity-75 cursor-not-allowed"
                            )}
                            title={previewMapping !== null ? "Shuffle candidate (Space)" : "Generate conflict-free schedule (Space)"}
                        >
                            {previewMapping !== null ? (
                                <RotateCw className={cn("w-3.5 h-3.5 text-[#5b82a6]", isGenerating && "animate-spin")} />
                            ) : (
                                <svg className={cn("w-3.5 h-3.5 fill-current opacity-90", isGenerating && "animate-spin")} viewBox="0 0 24 24">
                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                                </svg>
                            )}
                            <span>
                                {isGenerating
                                    ? "Solving..."
                                    : previewMapping !== null
                                        ? "Shuffle"
                                        : "Auto-Schedule"}
                            </span>
                        </button>

                        {/* Margin Note: Doodle arrow & text pointing directly at Auto-Schedule */}
                        {previewMapping === null && (
                            <div className="hidden 2xl:flex items-center gap-1.5 select-none text-[#5b82a6] font-doodle font-bold text-[16.5px] -rotate-2 ml-1">
                                <svg className="w-6 h-4 text-[#5b82a6] stroke-current fill-none stroke-[2] -scale-x-100" viewBox="0 0 32 20">
                                    <path d="M4 16 C 14 16, 22 12, 28 4" strokeLinecap="round" />
                                    <path d="M22 4 L28 4 L28 10" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>← space to shuffle</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Right Group: Compact Tutorial Pill, SKS Status & Export */}
                <div className="flex items-center gap-2.5 shrink-0">
                    {/* Tutorial Doodle Button */}
                    <button
                        type="button"
                        onClick={() => openOverlay("tour")}
                        className="font-doodle text-[17.5px] font-bold text-[#5b82a6] hover:text-[#141413] px-2.5 py-1 rounded-lg hover:bg-neutral-100/80 transition-colors flex items-center gap-1 shrink-0 select-none"
                        title="Restart 5-step interactive tutorial"
                    >
                        <span>↻ tutorial</span>
                    </button>

                    <span className="text-[#d8d8d4] text-xs select-none">·</span>

                    {/* Status Dot + SKS Count with lowercase sks */}
                    <div
                        onClick={() => {
                            if (totalSks > 24) {
                                setAllowOverload(!allowOverload);
                                toast.info(allowOverload ? "24 SKS limit active" : "Overload allowed (>24 SKS)");
                            }
                        }}
                        className={cn(
                            "flex items-center gap-1.5 text-[12.5px] font-mono select-none cursor-pointer",
                            conflictCount > 0 ? "text-rose-500 font-semibold" : "text-[#6e6e77]"
                        )}
                        title={conflictCount > 0 ? `${conflictCount} conflicting courses` : "Total selected SKS"}
                    >
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            conflictCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                        )} />
                        <div className="flex items-baseline gap-1">
                            <span className="font-mono text-[12.5px] tabular-nums">{totalSks} / 24</span>
                            <span className="font-doodle text-[17px] font-bold text-[#6e6e77]">sks</span>
                        </div>
                        {totalSks > 24 && (
                            <span className="text-[10px] text-amber-500 font-sans">
                                {allowOverload ? "(Overload)" : "(Exceeded)"}
                            </span>
                        )}
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportImage}
                        className="btn-tactile-light px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] flex items-center gap-1.5 transition-all"
                        title="Export Timetable as PNG"
                    >
                        <Download className="w-3.5 h-3.5 text-[#6e6e77]" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    {/* Saved Drawer Modal */}
                    <SavedVariants
                        plan={activePlan}
                        datasource={activeDatasource}
                        isOpen={activeOverlay === "saved"}
                        onOpenChange={(open) => {
                            if (!open) closeOverlay();
                            else openOverlay("saved");
                        }}
                        hideTrigger
                    />
                </div>
            </header>



            {/* ========================================================= */}
            {/* 3. SOLVER DIAGNOSTIC BANNER (If 0 solutions found)         */}
            {/* ========================================================= */}
            {solverDiagnostics && (
                <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between px-6 text-xs text-rose-800 animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="font-semibold">
                            No conflict-free schedule found:
                        </span>
                        <span className="truncate opacity-90">
                            {solverDiagnostics.blockerSubjects?.length
                                ? `${solverDiagnostics.blockerSubjects.map(b => b.subjectName).join(", ")} conflict with your locked courses or time rules.`
                                : "One or more rules are too restrictive for this subject combination."}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button
                            onClick={() => openOverlay("rules")}
                            className="underline font-semibold hover:opacity-80"
                        >
                            Adjust Rules
                        </button>
                        <button
                            onClick={() => setSolverDiagnostics(null)}
                            className="p-1 rounded hover:bg-rose-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 4. MAIN WORKSPACE STAGE: (Left Panel + Center Grid)       */}
            {/* ========================================================= */}
            <div className="flex-1 flex overflow-hidden relative z-10 bg-[#f9f9f8] bg-dot-matrix">
                {/* Left Panel: Desktop 320px Clean Split (Untouched on lg screens) */}
                <div
                    id="tour-course-panel"
                    className="hidden lg:flex w-[320px] shrink-0 h-full flex-col z-10 border-r border-[#e6e6e3] bg-white/95"
                >
                    <CoursePanel
                        plan={activePlan}
                        datasource={activeDatasource}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        conflicts={conflicts}
                        effectiveMapping={effectiveMapping}
                        onHoverSubject={setHoveredSubjectId}
                        onHoverClass={setHoveredClassId}
                    />
                </div>

                {/* Center / Right Panel: Live Interactive ScheduleGrid (100% width on mobile/tablet) */}
                <div
                    id="krs-grid-capture"
                    className="flex-1 h-full overflow-hidden bg-[#f9f9f8] bg-dot-matrix relative flex flex-col"
                >
                    <ScheduleGrid
                        selectedClasses={selectedClasses}
                        conflicts={conflicts}
                        frozenSubjectIds={activePlan?.frozenSubjectIds ?? []}
                        onToggleFreeze={(subId) => toggleFreezeSubject(activePlan.id, subId)}
                        onBlockClick={(subId) => {
                            setActiveTab("selected");
                        }}
                        onSelectClass={(subId, classId) => {
                            if (previewMapping) {
                                setPreviewMapping(prev => ({ ...(prev ?? {}), [subId]: classId }));
                            } else {
                                setSelectedClassForSubject(activePlan.id, subId, classId);
                            }
                            const sub = activeDatasource.subjects.find(s => s.subjectId === subId);
                            const cls = sub?.classes.find(c => c.classId === classId);
                            toast.success(`Switched to Kelas ${cls?.className || classId}`, { id: "switch-section" });
                        }}
                        allSubjects={activeDatasource.subjects}
                        hoveredSubjectId={hoveredSubjectId}
                        hoveredClassId={hoveredClassId}
                        focusedSubjectId={gridFocusedSubjectId}
                        onFocusSubject={setGridFocusedSubjectId}
                    />
                </div>

                {/* Floating Preview Confirmation Bar */}
                {previewMapping !== null && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-[#d8d8d4] shadow-[0_12px_32px_rgba(0,0,0,0.12)] rounded-2xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
                        <span className="font-doodle text-[18px] font-bold text-[#5b82a6] pr-1 select-none">
                            previewing schedule
                        </span>

                        {/* [ ✓ Accept ↵ ] */}
                        <button
                            onClick={handleAcceptPreview}
                            className="btn-tactile-dark px-3.5 py-1.5 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-700 shadow-sm flex items-center gap-1.5 transition-all select-none cursor-pointer"
                            title="Accept schedule candidate (Enter)"
                        >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Accept</span>
                            <span className="text-[10px] font-mono opacity-80 bg-emerald-700/60 px-1 py-0.2 rounded ml-0.5">↵</span>
                        </button>

                        {/* [ ↻ Shuffle Space ] */}
                        <button
                            onClick={handleGenerateOrShuffle}
                            disabled={isGenerating}
                            className="btn-tactile-light px-3.5 py-1.5 rounded-xl text-[13px] font-medium text-[#141413] flex items-center gap-1.5 transition-all select-none shadow-2xs cursor-pointer"
                            title="Shuffle candidate (Space)"
                        >
                            <RotateCw className={cn("w-3.5 h-3.5 text-[#5b82a6]", isGenerating && "animate-spin")} />
                            <span>Shuffle</span>
                            <span className="text-[10px] font-mono text-[#6e6e77] bg-neutral-200/60 px-1.5 py-0.2 rounded ml-0.5">Space</span>
                        </button>

                        {/* [ ✕ Cancel Esc ] */}
                        <button
                            onClick={handleCancelPreview}
                            className="px-3 py-1.5 rounded-xl text-[13px] font-medium text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100 transition-colors flex items-center gap-1 select-none cursor-pointer"
                            title="Discard preview (Esc)"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                            <span className="text-[10px] font-mono text-[#a1a1aa] ml-0.5">Esc</span>
                        </button>
                    </div>
                )}

                {/* Mobile/Tablet (< lg) Floating Pill Button to toggle Courses Drawer */}
                <div className="lg:hidden fixed bottom-5 left-5 z-40">
                    <button
                        onClick={() => setIsMobileCoursesOpen(true)}
                        className="tactile-btn px-4 py-2.5 rounded-full bg-[#141413] text-white text-[13px] font-medium shadow-xl flex items-center gap-2 hover:bg-[#282826] active:scale-95 transition-all border border-neutral-700 select-none"
                        title="Open Course Catalog & Selected Sections"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Courses ({activePlan.selectedSubjectIds.length})</span>
                        <span className="text-[#a1a1aa]">·</span>
                        <span className="text-amber-300 font-semibold">+ Add</span>
                    </button>
                </div>

                {/* Mobile/Tablet (< lg) Slide-Over Course Drawer */}
                {isMobileCoursesOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
                            onClick={() => setIsMobileCoursesOpen(false)}
                        />

                        {/* Slide-over Panel */}
                        <div className="relative w-full max-w-[340px] sm:max-w-[380px] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
                            {/* Drawer Top Header with Close Button */}
                            <div className="h-12 px-4 border-b border-[#e6e6e3] flex items-center justify-between bg-neutral-50/80 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[13.5px] text-[#141413]">Courses</span>
                                    <span className="text-[11px] font-mono text-[#6e6e77] bg-neutral-200/60 px-1.5 py-0.2 rounded">
                                        {activePlan.selectedSubjectIds.length} selected
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMobileCoursesOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-neutral-200/60 text-[#6e6e77] hover:text-[#141413] transition-colors"
                                    title="Close Drawer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <CoursePanel
                                    plan={activePlan}
                                    datasource={activeDatasource}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    conflicts={conflicts}
                                    effectiveMapping={effectiveMapping}
                                    onHoverSubject={setHoveredSubjectId}
                                    onHoverClass={setHoveredClassId}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rules Drawer */}
            <RulesLab
                isOpen={activeOverlay === "rules"}
                onClose={closeOverlay}
                rules={activePlan.rules ?? []}
                onUpdateRules={(rules) => setRulesForPlan(activePlan.id, rules)}
                onGenerate={handleGenerateOrShuffle}
            />

            {/* BIMA Import / Switch Modal */}
            <DataModal
                isOpen={activeOverlay === "bima-import"}
                onClose={closeOverlay}
                editSourceId={dataModalEditSourceId}
            />

            {/* Interactive 5-Step Spotlight Tour */}
            <InteractiveTour
                isOpen={activeOverlay === "tour"}
                onClose={closeOverlay}
                onOpenImport={() => openOverlay("bima-import")}
                onFocusFirstCourse={() => {
                    const firstSubId = selectedClasses[0]?.subjectId || activePlan.selectedSubjectIds[0];
                    if (firstSubId) {
                        setGridFocusedSubjectId(firstSubId);
                    }
                }}
                onClearFocus={() => {
                    setGridFocusedSubjectId(null);
                }}
                selectedClasses={selectedClasses}
            />

            {/* Portaled Source Switcher Dropdown (z-[9999] in document.body) */}
            {mounted && isSourceMenuOpen && sourceMenuCoords && createPortal(
                <div className="fixed inset-0 z-[9998] pointer-events-auto">
                    {/* Full-screen invisible click-away backdrop */}
                    <div
                        className="fixed inset-0 z-[9998] bg-transparent"
                        onClick={() => setIsSourceMenuOpen(false)}
                    />

                    {/* Popover Card */}
                    <div
                        style={{
                            position: "fixed",
                            top: `${sourceMenuCoords.top}px`,
                            left: `${sourceMenuCoords.left}px`,
                        }}
                        className="w-[300px] sm:w-[340px] bg-white border border-[#e2e2de] rounded-xl shadow-2xl p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-100 flex flex-col text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2.5 py-1 font-doodle text-[18px] font-bold text-[#5b82a6] select-none">
                            schedule sources
                        </div>

                        <div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-0.5 my-1">
                            {datasources.map((ds) => {
                                const isActive = ds.id === activeDatasource.id;
                                const totalClasses = ds.subjects.reduce((sum, s) => sum + s.classes.length, 0);

                                return (
                                    <div
                                        key={ds.id}
                                        onClick={() => handleSwitchDatasource(ds.id)}
                                        className={cn(
                                            "p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors group select-none",
                                            isActive ? "bg-neutral-100/80 font-medium" : "hover:bg-neutral-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13px] text-[#141413] truncate font-medium">
                                                        {ds.name}
                                                    </span>
                                                    {isActive && (
                                                        <Check className="w-3.5 h-3.5 text-[#141413] shrink-0" />
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-[#6e6e77] truncate">
                                                    {ds.subjects.length} courses · {totalClasses} classes
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inline management actions on each row */}
                                        <div
                                            className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Edit */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsSourceMenuOpen(false);
                                                    setDataModalEditSourceId(ds.id);
                                                    openOverlay("bima-import");
                                                }}
                                                className="p-1 rounded hover:bg-neutral-200/70 text-[#6e6e77] hover:text-[#141413] transition-colors"
                                                title="Edit source or rename"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Duplicate */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDuplicateDatasource(ds.id);
                                                }}
                                                className="p-1 rounded hover:bg-neutral-200/70 text-[#6e6e77] hover:text-[#141413] transition-colors"
                                                title="Duplicate source"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDatasource(ds);
                                                }}
                                                className="p-1 rounded hover:bg-rose-100 text-[#a1a1aa] hover:text-rose-600 transition-colors"
                                                title="Delete source"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Popover Footer Actions */}
                        <div className="border-t border-[#e6e6e3] mt-1 pt-1.5 space-y-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSourceMenuOpen(false);
                                    setDataModalEditSourceId(null);
                                    openOverlay("bima-import");
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] hover:bg-neutral-100 flex items-center gap-2 transition-colors select-none"
                            >
                                <Plus className="w-3.5 h-3.5 text-[#5b82a6]" />
                                <span>+ Import new BIMA source...</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsSourceMenuOpen(false);
                                    handleLoadSample();
                                }}
                                className="w-full text-left px-2.5 py-1 rounded-lg text-[11.5px] text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-50 flex items-center gap-2 transition-colors select-none"
                            >
                                <span>Load sample Informatics data</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense
            fallback={
                <div className="h-screen flex items-center justify-center bg-background">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <WorkspaceContent />
        </Suspense>
    );
}
