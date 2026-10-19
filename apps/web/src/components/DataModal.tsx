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
        setActivePlanId,
        createEmptyDatasource,
        setIsCustomCourseModalOpen,
        language
    } = useAppStore();

    const isId = language === "id";

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
                    error: isId
                        ? "Tidak ada baris jadwal yang dikenali. Pastikan tabel berisi matkul dan jadwal."
                        : "No course rows recognized. Ensure table columns or text contain courses and schedules.",
                    subjects: [],
                    classCount: 0
                };
            }
            return { ok: true, subjects, classCount, error: null };
        } catch (err: any) {
            return {
                ok: false,
                error: err?.message || (isId ? "Gagal memproses format tabel" : "Failed to parse table format"),
                subjects: [],
                classCount: 0
            };
        }
    }, [rawText, isId]);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setRawText(text);
                toast.success(isId ? "Berhasil ditempel dari clipboard!" : "Pasted from clipboard!");
            }
        } catch {
            toast.error(isId ? "Akses clipboard dibatasi. Silakan tempel dengan Ctrl+V." : "Clipboard access restricted. Please paste directly with Ctrl+V.");
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
            toast.success(isId ? "Data jadwal berhasil disalin ke clipboard!" : "Copied course schedule data to clipboard!");
        } catch {
            toast.error(isId ? "Gagal menyalin ke clipboard" : "Could not copy to clipboard");
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
            toast.info(isId ? "Beralih ke Jadwal Sampel" : "Switched to existing Sample Schedule");
            onClose();
            return;
        }
        const parsed = parseBimaMasterWithDebug(SAMPLE_BIMA_TEXT);
        const sampleName = isId ? "Sampel Informatika" : "Sample Informatics";
        const { planId } = importDatasourceAndCreatePlan(sampleName, parsed.subjects);
        const sampleSubIds = parsed.subjects.slice(0, 5).map(s => s.subjectId);
        useAppStore.getState().updatePlan(planId, {
            name: "Plan 1",
            selectedSubjectIds: sampleSubIds
        });
        toast.success(isId ? "Data sampel dimuat!" : "Sample Data Loaded!");
        onClose();
    };

    const handleStartEmpty = () => {
        const activeDs = datasources.find(d => d.id === activeDatasourceId);
        if (!sourceName.trim() && activeDs && activeDs.subjects.length === 0) {
            setIsCustomCourseModalOpen(true);
            toast.info(isId ? "Sudah berada di lembar jadwal kosong." : "Already on an empty schedule sheet.");
            onClose();
            return;
        }
        const { datasourceId } = createEmptyDatasource(sourceName.trim() || undefined);
        setActiveDatasourceId(datasourceId);
        setIsCustomCourseModalOpen(true);
        toast.success(isId ? "Sumber jadwal kosong berhasil dibuat!" : "Created empty schedule source!");
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
            toast.error(isId ? "Tempel data tabel jadwalmu terlebih dahulu" : "Paste your schedule table data first");
            return;
        }

        if (!parseResult?.ok || parseResult.subjects.length === 0) {
            toast.error(isId ? "Format jadwal tidak dapat dibaca" : "Could not parse schedule data", {
                description: parseResult?.error || (isId
                    ? "Pastikan kamu menyalin tabel jadwal dari portal kampus (SIAKAD, BIMA, SIMASTER, SIAK-NG, dll) atau spreadsheet."
                    : "Make sure you copied a schedule table from your campus portal (SIAKAD, BIMA, SIMASTER, SIAK-NG, etc.) or spreadsheet.")
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

            toast.success(isId ? "Jadwal Berhasil Diimpor!" : "Schedule Imported!", {
                description: isId
                    ? `Berhasil memuat ${parseResult.subjects.length} mata kuliah.`
                    : `Successfully loaded ${parseResult.subjects.length} courses.`
            });

            setRawText("");
            setSourceName("");
            setIsSubmitting(false);
            onClose();
        } catch (err: any) {
            setIsSubmitting(false);
            toast.error(isId ? "Gagal memproses data" : "Failed to parse data", {
                description: err?.message || (isId ? "Silakan periksa format tabel yang ditempel." : "Please check the pasted format.")
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
                id="tour-data-modal"
                className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (No Database Icon, Clean Editorial) */}
                <div className="p-5 px-6 border-b border-[#e6e6e3] dark:border-[#2e2e34] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#18181b]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#27272a] border border-[#e6e6e3] dark:border-[#3f3f46] flex items-center justify-center text-[#141413] dark:text-[#f4f4f6]">
                            {isEditMode ? (
                                <FileText className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc]" />
                            ) : (
                                <Calendar className="w-4 h-4 text-[#5b82a6] dark:text-[#7dd3fc]" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight">
                                {isEditMode
                                    ? (isId ? "Edit sumber jadwal" : "Edit schedule source")
                                    : (isId ? "Impor jadwal kuliah" : "Import course schedule")}
                            </h2>
                            <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa]">
                                {isEditMode
                                    ? (isId
                                        ? "Ganti nama sumber ini atau tempel teks jadwal terbaru dari portal kampus atau spreadsheet."
                                        : "Rename this source or paste updated schedule text from your campus portal or spreadsheet.")
                                    : (isId
                                        ? "Salin & tempel tabel jadwal dari SIAKAD, SiakadCloud, BIMA, SIMASTER, SIAK-NG, SIX, SIAM, atau Excel/CSV."
                                        : "Copy & paste your schedule table from SIAKAD, SiakadCloud, BIMA, SIMASTER, SIAK-NG, SIX, SIAM, or Excel/CSV.")}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
                        title="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                    {/* 1. Source Name Input */}
                    <div className="space-y-1.5">
                        <label className="text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6]">
                            {isId ? "Nama sumber jadwal" : "Source name"}
                        </label>
                        <input
                            type="text"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                            placeholder={
                                isEditMode
                                    ? (isId ? "Nama sumber jadwal" : "Source name")
                                    : (isId
                                        ? "contoh: Semester 4 Informatika (opsional — otomatis jika dikosongkan)"
                                        : "e.g. Semester 4 Informatika (optional — auto-named if left blank)")
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#fafaf9] dark:bg-[#141416] border border-[#e2e2de] dark:border-[#2e2e34] focus:border-[#141413] dark:focus:border-[#f4f4f6] focus:bg-white dark:focus:bg-[#18181b] outline-none text-[13px] text-[#141413] dark:text-[#f4f4f6] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] transition-colors"
                        />
                    </div>

                    {/* 2. Compact 3-Step Doodle Hint (No Nested Grey Boxes!) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-1 select-none">
                        <div className="flex items-center gap-2">
                            <span className="font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] leading-none shrink-0">
                                01
                            </span>
                            <span className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] leading-tight">
                                {isId ? (
                                    <>Buka portal kampus (<strong className="text-[#141413] dark:text-[#f4f4f6] font-medium">Jadwal Kuliah / Dosen / KRS</strong>) atau spreadsheet</>
                                ) : (
                                    <>Open campus portal (<strong className="text-[#141413] dark:text-[#f4f4f6] font-medium">Jadwal Kuliah / Dosen / KRS</strong>) or spreadsheet</>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] leading-none shrink-0">
                                02
                            </span>
                            <span className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] leading-tight">
                                {isId ? (
                                    <>Sorot semua baris tabel (<kbd className="font-mono text-[10px] bg-[#f3f3f0] dark:bg-[#27272a] border border-[#e2e2de] dark:border-[#3f3f46] text-[#141413] dark:text-[#f4f4f6] px-1 py-0.5 rounded">Ctrl+C</kbd>)</>
                                ) : (
                                    <>Highlight all table rows (<kbd className="font-mono text-[10px] bg-[#f3f3f0] dark:bg-[#27272a] border border-[#e2e2de] dark:border-[#3f3f46] text-[#141413] dark:text-[#f4f4f6] px-1 py-0.5 rounded">Ctrl+C</kbd>)</>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] leading-none shrink-0">
                                03
                            </span>
                            <span className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] leading-tight">
                                {isId ? (
                                    <>Tempel di bawah ini (atau klik <strong className="text-[#141413] dark:text-[#f4f4f6] font-medium">Mulai sumber kosong</strong>)</>
                                ) : (
                                    <>Paste below (or click <strong className="text-[#141413] dark:text-[#f4f4f6] font-medium">Start empty source</strong>)</>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* 3. Raw Table Textarea + Live Feedback */}
                    <div id="tour-bima-paste-area" className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-doodle text-[17px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] select-none">
                                {isId ? "data tabel jadwal" : "schedule table data"}
                            </span>

                            <div className="flex items-center gap-2">
                                {isEditMode && editSource && (
                                    <button
                                        type="button"
                                        onClick={handleCopyExistingData}
                                        className="text-[12px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] flex items-center gap-1 transition-colors"
                                        title={isId ? "Salin jadwal yang ada ke clipboard" : "Copy existing courses to clipboard"}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>{isId ? "Salin data" : "Copy data"}</span>
                                    </button>
                                )}

                                {rawText && (
                                    <button
                                        type="button"
                                        onClick={() => setRawText("")}
                                        className="text-[12px] font-medium text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                                    >
                                        {isId ? "Hapus teks" : "Clear"}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handlePaste}
                                    className="text-[12px] font-medium text-[#5b82a6] dark:text-[#7dd3fc] flex items-center gap-1 hover:underline"
                                >
                                    <Clipboard className="w-3.5 h-3.5" />
                                    <span>{isId ? "Tempel dari clipboard" : "Paste from clipboard"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Summary pill in Edit Mode when rawText is empty */}
                        {isEditMode && editSource && !rawText.trim() && (
                            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#141416] border border-[#e6e6e3] dark:border-[#2e2e34] text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5b82a6] dark:bg-[#7dd3fc] shrink-0" />
                                <span>
                                    {isId ? (
                                        <>Saat ini berisi <strong className="text-[#141413] dark:text-[#f4f4f6]">{editSource.subjects.length} matkul</strong> ({editSourceTotalClasses} kelas) — tempel teks jadwal baru hanya jika ingin menggantinya.</>
                                    ) : (
                                        <>Currently holds <strong className="text-[#141413] dark:text-[#f4f4f6]">{editSource.subjects.length} courses</strong> ({editSourceTotalClasses} classes) — paste new schedule text below only if you want to replace the courses.</>
                                    )}
                                </span>
                            </div>
                        )}

                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={
                                isId
                                    ? "Tempel teks tabel jadwal di sini (Ctrl + V)...\nContoh: Kode | Mata Kuliah | SKS | Kelas | Hari Jam | Ruang\nMendukung SIAKAD, SiakadCloud, BIMA, SIMASTER, SIAK-NG, SIX, SIAM, Excel, CSV, TSV..."
                                    : "Paste copied schedule table text here (Ctrl + V)...\ne.g. Code | Course Name | Credits | Class | Day Time | Room\nSupports SIAKAD, SiakadCloud, BIMA, SIMASTER, SIAK-NG, SIX, SIAM, Excel, CSV, TSV..."
                            }
                            rows={rawText ? 5 : 4}
                            className="w-full p-3 rounded-xl bg-[#fafaf9] dark:bg-[#141416] border border-[#e2e2de] dark:border-[#2e2e34] focus:border-[#141413] dark:focus:border-[#f4f4f6] focus:bg-white dark:focus:bg-[#18181b] outline-none font-mono text-[11.5px] text-[#141413] dark:text-[#f4f4f6] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] transition-colors leading-relaxed"
                        />

                        {/* Live Parser Feedback */}
                        {parseResult && (
                            <div
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150",
                                    parseResult.ok
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                                )}
                            >
                                {parseResult.ok ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span>✓ {isId ? `Terdeteksi ${parseResult.subjects.length} matkul (${parseResult.classCount} kelas)` : `Detected ${parseResult.subjects.length} courses (${parseResult.classCount} classes)`}</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <span>{parseResult.error}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-[#e6e6e3] dark:border-[#2e2e34] bg-[#fbfbfa] dark:bg-[#18181b] flex items-center justify-between gap-4">
                    <div>
                        {isEditMode ? (
                            <button
                                type="button"
                                onClick={handleDeleteSource}
                                className="text-[12.5px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{isId ? "Hapus sumber" : "Delete source"}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleStartEmpty}
                                    className="text-[12.5px] font-medium text-[#5b82a6] dark:text-[#7dd3fc] hover:text-[#416282] dark:hover:text-[#bae6fd] hover:underline transition-colors"
                                >
                                    {isId ? "Mulai sumber kosong (input manual)" : "Start empty source (manual input)"}
                                </button>
                                <span className="text-[#a1a1aa] dark:text-[#71717a]">·</span>
                                <button
                                    type="button"
                                    onClick={handleLoadSample}
                                    className="text-[12.5px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:underline transition-colors"
                                >
                                    {isId ? "Gunakan sampel Informatika" : "Use sample Informatics data"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-tactile-light px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors"
                        >
                            {isId ? "Batal" : "Cancel"}
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
                                    ? (isId ? "Menyimpan..." : "Saving...")
                                    : isEditMode
                                        ? (isId ? "Simpan perubahan" : "Save changes")
                                        : (isId ? "Impor jadwal" : "Import schedule")}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
