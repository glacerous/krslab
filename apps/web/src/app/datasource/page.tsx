"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { parseBimaMasterText } from "@krs/engine";
import { Database, FileText, CheckCircle2, AlertCircle, Plus } from "lucide-react";

export default function DatasourcePage() {
    const { datasources, addDatasource, deleteDatasource } = useAppStore();
    const [name, setName] = useState("");
    const [rawText, setRawText] = useState("");
    const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });

    const handleImport = () => {
        try {
            if (!name.trim()) {
                setStatus({ type: "error", message: "Please enter a name for the datasource." });
                return;
            }
            if (!rawText.trim()) {
                setStatus({ type: "error", message: "Please paste the BIMA text." });
                return;
            }

            const subjects = parseBimaMasterText(rawText);

            if (subjects.length === 0) {
                setStatus({ type: "error", message: "No subjects found. Check your text format." });
                return;
            }

            addDatasource(name, subjects);
            setStatus({ type: "success", message: `Imported ${subjects.length} subjects successfully.` });
            setRawText("");
            setName("");
            setTimeout(() => setStatus({ type: "idle" }), 3000);
        } catch (error) {
            console.error(error);
            setStatus({ type: "error", message: "Parsing failed. Check console for details." });
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-10">
                <h2 className="text-3xl font-bold tracking-tight">Manage Datasource</h2>
                <p className="text-zinc-500">Create global datasets from BIMA text to use in your plans.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="font-bold flex items-center gap-2 mb-4 text-blue-600">
                            <Plus className="w-4 h-4" /> Import New
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Datasource Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. SI Genap 2024"
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">BIMA Text</label>
                                <textarea
                                    placeholder="Paste raw text here..."
                                    className="w-full h-64 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-[10px] outline-none focus:ring-2 focus:ring-blue-500"
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleImport}
                                disabled={!name.trim() || !rawText.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white py-2 rounded-lg font-bold transition-all"
                            >
                                Import Dataset
                            </button>

                            {status.type !== "idle" && (
                                <div className={cn(
                                    "p-3 rounded-lg flex items-center gap-2 text-xs font-medium",
                                    status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                )}>
                                    {status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {status.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-lg">Saved Datasources ({datasources.length})</h3>
                    {datasources.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl opacity-50">
                            <Database className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                            <p>No datasources saved yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {datasources.map(ds => (
                                <div key={ds.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex justify-between items-center group">
                                    <div>
                                        <h4 className="font-bold text-lg">{ds.name}</h4>
                                        <p className="text-xs text-zinc-500">
                                            {ds.subjects.length} Subjects • {ds.subjects.reduce((acc, s) => acc + s.classes.length, 0)} Classes
                                        </p>
                                        <p className="text-[10px] text-zinc-400 mt-1">Imported on {new Date(ds.createdAt).toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteDatasource(ds.id)}
                                        className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
