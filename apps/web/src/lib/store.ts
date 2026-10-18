import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkClassConflict, Rule, Section, Course, generateRandomValidSchedules, validateRules, GeneratorResult, parseBimaMasterWithDebug } from "@krs/engine";
import { SAMPLE_BIMA_TEXT } from "./sample-data";

export interface Meeting {
    day: string;
    start: string; // HH:mm
    end: string;   // HH:mm
    room: string;
}

export interface ClassSchedule {
    classId: string;
    className: string;
    meetings: Meeting[];
    lecturers: string[];
}

export interface Subject {
    subjectId: string;
    code: string;
    name: string;
    sks: number;
    classes: ClassSchedule[];
}

export interface Datasource {
    id: string;
    name: string;
    createdAt: string;
    subjects: Subject[];
}

export interface Plan {
    id: string;
    name: string;
    createdAt: string;
    datasourceId: string;
    selectedSubjectIds: string[];
    selectedClassBySubjectId: Record<string, string>; // subjectId -> classId
    rules?: Rule[];
    generatedVariants?: Record<string, string>[];
    activeVariantIndex?: number | null;
    frozenSubjectIds?: string[];
    previewOverrides?: Record<string, string>; // subjectId -> classId, only used in preview
    savedVariants?: {
        id: string;
        createdAt: string;
        mapping: Record<string, string>;
        meta?: {
            label?: string;
            seed?: number;
            rulesHash?: string;
            frozenCount?: number;
        };
    }[];
    activeSavedVariantId?: string | null;
}

interface AppStore {
    datasources: Datasource[];
    plans: Plan[];
    activePlanId: string | null;
    activeDatasourceId: string | null;
    isGenerating: boolean;
    isDataModalOpen: boolean;
    _hasHydrated: boolean;

    // Actions
    setHasHydrated: (state: boolean) => void;
    setIsDataModalOpen: (open: boolean) => void;

    // Datasource Actions
    addDatasource: (name: string, subjects: Subject[]) => string;
    updateDatasource: (id: string, updates: { name?: string; subjects?: Subject[] }) => void;
    deleteDatasource: (id: string) => void;
    duplicateDatasource: (id: string) => string;
    deduplicateDatasources: () => void;
    importDatasourceAndCreatePlan: (name: string, subjects: Subject[]) => { datasourceId: string; planId: string };

    // Plan Actions
    addPlan: (plan: Omit<Plan, "id" | "createdAt">) => string;
    updatePlan: (id: string, updates: Partial<Plan>) => void;
    deletePlan: (id: string) => void;
    toggleSubjectInPlan: (planId: string, subjectId: string) => void;
    removeSubjectFromPlan: (planId: string, subjectId: string) => void;
    setSelectedClassForSubject: (planId: string, subjectId: string, classId: string) => void;

    // UI Actions
    setActivePlanId: (id: string | null) => void;
    setActiveDatasourceId: (id: string | null) => void;

    // Rule & Generator Actions
    setRulesForPlan: (planId: string, rules: Rule[]) => void;
    autoSchedulePlan: (planId: string) => {
        success: boolean;
        failureSummary?: { ruleId: string; hits: number; }[];
        blockerSubjects?: { subjectId: string; subjectName: string; hits?: number; reason?: string }[];
    };
    generateCandidateSchedule: (planId: string, currentDisplayedMapping?: Record<string, string>) => {
        success: boolean;
        candidate?: Record<string, string>;
        allCandidates?: Record<string, string>[];
        failureSummary?: { ruleId: string; hits: number; }[];
        blockerSubjects?: { subjectId: string; subjectName: string; hits?: number; reason?: string }[];
    };
    generateVariantsForPlan: (planId: string, opts?: {
        target?: number;
        maxAttempts?: number;
        seed?: number;
        initialPicks?: Record<string, Section>;
        freezeSeedMapping?: Record<string, string>;
    }) => {
        count: number;
        failureSummary?: { ruleId: string; hits: number; }[];
        blockerSubjects?: { subjectId: string; subjectName: string; hits?: number; reason?: string }[];
    };
    setActiveVariantIndex: (planId: string, index: number | null) => void;
    applyActiveVariantToPlan: (planId: string) => void;
    setPreviewOverride: (planId: string, subjectId: string, classId: string) => void;
    toggleFreezeSubject: (planId: string, subjectId: string) => void;
    clearFrozenSubjects: (planId: string) => void;

