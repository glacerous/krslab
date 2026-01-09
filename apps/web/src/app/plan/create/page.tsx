"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ChevronRight, Database, CheckSquare, Square, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreatePlanPage() {
    const router = useRouter();
    const { datasources, addPlan } = useAppStore();

    const [name, setName] = useState("");
    const [selectedDsId, setSelectedDsId] = useState("");
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

    const selectedDs = useMemo(() =>
        datasources.find(d => d.id === selectedDsId),
        [datasources, selectedDsId]);

    const totalSks = useMemo(() => {
        if (!selectedDs) return 0;
        return selectedDs.subjects
            .filter(s => selectedSubjectIds.includes(s.subjectId))
            .reduce((acc, s) => acc + s.sks, 0);
    }, [selectedDs, selectedSubjectIds]);

    const handleToggleSubject = (id: string) => {
        setSelectedSubjectIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreate = () => {
        if (!name || !selectedDsId || selectedSubjectIds.length === 0) return;

        const planId = addPlan({
            name,
            datasourceId: selectedDsId,
            selectedSubjectIds,
            selectedClassBySubjectId: {},
        });

        router.push(`/plan/${planId}`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-10">
                <h2 className="text-3xl font-bold tracking-tight">Create New Plan</h2>
                <p className="text-zinc-500">Select a datasource and pick the subjects you want to take.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Card: Form */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 border-b pb-3">Plan Details</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Plan Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Optimis Lulus!"
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Select Datasource</label>
                                <select
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat"
                                    value={selectedDsId}
                                    onChange={(e) => {
                                        setSelectedDsId(e.target.value);
                                        setSelectedSubjectIds([]);
                                    }}
                                >
                                    <option value="">-- Choose Datasource --</option>
                                    {datasources.map(ds => (
                                        <option key={ds.id} value={ds.id}>{ds.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="flex justify-between items-end border-b pb-2">
                                    <span className="text-zinc-500 text-sm">Selected Subjects</span>
                                    <span className="text-2xl font-black text-blue-600 leading-none">{selectedSubjectIds.length}</span>
                                </div>
                                <div className="flex justify-between items-end border-b pb-2">
                                    <span className="text-zinc-500 text-sm">Total SKS</span>
                                    <span className="text-2xl font-black text-blue-600 leading-none">{totalSks}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={!name || !selectedDsId || selectedSubjectIds.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                            >
                                CREATE PLAN <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Card: Subject Selection */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[70vh]">
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Choose Subjects</h3>
                            {!selectedDs && <p className="text-xs text-orange-600 flex items-center gap-1"><Info className="w-3 h-3" /> Select a datasource first</p>}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {selectedDs ? (
                                selectedDs.subjects.map(s => {
                                    const isSelected = selectedSubjectIds.includes(s.subjectId);
                                    return (
                                        <div
                                            key={s.subjectId}
                                            onClick={() => handleToggleSubject(s.subjectId)}
                                            className={cn(
                                                "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4",
                                                isSelected
                                                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                                                    : "border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            {isSelected ? <CheckSquare className="w-6 h-6 text-blue-600" /> : <Square className="w-6 h-6 text-zinc-300" />}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">{s.code}</span>
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{s.sks} SKS</span>
                                                </div>
                                                <h4 className="font-bold">{s.name}</h4>
                                                <p className="text-xs text-zinc-500">{s.classes.length} classes available</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-50 space-y-4">
                                    <Database className="w-16 h-16" />
                                    <p className="font-medium">No datasource selected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
