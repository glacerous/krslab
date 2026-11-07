"use client";

import { useState, useEffect } from "react";
import { useAppStore, Subject, ClassSchedule } from "@/lib/store";
import { formatDay } from "@/lib/i18n";
import { X, Plus, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CustomCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SectionDraft {
    id: string;
    className: string;
    day: string;
    start: string;
    end: string;
    room: string;
    lecturer: string;
}

const DEFAULT_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function normalizeTimeInput(val: string): string {
    const cleaned = val.trim().replace(/\./g, ":");
    const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return cleaned;
    const hh = match[1].padStart(2, "0");
    const mm = match[2];
    return `${hh}:${mm}`;
}

export function CustomCourseModal({ isOpen, onClose }: CustomCourseModalProps) {
    const {
        datasources,
        activeDatasourceId,
        activePlanId,
        addSubjectToDatasource,
        createEmptyDatasource,
        language
    } = useAppStore();

    const isId = language === "id";

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [sks, setSks] = useState(3);
    const [sections, setSections] = useState<SectionDraft[]>([
        {
            id: "sec_1",
            className: "A",
            day: "Senin",
            start: "08:00",
            end: "10:30",
            room: "",
            lecturer: ""
        }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setName("");
            setCode("");
            setSks(3);
            setSections([
                {
                    id: `sec_${Date.now()}_1`,
                    className: "A",
                    day: "Senin",
                    start: "08:00",
                    end: "10:30",
                    room: "",
                    lecturer: ""
                }
            ]);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const handleAddSection = () => {
        const nextChar = String.fromCharCode(65 + Math.min(sections.length, 25));
        const lastSec = sections[sections.length - 1];
        setSections((prev) => [
            ...prev,
            {
                id: `sec_${Date.now()}_${prev.length + 1}`,
                className: nextChar,
                day: lastSec ? lastSec.day : "Senin",
                start: lastSec ? lastSec.start : "08:00",
                end: lastSec ? lastSec.end : "10:30",
                room: lastSec ? lastSec.room : "",
                lecturer: lastSec ? lastSec.lecturer : ""
            }
        ]);
    };

    const handleRemoveSection = (index: number) => {
        if (sections.length <= 1) return;
        setSections((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSectionChange = (index: number, field: keyof SectionDraft, val: string) => {
        setSections((prev) =>
            prev.map((sec, i) => (i === index ? { ...sec, [field]: val } : sec))
        );
    };

    const handleSubmit = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error(isId ? "Nama matkul wajib diisi" : "Course name is required");
            return;
        }

        // Validate sections
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            const normStart = normalizeTimeInput(sec.start);
            const normEnd = normalizeTimeInput(sec.end);
            if (!/^\d{2}:\d{2}$/.test(normStart) || !/^\d{2}:\d{2}$/.test(normEnd)) {
                toast.error(
                    isId
                        ? `Format waktu tidak valid pada kelas ${sec.className || i + 1} (contoh: 08:00)`
                        : `Invalid time format in section ${sec.className || i + 1} (e.g. 08:00)`
                );
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Determine datasource and plan
            let targetDsId = activeDatasourceId;
            let targetPlanId = activePlanId;

            if (!targetDsId || !datasources.some((d) => d.id === targetDsId)) {
                // Auto create empty datasource if none exists
                const created = createEmptyDatasource(
                    isId ? "Jadwal Semester" : "Semester Schedule"
                );
                targetDsId = created.datasourceId;
                targetPlanId = created.planId;
            }

            const subjectId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const subjectCode =
                code.trim() ||
                trimmedName
                    .split(/\s+/)
                    .map((w) => w[0]?.toUpperCase() || "")
                    .join("")
                    .slice(0, 6) ||
                "CUST";

            const classes: ClassSchedule[] = sections.map((sec, idx) => {
                const normStart = normalizeTimeInput(sec.start);
                const normEnd = normalizeTimeInput(sec.end);
                return {
                    classId: `${subjectId}_c${idx + 1}`,
                    className: sec.className.trim() || String.fromCharCode(65 + idx),
                    meetings: [
                        {
                            day: sec.day,
                            start: normStart,
                            end: normEnd,
                            room: sec.room.trim() || "TBA"
                        }
                    ],
                    lecturers: sec.lecturer.trim() ? [sec.lecturer.trim()] : []
                };
            });

            const newSubject: Subject = {
                subjectId,
                code: subjectCode,
                name: trimmedName,
                sks,
                classes
            };

            addSubjectToDatasource(targetDsId, newSubject, targetPlanId || undefined);

            toast.success(
                isId
                    ? `Matkul "${trimmedName}" berhasil ditambahkan ke jadwal!`
                    : `Added "${trimmedName}" to your schedule!`
            );

            onClose();
        } catch (err: any) {
            toast.error(isId ? "Gagal menyimpan mata kuliah" : "Failed to add course", {
                description: err?.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div
                className="relative w-full max-w-xl bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 px-6 border-b border-[#e6e6e3] dark:border-[#2e2e34] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#18181b]">
                    <div>
                        <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none mb-1">
                            {isId ? "buat matkul manual" : "custom course builder"}
                        </span>
                        <h2 className="text-[17px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight">
                            {isId ? "Tambah Mata Kuliah Manual" : "Add Custom Course"}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors"
                        title="Close modal"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                    {/* 1. Name & Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6]">
                                {isId ? "Nama Mata Kuliah" : "Course Name"} *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={isId ? "contoh: Struktur Data" : "e.g. Data Structures"}
                                autoFocus
                                className="w-full px-3 py-2 rounded-xl bg-[#fafaf9] dark:bg-[#141416] border border-[#e2e2de] dark:border-[#2e2e34] focus:border-[#141413] dark:focus:border-[#f4f4f6] focus:bg-white dark:focus:bg-[#18181b] outline-none text-[13px] text-[#141413] dark:text-[#f4f4f6] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] transition-colors"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6]">
                                {isId ? "Kode (opsional)" : "Code (optional)"}
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="CS201"
                                className="w-full px-3 py-2 rounded-xl bg-[#fafaf9] dark:bg-[#141416] border border-[#e2e2de] dark:border-[#2e2e34] focus:border-[#141413] dark:focus:border-[#f4f4f6] focus:bg-white dark:focus:bg-[#18181b] outline-none font-mono text-[13px] text-[#141413] dark:text-[#f4f4f6] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] transition-colors"
                            />
                        </div>
                    </div>

                    {/* 2. SKS Selector (Tactile Pill Buttons) */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6]">
                                {isId ? "Beban SKS (Kredit)" : "Credits (SKS)"}
                            </label>
                            <span className="font-doodle text-[14px] text-[#6e6e77] dark:text-[#a1a1aa]">
                                {sks} {isId ? "sks dipilih" : "sks selected"}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setSks(num)}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all select-none border",
                                        sks === num
                                            ? "bg-[#141413] dark:bg-[#f4f4f6] border-[#141413] dark:border-[#f4f4f6] text-white dark:text-[#141413] shadow-sm font-semibold"
                                            : "bg-[#fafaf9] dark:bg-[#141416] border-[#e2e2de] dark:border-[#2e2e34] text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Class Sections List */}
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-[12.5px] font-medium text-[#141413] dark:text-[#f4f4f6] block">
                                    {isId ? "Pilihan Kelas & Jadwal" : "Class Sections & Schedules"}
                                </label>
                                <p className="text-[11.5px] text-[#6e6e77] dark:text-[#a1a1aa]">
                                    {isId
                                        ? "Bisa tambah beberapa kelas (A, B) agar dapat diswap atau diatur otomatis."
                                        : "Add multiple sections (A, B) to enable auto-scheduling & swapping."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddSection}
                                className="text-[12px] font-medium text-[#5b82a6] dark:text-[#7dd3fc] hover:underline flex items-center gap-1 shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{isId ? "Tambah kelas" : "Add section"}</span>
                            </button>
                        </div>

                        {/* Sections Rows */}
                        <div className="space-y-3">
                            {sections.map((sec, idx) => (
                                <div
                                    key={sec.id}
                                    className="p-3.5 rounded-xl bg-[#fafaf9] dark:bg-[#141416] border border-[#e2e2de] dark:border-[#2e2e34] space-y-2.5 transition-colors"
                                >
                                    {/* Section header: Class Label & Delete */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                                                {isId ? `Kelas ${idx + 1}` : `Section ${idx + 1}`}
                                            </span>
                                            <div className="flex items-center gap-1 text-[11px] text-[#a1a1aa]">
                                                <span>·</span>
                                                <span>{sec.className ? `Kelas ${sec.className}` : ""}</span>
                                            </div>
                                        </div>

                                        {sections.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSection(idx)}
                                                className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                                                title={isId ? "Hapus kelas ini" : "Remove section"}
                                                aria-label={isId ? `Hapus kelas ${sec.className || idx + 1}` : `Remove section ${sec.className || idx + 1}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Row Fields */}
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                        {/* Class Name */}
                                        <div className="col-span-1 sm:col-span-1">
                                            <label className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] block mb-1">
                                                {isId ? "Kelas" : "Section"}
                                            </label>
                                            <input
                                                type="text"
                                                value={sec.className}
                                                onChange={(e) => handleSectionChange(idx, "className", e.target.value)}
                                                placeholder="A"
                                                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1f1f23] border border-[#e2e2de] dark:border-[#2e2e34] text-xs text-[#141413] dark:text-[#f4f4f6] font-medium outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6]"
                                            />
                                        </div>

                                        {/* Day */}
                                        <div className="col-span-1 sm:col-span-2">
                                            <label className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] block mb-1">
                                                {isId ? "Hari" : "Day"}
                                            </label>
                                            <select
                                                value={sec.day}
                                                onChange={(e) => handleSectionChange(idx, "day", e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#1f1f23] border border-[#e2e2de] dark:border-[#2e2e34] text-xs text-[#141413] dark:text-[#f4f4f6] outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6]"
                                            >
                                                {DEFAULT_DAYS.map((d) => (
                                                    <option key={d} value={d}>
                                                        {formatDay(d, language)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Start Time */}
                                        <div className="col-span-1 sm:col-span-1">
                                            <label className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] block mb-1">
                                                {isId ? "Mulai" : "Start"}
                                            </label>
                                            <input
                                                type="text"
                                                value={sec.start}
                                                onChange={(e) => handleSectionChange(idx, "start", e.target.value)}
                                                placeholder="08:00"
                                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#1f1f23] border border-[#e2e2de] dark:border-[#2e2e34] text-xs font-mono text-[#141413] dark:text-[#f4f4f6] outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6]"
                                            />
                                        </div>

                                        {/* End Time */}
                                        <div className="col-span-1 sm:col-span-1">
                                            <label className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] block mb-1">
                                                {isId ? "Selesai" : "End"}
                                            </label>
                                            <input
                                                type="text"
                                                value={sec.end}
                                                onChange={(e) => handleSectionChange(idx, "end", e.target.value)}
                                                placeholder="10:30"
                                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#1f1f23] border border-[#e2e2de] dark:border-[#2e2e34] text-xs font-mono text-[#141413] dark:text-[#f4f4f6] outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6]"
                                            />
                                        </div>

                                        {/* Room */}
                                        <div className="col-span-1 sm:col-span-1">
                                            <label className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] block mb-1">
                                                {isId ? "Ruang" : "Room"}
                                            </label>
                                            <input
                                                type="text"
                                                value={sec.room}
                                                onChange={(e) => handleSectionChange(idx, "room", e.target.value)}
                                                placeholder="B-201"
                                                className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#1f1f23] border border-[#e2e2de] dark:border-[#2e2e34] text-xs text-[#141413] dark:text-[#f4f4f6] outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6]"
                                            />
                                        </div>
                                    </div>

                                    {/* Lecturer Row */}
                                    <div>
                                        <input
                                            type="text"
                                            value={sec.lecturer}
                                            onChange={(e) => handleSectionChange(idx, "lecturer", e.target.value)}
                                            placeholder={isId ? "Nama Dosen (opsional)" : "Lecturer name (optional)"}
                                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f1f23] border border-[#e2e2de] dark:border-[#2e2e34] text-[11.5px] text-[#141413] dark:text-[#f4f4f6] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Another Class Section Button */}
                        <button
                            type="button"
                            onClick={handleAddSection}
                            className="w-full py-2 rounded-xl border border-dashed border-[#d4d4d0] dark:border-[#3f3f46] hover:border-[#141413] dark:hover:border-[#f4f4f6] text-[12.5px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                                {isId
                                    ? "+ Tambah pilihan kelas lain (Kelas B, C...)"
                                    : "+ Add another class option (Section B, C...)"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-[#e6e6e3] dark:border-[#2e2e34] bg-[#fbfbfa] dark:bg-[#18181b] flex items-center justify-between">
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
                        disabled={isSubmitting || !name.trim()}
                        className={cn(
                            "btn-tactile-dark px-4 py-1.5 rounded-lg text-[13px] font-medium text-white transition-all flex items-center gap-1.5 select-none",
                            (isSubmitting || !name.trim()) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <span>
                            {isSubmitting
                                ? isId
                                    ? "Menyimpan..."
                                    : "Saving..."
                                : isId
                                    ? "Tambahkan ke Rencana"
                                    : "Add Course to Plan"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