    // Saved Variant Actions
    saveActiveVariant: (planId: string) => void;
    deleteSavedVariant: (planId: string, savedId: string) => void;
    setActiveSavedVariant: (planId: string, savedId: string | null) => void;
    applyActiveSavedVariantToPlan: (planId: string, savedId?: string) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get): AppStore => ({
            datasources: [],
            plans: [],
            activePlanId: null,
            activeDatasourceId: null,
            isGenerating: false,
            isDataModalOpen: false,
            _hasHydrated: false,

            setHasHydrated: (state) => set({ _hasHydrated: state }),
            setIsDataModalOpen: (isDataModalOpen) => set({ isDataModalOpen }),

            addDatasource: (name, subjects) => {
                const id = crypto.randomUUID();
                const newDs: Datasource = {
                    id,
                    name,
                    createdAt: new Date().toISOString(),
                    subjects,
                };
                set((state) => ({ datasources: [newDs, ...state.datasources] }));
                return id;
            },

            updateDatasource: (id, updates) => {
                set((state) => ({
                    datasources: state.datasources.map((ds) => {
                        if (ds.id !== id) return ds;
                        return {
                            ...ds,
                            name: updates.name !== undefined && updates.name.trim() ? updates.name.trim() : ds.name,
                            subjects: updates.subjects !== undefined ? updates.subjects : ds.subjects,
                        };
                    }),
                }));
            },

            duplicateDatasource: (id) => {
                const source = get().datasources.find((d) => d.id === id);
                if (!source) return id;

                const newId = crypto.randomUUID();
                const newName = `${source.name} (Copy)`;
                const newDs: Datasource = {
                    id: newId,
                    name: newName,
                    createdAt: new Date().toISOString(),
                    subjects: JSON.parse(JSON.stringify(source.subjects)),
                };

                const planId = crypto.randomUUID();
                const sourcePlan = get().plans.find((p) => p.datasourceId === id && p.id === get().activePlanId)
                    || get().plans.find((p) => p.datasourceId === id);

                const newPlan: Plan = {
                    id: planId,
                    name: sourcePlan ? `${sourcePlan.name} (Copy)` : "Plan 1",
                    createdAt: new Date().toISOString(),
                    datasourceId: newId,
                    selectedSubjectIds: sourcePlan ? [...sourcePlan.selectedSubjectIds] : newDs.subjects.slice(0, 5).map((s) => s.subjectId),
                    selectedClassBySubjectId: sourcePlan ? { ...sourcePlan.selectedClassBySubjectId } : {},
                    rules: sourcePlan ? JSON.parse(JSON.stringify(sourcePlan.rules)) : [],
                    savedVariants: [],
                    frozenSubjectIds: sourcePlan ? [...(sourcePlan.frozenSubjectIds || [])] : [],
                    previewOverrides: {},
                };

                set((state: AppStore) => ({
                    datasources: [newDs, ...state.datasources],
                    plans: [newPlan, ...state.plans],
                    activeDatasourceId: newId,
                    activePlanId: planId,
                }));

                return newId;
            },

            deduplicateDatasources: () => {
                set((state) => {
                    const sampleSources = state.datasources.filter(
                        (d) => d.id.startsWith("sample") || d.name.toLowerCase().includes("sample")
                    );
                    if (sampleSources.length <= 1) return state;

                    // Keep the first sample source
                    const primarySample = sampleSources[0];
                    const duplicateIds = new Set(sampleSources.slice(1).map((d) => d.id));

                    const cleanedDatasources = state.datasources.filter((d) => !duplicateIds.has(d.id));
                    const cleanedPlans = state.plans.map((p) => {
                        if (duplicateIds.has(p.datasourceId)) {
                            return { ...p, datasourceId: primarySample.id };
                        }
                        return p;
                    });

                    let nextActiveDsId = state.activeDatasourceId;
                    if (nextActiveDsId && duplicateIds.has(nextActiveDsId)) {
                        nextActiveDsId = primarySample.id;
                    }

                    return {
                        datasources: cleanedDatasources,
                        plans: cleanedPlans,
                        activeDatasourceId: nextActiveDsId,
                    };
                });
            },

            deleteDatasource: (id) => {
                const remaining = get().datasources.filter((d) => d.id !== id);
                if (remaining.length === 0) {
                    // Reset to single clean Sample Data source so the app is never broken
                    const parsed = parseBimaMasterWithDebug(SAMPLE_BIMA_TEXT);
                    const dsId = crypto.randomUUID();
                    const sampleDs: Datasource = {
                        id: dsId,
                        name: "Sample UPNYK Informatics",
                        createdAt: new Date().toISOString(),
                        subjects: parsed.subjects,
                    };
                    const planId = crypto.randomUUID();
                    const samplePlan: Plan = {
                        id: planId,
                        name: "Semester 4",
                        createdAt: new Date().toISOString(),
                        datasourceId: dsId,
                        selectedSubjectIds: parsed.subjects.slice(0, 5).map((s: any) => s.subjectId),
                        selectedClassBySubjectId: {},
                        rules: [],
                        savedVariants: [],
                        frozenSubjectIds: [],
                        previewOverrides: {},
                    };
                    set({
                        datasources: [sampleDs],
                        plans: [samplePlan],
                        activeDatasourceId: dsId,
                        activePlanId: planId,
                    });
                    return;
                }

                let nextActiveDsId = get().activeDatasourceId;
                if (nextActiveDsId === id) {
                    nextActiveDsId = remaining[0].id;
                }
                const remainingPlans = get().plans.filter((p) => p.datasourceId !== id);
                let nextActivePlanId = get().activePlanId;
                if (!remainingPlans.some((p) => p.id === nextActivePlanId)) {
                    nextActivePlanId = remainingPlans.find((p) => p.datasourceId === nextActiveDsId)?.id ?? null;
                }
                set({
                    datasources: remaining,
                    plans: remainingPlans,
                    activeDatasourceId: nextActiveDsId,
                    activePlanId: nextActivePlanId,
                });
            },

            importDatasourceAndCreatePlan: (name, subjects) => {
                const defaultName = name.trim() || `BIMA Schedule - ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;

                // Deduplicate sample data if already loaded
                if (defaultName.toLowerCase().includes("sample")) {
                    const existingSample = get().datasources.find(d =>
                        d.id.startsWith("sample") || d.name.toLowerCase().includes("sample")
                    );
                    if (existingSample) {
                        const existingPlan = get().plans.find(p => p.datasourceId === existingSample.id);
                        if (existingPlan) {
                            set({ activeDatasourceId: existingSample.id, activePlanId: existingPlan.id });
                            return { datasourceId: existingSample.id, planId: existingPlan.id };
                        } else {
                            const planId = crypto.randomUUID();
                            const newPlan: Plan = {
                                id: planId,
                                name: "Semester 4",
                                createdAt: new Date().toISOString(),
                                datasourceId: existingSample.id,
                                selectedSubjectIds: existingSample.subjects.slice(0, 5).map((s: any) => s.subjectId),
                                selectedClassBySubjectId: {},
                                rules: [],
                                savedVariants: [],
                                frozenSubjectIds: [],
                                previewOverrides: {},
                            };
                            set((state: AppStore) => ({
                                plans: [newPlan, ...state.plans],
                                activeDatasourceId: existingSample.id,
                                activePlanId: planId,
                            }));
                            return { datasourceId: existingSample.id, planId };
                        }
                    }
                }

                const dsId = crypto.randomUUID();
                const newDs: Datasource = {
                    id: dsId,
                    name: defaultName,
                    createdAt: new Date().toISOString(),
                    subjects,
                };
                const planId = crypto.randomUUID();
                const newPlan: Plan = {
                    id: planId,
                    name: "Plan 1",
                    createdAt: new Date().toISOString(),
                    datasourceId: dsId,
                    selectedSubjectIds: [],
                    selectedClassBySubjectId: {},
                    rules: [],
                    savedVariants: [],
                    frozenSubjectIds: [],
                    previewOverrides: {},
                };
                set((state: AppStore) => ({
                    datasources: [newDs, ...state.datasources],
                    plans: [newPlan, ...state.plans],
                    activeDatasourceId: dsId,
                    activePlanId: planId,
                }));
                return { datasourceId: dsId, planId };
            },

            addPlan: (planData) => {
                const id = crypto.randomUUID();
                const newPlan: Plan = {
                    ...planData,
                    id,
                    createdAt: new Date().toISOString(),
                };
                set((state: AppStore) => ({
                    plans: [newPlan, ...state.plans],
                    activePlanId: id
                }));
                return id;
            },

            updatePlan: (id, updates) => {
                set((state: AppStore) => ({
                    plans: state.plans.map((p: Plan) => (p.id === id ? { ...p, ...updates } : p)),
                }));
            },

            deletePlan: (id) => {
                set((state: AppStore) => ({
                    plans: state.plans.filter((p: Plan) => p.id !== id),
                    activePlanId: state.activePlanId === id ? (state.plans.find(p => p.id !== id)?.id ?? null) : state.activePlanId,
                }));
            },

            toggleSubjectInPlan: (planId, subjectId) => {
                set((state: AppStore) => ({
                    plans: state.plans.map((p: Plan) => {
                        if (p.id !== planId) return p;
                        const exists = (p.selectedSubjectIds ?? []).includes(subjectId);
                        const newSelected = exists
                            ? p.selectedSubjectIds.filter((id) => id !== subjectId)
                            : [...(p.selectedSubjectIds ?? []), subjectId];

                        const newSelectedClass = { ...p.selectedClassBySubjectId };
                        if (exists) {
                            delete newSelectedClass[subjectId];
                        } else {
                            // Auto-assign first non-conflicting section or fallback to section 0
                            const ds = state.datasources.find((d) => d.id === p.datasourceId);
                            const subject = ds?.subjects.find((s) => s.subjectId === subjectId);
                            if (subject && subject.classes.length > 0) {
                                const currentSelectedClasses = Object.entries(newSelectedClass)
                                    .map(([sId, cId]) => {
                                        const s = ds?.subjects.find((sub) => sub.subjectId === sId);
                                        return s?.classes.find((c) => c.classId === cId);
                                    })
                                    .filter(Boolean);

                                let chosenClass = subject.classes.find((candidateCls) => {
                                    return !currentSelectedClasses.some((existingCls) =>
                                        checkClassConflict(candidateCls, existingCls!)
                                    );
                                });

                                if (!chosenClass) {
                                    chosenClass = subject.classes[0];
                                }
                                newSelectedClass[subjectId] = chosenClass.classId;
                            }
                        }

                        // Auto-repair any selected subjects that might be missing a class assignment
                        const ds = state.datasources.find((d) => d.id === p.datasourceId);
                        if (ds) {
                            for (const sId of newSelected) {
                                if (!newSelectedClass[sId]) {
                                    const s = ds.subjects.find((sub) => sub.subjectId === sId);
                                    if (s?.classes?.[0]) {
                                        newSelectedClass[sId] = s.classes[0].classId;
                                    }
                                }
                            }
                        }

                        const newFrozen = (p.frozenSubjectIds ?? []).filter((id) => id !== subjectId);
                        const newOverrides = { ...(p.previewOverrides ?? {}) };
                        delete newOverrides[subjectId];

                        return {
                            ...p,
                            selectedSubjectIds: newSelected,
                            selectedClassBySubjectId: newSelectedClass,
                            frozenSubjectIds: newFrozen,
                            previewOverrides: newOverrides,
                        };
                    })
                }));
            },

            removeSubjectFromPlan: (planId, subjectId) => {
                set((state: AppStore) => ({
                    plans: state.plans.map((p: Plan) => {
                        if (p.id !== planId) return p;
                        const newSelectedClass = { ...p.selectedClassBySubjectId };
                        delete newSelectedClass[subjectId];
                        const newOverrides = { ...(p.previewOverrides ?? {}) };
                        delete newOverrides[subjectId];

                        return {
                            ...p,
                            selectedSubjectIds: (p.selectedSubjectIds ?? []).filter((id) => id !== subjectId),
                            selectedClassBySubjectId: newSelectedClass,
                            frozenSubjectIds: (p.frozenSubjectIds ?? []).filter((id) => id !== subjectId),
                            previewOverrides: newOverrides,
                        };
                    })
                }));
            },

            setSelectedClassForSubject: (planId, subjectId, classId) => {
                set((state: AppStore) => ({
                    plans: state.plans.map((p: Plan) => {
                        if (p.id !== planId) return p;
                        const exists = (p.selectedSubjectIds ?? []).includes(subjectId);
                        const newSelectedSubjectIds = exists ? p.selectedSubjectIds : [...(p.selectedSubjectIds ?? []), subjectId];
                        return {
                            ...p,
                            selectedSubjectIds: newSelectedSubjectIds,
                            selectedClassBySubjectId: {
                                ...p.selectedClassBySubjectId,
                                [subjectId]: classId,
                            },
                        };
                    })
                }));
            },

            setActivePlanId: (activePlanId) => set({ activePlanId }),
            setActiveDatasourceId: (activeDatasourceId) => set({ activeDatasourceId }),

            setRulesForPlan: (planId, rules) => {
                set((state: AppStore) => ({
                    plans: state.plans.map((p: Plan) => (p.id === planId ? { ...p, rules } : p)),
                }));
            },

            autoSchedulePlan: (planId) => {
                set({ isGenerating: true });
                try {
                    const state = useAppStore.getState();
                    const plan = state.plans.find((p) => p.id === planId);
                    if (!plan) return { success: false };

                    const datasource = state.datasources.find((ds) => ds.id === plan.datasourceId);
                    if (!datasource) return { success: false };

                    const rules = (plan.rules ?? []).filter(r => r.enabled);
                    const validation = validateRules(rules);
                    if (!validation.ok) {
                        return { success: false };
                    }

                    const targetSubjectIds = (plan.selectedSubjectIds && plan.selectedSubjectIds.length > 0)
                        ? plan.selectedSubjectIds
                        : Object.keys(plan.selectedClassBySubjectId);

                    if (targetSubjectIds.length === 0) {
                        return { success: false };
                    }

                    // Build initial picks for frozen subjects
                    const initialPicks: Record<string, Section> = {};
                    const frozenSet = new Set(plan.frozenSubjectIds ?? []);
                    for (const subId of targetSubjectIds) {
                        if (frozenSet.has(subId)) {
                            const classId = plan.selectedClassBySubjectId[subId];
                            if (classId) {
                                const sub = datasource.subjects.find(s => s.subjectId === subId);
                                const cls = sub?.classes.find(c => c.classId === classId);
                                if (cls) initialPicks[subId] = cls as unknown as Section;
                            }
                        }
                    }

                    // Check fixed conflicts
                    const fixedSubjectIds = Object.keys(initialPicks);
                    for (let i = 0; i < fixedSubjectIds.length; i++) {
                        for (let j = i + 1; j < fixedSubjectIds.length; j++) {
                            const idA = fixedSubjectIds[i];
                            const idB = fixedSubjectIds[j];
                            if (checkClassConflict(initialPicks[idA] as any, initialPicks[idB] as any)) {
                                const subA = datasource.subjects.find(s => s.subjectId === idA);
                                const subB = datasource.subjects.find(s => s.subjectId === idB);
                                return {
                                    success: false,
                                    blockerSubjects: [
                                        { subjectId: idA, subjectName: subA?.name || idA, reason: "Locked class conflict" },
                                        { subjectId: idB, subjectName: subB?.name || idB, reason: "Locked class conflict" }
                                    ]
                                };
                            }
                        }
                    }

                    const initialPicksIds = new Set(Object.keys(initialPicks));
                    const mutableIds = targetSubjectIds.filter(id => !initialPicksIds.has(id));

                    if (mutableIds.length === 0) {
                        return { success: true };
                    }

                    const mutableCourses = datasource.subjects.filter((s) =>
                        mutableIds.includes(s.subjectId)
                    ) as unknown as Course[];

                    const freshSeed = Date.now() + Math.floor(Math.random() * 100000);
                    const genResult = generateRandomValidSchedules(
                        mutableCourses as any,
                        rules,
                        {
                            target: 10,
                            maxAttempts: 10000,
                            seed: freshSeed
                        },
                        {
                            sectionsConflict: checkClassConflict,
                            initialPicks
                        } as any
                    );

                    let blockerSubjects: { subjectId: string; subjectName: string; hits?: number; reason?: string }[] | undefined;
                    if (genResult.blockerSubjects) {
                        blockerSubjects = genResult.blockerSubjects.map(b => {
                            const sub = datasource.subjects.find(s => s.subjectId === b.subjectId);
                            return {
                                ...b,
                                subjectName: sub?.name || b.subjectId
                            };
                        });
                    }

                    if (!genResult.variants || genResult.variants.length === 0) {
                        return {
                            success: false,
                            failureSummary: genResult.failureSummary,
                            blockerSubjects
                        };
                    }

                    // Serialize variants to mappings
                    const serializedVariants = genResult.variants.map((v: any) => {
                        const mapping: Record<string, string> = {};
                        Object.entries(initialPicks).forEach(([courseId, section]: [string, any]) => {
                            mapping[courseId] = section.classId;
                        });
                        Object.entries(v.picks).forEach(([courseId, section]: [string, any]) => {
                            mapping[courseId] = (section as any).classId;
                        });
                        return mapping;
                    });

                    // Pick one that differs from current selection if possible
                    const currentMapping = plan.selectedClassBySubjectId;
                    const differingVariant = serializedVariants.find((m) =>
                        Object.entries(m).some(([sId, cId]) => currentMapping[sId] !== cId)
                    );
                    const chosen = differingVariant || serializedVariants[0];

                    set((state) => ({
                        plans: state.plans.map((p) =>
                            p.id === planId
                                ? {
                                    ...p,
                                    selectedClassBySubjectId: { ...p.selectedClassBySubjectId, ...chosen },
                                    generatedVariants: [],
                                    activeVariantIndex: null,
                                    previewOverrides: {}
                                }
                                : p
                        )
                    }));

                    return { success: true };
                } finally {
                    set({ isGenerating: false });
                }
            },

            generateCandidateSchedule: (planId, currentDisplayedMapping) => {
                set({ isGenerating: true });
                try {
                    const plan = get().plans.find(p => p.id === planId);
                    if (!plan) return { success: false };

                    const datasource = get().datasources.find(d => d.id === plan.datasourceId);
                    if (!datasource) return { success: false };

                    const targetSubjectIds = plan.selectedSubjectIds;
                    if (targetSubjectIds.length === 0) return { success: false };

                    // 1. Gather rules
                    const rules = (plan.rules ?? []).filter(r => r.enabled);

                    // 2. Initial picks from frozen courses
                    const initialPicks: Record<string, Section> = {};
                    const frozenIds = plan.frozenSubjectIds ?? [];

                    for (const subId of frozenIds) {
                        const classId = currentDisplayedMapping?.[subId] ?? plan.selectedClassBySubjectId[subId];
                        if (classId) {
                            const sub = datasource.subjects.find(s => s.subjectId === subId);
                            const cls = sub?.classes.find(c => c.classId === classId);
                            if (cls) {
                                initialPicks[subId] = cls as unknown as Section;
                            }
                        }
                    }

                    // Check if locked classes mutually clash
                    const fixedSubjectIds = Object.keys(initialPicks);
                    for (let i = 0; i < fixedSubjectIds.length; i++) {
                        for (let j = i + 1; j < fixedSubjectIds.length; j++) {
                            const idA = fixedSubjectIds[i];
                            const idB = fixedSubjectIds[j];
                            if (checkClassConflict(initialPicks[idA] as any, initialPicks[idB] as any)) {
                                const subA = datasource.subjects.find(s => s.subjectId === idA);
                                const subB = datasource.subjects.find(s => s.subjectId === idB);
                                return {
                                    success: false,
                                    blockerSubjects: [
                                        { subjectId: idA, subjectName: subA?.name || idA, reason: "Locked class conflict" },
                                        { subjectId: idB, subjectName: subB?.name || idB, reason: "Locked class conflict" }
                                    ]
                                };
                            }
                        }
                    }

                    const initialPicksIds = new Set(Object.keys(initialPicks));
                    const mutableIds = targetSubjectIds.filter(id => !initialPicksIds.has(id));

                    if (mutableIds.length === 0) {
                        const directMapping: Record<string, string> = {};
                        Object.entries(initialPicks).forEach(([subId, sec]: [string, any]) => {
                            directMapping[subId] = sec.classId;
                        });
                        return { success: true, candidate: directMapping };
                    }

                    const mutableCourses = datasource.subjects.filter((s) =>
                        mutableIds.includes(s.subjectId)
                    ) as unknown as Course[];

                    const freshSeed = Date.now() + Math.floor(Math.random() * 100000);
                    const genResult = generateRandomValidSchedules(
                        mutableCourses as any,
                        rules,
                        {
                            target: 20,
                            maxAttempts: 2000,
                            seed: freshSeed
                        },
                        {
                            sectionsConflict: checkClassConflict,
                            initialPicks
                        } as any
                    );

                    let blockerSubjects: { subjectId: string; subjectName: string; hits?: number; reason?: string }[] | undefined;
                    if (genResult.blockerSubjects) {
                        blockerSubjects = genResult.blockerSubjects.map(b => {
                            const sub = datasource.subjects.find(s => s.subjectId === b.subjectId);
                            return {
                                ...b,
                                subjectName: sub?.name || b.subjectId
                            };
                        });
                    }

                    if (!genResult.variants || genResult.variants.length === 0) {
                        return {
                            success: false,
                            failureSummary: genResult.failureSummary,
                            blockerSubjects
                        };
                    }

                    // Serialize variants to mappings
                    const serializedVariants = genResult.variants.map((v: any) => {
                        const mapping: Record<string, string> = {};
                        Object.entries(initialPicks).forEach(([courseId, section]: [string, any]) => {
                            mapping[courseId] = section.classId;
                        });
                        Object.entries(v.picks).forEach(([courseId, section]: [string, any]) => {
                            mapping[courseId] = (section as any).classId;
                        });
                        return mapping;
                    });

                    // Deduplicate serialized variants
                    const uniqueVariants: Record<string, string>[] = [];
                    const seenKeys = new Set<string>();
                    for (const m of serializedVariants) {
                        const key = Object.entries(m)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([s, c]) => `${s}:${c}`)
                            .join("|");
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            uniqueVariants.push(m);
                        }
                    }

                    // Pick a variant that differs from current displayed mapping
                    const currentMapping = currentDisplayedMapping ?? plan.selectedClassBySubjectId;
                    const differingVariants = uniqueVariants.filter((m) =>
                        Object.entries(m).some(([sId, cId]) => currentMapping[sId] !== cId)
                    );

                    let chosen: Record<string, string> | null = null;
                    if (differingVariants.length > 0) {
                        // Sort by count of moved courses DESC to favor high visual reshuffling
                        differingVariants.sort((a, b) => {
                            const diffA = Object.entries(a).filter(([sId, cId]) => currentMapping[sId] !== cId).length;
                            const diffB = Object.entries(b).filter(([sId, cId]) => currentMapping[sId] !== cId).length;
                            return diffB - diffA;
                        });
                        const poolSize = Math.max(1, Math.ceil(differingVariants.length / 2));
                        chosen = differingVariants[Math.floor(Math.random() * poolSize)];
                    } else {
                        chosen = uniqueVariants[0] || null;
                    }

                    return {
                        success: true,
                        candidate: chosen,
                        allCandidates: differingVariants.length > 0 ? differingVariants : uniqueVariants
                    };
                } finally {
                    set({ isGenerating: false });
                }
            },

            generateVariantsForPlan: (planId, opts = {}) => {
                const DEBUG = process.env.NEXT_PUBLIC_DEBUG_GEN === "1" || (typeof window !== "undefined" && (window as any).DEBUG_GEN === true);

                set({ isGenerating: true });
                let count = 0;
                let failureSummary: { ruleId: string; hits: number; }[] | undefined;
                let blockerSubjects: { subjectId: string; subjectName: string; hits?: number; reason?: string }[] | undefined;

                try {
                    const state = useAppStore.getState();
                    const plan = state.plans.find((p) => p.id === planId);
                    if (!plan) return { count: 0 };

                    const datasource = state.datasources.find((ds) => ds.id === plan.datasourceId);
                    if (!datasource) return { count: 0 };

                    const rules = (plan.rules ?? []).filter(r => r.enabled);
                    const validation = validateRules(rules);
                    if (!validation.ok) {
                        console.error("Rule validation failed", validation.errors);
                        return { count: 0 };
                    }

                    // 1. Determine target subjects to schedule
                    const targetSubjectIds = (plan.selectedSubjectIds && plan.selectedSubjectIds.length > 0)
                        ? plan.selectedSubjectIds
                        : Object.keys(plan.selectedClassBySubjectId);

                    if (targetSubjectIds.length === 0) {
                        set((state) => ({
                            plans: state.plans.map((p) =>
                                p.id === planId
                                    ? { ...p, generatedVariants: [], activeVariantIndex: null }
                                    : p
                            ),
                        }));
                        return { count: 0 };
                    }

                    // 2. Build initialPicks mapping (Frozen Sections)
                    let initialPicks: Record<string, Section> = opts.initialPicks || {};
                    const freezeSource = opts.freezeSeedMapping || plan.selectedClassBySubjectId;

                    if (!opts.initialPicks) {
                        const frozenSet = new Set(plan.frozenSubjectIds ?? []);
                        for (const subId of targetSubjectIds) {
                            if (frozenSet.has(subId)) {
                                const classId = freezeSource[subId];
                                if (!classId) {
                                    if (DEBUG) console.warn(`[GenDebug] Subject ${subId} is frozen but has no classId in source.`);
                                    continue;
                                }
                                const sub = datasource.subjects.find(s => s.subjectId === subId);
                                const cls = sub?.classes.find(c => c.classId === classId);
                                if (cls) {
                                    initialPicks[subId] = cls as unknown as Section;
                                } else if (DEBUG) {
                                    console.warn(`[GenDebug] Class ${classId} for subject ${subId} not found in datasource.`);
                                }
                            }
                        }
                    }

                    // 3. Determine mutable subjects
                    const initialPicksIds = new Set(Object.keys(initialPicks));
                    const mutableIds = targetSubjectIds.filter(id => !initialPicksIds.has(id));

                    // Integrity check: overlap
                    const overlap = mutableIds.filter(id => initialPicksIds.has(id));
                    if (overlap.length > 0 && DEBUG) {
                        console.error("[GenDebug] Subject Overlap detected! Subjects are both frozen and mutable:", overlap);
                    }

                    // Heuristic 1: Fixed conflict detector
                    const fixedSubjectIds = Object.keys(initialPicks);
                    for (let i = 0; i < fixedSubjectIds.length; i++) {
                        for (let j = i + 1; j < fixedSubjectIds.length; j++) {
                            const idA = fixedSubjectIds[i];
                            const idB = fixedSubjectIds[j];
                            if (checkClassConflict(initialPicks[idA] as any, initialPicks[idB] as any)) {
                                const subA = datasource.subjects.find(s => s.subjectId === idA);
                                const subB = datasource.subjects.find(s => s.subjectId === idB);
                                blockerSubjects = [
                                    { subjectId: idA, subjectName: subA?.name || idA, reason: "Fixed selection conflict" },
                                    { subjectId: idB, subjectName: subB?.name || idB, reason: "Fixed selection conflict" }
                                ];
                                if (DEBUG) console.warn("[GenDebug] Conflicts found in fixed picks:", blockerSubjects);
                                return { count: 0, blockerSubjects };
                            }
                        }
                    }

                    if (mutableIds.length === 0) {
                        const directMapping = { ...plan.selectedClassBySubjectId };
                        Object.entries(initialPicks).forEach(([sId, sec]: [string, any]) => {
                            directMapping[sId] = sec.classId;
                        });
                        set((state) => ({
                            plans: state.plans.map((p) =>
                                p.id === planId
                                    ? {
                                        ...p,
                                        generatedVariants: [directMapping],
                                        activeVariantIndex: 0,
                                    }
                                    : p
                            ),
                        }));
                        return { count: 1 };
                    }

                    const mutableCourses = datasource.subjects.filter((s) =>
                        mutableIds.includes(s.subjectId)
                    ) as unknown as Course[];

                    const generationSeed = opts.seed ?? Date.now();
                    const genResult = generateRandomValidSchedules(
                        mutableCourses as any,
                        rules,
                        {
                            target: opts.target ?? 10,
                            maxAttempts: opts.maxAttempts ?? 10000,
                            seed: generationSeed
                        },
                        {
                            sectionsConflict: checkClassConflict,
                            initialPicks
                        } as any
                    );

                    const variants = genResult.variants;
                    failureSummary = genResult.failureSummary;

                    if (genResult.blockerSubjects) {
                        blockerSubjects = genResult.blockerSubjects.map(b => {
                            const sub = datasource.subjects.find(s => s.subjectId === b.subjectId);
                            return {
                                ...b,
                                subjectName: sub?.name || b.subjectId
                            };
                        });
                    }

                    const serializedVariants = variants.map((v: any) => {
                        const mapping: Record<string, string> = {};
                        // Ensure frozen initial picks are preserved
                        Object.entries(initialPicks).forEach(([courseId, section]: [string, any]) => {
                            mapping[courseId] = section.classId;
                        });
                        Object.entries(v.picks).forEach(([courseId, section]: [string, any]) => {
                            mapping[courseId] = (section as any).classId;
                        });
                        return mapping;
                    });

                    count = serializedVariants.length;

                    if (DEBUG) {
                        console.group(`%c[Generation Report] ${new Date().toLocaleTimeString()}`, "color: #00ff00; font-weight: bold;");
                        console.log("Input Stats:", {
                            targetSubjects: targetSubjectIds.length,
                            frozen: initialPicksIds.size,
                            mutable: mutableIds.length,
                            rules: rules.length,
                            seed: generationSeed
                        });
                        console.log("Frozen Subjects:", Object.keys(initialPicks).map(id => datasource.subjects.find(s => s.subjectId === id)?.name));
                        if ((genResult as any).stats) {
                            console.log("Engine Stats:", (genResult as any).stats);
                        }
                        console.log("Results:", {
                            variants: count,
                            failures: failureSummary?.length || 0,
                            blockers: blockerSubjects?.length || 0
                        });
                        if (count === 0) {
                            console.log("Failure Reasons:", { failureSummary, blockerSubjects });
                        }
                        console.groupEnd();
                    }

                    set((state) => ({
                        plans: state.plans.map((p) =>
                            p.id === planId
                                ? {
                                    ...p,
                                    generatedVariants: serializedVariants,
                                    activeVariantIndex: null,
                                    previewOverrides: {}
                                }
                                : p
                        ),
                    }));
                    return { count, failureSummary, blockerSubjects };
                } finally {
                    set({ isGenerating: false });
                }
            },

            setActiveVariantIndex: (planId: string, index: number | null) => {
                set((state: AppStore) => ({
                    plans: state.plans.map((p: Plan) => (p.id === planId ? { ...p, activeVariantIndex: index, previewOverrides: {} } : p)),
                }));
            },

            applyActiveVariantToPlan: (planId) => {
                set((state) => {
                    const plan = state.plans.find((p) => p.id === planId);
                    if (!plan || plan.activeVariantIndex === null || plan.activeVariantIndex === undefined || !plan.generatedVariants) {
                        return state;
                    }

                    const variantMapping = plan.generatedVariants[plan.activeVariantIndex];
                    if (!variantMapping) return state;

                    // Apply variant + overrides
                    const effectiveMapping = { ...variantMapping, ...plan.previewOverrides };

                    return {
                        plans: state.plans.map((p) =>
                            p.id === planId
                                ? {
                                    ...p,
                                    selectedClassBySubjectId: { ...p.selectedClassBySubjectId, ...effectiveMapping },
                                    activeVariantIndex: null,
                                    previewOverrides: {}
                                }
                                : p
                        ),
                    };
                });
            },

            setPreviewOverride: (planId, subjectId, classId) => {
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === planId
                            ? {
                                ...p,
                                previewOverrides: { ...(p.previewOverrides ?? {}), [subjectId]: classId }
                            }
                            : p
                    ),
                }));
            },

            toggleFreezeSubject: (planId, subjectId) => {
                set((state) => ({
                    plans: state.plans.map((p) => {
                        if (p.id !== planId) return p;
                        return {
                            ...p,
                            frozenSubjectIds: (p.frozenSubjectIds ?? []).includes(subjectId)
                                ? (p.frozenSubjectIds ?? []).filter((id) => id !== subjectId)
                                : [...(p.frozenSubjectIds ?? []), subjectId],
                        };
                    }),
                }));
            },

            clearFrozenSubjects: (planId) => {
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === planId ? { ...p, frozenSubjectIds: [] } : p
                    ),
                }));
            },

            saveActiveVariant: (planId) => {
                set((state) => {
                    const plan = state.plans.find((p) => p.id === planId);
                    if (!plan) return state;

                    // 1. Start with the base mapping (what's currently in the grid)
                    let mapping: Record<string, string> = { ...plan.selectedClassBySubjectId };

                    // 2. If a generated variant is being previewed, use its mapping instead
                    if (plan.activeVariantIndex !== null && plan.activeVariantIndex !== undefined && plan.generatedVariants) {
                        const variantMapping = plan.generatedVariants[plan.activeVariantIndex];
                        if (variantMapping) mapping = { ...variantMapping };
                    }

                    // 3. If a saved variant is being previewed, use its mapping instead
                    else if (plan.activeSavedVariantId && plan.savedVariants) {
                        const savedMapping = plan.savedVariants.find(sv => sv.id === plan.activeSavedVariantId)?.mapping;
                        if (savedMapping) mapping = { ...savedMapping };
                    }

                    // 4. Always apply preview overrides (manual adjustments during preview)
                    if (plan.previewOverrides) {
                        mapping = { ...mapping, ...plan.previewOverrides };
                    }

                    if (Object.keys(mapping).length === 0) return state;

                    // Stable deduplication key
                    const getStableKey = (m: Record<string, string>) =>
                        Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join("|");

                    const newKey = getStableKey(mapping);

                    // Deduplicate
                    const isAlreadySaved = (plan.savedVariants ?? []).some(
                        (sv) => getStableKey(sv.mapping) === newKey
                    );
                    if (isAlreadySaved) return state;

                    const newSaved = {
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        mapping: { ...mapping },
                    };

                    return {
                        plans: state.plans.map((p) =>
                            p.id === planId
                                ? { ...p, savedVariants: [newSaved, ...(p.savedVariants ?? [])] }
                                : p
                        ),
                    };
                });
            },

            deleteSavedVariant: (planId, savedId) => {
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === planId
                            ? {
                                ...p,
                                savedVariants: (p.savedVariants ?? []).filter((sv) => sv.id !== savedId),
                                activeSavedVariantId: p.activeSavedVariantId === savedId ? null : p.activeSavedVariantId,
                            }
                            : p
                    ),
                }));
            },

            setActiveSavedVariant: (planId, savedId) => {
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === planId ? { ...p, activeSavedVariantId: savedId, activeVariantIndex: savedId ? null : p.activeVariantIndex, previewOverrides: {} } : p
                    ),
                }));
            },

            applyActiveSavedVariantToPlan: (planId: string, savedId?: string) => {
                set((state: AppStore) => {
                    const plan = state.plans.find((p: Plan) => p.id === planId);
                    if (!plan || !plan.savedVariants) return state;

                    const idToApply = savedId || plan.activeSavedVariantId;
                    if (!idToApply) return state;

                    const saved = plan.savedVariants.find((sv) => sv.id === idToApply);
                    if (!saved) return state;

                    // Apply saved + overrides
                    const effectiveMapping = { ...saved.mapping, ...plan.previewOverrides };

                    return {
                        plans: state.plans.map((p: Plan) =>
                            p.id === planId
                                ? {
                                    ...p,
                                    selectedClassBySubjectId: { ...p.selectedClassBySubjectId, ...effectiveMapping },
                                    activeSavedVariantId: null,
                                    previewOverrides: {}
                                }
                                : p
                        ),
                    };
                });
            },
        }),
        {
            name: "krs-plan-next-gen",
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
                state?.deduplicateDatasources();
            },
        }
    )
);

// Keep usePlanStore and useKrsStore as empty stubs to prevent immediate crashes if they are still imported elsewhere
// but we will eventually replace all their usages.
export const usePlanStore = () => {
    const store = useAppStore();
    return { ...store, plans: store.plans, activePlanId: store.activePlanId };
};

export const useKrsStore = () => ({
    allSubjects: [],
    selectedSubjectIds: [],
    plans: [],
    currentPlanIndex: 0,
});
