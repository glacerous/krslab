"use client";

import React from "react";
import { useKrsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

export function PlanSelector() {
    const { plans, currentPlanIndex, setCurrentPlanIndex } = useKrsStore();

    if (plans.length === 0) return null;

    const handleDownload = () => {
        const data = plans[currentPlanIndex];
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `krs-plan-${currentPlanIndex + 1}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 border rounded-xl">
            <div className="text-sm font-medium">Hasil Generate:</div>
            <div className="flex gap-2">
                {plans.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentPlanIndex(idx)}
                        className={cn(
                            "px-3 py-1 rounded-md text-sm transition-all",
                            currentPlanIndex === idx
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-zinc-900 border hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        )}
                    >
                        Opsi {idx + 1}
                    </button>
                ))}
            </div>
            <button
                onClick={handleDownload}
                className="ml-auto flex items-center gap-2 px-4 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-md text-sm hover:opacity-90 transition-opacity"
            >
                <Download size={16} />
                Export JSON
            </button>
        </div>
    );
}
