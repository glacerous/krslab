"use client";

import { useAppStore } from "@/lib/store";
import { Plus, Trash2, ArrowRight, Calendar, Layers } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
    const { plans, deletePlan, setActivePlanId, activePlanId, datasources } = useAppStore();

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Your Plans</h2>
                    <p className="text-zinc-500">Manage your course selection and schedule strategies.</p>
                </div>
                <Link
                    href="/plan/create"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Create New Plan
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
                        <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No plans yet</h3>
                        <p className="text-zinc-500 mb-6">Start by creating your first plan using a datasource.</p>
                        <Link
                            href="/plan/create"
                            className="text-blue-600 font-medium hover:underline"
                        >
                            + Add Plan
                        </Link>
                    </div>
                )}

                {plans.map((plan) => {
                    const ds = datasources.find(d => d.id === plan.datasourceId);
                    return (
                        <Link
                            href={`/plan/${plan.id}`}
                            key={plan.id}
                            className={cn(
                                "group p-6 rounded-2xl border transition-all hover:shadow-md relative bg-white dark:bg-zinc-900",
                                activePlanId === plan.id
                                    ? "border-blue-500 shadow-sm"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            )}
                            onClick={() => setActivePlanId(plan.id)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold truncate pr-8 group-hover:text-blue-600 transition-colors">{plan.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Layers className="w-3 h-3 text-zinc-400" />
                                        <p className="text-xs text-zinc-500 truncate">
                                            {ds?.name || "Unknown Datasource"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deletePlan(plan.id);
                                    }}
                                    className="text-zinc-300 hover:text-red-500 p-2 -mr-2 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-6">
                                <span className="text-xs font-medium text-zinc-500">
                                    {plan.selectedSubjectIds.length} Subjects Selected
                                </span>
                                <div className="flex items-center gap-2 text-blue-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                                    Configure <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>

                            {activePlanId === plan.id && (
                                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
