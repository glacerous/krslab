"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { parseBimaMasterWithDebug } from "@krs/engine";
import { SAMPLE_BIMA_TEXT } from "@/lib/sample-data";
import { toast } from "sonner";
import { X, Calendar, Clipboard, ArrowRight, Trash2, Check, Copy, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataModalProps {
    isOpen: boolean;
    onClose: () => void;
    editSourceId?: string | null;
}

export function DataModal({ isOpen, onClose, editSourceId }: DataModalProps) {
    const {
        datasources,
        activeDatasourceId,
        setActiveDatasourceId,
        deleteDatasource,
        updateDatasource,
        importDatasourceAndCreatePlan,
        plans,
        setActivePlanId
    } = useAppStore();

    const isEditMode = Boolean(editSourceId);
    const editSource = useMemo(() => datasources.find(d => d.id === editSourceId), [datasources, editSourceId]);
    const editSourceTotalClasses = editSource
        ? editSource.subjects.reduce((sum, s) => sum + s.classes.length, 0)
        : 0;

    const [rawText, setRawText] = useState("");
    const [sourceName, setSourceName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync form state when modal opens or editSource changes
    useEffect(() => {
        if (isOpen) {
            if (editSource) {
                setSourceName(editSource.name);
            } else {
                setSourceName("");
            }
            setRawText("");
            setIsSubmitting(false);
        }
    }, [isOpen, editSource]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Live parsing feedback
    const parseResult = useMemo(() => {
        const trimmed = rawText.trim();
        if (!trimmed) return null;
        try {
            const res = parseBimaMasterWithDebug(trimmed);
            const subjects = res.subjects || [];
            const classCount = subjects.reduce((sum, s) => sum + s.classes.length, 0);
            if (subjects.length === 0) {
                return {
                    ok: false,
                    error: "No course rows recognized. Ensure table columns match BIMA format.",
                    subjects: [],
                    classCount: 0
                };
            }
            return { ok: true, subjects, classCount, error: null };
        } catch (err: any) {
            return {
                ok: false,
                error: err?.message || "Failed to parse table format",
                subjects: [],
                classCount: 0
            };
        }
    }, [rawText]);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setRawText(text);
                toast.success("Pasted from clipboard!");
            }
        } catch {
            toast.error("Clipboard access restricted. Please paste directly with Ctrl+V.");
        }
    };

    const handleCopyExistingData = async () => {
        if (!editSource) return;
        try {
            const lines = editSource.subjects.flatMap(s =>
                s.classes.flatMap(c =>
                    c.meetings.map(m =>
                        `${s.code}\t${s.name}\t${s.sks}\t${c.className}\t${m.day} ${m.start}-${m.end}\t${m.room}\t${c.lecturers.join(", ")}`
                    )
                )
            );
            await navigator.clipboard.writeText(lines.join("\n"));
            toast.success("Copied course schedule data to clipboard!");
        } catch {
            toast.error("Could not copy to clipboard");
        }
    };

    const handleLoadSample = () => {
        const existingSample = datasources.find(d =>
            d.id.startsWith("sample") || d.name.toLowerCase().includes("sample")
        );
        if (existingSample) {
            setActiveDatasourceId(existingSample.id);
            const existingPlan = plans.find(p => p.datasourceId === existingSample.id);
            if (existingPlan) {
                setActivePlanId(existingPlan.id);
            }
            toast.info("Switched to existing Sample Schedule");
            onClose();
            return;
        }
        const parsed = parseBimaMasterWithDebug(SAMPLE_BIMA_TEXT);
        const { planId } = importDatasourceAndCreatePlan("Sample UPNYK Informatics", parsed.subjects);
        const sampleSubIds = parsed.subjects.slice(0, 5).map(s => s.subjectId);
        useAppStore.getState().updatePlan(planId, {
            name: "Semester 4",
            selectedSubjectIds: sampleSubIds
        });
        toast.success("Sample Data Loaded!");
        onClose();
    };

    const handleDeleteSource = () => {
        if (!editSource) return;
        if (confirm(`Delete schedule "${editSource.name}" and its associated plans?`)) {
            deleteDatasource(editSource.id);
            toast.success("Source deleted");
            onClose();
        }
    };

    const handleSubmit = () => {
        if (isEditMode) {
            if (!editSource) return;
            setIsSubmitting(true);
            try {
                if (rawText.trim()) {
                    if (!parseResult?.ok || parseResult.subjects.length === 0) {
                        toast.error("Could not parse schedule data", {
                            description: parseResult?.error || "Check the pasted table format."
                        });
                        setIsSubmitting(false);
                        return;
                    }
                    updateDatasource(editSource.id, {
                        name: sourceName.trim() || editSource.name,
                        subjects: parseResult.subjects
                    });
                    toast.success("Schedule source updated!", {
                        description: `Updated with ${parseResult.subjects.length} courses.`
                    });
                } else {
                    // Just updating name
                    updateDatasource(editSource.id, {
                        name: sourceName.trim() || editSource.name
                    });
                    toast.success("Source renamed!");
                }
                setIsSubmitting(false);
                onClose();
            } catch (err: any) {
                setIsSubmitting(false);
                toast.error("Failed to update source", { description: err?.message });
            }
            return;
        }

        // Create Mode
        const text = rawText.trim();
        if (!text) {
            toast.error("Paste your BIMA table data first");
            return;
        }

        if (!parseResult?.ok || parseResult.subjects.length === 0) {
            toast.error("Could not parse schedule data", {
                description: parseResult?.error || "Make sure you copied the 'Jadwal Dosen' table from BIMA."
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { planId } = importDatasourceAndCreatePlan(
                sourceName.trim(),
                parseResult.subjects
            );

            if (sourceName.toLowerCase().includes("sample")) {
                const sampleSubIds = parseResult.subjects.slice(0, 5).map(s => s.subjectId);
                useAppStore.getState().updatePlan(planId, {
                    selectedSubjectIds: sampleSubIds
                });
            }

            toast.success("Schedule Imported!", {
                description: `Successfully loaded ${parseResult.subjects.length} courses.`
            });

            setRawText("");
            setSourceName("");
            setIsSubmitting(false);
            onClose();
        } catch (err: any) {
            setIsSubmitting(false);
            toast.error("Failed to parse data", {
                description: err?.message || "Please check the pasted format."
            });
        }
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
                {/* Header (No Database Icon, Clean Editorial) */}
                <div className="p-5 px-6 border-b border-[#e6e6e3] flex items-center justify-between bg-[#fbfbfa]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-[#e6e6e3] flex items-center justify-center text-[#141413]">
                            {isEditMode ? (
                                <FileText className="w-4 h-4 text-[#5b82a6]" />
                            ) : (
                                <Calendar className="w-4 h-4 text-[#5b82a6]" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-[#141413] tracking-tight">
                                {isEditMode ? "Edit schedule source" : "Import BIMA schedule"}
                            </h2>
                            <p className="text-[12.5px] text-[#6e6e77]">
                                {isEditMode
                                    ? "Rename this source or paste updated BIMA schedule text."
                                    : "Paste your Jadwal Dosen table from bima.upnyk.ac.id."}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100 transition-colors"
                        title="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                    {/* 1. Source Name Input */}
                    <div className="space-y-1.5">
                        <label className="text-[12.5px] font-medium text-[#141413]">
                            Source name
                        </label>
                        <input
                            type="text"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                            placeholder={
                                isEditMode
                                    ? "Source name"
                                    : "e.g. Semester 4 Informatika (optional — auto-named if left blank)"
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#fafaf9] border border-[#e2e2de] focus:border-[#141413] focus:bg-white outline-none text-[13px] text-[#141413] placeholder:text-[#a1a1aa] transition-colors"
                        />
                    </div>

                    {/* 2. Compact 3-Step Doodle Hint (No Nested Grey Boxes!) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-1 select-none">
                        <div className="flex items-center gap-2">
                            <span className="font-doodle text-[18px] font-bold text-[#5b82a6] leading-none shrink-0">
                                01
                            </span>
                            <span className="text-[12px] text-[#6e6e77] leading-tight">
                                Open BIMA → <strong className="text-[#141413] font-medium">Jadwal Dosen</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-doodle text-[18px] font-bold text-[#5b82a6] leading-none shrink-0">
                                02
                            </span>
                            <span className="text-[12px] text-[#6e6e77] leading-tight">
                                Copy all table rows (<kbd className="font-mono text-[10px] bg-[#f3f3f0] border border-[#e2e2de] px-1 py-0.5 rounded">Ctrl+C</kbd>)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-doodle text-[18px] font-bold text-[#5b82a6] leading-none shrink-0">
                                03
                            </span>
                            <span className="text-[12px] text-[#6e6e77] leading-tight">
                                Paste below
                            </span>
                        </div>
                    </div>

                    {/* 3. Raw BIMA Textarea + Live Feedback */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-doodle text-[17px] font-bold text-[#5b82a6] select-none">
                                bima table data
                            </span>

                            <div className="flex items-center gap-2">
                                {isEditMode && editSource && (
                                    <button
                                        type="button"
                                        onClick={handleCopyExistingData}
                                        className="text-[12px] font-medium text-[#6e6e77] hover:text-[#141413] flex items-center gap-1 transition-colors"
                                        title="Copy existing courses to clipboard"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy data</span>
                                    </button>
                                )}

                                {rawText && (
                                    <button
                                        type="button"
                                        onClick={() => setRawText("")}
                                        className="text-[12px] font-medium text-[#a1a1aa] hover:text-[#141413] transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handlePaste}
                                    className="text-[12px] font-medium text-[#5b82a6] flex items-center gap-1 hover:underline"
                                >
                                    <Clipboard className="w-3.5 h-3.5" />
                                    <span>Paste from clipboard</span>
                                </button>
                            </div>
                        </div>

                        {/* Summary pill in Edit Mode when rawText is empty */}
                        {isEditMode && editSource && !rawText.trim() && (
                            <div className="p-2.5 rounded-xl bg-neutral-50 border border-[#e6e6e3] text-[12px] text-[#6e6e77] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5b82a6] shrink-0" />
                                <span>
                                    Currently holds <strong className="text-[#141413]">{editSource.subjects.length} courses</strong> ({editSourceTotalClasses} classes) — paste new BIMA text below only if you want to replace the courses.
                                </span>
                            </div>
                        )}

                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Paste copied table text here (Ctrl + V)...&#10;e.g. INFORMATIKA  123001  Pemrograman Web  3  IF-A  40  Senin 07:00-09:30  Lab. 1"
                            rows={rawText ? 5 : 4}
                            className="w-full p-3 rounded-xl bg-[#fafaf9] border border-[#e2e2de] focus:border-[#141413] focus:bg-white outline-none font-mono text-[11.5px] text-[#141413] placeholder:text-[#a1a1aa] transition-colors leading-relaxed"
                        />

                        {/* Live Parser Feedback */}
                        {parseResult && (
                            <div
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150",
                                    parseResult.ok
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                                        : "bg-amber-50 text-amber-800 border border-amber-200/80"
                                )}
                            >
                                {parseResult.ok ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>✓ Detected {parseResult.subjects.length} courses ({parseResult.classCount} classes)</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>{parseResult.error}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-[#e6e6e3] bg-[#fbfbfa] flex items-center justify-between gap-4">
                    <div>
                        {isEditMode ? (
                            <button
                                type="button"
                                onClick={handleDeleteSource}
                                className="text-[12.5px] font-medium text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete source</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleLoadSample}
                                className="text-[12.5px] font-medium text-[#5b82a6] hover:text-[#416282] hover:underline transition-colors"
                            >
                                Use sample Informatics data
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-tactile-light px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-[#6e6e77] hover:text-[#141413] transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!isEditMode && (!rawText.trim() || !parseResult?.ok))}
                            className={cn(
                                "btn-tactile-dark px-4 py-1.5 rounded-lg text-[13px] font-medium text-white transition-all flex items-center gap-1.5 select-none",
                                (isSubmitting || (!isEditMode && (!rawText.trim() || !parseResult?.ok))) &&
                                    "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span>
                                {isSubmitting
                                    ? "Saving..."
                                    : isEditMode
                                        ? "Save changes"
                                        : "Import schedule"}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
