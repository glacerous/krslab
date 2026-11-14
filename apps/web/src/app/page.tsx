"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useAppStore, Subject, Plan } from "@/lib/store";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { RulesLab } from "@/components/RulesLab";
import { CoursePanel } from "@/components/CoursePanel";
import { DataModal } from "@/components/DataModal";
import { CustomCourseModal } from "@/components/CustomCourseModal";
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
    ArrowRight,
    AlertCircle,
    Info,
    Sun,
    Moon,
    Compass,
    Video,
    History,
    Calendar,
    FileText,
    RotateCw,
    Pencil,
    Copy,
    SlidersHorizontal,
    User
} from "lucide-react";
import { createPortal } from "react-dom";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { BrandLogo } from "@/components/BrandLogo";
import { getTranslation } from "@/lib/i18n";
import { switchThemeWithTransition, switchLanguageWithTransition } from "@/lib/theme-transition";
import { buildKrsChecklistText, buildScheduleIcs, getScheduledItems } from "@/lib/export-schedule";
import { useOnboarding } from "@/lib/onboarding/useOnboarding";
import { IntroCard } from "@/components/onboarding/IntroCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ReleaseAnnouncementCard } from "@/components/onboarding/ReleaseAnnouncementCard";
import { AdvancedTipCard } from "@/components/onboarding/AdvancedTipCard";
import { LATEST_CHANGELOG_VERSION } from "@/lib/changelog";

const VideoModal = dynamic(
    () => import("@/components/onboarding/VideoModal").then((m) => m.VideoModal),
    { ssr: false }
);
const WhatsNew = dynamic(
    () => import("@/components/onboarding/WhatsNew").then((m) => m.WhatsNew),
    { ssr: false }
);

