import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkClassConflict, Rule, Section, Course, generateRandomValidSchedules, validateRules, GeneratorResult } from "@krs/engine";

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

    // Datasource Actions
    addDatasource: (name: string, subjects: Subject[]) => string;
    deleteDatasource: (id: string) => void;

    // Plan Actions
    addPlan: (plan: Omit<Plan, "id" | "createdAt">) => string;
    updatePlan: (id: string, updates: Partial<Plan>) => void;
    deletePlan: (id: string) => void;

    // UI Actions
    setActivePlanId: (id: string | null) => void;
    setActiveDatasourceId: (id: string | null) => void;

    // Rule & Generator Actions
    setRulesForPlan: (planId: string, rules: Rule[]) => void;
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
    applyActiveSavedVariantToPlan: (planId: string) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            datasources: [],
            plans: [],
            activePlanId: null,
            activeDatasourceId: null,
            isGenerating: false,

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

            deleteDatasource: (id) => {
                set((state) => ({
                    datasources: state.datasources.filter((d) => d.id !== id),
                    plans: state.plans.filter((p) => p.datasourceId !== id), // Cascading delete
                    activeDatasourceId: state.activeDatasourceId === id ? null : state.activeDatasourceId,
                }));
            },

            addPlan: (planData) => {
                const id = crypto.randomUUID();
                const newPlan: Plan = {
                    ...planData,
                    id,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    plans: [newPlan, ...state.plans],
                    activePlanId: id
                }));
                return id;
            },

            updatePlan: (id, updates) => {
                set((state) => ({
                    plans: state.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                }));
            },

            deletePlan: (id) => {
                set((state) => ({
                    plans: state.plans.filter((p) => p.id !== id),
                    activePlanId: state.activePlanId === id ? null : state.activePlanId,
                }));
            },

            setActivePlanId: (activePlanId) => set({ activePlanId }),
            setActiveDatasourceId: (activeDatasourceId) => set({ activeDatasourceId }),

            setRulesForPlan: (planId, rules) => {
                set((state) => ({
                    plans: state.plans.map((p) => (p.id === planId ? { ...p, rules } : p)),
                }));
            },

            generateVariantsForPlan: (planId, opts = {}) => {
                set({ isGenerating: true });
                let count = 0;
                let failureSummary: { ruleId: string; hits: number; }[] | undefined;
                let blockerSubjects: { subjectId: string; subjectName: string; hits?: number; reason?: string }[] | undefined;

                try {
                    set((state) => {
                        const plan = state.plans.find((p) => p.id === planId);
                        if (!plan) return state;

                        const datasource = state.datasources.find((ds) => ds.id === plan.datasourceId);
                        if (!datasource) return state;

                        const rules = (plan.rules ?? []).filter(r => r.enabled);
                        const validation = validateRules(rules);
                        if (!validation.ok) {
                            console.error("Rule validation failed", validation.errors);
                            return state;
                        }

                        // 1. Determine which subjects are in the grid
                        const inGridIds = Object.keys(plan.selectedClassBySubjectId);
                        if (inGridIds.length === 0) {
                            return {
                                plans: state.plans.map((p) =>
                                    p.id === planId
                                        ? { ...p, generatedVariants: [], activeVariantIndex: null }
                                        : p
                                ),
                            };
                        }

                        // 2. Build initialPicks mapping (Frozen Sections)
                        // Priority: Provided Section mapping (opts.initialPicks) > Provided ID mapping (opts.freezeSeedMapping) > Base plan mapping.
                        let initialPicks: Record<string, Section> = opts.initialPicks || {};
                        const freezeSource = opts.freezeSeedMapping || plan.selectedClassBySubjectId;

                        if (!opts.initialPicks) {
                            const frozenSet = new Set(plan.frozenSubjectIds ?? []);
                            for (const subId of inGridIds) {
                                if (frozenSet.has(subId)) {
                                    const classId = freezeSource[subId];
                                    if (!classId) continue;
                                    const sub = datasource.subjects.find(s => s.subjectId === subId);
                                    const cls = sub?.classes.find(c => c.classId === classId);
                                    if (cls) {
                                        initialPicks[subId] = cls as unknown as Section;
                                    }
                                }
                            }
                        }

                        // 3. Determine mutable subjects (Everything in grid NOT in initialPicks)
                        const initialPicksIds = new Set(Object.keys(initialPicks));
                        const mutableIds = inGridIds.filter(id => !initialPicksIds.has(id));

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
                                    count = 0;
                                    return state;
                                }
                            }
                        }

                        if (mutableIds.length === 0) {
                            // No subjects left to mutate
                            return {
                                plans: state.plans.map((p) =>
                                    p.id === planId
                                        ? {
                                            ...p,
                                            generatedVariants: [p.selectedClassBySubjectId],
                                            activeVariantIndex: 0,
                                        }
                                        : p
                                ),
                            };
                        }

                        const mutableCourses = datasource.subjects.filter((s) =>
                            mutableIds.includes(s.subjectId)
                        ) as unknown as Course[];

                        const genResult = generateRandomValidSchedules(
                            mutableCourses as any,
                            rules,
                            {
                                target: opts.target ?? 10,
                                maxAttempts: opts.maxAttempts ?? 1000,
                                seed: opts.seed
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
                            Object.entries(v.picks).forEach(([courseId, section]: [string, any]) => {
                                mapping[courseId] = (section as any).classId;
                            });
                            return mapping;
                        });

                        count = serializedVariants.length;

                        return {
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
                        };
                    });
                    return { count, failureSummary, blockerSubjects };
                } finally {
                    set({ isGenerating: false });
                }
            },

            setActiveVariantIndex: (planId, index) => {
                set((state) => ({
                    plans: state.plans.map((p) => (p.id === planId ? { ...p, activeVariantIndex: index, previewOverrides: {} } : p)),
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

                    // Source mapping: generated preview OR saved preview
                    let mapping: Record<string, string> | undefined;
                    if (plan.activeVariantIndex !== null && plan.activeVariantIndex !== undefined && plan.generatedVariants) {
                        mapping = plan.generatedVariants[plan.activeVariantIndex];
                    } else if (plan.activeSavedVariantId && plan.savedVariants) {
                        mapping = plan.savedVariants.find(sv => sv.id === plan.activeSavedVariantId)?.mapping;
                    }

                    if (!mapping) return state;

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

            applyActiveSavedVariantToPlan: (planId) => {
                set((state) => {
                    const plan = state.plans.find((p) => p.id === planId);
                    if (!plan || !plan.activeSavedVariantId || !plan.savedVariants) return state;

                    const saved = plan.savedVariants.find((sv) => sv.id === plan.activeSavedVariantId);
                    if (!saved) return state;

                    // Apply saved + overrides
                    const effectiveMapping = { ...saved.mapping, ...plan.previewOverrides };

                    return {
                        plans: state.plans.map((p) =>
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
