"use client";

import React, { useState, useMemo } from "react";
import { useKrsStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CourseList() {
    const { allSubjects, selectedSubjectIds, toggleSubject, generatePlans } = useKrsStore();
    const [search, setSearch] = useState("");

    const filteredSubjects = useMemo(() => {
        return allSubjects.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.code.toLowerCase().includes(search.toLowerCase())
        );
    }, [allSubjects, search]);

    if (allSubjects.length === 0) return null;

    return (
        <div className="flex flex-col gap-4 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-full">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Daftar Mata Kuliah</h2>
                <button
                    onClick={generatePlans}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Generate Plan
                </button>
            </div>

            <input
                type="text"
                placeholder="Cari Mata Kuliah atau Kode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="overflow-y-auto max-h-[500px] flex flex-col gap-2 pr-2">
                {filteredSubjects.map((subject) => (
                    <div
                        key={subject.id}
                        onClick={() => toggleSubject(subject.id)}
                        className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all",
                            selectedSubjectIds.includes(subject.id)
                                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                : "bg-white border-zinc-100 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800"
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{subject.code}</span>
                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{subject.name}</h3>
                                <p className="text-sm text-zinc-500">{subject.className} • {subject.credits} SKS</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    {subject.schedule.day}
                                </span>
                                <p className="text-xs text-zinc-500">
                                    {subject.schedule.intervalTime.start.hour.toString().padStart(2, '0')}:
                                    {subject.schedule.intervalTime.start.minute.toString().padStart(2, '0')} -
                                    {subject.schedule.intervalTime.end.hour.toString().padStart(2, '0')}:
                                    {subject.schedule.intervalTime.end.minute.toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