function WorkspaceContent() {
    const {
        datasources,
        plans,
        activePlanId,
        activeDatasourceId,
        setActivePlanId,
        setActiveDatasourceId,
        addDatasource,
        addPlan,
        updatePlan,
        deletePlan,
        duplicatePlan,
        updateDatasource,
        duplicateDatasource,
        deleteDatasource,
        deduplicateDatasources,
        autoSchedulePlan,
        generateCandidateSchedule,
        setRulesForPlan,
        toggleFreezeSubject,
        removeSubjectFromPlan,
        setSelectedClassForSubject,
        importDatasourceAndCreatePlan,
        isDataModalOpen,
        setIsDataModalOpen,
        isGenerating,
        _hasHydrated,
        setHasHydrated,
        language,
        setLanguage,
        maxSks,
        setMaxSks,
        hasCompletedWelcome,
        setHasCompletedWelcome,
        createEmptyDatasource,
        isCustomCourseModalOpen,
        setIsCustomCourseModalOpen
    } = useAppStore();

    type ActiveOverlay = "none" | "bima-import" | "rules" | "tour";

    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const t = useMemo(() => getTranslation(language), [language]);
    const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>("none");
    const [tourStep, setTourStep] = useState(0);
    const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
    const [isPlanMenuOpen, setIsPlanMenuOpen] = useState(false);
    const [isPrefsOpen, setIsPrefsOpen] = useState(false);
    const [isGuideMenuOpen, setIsGuideMenuOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isDragRemoveHover, setIsDragRemoveHover] = useState(false);
    const [isTrashCatching, setIsTrashCatching] = useState(false);
    const [isWelcomeManuallyOpen, setIsWelcomeManuallyOpen] = useState(false);
    const [confirmDeletePlanId, setConfirmDeletePlanId] = useState<string | null>(null);
    const [editingPlanIdInMenu, setEditingPlanIdInMenu] = useState<string | null>(null);
    const [menuPlanNameInput, setMenuPlanNameInput] = useState("");
    const [isRenamingTopBar, setIsRenamingTopBar] = useState(false);
    const [topBarPlanName, setTopBarPlanName] = useState("");
    const topBarInputRef = useRef<HTMLInputElement>(null);

    const [dataModalEditSourceId, setDataModalEditSourceId] = useState<string | null>(null);
    const sourceTriggerRef = useRef<HTMLButtonElement>(null);
    const planTriggerRef = useRef<HTMLButtonElement>(null);
    const prefsBtnRef = useRef<HTMLButtonElement>(null);
    const guideBtnRef = useRef<HTMLButtonElement>(null);
    const exportBtnRef = useRef<HTMLButtonElement>(null);
    const [exportMenuCoords, setExportMenuCoords] = useState<{ top: number; right: number } | null>(null);
    const [sourceMenuCoords, setSourceMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const [planMenuCoords, setPlanMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const [prefsCoords, setPrefsCoords] = useState<{ top: number; left: number } | null>(null);
    const [guideMenuCoords, setGuideMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const shouldLaunchTourAfterImportRef = useRef(false);

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

    const updatePlanMenuCoords = useCallback(() => {
        if (planTriggerRef.current) {
            const rect = planTriggerRef.current.getBoundingClientRect();
            const menuWidth = 340;
            const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
            setPlanMenuCoords({
                top: rect.bottom + 6,
                left,
            });
        }
    }, []);

    const updatePrefsCoords = useCallback(() => {
        if (prefsBtnRef.current) {
            const rect = prefsBtnRef.current.getBoundingClientRect();
            const menuWidth = 280;
            const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
            setPrefsCoords({
                top: rect.bottom + 6,
                left,
            });
        }
    }, []);

    const updateGuideMenuCoords = useCallback(() => {
        if (guideBtnRef.current) {
            const rect = guideBtnRef.current.getBoundingClientRect();
            const menuWidth = 240;
            const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
            setGuideMenuCoords({
                top: rect.bottom + 6,
                left,
            });
        }
    }, []);

    const handleToggleSourceMenu = () => {
        if (!isSourceMenuOpen) {
            updateSourceMenuCoords();
            setIsSourceMenuOpen(true);
            setIsPlanMenuOpen(false);
            setIsPrefsOpen(false);
        } else {
            setIsSourceMenuOpen(false);
        }
    };

    const handleTogglePlanMenu = () => {
        if (!isPlanMenuOpen) {
            updatePlanMenuCoords();
            setIsPlanMenuOpen(true);
            setIsSourceMenuOpen(false);
            setIsPrefsOpen(false);
            setConfirmDeletePlanId(null);
            setEditingPlanIdInMenu(null);
        } else {
            setIsPlanMenuOpen(false);
        }
    };

    const handleTogglePrefs = () => {
        if (!isPrefsOpen) {
            updatePrefsCoords();
            setIsPrefsOpen(true);
            setIsSourceMenuOpen(false);
            setIsPlanMenuOpen(false);
            setIsGuideMenuOpen(false);
        } else {
            setIsPrefsOpen(false);
        }
    };

    const updateExportMenuCoords = useCallback(() => {
        if (exportBtnRef.current) {
            const rect = exportBtnRef.current.getBoundingClientRect();
            setExportMenuCoords({
                top: rect.bottom + 8,
                right: Math.max(12, window.innerWidth - rect.right),
            });
        }
    }, []);

    const handleToggleGuideMenu = () => {
        if (!isGuideMenuOpen) {
            updateGuideMenuCoords();
            setIsGuideMenuOpen(true);
            setIsSourceMenuOpen(false);
            setIsPlanMenuOpen(false);
            setIsPrefsOpen(false);
            setIsExportMenuOpen(false);
        } else {
            setIsGuideMenuOpen(false);
        }
    };

    const handleToggleExportMenu = () => {
        if (!isExportMenuOpen) {
            updateExportMenuCoords();
            setIsExportMenuOpen(true);
            setIsSourceMenuOpen(false);
            setIsPlanMenuOpen(false);
            setIsPrefsOpen(false);
            setIsGuideMenuOpen(false);
        } else {
            setIsExportMenuOpen(false);
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

    useEffect(() => {
        if (!isPlanMenuOpen) return;
        window.addEventListener("resize", updatePlanMenuCoords);
        window.addEventListener("scroll", updatePlanMenuCoords, true);
        return () => {
            window.removeEventListener("resize", updatePlanMenuCoords);
            window.removeEventListener("scroll", updatePlanMenuCoords, true);
        };
    }, [isPlanMenuOpen, updatePlanMenuCoords]);

    useEffect(() => {
        if (!isPrefsOpen) return;
        window.addEventListener("resize", updatePrefsCoords);
        window.addEventListener("scroll", updatePrefsCoords, true);
        return () => {
            window.removeEventListener("resize", updatePrefsCoords);
            window.removeEventListener("scroll", updatePrefsCoords, true);
        };
    }, [isPrefsOpen, updatePrefsCoords]);

    useEffect(() => {
        if (!isGuideMenuOpen) return;
        window.addEventListener("resize", updateGuideMenuCoords);
        window.addEventListener("scroll", updateGuideMenuCoords, true);
        return () => {
            window.removeEventListener("resize", updateGuideMenuCoords);
            window.removeEventListener("scroll", updateGuideMenuCoords, true);
        };
    }, [isGuideMenuOpen, updateGuideMenuCoords]);

    const [activeTab, setActiveTab] = useState<"selected" | "catalog">("selected");
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [editingPlanName, setEditingPlanName] = useState("");
    const [allowOverload, setAllowOverload] = useState(false);
    const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);

    const isOnboardingBlocked =
        !mounted ||
        !hasCompletedWelcome ||
        isWelcomeManuallyOpen ||
        activeOverlay !== "none" ||
        isCustomCourseModalOpen ||
        isSourceMenuOpen ||
        isPlanMenuOpen ||
        isPrefsOpen ||
        isGuideMenuOpen ||
        isExportMenuOpen ||
        isMobileCoursesOpen;

    const onboarding = useOnboarding({ isBlocked: isOnboardingBlocked });
    const {
        activeSurface: onboardingSurface,
        seenVersion: onboardingSeenVersion,
        markVersionSeen: markOnboardingVersionSeen,
    } = onboarding;
    const hasUnseenChangelog =
        onboarding.hydrated && onboardingSeenVersion !== LATEST_CHANGELOG_VERSION;

    useEffect(() => {
        if (onboardingSurface === "intro" && onboardingSeenVersion === null) {
            markOnboardingVersionSeen(LATEST_CHANGELOG_VERSION);
        }
    }, [onboardingSurface, onboardingSeenVersion, markOnboardingVersionSeen]);

    // Existing users who already completed welcome and have saved data should not see the first-time intro popup
    const checkedExistingUserRef = useRef(false);
    useEffect(() => {
        if (!_hasHydrated || !onboarding.hydrated || checkedExistingUserRef.current) return;
        checkedExistingUserRef.current = true;
        if (hasCompletedWelcome && datasources.length > 0 && !onboarding.introSeen) {
            onboarding.markIntroSeen();
        }
    }, [_hasHydrated, hasCompletedWelcome, datasources.length, onboarding]);

    const handleThemeSwitch = useCallback(
        (nextTheme: "light" | "dark", e: React.MouseEvent<HTMLButtonElement>) => {
            switchThemeWithTransition(nextTheme, theme, setTheme, e);
        },
        [theme, setTheme]
    );

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

    const handleCloseTour = useCallback(() => {
        closeOverlay();
        setIsSourceMenuOpen(false);
        setIsPlanMenuOpen(false);
        setGridFocusedSubjectId(null);
        setTourStep(0);
    }, [closeOverlay]);


    const openOverlay = useCallback((overlay: ActiveOverlay) => {
        setActiveOverlay(overlay);
        if (overlay === "bima-import") {
            setIsDataModalOpen(true);
        } else if (overlay === "tour") {
            if (typeof window !== "undefined") {
                localStorage.removeItem("krs_tour_completed");
            }
            setTourStep(0);
            updateSourceMenuCoords();
            setIsSourceMenuOpen(true);
            setIsPlanMenuOpen(false);
            setGridFocusedSubjectId(null);
        } else {
            setIsDataModalOpen(false);
        }
    }, [setIsDataModalOpen, updateSourceMenuCoords]);

    const triggerTour = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("krs_tour_completed");
        }
        setTourStep(0);
        openOverlay("tour");
    }, [openOverlay]);

    // Sync external store isDataModalOpen changes (e.g., from direct actions)
    useEffect(() => {
        if (activeOverlay === "tour") return;
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
                if (isSourceMenuOpen && activeOverlay !== "tour") {
                    setIsSourceMenuOpen(false);
                }
                if (isPlanMenuOpen && activeOverlay !== "tour") {
                    setIsPlanMenuOpen(false);
                    setConfirmDeletePlanId(null);
                    setEditingPlanIdInMenu(null);
                }
                if (isPrefsOpen) {
                    setIsPrefsOpen(false);
                }
                if (isGuideMenuOpen) {
                    setIsGuideMenuOpen(false);
                }
                if (isRenamingTopBar) {
                    setIsRenamingTopBar(false);
                }
                if (isMobileCoursesOpen) {
                    setIsMobileCoursesOpen(false);
                }
                if (activeOverlay === "tour") {
                    handleCloseTour();
                } else if (activeOverlay !== "none") {
                    closeOverlay();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeOverlay, closeOverlay, handleCloseTour, isMobileCoursesOpen, isSourceMenuOpen, isPlanMenuOpen, isPrefsOpen, isGuideMenuOpen, isRenamingTopBar]);

    const handleSaveTopBarRename = () => {
        if (!activePlan) return;
        const trimmed = topBarPlanName.trim();
        if (trimmed && trimmed !== activePlan.name) {
            updatePlan(activePlan.id, { name: trimmed });
            toast.success("Plan renamed");
        }
        setIsRenamingTopBar(false);
    };

    const handleSaveMenuRename = (planId: string) => {
        const trimmed = menuPlanNameInput.trim();
        if (trimmed) {
            updatePlan(planId, { name: trimmed });
            toast.success("Plan renamed");
        }
        setEditingPlanIdInMenu(null);
    };

    const handleDuplicatePlan = (planId: string) => {
        const newPlanId = duplicatePlan(planId);
        if (newPlanId) {
            toast.success("Plan duplicated");
            setIsPlanMenuOpen(false);
        }
    };

    const handleSwitchDatasource = (dsId: string) => {
        setActiveDatasourceId(dsId);
        const targetDs = datasources.find(d => d.id === dsId);
        const existingPlans = plans
            .filter(p => p.datasourceId === dsId)
            .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

        if (existingPlans.length > 0) {
            const firstPlan = existingPlans[0];
            setActivePlanId(firstPlan.id);
            const hasCourses = (firstPlan.selectedSubjectIds ?? []).length > 0;
            setActiveTab(hasCourses ? "selected" : "catalog");
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
            setActiveTab("catalog");
        }
        const count = targetDs?.subjects?.length ?? 0;
        toast.success(`Switched to "${targetDs?.name || 'Schedule'}" (${count} courses)`);
        setIsSourceMenuOpen(false);
    };

    const handleDuplicateDatasource = (dsId: string) => {
        duplicateDatasource(dsId);
        toast.success("Source duplicated");
        setIsSourceMenuOpen(false);
    };

    const [pendingDeleteDs, setPendingDeleteDs] = useState<{ id: string; name: string } | null>(null);

    const handleDeleteDatasource = (ds: { id: string; name: string }) => {
        setIsSourceMenuOpen(false);
        setPendingDeleteDs({ id: ds.id, name: ds.name });
    };

    const confirmDeleteDatasource = () => {
        if (!pendingDeleteDs) return;
        deleteDatasource(pendingDeleteDs.id);
        toast.success(language === "id" ? "Sumber jadwal dihapus" : "Source deleted");
        setPendingDeleteDs(null);
    };

    const handleLoadSample = () => {
        const existingSample = datasources.find(d =>
            d.id.startsWith("sample") || d.name.toLowerCase().includes("sample")
        );
        if (existingSample) {
            handleSwitchDatasource(existingSample.id);
            return;
        }
        const { parseBimaMasterWithDebug } = require("@krs/engine");
        const parsed = parseBimaMasterWithDebug(SAMPLE_BIMA_TEXT);
        const sampleName = language === "id" ? "Sampel Informatika" : "Sample Informatics";
        const { planId } = importDatasourceAndCreatePlan(sampleName, parsed.subjects);
        const sampleSubIds = parsed.subjects.slice(0, 5).map((s: any) => s.subjectId);
        const sampleClasses: Record<string, string> = {};
        const assignedClasses: any[] = [];
        for (const subId of sampleSubIds) {
            const sub = parsed.subjects.find((s: any) => s.subjectId === subId);
            if (!sub?.classes?.length) continue;
            let picked = sub.classes.find((candidate: any) =>
                !assignedClasses.some((assigned: any) => checkClassConflict(candidate, assigned))
            );
            if (!picked) picked = sub.classes[0];
            sampleClasses[subId] = picked.classId;
            assignedClasses.push(picked);
        }
        updatePlan(planId, {
            name: "Plan 1",
            selectedSubjectIds: sampleSubIds,
            selectedClassBySubjectId: sampleClasses
        });
        toast.success(language === "id" ? `Beralih ke "${sampleName}" (${parsed.subjects.length} matkul)` : `Switched to "${sampleName}" (${parsed.subjects.length} courses)`);
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
        if (!_hasHydrated) return;

        if (datasources.length === 0) {
            const newDsId = addDatasource(language === "id" ? "Jadwal Saya" : "My Schedule", []);
            setActiveDatasourceId(newDsId);
            const newPlanId = addPlan({
                name: "Plan 1",
                datasourceId: newDsId,
                selectedSubjectIds: [],
                selectedClassBySubjectId: {},
                rules: [],
                savedVariants: []
            });
            setActivePlanId(newPlanId);
            setActiveTab("catalog");
            return;
        }

        let currentDsId = activeDatasourceId;
        if (!currentDsId || !datasources.some(d => d.id === currentDsId)) {
            currentDsId = datasources[0].id;
            setActiveDatasourceId(currentDsId);
        }

        // Find plans for this datasource
        const dsPlans = plans
            .filter(p => p.datasourceId === currentDsId)
            .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

        if (dsPlans.length === 0) {
            // Auto-create Plan 1 for this datasource
            const newPlanId = addPlan({
                name: "Plan 1",
                datasourceId: currentDsId,
                selectedSubjectIds: [],
                selectedClassBySubjectId: {},
                rules: [],
                savedVariants: []
            });
            setActivePlanId(newPlanId);
            setActiveTab("catalog");
        } else if (!activePlanId || !dsPlans.some(p => p.id === activePlanId)) {
            const firstPlan = dsPlans[0];
            setActivePlanId(firstPlan.id);
            if ((firstPlan.selectedSubjectIds ?? []).length === 0) {
                setActiveTab("catalog");
            }
        }
    }, [_hasHydrated, datasources, activeDatasourceId, plans, activePlanId, setActiveDatasourceId, setActivePlanId, addPlan, addDatasource, language]);

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

    // Auto-switch sidebar view: if plan has 0 courses, auto-open catalog; else show selected
    const prevPlanIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!activePlan) return;
        if (prevPlanIdRef.current !== activePlan.id) {
            prevPlanIdRef.current = activePlan.id;
            if ((activePlan.selectedSubjectIds ?? []).length === 0) {
                setActiveTab("catalog");
            } else {
                setActiveTab("selected");
            }
        }
    }, [activePlan]);

    // Tactile Header Pill Pulses on Source or Plan switch (400ms)
    const [isSourcePulsing, setIsSourcePulsing] = useState(false);
    const [isPlanPulsing, setIsPlanPulsing] = useState(false);
    const prevDatasourcePulseIdRef = useRef<string | null>(null);
    const prevPlanPulseIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!activeDatasource?.id) return;
        if (prevDatasourcePulseIdRef.current && prevDatasourcePulseIdRef.current !== activeDatasource.id) {
            setIsSourcePulsing(true);
            const timer = setTimeout(() => setIsSourcePulsing(false), 400);
            prevDatasourcePulseIdRef.current = activeDatasource.id;
            return () => clearTimeout(timer);
        }
        prevDatasourcePulseIdRef.current = activeDatasource.id;
    }, [activeDatasource?.id]);

    useEffect(() => {
        if (!activePlan?.id) return;
        if (prevPlanPulseIdRef.current && prevPlanPulseIdRef.current !== activePlan.id) {
            setIsPlanPulsing(true);
            const timer = setTimeout(() => setIsPlanPulsing(false), 400);
            prevPlanPulseIdRef.current = activePlan.id;
            return () => clearTimeout(timer);
        }
        prevPlanPulseIdRef.current = activePlan.id;
    }, [activePlan?.id]);

    // Stable key for tactile workspace sheet swap transitions
    const sheetTransitionKey = `${activeDatasource?.id || "ds"}-${activePlan?.id || "plan"}`;

    // Safety auto-assign: ensure selected courses in activePlan always have a valid class section assigned
    useEffect(() => {
        if (!_hasHydrated || !activePlan || !activeDatasource) return;
        const selectedIds = activePlan.selectedSubjectIds ?? [];
        if (selectedIds.length === 0) return;

        const currentMapping = { ...(activePlan.selectedClassBySubjectId || {}) };
        let hasChanges = false;

        const assignedClassesSoFar = selectedIds
            .filter((subId) => {
                const classId = currentMapping[subId];
                if (!classId) return false;
                const sub = activeDatasource.subjects.find((s) => s.subjectId === subId);
                return sub?.classes.some((c) => c.classId === classId);
            })
            .map((subId) => {
                const sub = activeDatasource.subjects.find((s) => s.subjectId === subId)!;
                return sub.classes.find((c) => c.classId === currentMapping[subId])!;
            });

        for (const subId of selectedIds) {
            const currentClassId = currentMapping[subId];
            const sub = activeDatasource.subjects.find((s) => s.subjectId === subId);
            if (!sub || !sub.classes || sub.classes.length === 0) continue;

            const isValid = currentClassId && sub.classes.some((c) => c.classId === currentClassId);
            if (isValid) continue;

            // Pick non-conflicting class if possible, or fallback to first available
            let pickedClass = sub.classes.find((candidate) => {
                return !assignedClassesSoFar.some((assigned) => checkClassConflict(candidate, assigned));
            });

            if (!pickedClass) {
                pickedClass = sub.classes[0];
            }

            if (pickedClass) {
                currentMapping[subId] = pickedClass.classId;
                assignedClassesSoFar.push(pickedClass);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            updatePlan(activePlan.id, {
                selectedClassBySubjectId: currentMapping
            });
        }
    }, [_hasHydrated, activePlan, activeDatasource, updatePlan]);

    // Filter Plan Tabs Strictly by Active Datasource in stable creation order
    const sourcePlans = useMemo(() => {
        if (!activeDatasource) return [];
        return plans
            .filter((p) => p.datasourceId === activeDatasource.id)
            .sort((a, b) => {
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                if (timeA !== timeB) return timeA - timeB;
                return a.name.localeCompare(b.name);
            });
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

    // Handle Tour Step changes & automatically open target menus / views
    const handleTourStepChange = useCallback((step: number) => {
        setTourStep(step);
        if (step === 0) {
            // Step 1: Manage schedule sources
            setIsPlanMenuOpen(false);
            updateSourceMenuCoords();
            setIsSourceMenuOpen(true);
            setGridFocusedSubjectId(null);
        } else if (step === 1) {
            // Step 2: Importing BIMA table data
            setIsSourceMenuOpen(false);
            setIsPlanMenuOpen(false);
            setGridFocusedSubjectId(null);
        } else if (step === 2) {
            // Step 3: Create & switch plans
            setIsSourceMenuOpen(false);
            updatePlanMenuCoords();
            setIsPlanMenuOpen(true);
            setGridFocusedSubjectId(null);
        } else if (step === 3) {
            // Step 4: Pick your semester courses
            setIsSourceMenuOpen(false);
            setIsPlanMenuOpen(false);
            setActiveTab("catalog");
            setGridFocusedSubjectId(null);
        } else if (step === 4) {
            // Step 5: Drag or click to swap classes
            setIsSourceMenuOpen(false);
            setIsPlanMenuOpen(false);
            setActiveTab("selected");
            const firstSubId = selectedClasses[0]?.subjectId || activePlan?.selectedSubjectIds?.[0];
            if (firstSubId) {
                setGridFocusedSubjectId(firstSubId);
            }
        } else if (step === 5) {
            // Step 6: Lock, set rules & auto-schedule
            setIsSourceMenuOpen(false);
            setIsPlanMenuOpen(false);
            setGridFocusedSubjectId(null);
        }
    }, [updateSourceMenuCoords, updatePlanMenuCoords, selectedClasses, activePlan]);

    const handleToggleFreeze = useCallback((subId: string) => {
        if (activePlan) {
            toggleFreezeSubject(activePlan.id, subId);
        }
    }, [activePlan?.id, toggleFreezeSubject]);

    const handleBlockClick = useCallback((_subId: string) => {
        setActiveTab("selected");
    }, []);

    const handleSelectClassOnGrid = useCallback((subId: string, classId: string) => {
        if (previewMapping) {
            setPreviewMapping(prev => ({ ...(prev ?? {}), [subId]: classId }));
        } else if (activePlan) {
            setSelectedClassForSubject(activePlan.id, subId, classId);
        }
        const sub = activeDatasource?.subjects.find(s => s.subjectId === subId);
        const cls = sub?.classes.find(c => c.classId === classId);
        toast.success(`Switched to Kelas ${cls?.className || classId}`, { id: "switch-section" });
    }, [previewMapping, activePlan?.id, setSelectedClassForSubject, activeDatasource?.subjects]);

    const handleOpenCustomCourse = useCallback(() => {
        setIsCustomCourseModalOpen(true);
    }, [setIsCustomCourseModalOpen]);

    const handleOpenImportData = useCallback(() => {
        if (activeDatasource) {
            setDataModalEditSourceId(activeDatasource.id);
        }
        openOverlay("bima-import");
    }, [activeDatasource?.id, openOverlay]);

    const handleBrowseCatalog = useCallback(() => {
        setActiveTab("catalog");
    }, []);


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

    // Clear stuck sidebar hover highlights on Alt+Tab / window blur
    useEffect(() => {
        const clearHover = () => {
            setHoveredSubjectId(null);
            setHoveredClassId(null);
        };
        window.addEventListener("blur", clearHover);
        return () => window.removeEventListener("blur", clearHover);
    }, []);

    // Keyboard shortcuts:
    // When previewing: Enter to accept, Space to shuffle, Escape to cancel
    // When not previewing: Space to generate candidate
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
            if (document.querySelector('[role="dialog"]')) return;

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

    // Handler: Copy Schedule Image to Clipboard
    const handleCopyImage = async () => {
        const node = document.getElementById("krs-grid-capture");
        if (!node) return;
        setIsExportMenuOpen(false);

        if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
            toast.error(language === "id" ? "Browser tidak mendukung salin gambar" : "Clipboard image copy not supported in this browser");
            return;
        }

        toast.loading(language === "id" ? "Menyalin gambar..." : "Copying image...", { id: "export-copy-img" });
        try {
            const htmlToImage = await import("html-to-image");
            const blob = await htmlToImage.toBlob(node, {
                pixelRatio: 2,
                backgroundColor: "#f9f9f8",
                filter: (n: Node) => !(n as HTMLElement).classList?.contains("zoom-controls"),
            });
            if (!blob) throw new Error("Empty image blob");
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            toast.success(language === "id" ? "Gambar jadwal disalin!" : "Schedule image copied!", { id: "export-copy-img" });
            onboarding.triggerAdvancedTip();
        } catch (err) {
            console.error("Copy image failed", err);
            toast.error(language === "id" ? "Gagal menyalin gambar" : "Failed to copy image", { id: "export-copy-img" });
        }
    };

    // Handler: Export Calendar (.ics)
    const handleExportIcs = () => {
        setIsExportMenuOpen(false);
        const items = getScheduledItems(activeDatasource, activePlan, previewMapping);
        if (items.length === 0) {
            toast.info(t.exportEmpty);
            return;
        }
        const ics = buildScheduleIcs({
            planName: activePlan?.name || "Schedule",
            items,
        });
        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `KRSlab-${activePlan?.name || "Schedule"}.ics`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(language === "id" ? "File kalender (.ics) diunduh!" : "Calendar (.ics) downloaded!");
        onboarding.triggerAdvancedTip();
    };

    // Handler: Copy KRS Checklist Text
    const handleCopyChecklist = async () => {
        setIsExportMenuOpen(false);
        const items = getScheduledItems(activeDatasource, activePlan, previewMapping);
        if (items.length === 0) {
            toast.info(t.exportEmpty);
            return;
        }
        const text = buildKrsChecklistText({
            planName: activePlan?.name || "Schedule",
            items,
            lang: language,
        });
        try {
            await navigator.clipboard.writeText(text);
            toast.success(language === "id" ? "Daftar KRS disalin!" : "KRS checklist copied!");
            onboarding.triggerAdvancedTip();
        } catch {
            toast.error(language === "id" ? "Gagal menyalin teks" : "Failed to copy text");
        }
    };

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
            onboarding.triggerAdvancedTip();
        } catch (err) {
            console.error("Export failed", err);
            toast.error("Failed to export image", { id: "export-png" });
        }
    };

    // Handler: Create New Plan
    const handleCreateNewPlan = () => {
        if (!activeDatasource) return;
        const newPlanName = `Plan ${sourcePlans.length + 1}`;
        const newPlanId = addPlan({
            name: newPlanName,
            datasourceId: activeDatasource.id,
            selectedSubjectIds: [],
            selectedClassBySubjectId: {},
            rules: [],
            savedVariants: [],
            frozenSubjectIds: [],
            previewOverrides: {},
        });
        setActivePlanId(newPlanId);
        setActiveTab("catalog");
        toast.success(`Created ${newPlanName}`);
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
        if (sourcePlans.length <= 1) {
            toast.error("Cannot delete the only plan", {
                description: "You must have at least one plan."
            });
            return;
        }

        if (activePlanId === planId) {
            const nextPlan = sourcePlans.find(p => p.id !== planId);
            if (nextPlan) {
                setActivePlanId(nextPlan.id);
                const hasCourses = (nextPlan.selectedSubjectIds ?? []).length > 0;
                setActiveTab(hasCourses ? "selected" : "catalog");
            }
        }
        deletePlan(planId);
        toast.info(`Deleted ${planName}`);
    };

    // ==========================================
    // ONBOARDING / EMPTY STATE (0 Datasources)
    // ==========================================
    if (!_hasHydrated || !mounted) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f9f9f8",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
                className="h-screen w-full flex items-center justify-center bg-[#f9f9f8] dark:bg-[#141418]"
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <div
                        style={{
                            width: "28px",
                            height: "28px",
                            border: "2.5px solid #141413",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite"
                        }}
                        className="w-7 h-7 border-2 border-[#141413] dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin"
                    />
                    <span
                        style={{ fontSize: "12.5px", fontWeight: 500, color: "#6e6e77" }}
                        className="text-xs font-medium text-[#6e6e77] dark:text-[#a1a1aa]"
                    >
                        Loading studio...
                    </span>
                </div>
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
        <div className="flex flex-col h-screen bg-[#f9f9f8] dark:bg-[#0c0c0e] overflow-hidden font-sans selection:bg-amber-100">
            {/* ========================================================= */}
            {/* 1. TOP WORKSPACE HEADER & TOOLBAR                         */}
            {/* ========================================================= */}
            <header className="h-14 border-b border-[#e6e6e3] dark:border-[#26262e] bg-white/90 dark:bg-[#141418] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 shrink-0 relative z-50 sticky top-0">
                {/* 1. Left Group: Brand & Context & Inline Plan Tabs */}
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-full lg:justify-self-start">
                    {/* Custom Brand Logo with Timetable Mark & Doodle lab */}
                    <BrandLogo height={32} />

                    <span className="text-[#d8d8d4] dark:text-[#3e3e3a] text-sm shrink-0 font-light">/</span>

                    {/* Source Switcher Dropdown Trigger */}
                    <div className="relative min-w-0">
                        <button
                            id="tour-datasource-btn"
                            ref={sourceTriggerRef}
                            type="button"
                            onClick={handleToggleSourceMenu}
                            className={cn(
                                "px-2.5 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#20201e] text-[13.5px] font-medium text-[#141413] dark:text-[#f4f4f0] flex items-center gap-1.5 transition-all duration-200 select-none max-w-full",
                                isSourcePulsing && "ring-2 ring-amber-400/80 scale-[1.03] bg-amber-50/70 dark:bg-amber-950/40"
                            )}
                            title="Click to switch, edit, copy, or import schedule sources"
                        >
                            <span className="max-w-[120px] xl:max-w-[180px] truncate">{activeDatasource.name}</span>
                            <ChevronDown className={cn("w-3 h-3 text-[#a1a1aa] shrink-0 transition-transform duration-150", isSourceMenuOpen && "rotate-180")} />
                        </button>
                    </div>

                    <span className="text-[#d8d8d4] dark:text-[#3e3e3a] text-sm shrink-0 font-light">/</span>

                    {/* Plan Switcher Dropdown Trigger */}
                    <div className="relative min-w-0">
                        {isRenamingTopBar ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSaveTopBarRename();
                                }}
                                className="flex items-center gap-1"
                            >
                                <input
                                    ref={topBarInputRef}
                                    type="text"
                                    value={topBarPlanName}
                                    onChange={(e) => setTopBarPlanName(e.target.value)}
                                    onBlur={handleSaveTopBarRename}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                            setIsRenamingTopBar(false);
                                        }
                                    }}
                                    className="px-2 py-0.5 text-[13.5px] font-semibold text-[#141413] dark:text-[#f4f4f0] bg-white dark:bg-[#20201e] border border-[#141413] dark:border-[#f4f4f0] rounded-md outline-none max-w-[150px] shadow-xs"
                                    autoFocus
                                />
                            </form>
                        ) : (
                            <button
                                id="tour-plan-btn"
                                ref={planTriggerRef}
                                type="button"
                                onClick={handleTogglePlanMenu}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setIsPlanMenuOpen(false);
                                    setTopBarPlanName(activePlan.name);
                                    setIsRenamingTopBar(true);
                                }}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#20201e] text-[13.5px] text-[#141413] dark:text-[#f4f4f0] flex items-center gap-1.5 transition-all duration-200 select-none group",
                                    isPlanPulsing && "ring-2 ring-amber-400/80 scale-[1.03] bg-amber-50/70 dark:bg-amber-950/40"
                                )}
                                title="Click to switch plans, duplicate, or manage (double click to rename)"
                            >
                                <span className="nexvyn-dash font-semibold max-w-[110px] xl:max-w-[160px] truncate">
                                    {activePlan.name}
                                </span>
                                <ChevronDown className={cn("w-3 h-3 text-[#a1a1aa] shrink-0 transition-transform duration-150", isPlanMenuOpen && "rotate-180")} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Center Group: [Rules 0] | [Auto-Schedule] ↖ psst */}
                <div id="tour-solver-bar" className="flex items-center gap-2.5 shrink-0 lg:justify-self-center">
                    {/* Rules Button */}
                    <button
                        id="tour-rules-btn"
                        onClick={() => {
                            openOverlay("rules");
                            onboarding.triggerAdvancedTip();
                        }}
                        className="btn-tactile-light px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] dark:text-[#f4f4f0] flex items-center gap-1.5 transition-all"
                        title="Configure Solver Rules"
                    >
                        <span>{t.rules}</span>
                        <span className="bg-neutral-200/70 dark:bg-[#2e2e2b] text-[#6e6e77] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                            {activePlan.rules?.filter(r => r.enabled).length || 0}
                        </span>
                    </button>

                    {/* Auto-Schedule / Shuffle Button (Static width & position, never expands) */}
                    <div className="flex items-center gap-2">
                        <button
                            id="tour-auto-schedule-btn"
                            onClick={handleGenerateOrShuffle}
                            disabled={isGenerating}
                            className={cn(
                                "px-3.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-all select-none shadow-sm",
                                previewMapping !== null
                                    ? "btn-tactile-light text-[#141413] dark:text-[#f4f4f0] border-[#d8d8d4] dark:border-[#2e2e2b]"
                                    : "btn-tactile-dark text-white",
                                isGenerating && "opacity-75 cursor-not-allowed"
                            )}
                            title={previewMapping !== null ? `${t.shuffle} (Space)` : `${t.autoSchedule} (Space)`}
                        >
                            {previewMapping !== null ? (
                                <RotateCw className={cn("w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7da2c4]", isGenerating && "animate-spin")} />
                            ) : (
                                <svg className={cn("w-3.5 h-3.5 fill-current opacity-90", isGenerating && "animate-spin")} viewBox="0 0 24 24">
                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                                </svg>
                            )}
                            <span>
                                {isGenerating
                                    ? t.solving
                                    : previewMapping !== null
                                        ? t.shuffle
                                        : t.autoSchedule}
                            </span>
                        </button>

                        {/* Margin Note: Doodle arrow & text pointing directly at Auto-Schedule */}
                        {previewMapping === null && (
                            <div className="hidden 2xl:flex items-center gap-1.5 select-none text-[#5b82a6] dark:text-[#7da2c4] font-doodle font-bold text-[16.5px] -rotate-2 ml-1">
                                <svg className="w-6 h-4 text-[#5b82a6] dark:text-[#7da2c4] stroke-current fill-none stroke-[2] -scale-x-100" viewBox="0 0 32 20">
                                    <path d="M4 16 C 14 16, 22 12, 28 4" strokeLinecap="round" />
                                    <path d="M22 4 L28 4 L28 10" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{t.spaceToShuffle}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Right Group: Compact Tutorial Pill, SKS Status, Export & Preferences */}
                <div className="flex items-center gap-2.5 shrink-0 lg:justify-self-end">
                    {/* Tutorial / Help Menu Button */}
                    <button
                        ref={guideBtnRef}
                        id="tour-guide-link"
                        type="button"
                        onClick={handleToggleGuideMenu}
                        aria-haspopup="menu"
                        aria-expanded={isGuideMenuOpen}
                        className={cn(
                            "relative font-doodle text-[17.5px] font-bold text-[#5b82a6] dark:text-[#7da2c4] hover:text-[#141413] dark:hover:text-[#f4f4f0] px-2.5 py-1 rounded-lg hover:bg-neutral-100/80 dark:hover:bg-[#20201e] transition-colors flex items-center gap-1 shrink-0 select-none",
                            isGuideMenuOpen && "bg-neutral-100/90 dark:bg-[#20201e]"
                        )}
                        title={t.helpSection}
                    >
                        <span>↻ {t.tutorial}</span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                        {hasUnseenChangelog && (
                            <span
                                aria-hidden="true"
                                className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                            />
                        )}
                    </button>

                    <span className="text-[#d8d8d4] dark:text-[#3e3e3a] text-xs select-none">·</span>

                    {/* Status Dot + SKS Count with lowercase sks */}
                    <div
                        onClick={() => {
                            if (maxSks !== 99 && totalSks > maxSks) {
                                setAllowOverload(!allowOverload);
                                toast.info(allowOverload ? `${maxSks} SKS limit active` : `Overload allowed (>${maxSks} SKS)`);
                            }
                        }}
                        className={cn(
                            "flex items-center gap-1.5 text-[12.5px] font-mono select-none cursor-pointer",
                            conflictCount > 0 || (maxSks !== 99 && totalSks > maxSks && !allowOverload)
                                ? "text-rose-500 font-semibold"
                                : "text-[#6e6e77] dark:text-[#a1a1aa]"
                        )}
                        title={conflictCount > 0 ? `${conflictCount} conflicting courses` : "Total selected SKS"}
                    >
                        {(conflictCount > 0 || (maxSks !== 99 && totalSks > maxSks && !allowOverload)) && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-rose-500 animate-pulse" />
                        )}
                        <div className="flex items-baseline gap-1">
                            <span className="font-mono text-[12.5px] tabular-nums text-[#141413] dark:text-[#f4f4f0]">
                                {totalSks} / {maxSks === 99 ? "∞" : maxSks}
                            </span>
                            <span className="font-doodle text-[17px] font-bold text-[#6e6e77] dark:text-[#a1a1aa]">sks</span>
                        </div>
                        {maxSks !== 99 && totalSks > maxSks && (
                            <span className="text-[10px] text-amber-500 font-sans">
                                {allowOverload ? `(${t.overload})` : `(${t.exceeded})`}
                            </span>
                        )}
                    </div>

                    {/* Export Menu Button */}
                    <button
                        ref={exportBtnRef}
                        type="button"
                        onClick={handleToggleExportMenu}
                        aria-haspopup="menu"
                        aria-expanded={isExportMenuOpen}
                        className={cn(
                            "btn-tactile-light px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] dark:text-[#f4f4f0] flex items-center gap-1.5 transition-all",
                            isExportMenuOpen && "bg-neutral-200/80 dark:bg-[#2e2e2b]"
                        )}
                        title={t.export}
                    >
                        <Download className="w-3.5 h-3.5 text-[#6e6e77] dark:text-[#a1a1aa]" />
                        <span className="hidden sm:inline">{t.export}</span>
                        <ChevronDown className={cn("w-3 h-3 text-[#8a8a94] transition-transform", isExportMenuOpen && "rotate-180")} />
                    </button>

                    {/* Preferences Button */}
                    <button
                        ref={prefsBtnRef}
                        type="button"
                        onClick={handleTogglePrefs}
                        className={cn(
                            "btn-tactile-light p-2 rounded-lg text-[#141413] dark:text-[#f4f4f0] flex items-center justify-center transition-all",
                            isPrefsOpen && "bg-neutral-200/80 dark:bg-[#2e2e2b]"
                        )}
                        title={t.preferences}
                        aria-label={t.preferences}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#6e6e77] dark:text-[#a1a1aa]" />
                    </button>
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
                            aria-label="Dismiss diagnostic notice"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 4. MAIN WORKSPACE STAGE: (Left Panel + Center Grid)       */}
            {/* ========================================================= */}
            <div className="flex-1 flex overflow-hidden relative z-10 bg-[#f9f9f8] dark:bg-[#0c0c0e] bg-dot-matrix">
                {/* Left Panel: Desktop 320px Clean Split (Untouched on lg screens) */}
                <div
                    id="tour-course-panel"
                    className="hidden lg:flex w-[320px] shrink-0 h-full flex-col relative z-10 border-r border-[#e6e6e3] dark:border-[#26262e] bg-white/95 dark:bg-[#141418] overflow-hidden"
                >
                    {isDragRemoveHover && (
                        <div className="absolute inset-2 z-30 rounded-xl border-2 border-dashed border-rose-400 dark:border-rose-500/80 bg-rose-50/95 dark:bg-rose-950/95 flex flex-col items-center justify-center gap-2.5 pointer-events-none animate-in fade-in duration-150">
                            <div
                                className="relative text-rose-600 dark:text-rose-400 flex items-center justify-center"
                                style={
                                    isTrashCatching
                                        ? { animation: "krs-trash-gulp 280ms cubic-bezier(0.22, 1, 0.36, 1) 110ms both" }
                                        : undefined
                                }
                            >
                                <svg
                                    width="46"
                                    height="46"
                                    viewBox="0 0 36 36"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="overflow-visible"
                                >
                                    {/* Rim sparks on catch */}
                                    {isTrashCatching && (
                                        <g style={{ transformOrigin: "18px 11px", animation: "krs-trash-spark 260ms ease-out 110ms both" }}>
                                            <line x1="6" y1="6" x2="3" y2="3" />
                                            <line x1="18" y1="3" x2="18" y2="0" />
                                            <line x1="30" y1="6" x2="33" y2="3" />
                                        </g>
                                    )}
                                    {/* Hinged Lid (springs open on hover, snaps shut on catch) */}
                                    <g
                                        style={{
                                            transformOrigin: "8px 11px",
                                            ...(isTrashCatching
                                                ? {
                                                      transform: "rotate(0deg) translateY(0px)",
                                                      transition: "transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1) 110ms",
                                                  }
                                                : {
                                                      animation: "krs-trash-lid-open 240ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
                                                  }),
                                        }}
                                    >
                                        <path d="M14 11V8.5C14 7.7 14.7 7 15.5 7h5c.8 0 1.5.7 1.5 1.5V11" />
                                        <line x1="7" y1="11" x2="29" y2="11" />
                                    </g>
                                    {/* Can Body */}
                                    <path d="M9.5 13l1.4 15.2c.1 1 .9 1.8 2 1.8h10.2c1.1 0 1.9-.8 2-1.8L26.5 13" />
                                    <line x1="15" y1="17.5" x2="15.3" y2="25" />
                                    <line x1="21" y1="17.5" x2="20.7" y2="25" />
                                </svg>
                            </div>
                            <span className="font-doodle text-[19px] font-bold text-rose-700 dark:text-rose-300 leading-none">
                                {isTrashCatching
                                    ? (language === "id" ? "byeee ~" : "poof!")
                                    : (language === "id" ? "buang ke sini aja" : "drop it right in")}
                            </span>
                        </div>
                    )}
                    <div key={sheetTransitionKey} className="w-full h-full flex flex-col animate-sheet-swap">
                        <CoursePanel
                            plan={activePlan}
                            datasource={activeDatasource}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            conflicts={conflicts}
                            effectiveMapping={effectiveMapping}
                            onHoverSubject={setHoveredSubjectId}
                            onHoverClass={setHoveredClassId}
                            onOpenImportModal={handleOpenImportData}
                            onOpenStartVideo={() => onboarding.openVideo("start")}
                        />
                    </div>
                </div>

                {/* Center / Right Panel: Live Interactive ScheduleGrid (100% width on mobile/tablet) */}
                <div
                    id="krs-grid-capture"
                    className="flex-1 h-full overflow-hidden bg-[#f9f9f8] dark:bg-[#0c0c0e] bg-dot-matrix relative flex flex-col"
                >
                    <div key={sheetTransitionKey} className="w-full h-full flex flex-col animate-sheet-swap">
                        <ScheduleGrid
                            selectedClasses={selectedClasses}
                            conflicts={conflicts}
                            frozenSubjectIds={activePlan?.frozenSubjectIds}
                            onToggleFreeze={handleToggleFreeze}
                            onBlockClick={handleBlockClick}
                            onSelectClass={handleSelectClassOnGrid}
                            allSubjects={activeDatasource?.subjects}
                            hoveredSubjectId={hoveredSubjectId}
                            hoveredClassId={hoveredClassId}
                            focusedSubjectId={gridFocusedSubjectId}
                            onFocusSubject={setGridFocusedSubjectId}
                            activeDatasourceName={activeDatasource?.name}
                            activePlanName={activePlan?.name}
                            onOpenCustomCourse={handleOpenCustomCourse}
                            onOpenImportData={handleOpenImportData}
                            onBrowseCatalog={handleBrowseCatalog}
                            onRemoveSubject={(subjectId) => activePlan && removeSubjectFromPlan(activePlan.id, subjectId)}
                            onDragRemoveHoverChange={(hovering) => {
                                setIsDragRemoveHover(hovering);
                                if (!hovering) setIsTrashCatching(false);
                            }}
                            onDragRemoveDrop={() => setIsTrashCatching(true)}
                        />
                    </div>
                </div>

                {/* Floating Preview Confirmation Bar */}
                {previewMapping !== null && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-[#1c1c1f]/95 backdrop-blur-md border border-[#d8d8d4] dark:border-[#2e2e34] shadow-[0_12px_32px_rgba(0,0,0,0.12)] rounded-2xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
                        <span className="font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] pr-1 select-none">
                            {t.previewingSchedule}
                        </span>

                        {/* [ ✓ Accept ↵ ] */}
                        <button
                            onClick={handleAcceptPreview}
                            className="btn-tactile-dark px-3.5 py-1.5 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-700 shadow-sm flex items-center gap-1.5 transition-all select-none cursor-pointer"
                            title="Accept schedule candidate (Enter)"
                        >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{t.accept}</span>
                            <span className="text-[10px] font-mono opacity-80 bg-emerald-700/60 px-1 py-0.2 rounded ml-0.5">↵</span>
                        </button>

                        {/* [ ↻ Shuffle Space ] */}
                        <button
                            onClick={handleGenerateOrShuffle}
                            disabled={isGenerating}
                            className="btn-tactile-light px-3.5 py-1.5 rounded-xl text-[13px] font-medium text-[#141413] dark:text-[#f4f4f6] dark:bg-[#27272a] dark:border-[#383840] flex items-center gap-1.5 transition-all select-none shadow-2xs cursor-pointer"
                            title="Shuffle candidate (Space)"
                        >
                            <RotateCw className={cn("w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc]", isGenerating && "animate-spin")} />
                            <span>{t.shuffle}</span>
                            <span className="text-[10px] font-mono text-[#6e6e77] dark:text-[#a1a1aa] bg-neutral-200/60 dark:bg-[#383840] px-1.5 py-0.2 rounded ml-0.5">Space</span>
                        </button>

                        {/* [ ✕ Cancel Esc ] */}
                        <button
                            onClick={handleCancelPreview}
                            className="px-3 py-1.5 rounded-xl text-[13px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center gap-1 select-none cursor-pointer"
                            title="Discard preview (Esc)"
                            aria-label="Discard preview (Esc)"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>{t.cancel}</span>
                            <span className="text-[10px] font-mono text-[#a1a1aa] ml-0.5">Esc</span>
                        </button>
                    </div>
                )}

                {/* Mobile/Tablet (< lg) Floating Pill Button to toggle Courses Drawer */}
                <div className="lg:hidden fixed bottom-5 left-5 z-40">
                    <button
                        onClick={() => setIsMobileCoursesOpen(true)}
                        className="tactile-btn px-4 py-2.5 rounded-full bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] text-[13px] font-medium shadow-xl flex items-center gap-2 hover:bg-[#282826] active:scale-95 transition-all border border-neutral-700 dark:border-neutral-300 select-none"
                        title="Open Course Catalog & Selected Sections"
                        aria-label="Open Course Catalog and Selected Sections"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Courses ({activePlan.selectedSubjectIds.length})</span>
                        <span className="text-[#a1a1aa]">·</span>
                        <span className="text-amber-300 dark:text-amber-600 font-semibold">+ Add</span>
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
                        <div className="relative w-full max-w-[340px] sm:max-w-[380px] h-full bg-white dark:bg-[#161618] border-r border-[#e6e6e3] dark:border-[#27272a] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
                            {/* Drawer Top Header with Close Button */}
                            <div className="h-12 px-4 border-b border-[#e6e6e3] dark:border-[#27272a] flex items-center justify-between bg-neutral-50/80 dark:bg-[#1c1c1f] shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[13.5px] text-[#141413] dark:text-[#f4f4f6]">Courses</span>
                                    <span className="text-[11px] font-mono text-[#6e6e77] dark:text-[#a1a1aa] bg-neutral-200/60 dark:bg-white/[0.08] px-1.5 py-0.2 rounded">
                                        {activePlan.selectedSubjectIds.length} selected
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMobileCoursesOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                                    title="Close Drawer"
                                    aria-label="Close Drawer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div key={sheetTransitionKey} className="flex-1 overflow-hidden animate-sheet-swap">
                                <CoursePanel
                                    plan={activePlan}
                                    datasource={activeDatasource}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    conflicts={conflicts}
                                    effectiveMapping={effectiveMapping}
                                    onHoverSubject={setHoveredSubjectId}
                                    onHoverClass={setHoveredClassId}
                                    onOpenImportModal={() => {
                                        setDataModalEditSourceId(activeDatasource.id);
                                        openOverlay("bima-import");
                                    }}
                                    onOpenStartVideo={() => {
                                        setIsMobileCoursesOpen(false);
                                        onboarding.openVideo("start");
                                    }}
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
                isOpen={activeOverlay === "bima-import" || (activeOverlay === "tour" && tourStep === 1)}
                onClose={() => {
                    if (activeOverlay !== "tour") {
                        closeOverlay();
                        if (shouldLaunchTourAfterImportRef.current) {
                            shouldLaunchTourAfterImportRef.current = false;
                            setTimeout(() => {
                                triggerTour();
                            }, 100);
                        }
                    }
                }}
                editSourceId={dataModalEditSourceId}
            />

            {/* Manual Custom Course Modal */}
            <CustomCourseModal
                isOpen={isCustomCourseModalOpen}
                onClose={() => setIsCustomCourseModalOpen(false)}
            />

            {/* Interactive 6-Step Spotlight Tour */}
            <InteractiveTour
                isOpen={activeOverlay === "tour"}
                tourStep={tourStep}
                onStepChange={handleTourStepChange}
                onClose={handleCloseTour}
                onFocusFirstCourse={() => {
                    const firstSubId = selectedClasses[0]?.subjectId || activePlan?.selectedSubjectIds?.[0];
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
                        className={cn(
                            "fixed inset-0 z-[9998] bg-transparent",
                            activeOverlay === "tour" && "pointer-events-none"
                        )}
                        onClick={() => {
                            if (activeOverlay !== "tour") setIsSourceMenuOpen(false);
                        }}
                    />

                    {/* Popover Card */}
                    <div
                        id="tour-source-menu-card"
                        style={{
                            position: "fixed",
                            top: `${sourceMenuCoords.top}px`,
                            left: `${sourceMenuCoords.left}px`,
                        }}
                        className="w-[300px] sm:w-[340px] bg-white dark:bg-[#1c1c1f] border border-[#e2e2de] dark:border-[#2e2e34] rounded-xl shadow-2xl p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-100 flex flex-col text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2.5 py-1 font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] select-none">
                            {t.scheduleSources}
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
                                            isActive ? "bg-neutral-100/80 dark:bg-white/[0.08] font-medium" : "hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13px] text-[#141413] dark:text-[#f4f4f6] truncate font-medium">
                                                        {ds.name}
                                                    </span>
                                                    {isActive && (
                                                        <Check className="w-3.5 h-3.5 text-[#141413] dark:text-[#f4f4f6] shrink-0" />
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] truncate">
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
                                                className="p-1 rounded hover:bg-neutral-200/70 dark:hover:bg-white/[0.08] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                                                title="Edit source or rename"
                                                aria-label={`Edit or rename source ${ds.name}`}
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
                                                className="p-1 rounded hover:bg-neutral-200/70 dark:hover:bg-white/[0.08] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                                                title="Duplicate source"
                                                aria-label={`Duplicate source ${ds.name}`}
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
                                                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                                title="Delete source"
                                                aria-label={`Delete source ${ds.name}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Popover Footer Actions */}
                        <div className="border-t border-[#e6e6e3] dark:border-[#2e2e34] mt-1 pt-1.5 space-y-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSourceMenuOpen(false);
                                    setDataModalEditSourceId(null);
                                    openOverlay("bima-import");
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors select-none"
                            >
                                <Plus className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc]" />
                                <span>{t.importNewBima}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsSourceMenuOpen(false);
                                    if (activeDatasource && activeDatasource.subjects.length === 0) {
                                        setActiveTab("catalog");
                                        setIsCustomCourseModalOpen(true);
                                        toast.info(language === "id" ? "Sudah berada di lembar jadwal kosong." : "Already on an empty schedule sheet.");
                                        return;
                                    }
                                    const { datasourceId } = createEmptyDatasource();
                                    setActiveDatasourceId(datasourceId);
                                    setActiveTab("catalog");
                                    setIsCustomCourseModalOpen(true);
                                    toast.success(language === "id" ? "Sumber jadwal kosong berhasil dibuat!" : "Created empty schedule source!");
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors select-none"
                            >
                                <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{language === "id" ? "Mulai sumber kosong (input manual)" : "Start empty source (manual input)"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsSourceMenuOpen(false);
                                    handleLoadSample();
                                }}
                                className="w-full text-left px-2.5 py-1 rounded-lg text-[11.5px] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-50 dark:hover:bg-white/[0.04] flex items-center gap-2 transition-colors select-none"
                            >
                                <span>{t.loadSample}</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Portaled Plan Manager Dropdown (z-[9999] in document.body) */}
            {mounted && isPlanMenuOpen && planMenuCoords && createPortal(
                <div className="fixed inset-0 z-[9998] pointer-events-auto">
                    {/* Full-screen invisible click-away backdrop */}
                    <div
                        className={cn(
                            "fixed inset-0 z-[9998] bg-transparent",
                            activeOverlay === "tour" && "pointer-events-none"
                        )}
                        onClick={() => {
                            if (activeOverlay !== "tour") {
                                setIsPlanMenuOpen(false);
                                setConfirmDeletePlanId(null);
                                setEditingPlanIdInMenu(null);
                            }
                        }}
                    />

                    {/* Popover Card */}
                    <div
                        id="tour-plan-menu-card"
                        style={{
                            position: "fixed",
                            top: `${planMenuCoords.top}px`,
                            left: `${planMenuCoords.left}px`,
                        }}
                        className="w-[300px] sm:w-[340px] bg-white dark:bg-[#1c1c1f] border border-[#e2e2de] dark:border-[#2e2e34] rounded-xl shadow-2xl p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-100 flex flex-col text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2.5 py-1 font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] select-none flex items-center justify-between">
                            <span>{t.schedulePlans}</span>
                            <span className="text-[11px] font-sans font-normal text-[#a1a1aa]">
                                {sourcePlans.length} {sourcePlans.length === 1 ? "plan" : "plans"}
                            </span>
                        </div>

                        <div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-0.5 my-1">
                            {sourcePlans.map((p) => {
                                const isActive = p.id === activePlan.id;
                                const isConfirmingDelete = confirmDeletePlanId === p.id;
                                const isEditing = editingPlanIdInMenu === p.id;

                                if (isConfirmingDelete) {
                                    return (
                                        <div
                                            key={p.id}
                                            className="bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg px-2.5 py-2 flex items-center justify-between gap-2 animate-in fade-in duration-150 select-none"
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                <span className="text-[12px] font-medium text-rose-900 dark:text-rose-200 truncate">
                                                    Delete &quot;{p.name}&quot;?
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeletePlanId(null)}
                                                    className="text-[11.5px] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] px-2 py-0.5 rounded transition-colors"
                                                >
                                                    {t.cancel}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleDeletePlan(p.id, p.name);
                                                        setConfirmDeletePlanId(null);
                                                    }}
                                                    className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[11.5px] font-medium px-2.5 py-0.5 rounded-md transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isEditing) {
                                    return (
                                        <div
                                            key={p.id}
                                            className="p-1.5 rounded-lg bg-neutral-100/90 dark:bg-[#202024] border border-[#d8d8d4] dark:border-[#2e2e34] flex items-center gap-1.5"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="text"
                                                value={menuPlanNameInput}
                                                onChange={(e) => setMenuPlanNameInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleSaveMenuRename(p.id);
                                                    } else if (e.key === "Escape") {
                                                        setEditingPlanIdInMenu(null);
                                                    }
                                                }}
                                                className="flex-1 min-w-0 px-2 py-1 text-[13px] font-medium bg-white dark:bg-[#141416] border border-[#d8d8d4] dark:border-[#2e2e34] text-[#141413] dark:text-[#f4f4f6] rounded-md outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6]"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveMenuRename(p.id)}
                                                className="px-2 py-1 text-[11.5px] font-medium bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] rounded-md hover:bg-neutral-800 transition-colors"
                                            >
                                                {t.save}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingPlanIdInMenu(null)}
                                                className="px-1.5 py-1 text-[11.5px] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                                            >
                                                {t.cancel}
                                            </button>
                                        </div>
                                    );
                                }

                                const courseCount = p.selectedSubjectIds?.length || 0;
                                const sksCount = activeDatasource.subjects
                                    .filter(s => (p.selectedSubjectIds || []).includes(s.subjectId))
                                    .reduce((sum, s) => sum + s.sks, 0);

                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            setActivePlanId(p.id);
                                            const hasCourses = (p.selectedSubjectIds ?? []).length > 0;
                                            setActiveTab(hasCourses ? "selected" : "catalog");
                                            setIsPlanMenuOpen(false);
                                        }}
                                        className={cn(
                                            "p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors group select-none",
                                            isActive ? "bg-neutral-100/80 dark:bg-white/[0.08] font-medium" : "hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn("text-[13px] text-[#141413] dark:text-[#f4f4f6] truncate", isActive && "font-semibold")}>
                                                        {p.name}
                                                    </span>
                                                    {isActive && (
                                                        <Check className="w-3.5 h-3.5 text-[#141413] dark:text-[#f4f4f6] shrink-0" />
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] truncate">
                                                    {courseCount} courses · {sksCount} SKS
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inline management actions on each row */}
                                        <div
                                            className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Rename */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingPlanIdInMenu(p.id);
                                                    setMenuPlanNameInput(p.name);
                                                    setConfirmDeletePlanId(null);
                                                }}
                                                className="p-1 rounded hover:bg-neutral-200/70 dark:hover:bg-white/[0.08] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                                                title="Rename plan"
                                                aria-label={`Rename plan ${p.name}`}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Duplicate */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDuplicatePlan(p.id);
                                                }}
                                                className="p-1 rounded hover:bg-neutral-200/70 dark:hover:bg-white/[0.08] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                                                title="Duplicate plan"
                                                aria-label={`Duplicate plan ${p.name}`}
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Delete (only when sourcePlans.length > 1) */}
                                            {sourcePlans.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeletePlanId(p.id);
                                                        setEditingPlanIdInMenu(null);
                                                    }}
                                                    className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                                    title="Delete plan"
                                                    aria-label={`Delete plan ${p.name}`}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Popover Footer Actions */}
                        <div className="border-t border-[#e6e6e3] dark:border-[#2e2e34] mt-1 pt-1.5 space-y-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    handleDuplicatePlan(activePlan.id);
                                    setIsPlanMenuOpen(false);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors select-none"
                            >
                                <Copy className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc]" />
                                <span>{t.duplicateCurrentPlan}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleCreateNewPlan();
                                    setIsPlanMenuOpen(false);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors select-none"
                            >
                                <Plus className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc]" />
                                <span>+ {t.createNewPlan}</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Portaled User Preferences Popover */}
            {mounted && isPrefsOpen && prefsCoords && createPortal(
                <div className="fixed inset-0 z-[9998] pointer-events-auto">
                    {/* Full-screen invisible click-away backdrop */}
                    <div
                        className="fixed inset-0 z-[9998] bg-transparent"
                        onClick={() => setIsPrefsOpen(false)}
                    />

                    {/* Popover Card */}
                    <div
                        style={{
                            position: "fixed",
                            top: `${prefsCoords.top}px`,
                            left: `${prefsCoords.left}px`,
                        }}
                        className="w-[280px] bg-white dark:bg-[#1c1c1f] border border-[#e2e2de] dark:border-[#2e2e34] rounded-xl shadow-2xl p-3 z-[9999] animate-in fade-in zoom-in-95 duration-100 flex flex-col text-left space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Account / Cloud Sync */}
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-50 dark:bg-[#141416] border border-neutral-200/60 dark:border-[#2e2e34]">
                            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-[#27272a] flex items-center justify-center shrink-0 mt-0.5 text-[#6e6e77] dark:text-[#a1a1aa]">
                                <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-semibold text-[#141413] dark:text-[#f4f4f6] truncate">
                                    {t.localWorkspace}
                                </div>
                                <div className="text-[10.5px] text-[#6e6e77] dark:text-[#a1a1aa] truncate mb-1">
                                    {t.savedOnDevice}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        toast.info("Cloud sync coming soon!", {
                                            description: "All your data is safely saved in your browser's local storage."
                                        });
                                    }}
                                    className="text-[11px] font-medium text-[#5b82a6] dark:text-[#7dd3fc] hover:underline flex items-center gap-1 select-none"
                                >
                                    <span>{t.signInToSync}</span>
                                    <span className="text-[9.5px] opacity-75">({t.comingSoonBadge})</span>
                                </button>
                            </div>
                        </div>

                        {/* Language Setting */}
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

                        {/* Appearance Setting */}
                        <div className="space-y-1.5">
                            <div className="text-[10.5px] font-semibold text-[#6e6e77] dark:text-[#a1a1aa] uppercase tracking-wider">
                                {t.appearanceLabel}
                            </div>
                            <div className="grid grid-cols-2 gap-1 p-0.5 bg-neutral-100 dark:bg-[#141416] rounded-lg">
                                <button
                                    type="button"
                                    onClick={(e) => handleThemeSwitch("light", e)}
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
                                    onClick={(e) => handleThemeSwitch("dark", e)}
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

                        {/* SKS Limit Setting */}
                        <div className="space-y-1.5">
                            <div className="text-[10.5px] font-semibold text-[#6e6e77] dark:text-[#a1a1aa] uppercase tracking-wider">
                                {t.sksCapLabel}
                            </div>
                            <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-100 dark:bg-[#141416] rounded-lg">
                                {[20, 22, 24, 99].map((cap) => (
                                    <button
                                        key={cap}
                                        type="button"
                                        onClick={() => setMaxSks(cap)}
                                        className={cn(
                                            "py-1 text-[12px] font-medium rounded-md transition-all text-center",
                                            maxSks === cap
                                                ? "bg-white dark:bg-[#27272a] text-[#141413] dark:text-[#f4f4f6] shadow-xs font-semibold"
                                                : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                        )}
                                    >
                                        {cap === 99 ? "∞" : cap}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Help Group */}
                        <div className="border-t border-[#e6e6e3] dark:border-[#2e2e34] pt-2.5 space-y-1.5">
                            <div className="text-[10.5px] font-semibold text-[#6e6e77] dark:text-[#a1a1aa] uppercase tracking-wider px-2">
                                {t.helpSection}
                            </div>
                            <div className="space-y-0.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPrefsOpen(false);
                                        openOverlay("tour");
                                    }}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-between gap-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <Compass className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                        <span>{t.startTutorial}</span>
                                    </span>
                                    <span className="font-mono text-[10px] text-[#8a8a94] dark:text-[#71717a]">
                                        6 steps
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPrefsOpen(false);
                                        onboarding.openVideo("start");
                                    }}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-between gap-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <Video className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                        <span>{t.videoGetStarted}</span>
                                    </span>
                                    <span className="font-mono text-[10px] text-[#8a8a94] dark:text-[#71717a]">
                                        1:09
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPrefsOpen(false);
                                        onboarding.openVideo("advanced");
                                    }}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-between gap-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <Video className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                        <span>{t.videoAdvanced}</span>
                                    </span>
                                    <span className="font-mono text-[10px] text-[#8a8a94] dark:text-[#71717a]">
                                        1:32
                                    </span>
                                </button>
                            </div>
                            <div className="border-t border-[#e6e6e3] dark:border-[#2e2e34] pt-1 space-y-0.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPrefsOpen(false);
                                        onboarding.openWhatsNew();
                                    }}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-between gap-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <History className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                        <span>{t.whatsNew}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        {hasUnseenChangelog && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                        )}
                                        <span className="text-[11px] text-[#8a8a94] dark:text-[#71717a]" aria-hidden="true">
                                            →
                                        </span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPrefsOpen(false);
                                        setIsWelcomeManuallyOpen(true);
                                    }}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[11.5px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center gap-2"
                                >
                                    <RotateCw className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                    <span>{t.openWelcome}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Header Export Menu Popover */}
            {mounted && isExportMenuOpen && exportMenuCoords && createPortal(
                <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setIsExportMenuOpen(false)}
                >
                    <div
                        role="menu"
                        style={{
                            top: `${exportMenuCoords.top}px`,
                            right: `${exportMenuCoords.right}px`,
                        }}
                        className="fixed w-[240px] bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 z-[110]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2.5 pt-1 pb-1.5 font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] select-none">
                            {language === "id" ? "ekspor jadwal" : "export schedule"}
                        </div>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsExportMenuOpen(false);
                                handleExportImage();
                            }}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                        >
                            <Download className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                            <span>{t.exportPng}</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleCopyImage}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                        >
                            <Copy className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                            <span>{t.exportCopyImage}</span>
                        </button>
                        <div className="border-t border-[#e6e6e3] dark:border-[#2e2e34] my-1.5" />
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleExportIcs}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                        >
                            <Calendar className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                            <span>{t.exportCalendar}</span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleCopyChecklist}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                        >
                            <FileText className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                            <span>{t.exportChecklist}</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Header Guide / Help Menu Popover */}
            {mounted && isGuideMenuOpen && guideMenuCoords && createPortal(
                <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setIsGuideMenuOpen(false)}
                >
                    <div
                        role="menu"
                        aria-label={t.helpSection}
                        style={{ top: guideMenuCoords.top, left: guideMenuCoords.left }}
                        className="fixed w-[264px] bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 z-[110]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2.5 pt-1 pb-1.5 font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] select-none">
                            {language === "id" ? "panduan & catatan" : "guides & notes"}
                        </div>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsGuideMenuOpen(false);
                                openOverlay("tour");
                            }}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between gap-2"
                        >
                            <span className="flex items-center gap-2.5">
                                <Compass className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                <span>{t.introInteractiveTour}</span>
                            </span>
                            <span className="font-mono text-[10.5px] text-[#8a8a94] dark:text-[#71717a]">
                                6 steps
                            </span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsGuideMenuOpen(false);
                                onboarding.openVideo("start");
                            }}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between gap-2"
                        >
                            <span className="flex items-center gap-2.5">
                                <Video className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                <span>{t.videoGetStarted}</span>
                            </span>
                            <span className="font-mono text-[10.5px] text-[#8a8a94] dark:text-[#71717a]">
                                1:09
                            </span>
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsGuideMenuOpen(false);
                                onboarding.openVideo("advanced");
                            }}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between gap-2"
                        >
                            <span className="flex items-center gap-2.5">
                                <Video className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                <span>{t.videoAdvanced}</span>
                            </span>
                            <span className="font-mono text-[10.5px] text-[#8a8a94] dark:text-[#71717a]">
                                1:32
                            </span>
                        </button>
                        <div className="border-t border-[#e6e6e3] dark:border-[#2e2e34] my-1.5" />
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsGuideMenuOpen(false);
                                onboarding.openWhatsNew();
                            }}
                            className="w-full min-h-[44px] sm:min-h-0 text-left px-2.5 py-2 rounded-xl text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] hover:bg-[#f3f3f0] dark:hover:bg-white/[0.06] transition-colors flex items-center justify-between gap-2"
                        >
                            <span className="flex items-center gap-2.5">
                                <History className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc] shrink-0" />
                                <span>{t.whatsNew}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                {hasUnseenChangelog && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                )}
                                <span className="text-[11px] text-[#8a8a94] dark:text-[#71717a]" aria-hidden="true">
                                    →
                                </span>
                            </span>
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Onboarding Intro Card, Advanced Tip, Video Modal & What's New */}
            {mounted && (
                <>
                    <IntroCard
                        isOpen={onboarding.activeSurface === "intro"}
                        language={language}
                        onWatchVideo={() => {
                            onboarding.markIntroSeen();
                            onboarding.openVideo("start");
                        }}
                        onStartTour={() => {
                            onboarding.markIntroSeen();
                            openOverlay("tour");
                        }}
                        onDismiss={onboarding.markIntroSeen}
                    />
                    <ReleaseAnnouncementCard
                        isOpen={onboarding.activeSurface === "release"}
                        language={language}
                        onOpenWhatsNew={() => {
                            onboarding.markVersionSeen(LATEST_CHANGELOG_VERSION);
                            onboarding.openWhatsNew();
                        }}
                        onDismiss={() => onboarding.markVersionSeen(LATEST_CHANGELOG_VERSION)}
                    />
                    <AdvancedTipCard
                        isOpen={onboarding.activeSurface === "tip"}
                        language={language}
                        onWatchAdvanced={() => {
                            onboarding.markTipSeen();
                            onboarding.openVideo("advanced");
                        }}
                        onDismiss={onboarding.markTipSeen}
                    />
                    <VideoModal
                        videoId={onboarding.activeVideoId}
                        language={language}
                        onClose={onboarding.closeVideo}
                        onSelectVideo={onboarding.openVideo}
                    />
                    <WhatsNew
                        isOpen={onboarding.isWhatsNewOpen}
                        language={language}
                        onClose={onboarding.closeWhatsNew}
                        onMarkSeen={onboarding.markVersionSeen}
                    />
                    <ConfirmDialog
                        isOpen={pendingDeleteDs !== null}
                        eyebrow={language === "id" ? "hapus sumber" : "delete source"}
                        title={
                            language === "id"
                                ? `Hapus jadwal "${pendingDeleteDs?.name ?? ""}"?`
                                : `Delete schedule "${pendingDeleteDs?.name ?? ""}"?`
                        }
                        description={
                            language === "id"
                                ? "Sumber jadwal ini beserta seluruh plan terkait akan dihapus permanen."
                                : "This will permanently remove the schedule source and its associated plans."
                        }
                        confirmLabel={language === "id" ? "Hapus" : "Delete"}
                        cancelLabel={language === "id" ? "Batal" : "Cancel"}
                        onConfirm={confirmDeleteDatasource}
                        onCancel={() => setPendingDeleteDs(null)}
                    />
                </>
            )}

            {/* Welcome Greeting Screen */}
            <WelcomeScreen
                isOpen={mounted && (!hasCompletedWelcome || isWelcomeManuallyOpen)}
                onContinue={() => {
                    setHasCompletedWelcome(true);
                    setIsWelcomeManuallyOpen(false);
                }}
                onWatchIntro={() => onboarding.openVideo("start")}
            />
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
