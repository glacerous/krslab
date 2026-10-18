"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { parseBimaMasterWithDebug } from "@krs/engine";
import { SAMPLE_BIMA_TEXT } from "@/lib/sample-data";
import { toast } from "sonner";
import { X, Database, Calendar, Clipboard, ArrowRight, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DataModal({ isOpen, onClose }: DataModalProps) {
    const {
        datasources,
        activeDatasourceId,
        setActiveDatasourceId,
        deleteDatasource,
        importDatasourceAndCreatePlan,
        plans,
        addPlan,
        setActivePlanId
    } = useAppStore();

    const [activeTab, setActiveTab] = useState<"import" | "manage">("import");
    const [rawText, setRawText] = useState("");
    const [customName, setCustomName] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setRawText(text);
            toast.success("Pasted from clipboard!");
        } catch {
            toast.error("Clipboard access restricted. Please paste directly into the box.");
        }
    };

    const handleImport = (textToImport?: string, sourceName?: string) => {
        const text = textToImport || rawText;
        if (!text.trim()) {
            toast.error("Paste your BIMA table data first");
            return;
        }

        setIsParsing(true);
        try {
            const result = parseBimaMasterWithDebug(text);
            if (!result.subjects || result.subjects.length === 0) {
                toast.error("Could not parse schedule data", {
                    description: "Make sure you copied the 'Jadwal Dosen' table from BIMA."
                });
                setIsParsing(false);
                return;
            }

            const { planId } = importDatasourceAndCreatePlan(
                sourceName || customName,
                result.subjects
            );

            // If sample data, pre-select first 5 subjects for instant delight!
            if (sourceName?.includes("Sample")) {
                const sampleSubIds = result.subjects.slice(0, 5).map(s => s.subjectId);
                useAppStore.getState().updatePlan(planId, {
                    selectedSubjectIds: sampleSubIds
                });
            }

            toast.success("Schedule Imported!", {
                description: `Successfully loaded ${result.subjects.length} courses.`
            });

            setRawText("");
            setCustomName("");
            setIsParsing(false);
            onClose();
        } catch (err: any) {
            console.error("Parse error:", err);
            toast.error("Failed to parse data", {
                description: err?.message || "Please check the pasted format."
            });
            setIsParsing(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const handleLoadSample = () => {
        const existingSample = datasources.find(d =>
            d.id.startsWith("sample") || d.name.toLowerCase().includes("sample")
        );
        if (existingSample) {
            handleSwitchDatasource(existingSample.id);
            toast.info("Switched to existing Sample Schedule");
            return;
        }
        handleImport(SAMPLE_BIMA_TEXT, "Sample UPNYK Informatics");
    };

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
                savedVariants: []
            });
            setActivePlanId(newPlanId);
        }
        toast.success("Switched Schedule Data");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Card */}
            <div
                className="relative w-full max-w-2xl bg-white border border-[#e6e6e3] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header: Zero All-Caps, Clean Editorial */}
                <div className="p-5 px-6 border-b border-[#e6e6e3] flex items-center justify-between bg-[#fbfbfa]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-[#e6e6e3] flex items-center justify-center text-[#141413]">
                            <Database className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-semibold text-[#141413] tracking-tight">
                                Import your BIMA schedule
                            </h2>
                            <p className="text-[12.5px] text-[#6e6e77]">
                                Load your semester courses into KRSlab from BIMA UPNYK.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs: Normal Sentence Case */}
                {datasources.length > 0 && (
                    <div className="flex border-b border-[#e6e6e3] px-6 bg-[#fbfbfa]/50">
                        <button
                            onClick={() => setActiveTab("import")}
                            className={cn(
                                "py-2.5 px-3 text-[13px] font-medium border-b-2 transition-colors",
                                activeTab === "import"
                                    ? "border-[#141413] text-[#141413] font-semibold"
                                    : "border-transparent text-[#6e6e77] hover:text-[#141413]"
                            )}
                        >
                            Import new data
                        </button>
                        <button
                            onClick={() => setActiveTab("manage")}
                            className={cn(
                                "py-2.5 px-3 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-1.5",
                                activeTab === "manage"
                                    ? "border-[#141413] text-[#141413] font-semibold"
                                    : "border-transparent text-[#6e6e77] hover:text-[#141413]"
                            )}
                        >
                            <span>Saved sources</span>
                            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-[#6e6e77] border border-[#e8e8e3]">
                                {datasources.length}
                            </span>
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                    {activeTab === "import" ? (
                        <>
                            {/* Prominent "Try Sample Data →" Card at top */}
                            <div className="p-4 rounded-xl bg-[#fbfbfa] border border-[#e6e6e3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#141413]">
                                        <Calendar className="w-3.5 h-3.5 text-[#141413]" />
                                        <span>Just testing the app?</span>
                                    </div>
                                    <p className="text-[12px] text-[#6e6e77] leading-relaxed">
                                        Load a realistic UPNYK Informatics schedule (Senin–Sabtu) to test the solver in seconds.
                                    </p>
                                </div>
                                <button
                                    onClick={handleLoadSample}
                                    disabled={isParsing}
                                    className="shrink-0 btn-tactile-dark px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-white transition-all flex items-center gap-1.5 select-none"
                                >
                                    <span>Try Sample Data →</span>
                                </button>
                            </div>

                            {/* 3-Step Visual Guide (01, 02, 03 in Gaegu Doodle Font) */}
                            <div className="bg-[#f9f9f8] border border-[#e6e6e3] rounded-xl p-4 space-y-2.5">
                                <span className="text-[12.5px] font-semibold text-[#141413]">
                                    How to get your table from BIMA:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-[#6e6e77]">
                                    <div className="flex items-start gap-2">
                                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] shrink-0 leading-none pt-0.5 select-none">
                                            01
                                        </span>
                                        <p className="leading-snug">
                                            Log in to <strong className="text-[#141413] font-medium">bima.upnyk.ac.id</strong> and open <em>Menu Perkuliahan → Dosen → Jadwal Dosen</em>.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] shrink-0 leading-none pt-0.5 select-none">
                                            02
                                        </span>
                                        <p className="leading-snug">
                                            Highlight the entire schedule table and copy it (<kbd className="font-mono text-[10px] bg-white border border-[#e2e2de] px-1 py-0.5 rounded shadow-2xs">Ctrl + C</kbd> / <kbd className="font-mono text-[10px] bg-white border border-[#e2e2de] px-1 py-0.5 rounded shadow-2xs">⌘ + C</kbd>).
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-doodle text-[19px] font-bold text-[#5b82a6] shrink-0 leading-none pt-0.5 select-none">
                                            03
                                        </span>
                                        <p className="leading-snug">
                                            Paste it below (or click <strong>Paste from clipboard</strong>) and hit <strong>Load schedule</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Raw Table Textarea */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12.5px] font-medium text-[#141413]">
                                        Paste raw BIMA &quot;Jadwal Dosen&quot; table
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handlePaste}
                                        className="text-[12px] font-medium text-[#5b82a6] flex items-center gap-1 hover:underline"
                                    >
                                        <Clipboard className="w-3.5 h-3.5" />
                                        <span>Paste from clipboard</span>
                                    </button>
                                </div>

                                <textarea
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    placeholder="Paste copied table text here (Ctrl + V)...&#10;e.g. INFORMATIKA  123001  Pemrograman Web  3  IF-A  40  Senin 07:00-09:30  Lab. 1"
                                    rows={6}
                                    className="w-full p-3 rounded-xl bg-[#fafaf9] border border-[#e2e2de] focus:border-[#141413] focus:bg-white outline-none font-mono text-[11.5px] text-[#141413] placeholder:text-[#a1a1aa] transition-colors leading-relaxed"
                                />
                            </div>

                            {/* Schedule Label (Optional) */}
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-medium text-[#6e6e77]">
                                    Schedule label (optional)
                                </label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder={`e.g. 2024/2025 Semester Genap`}
                                    className="w-full px-3 py-2 rounded-xl bg-[#fafaf9] border border-[#e2e2de] focus:border-[#141413] focus:bg-white outline-none text-[12.5px] text-[#141413] placeholder:text-[#a1a1aa] transition-colors"
                                />
                            </div>
                        </>
                    ) : (
                        /* Manage Tab */
                        <div className="space-y-3">
                            <p className="text-[12.5px] text-[#6e6e77]">
                                Switch or delete saved course schedule databases:
                            </p>
                            <div className="space-y-2">
                                {datasources.map((ds) => {
                                    const isActive = ds.id === activeDatasourceId;
                                    const totalClasses = ds.subjects.reduce((sum, s) => sum + s.classes.length, 0);
                                    const totalSks = ds.subjects.reduce((sum, s) => sum + s.sks, 0);

                                    return (
                                        <div
                                            key={ds.id}
                                            onClick={() => handleSwitchDatasource(ds.id)}
                                            className={cn(
                                                "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all group",
                                                isActive
                                                    ? "bg-neutral-100/80 border-[#141413] shadow-xs"
                                                    : "bg-white border-[#e6e6e3] hover:border-[#141413]/40 hover:bg-neutral-50"
                                            )}
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-[13.5px] text-[#141413] truncate">
                                                        {ds.name}
                                                    </span>
                                                    {isActive && (
                                                        <span className="text-[10.5px] bg-[#141413] text-white font-medium px-2 py-0.5 rounded-full">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11.5px] text-[#6e6e77]">
                                                    {ds.subjects.length} Courses · {totalClasses} Sections · {totalSks} SKS available
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                                                {isActive && (
                                                    <Check className="w-4 h-4 text-[#141413]" />
                                                )}
                                                {datasources.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Delete schedule "${ds.name}" and its associated plans?`)) {
                                                                deleteDatasource(ds.id);
                                                                toast.success("Schedule deleted");
                                                            }
                                                        }}
                                                        className="p-1.5 text-[#a1a1aa] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete schedule"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: Sentence Case */}
                {activeTab === "import" && (
                    <div className="p-4 px-6 border-t border-[#e6e6e3] bg-[#fbfbfa] flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-tactile-light px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-[#6e6e77] hover:text-[#141413] transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={() => handleImport()}
                            disabled={isParsing || !rawText.trim()}
                            className={cn(
                                "btn-tactile-dark px-4 py-1.5 rounded-lg text-[13px] font-medium text-white transition-all flex items-center gap-1.5 select-none",
                                (isParsing || !rawText.trim()) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span>{isParsing ? "Loading..." : "Load schedule"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
