import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

interface AppStore {
    datasources: Datasource[];
    plans: Plan[];
    activePlanId: string | null;
    activeDatasourceId: string | null;

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
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            datasources: [],
            plans: [],
            activePlanId: null,
            activeDatasourceId: null,

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
