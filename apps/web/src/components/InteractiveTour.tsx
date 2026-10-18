"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { X, ArrowRight, ArrowLeft, Check, FileText, Sparkles, Lock, RotateCw, ExternalLink, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface InteractiveTourProps {
    isOpen: boolean;
    onClose: () => void;
    onFocusFirstCourse: () => void;
    onClearFocus: () => void;
    onOpenImport?: () => void;
    selectedClasses?: any[];
}

interface StepConfig {
    targetId: string;
    stepNumber: string;
    doodleHeader: string;
    title: string;
    placement: "bottom" | "right" | "left";
}

const STEPS: StepConfig[] = [
    {
        targetId: "tour-datasource-btn",
        stepNumber: "01",
        doodleHeader: "step 01 of 05 · getting your bima data",
        title: "How to Copy Your Schedule from BIMA UPNYK",
        placement: "bottom"
    },
    {
        targetId: "tour-add-course-btn",
        stepNumber: "02",
        doodleHeader: "step 02 of 05 · picking your courses",
        title: "Adding Your Semester Courses",
        placement: "right"
    },
    {
        targetId: "tour-first-node",
        stepNumber: "03",
        doodleHeader: "step 03 of 05 · drag & see every possibility",
        title: "Dragging & Exploring Every Possibility",
        placement: "right"
    },
    {
        targetId: "tour-rules-btn",
        stepNumber: "04",
        doodleHeader: "step 04 of 05 · lock classes & set rules",
        title: "Locking Favorite Classes & Setting Rules",
        placement: "bottom"
    },
    {
        targetId: "tour-auto-schedule-btn",
        stepNumber: "05",
        doodleHeader: "step 05 of 05 · magic-solve & export",
        title: "Magic Auto-Schedule & Saving Variants",
        placement: "bottom"
    }
];

export function InteractiveTour({
    isOpen,
    onClose,
    onFocusFirstCourse,
    onClearFocus,
    onOpenImport,
    selectedClasses = []
}: InteractiveTourProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [showBimaScreenshot, setShowBimaScreenshot] = useState(false);
    const [hasMovedCourse, setHasMovedCourse] = useState(false);

    // Snapshot of selected classes to detect live swaps during Step 3
    const initialClassesSignature = useMemo(() => {
        return selectedClasses.map((c: any) => `${c?.subjectId}:${c?.classId}`).join("|");
    }, [selectedClasses]);

    const [recordedSignature, setRecordedSignature] = useState(initialClassesSignature);

    const step = STEPS[stepIndex] || STEPS[0];

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setStepIndex(0);
            setHasMovedCourse(false);
            setShowBimaScreenshot(false);
            setRecordedSignature(initialClassesSignature);
        }
    }, [isOpen, initialClassesSignature]);

    const handleClose = useCallback(() => {
        onClearFocus();
        onClose();
    }, [onClearFocus, onClose]);

    const handleNext = useCallback(() => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex((i) => i + 1);
        } else {
            handleClose();
        }
    }, [stepIndex, handleClose]);

    const handleBack = useCallback(() => {
        if (stepIndex > 0) {
            setStepIndex((i) => i - 1);
        }
    }, [stepIndex]);

    // Handle ESC to close, Arrow keys for step navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handleBack();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose, handleNext, handleBack]);

    // When Step 3 is active, trigger ghost drop zones on first course
    useEffect(() => {
        if (!isOpen) return;

        if (stepIndex === 2) {
            onFocusFirstCourse();
            setRecordedSignature(selectedClasses.map((c: any) => `${c?.subjectId}:${c?.classId}`).join("|"));
        } else {
            onClearFocus();
        }
    }, [stepIndex, isOpen, onFocusFirstCourse, onClearFocus, selectedClasses]);

    // Detect live swaps during Step 3
    useEffect(() => {
        if (stepIndex === 2) {
            const currentSig = selectedClasses.map((c: any) => `${c?.subjectId}:${c?.classId}`).join("|");
            if (currentSig && recordedSignature && currentSig !== recordedSignature) {
                setHasMovedCourse(true);
            }
        }
    }, [selectedClasses, stepIndex, recordedSignature]);

    // Update target element bounding rect
    useEffect(() => {
        if (!isOpen || !step) return;

        const updateRect = () => {
            let el = document.getElementById(step.targetId);
            // Fallback for step 2 if add-course button is inside collapsed drawer
            if (!el && stepIndex === 1) {
                el = document.getElementById("tour-course-panel");
            }
            if (el) {
                setTargetRect(el.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        const interval = setInterval(updateRect, 250);
        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, true);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", updateRect);
            window.removeEventListener("scroll", updateRect, true);
        };
    }, [stepIndex, isOpen, step]);

    if (!isOpen || typeof document === "undefined") return null;

    // Calculate popover positioning relative to targetRect
    let popoverStyle: React.CSSProperties = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 140
    };

    const cardWidth = stepIndex === 0 ? 430 : 385;

    if (targetRect) {
        if (step.placement === "right") {
            const top = Math.max(16, Math.min(window.innerHeight - 440, targetRect.top - 10));
            const left = Math.min(window.innerWidth - cardWidth - 20, targetRect.right + 20);
            popoverStyle = {
                position: "fixed",
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 140
            };
        } else if (step.placement === "bottom") {
            const top = Math.min(window.innerHeight - 460, targetRect.bottom + 16);
            const left = Math.max(16, Math.min(window.innerWidth - cardWidth - 20, targetRect.left - 10));
            popoverStyle = {
                position: "fixed",
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 140
            };
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[130] animate-in fade-in duration-200">
            {/* Dim Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[1px] cursor-pointer"
                onClick={handleClose}
            />

            {/* Target Highlight Box (Spotlight Ring) */}
            {targetRect && (
                <div
                    className="fixed rounded-xl ring-4 ring-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.35)] pointer-events-none transition-all duration-300 z-[135]"
                    style={{
                        top: `${targetRect.top - 4}px`,
                        left: `${targetRect.left - 4}px`,
                        width: `${targetRect.width + 8}px`,
                        height: `${targetRect.height + 8}px`
                    }}
                />
            )}

            {/* Floating Editorial Tour Card */}
            <div
                style={popoverStyle}
                className={cn(
                    "bg-white border border-[#d8d8d4] border-b-[3px] border-b-[#c2c2bc] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-5 space-y-3.5 animate-in zoom-in-95 duration-200 pointer-events-auto relative max-h-[92vh] overflow-y-auto custom-scrollbar",
                    stepIndex === 0 ? "w-[430px] max-w-[calc(100vw-32px)]" : "w-[385px] max-w-[calc(100vw-32px)]"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hand-drawn SVG pointer arrow */}
                {targetRect && step.placement === "bottom" && (
                    <div className="absolute -top-7 left-8 pointer-events-none text-[#5b82a6] hidden sm:block">
                        <svg className="w-10 h-7 stroke-current fill-none stroke-[2.2]" viewBox="0 0 40 28">
                            <path d="M 28 26 C 24 14, 16 10, 8 4" strokeLinecap="round" />
                            <path d="M 15 3 L 8 4 L 9 11" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
                {targetRect && step.placement === "right" && (
                    <div className="absolute top-6 -left-7 pointer-events-none text-[#5b82a6] hidden sm:block">
                        <svg className="w-7 h-10 stroke-current fill-none stroke-[2.2]" viewBox="0 0 28 40">
                            <path d="M 26 28 C 14 24, 10 16, 4 8" strokeLinecap="round" />
                            <path d="M 3 15 L 4 8 L 11 9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}

                {/* Header: handwritten doodle step label + close button */}
                <div className="flex items-center justify-between pb-1">
                    <span className="font-doodle text-[17.5px] font-bold text-[#5b82a6] select-none tracking-tight">
                        {step.doodleHeader}
                    </span>

                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg text-[#a1a1aa] hover:text-[#141413] hover:bg-neutral-100 transition-colors"
                        title="Close tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Title */}
                <h3 className="text-[16.5px] font-semibold text-[#141413] leading-snug">
                    {step.title}
                </h3>

                {/* ========================================================= */}
                {/* STEP 1: DETAILED BIMA DATA IMPORT GUIDE                   */}
                {/* ========================================================= */}
                {stepIndex === 0 && (
                    <div className="space-y-3">
                        {/* 1. Animated BIMA Table Mockup with Highlight Sweep */}
                        <div className="relative rounded-xl border border-[#e2e2de] bg-[#f9f9f8] p-2.5 overflow-hidden font-mono text-[9.5px] select-none shadow-2xs">
                            {/* Animated Sweep Bar */}
                            <div className="absolute inset-x-0 bg-sky-500/20 border-y border-sky-400/50 pointer-events-none animate-select-sweep" />

                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[#8e8e93] text-[8.5px] pb-1 border-b border-[#e6e6e3] font-semibold tracking-wider">
                                    <span>Program Studi</span>
                                    <span>Nama Mata Kuliah</span>
                                    <span>Kls</span>
                                    <span>Hari/Jam</span>
                                    <span>Ruang</span>
                                </div>
                                <div className="flex items-center justify-between text-[#141413]">
                                    <span className="truncate max-w-[70px]">Informatika</span>
                                    <span className="truncate max-w-[110px] font-semibold">Pemrograman Web</span>
                                    <span className="text-sky-600 font-bold">IF-A</span>
                                    <span>Sen 07:00-09:30</span>
                                    <span>Lab. 1</span>
                                </div>
                                <div className="text-[8px] text-[#6e6e77] italic pl-2 border-l-2 border-sky-300">
                                    Dr. Ir. Budi Santoso, M.T.
                                </div>
                                <div className="flex items-center justify-between text-[#141413]">
                                    <span className="truncate max-w-[70px]">Informatika</span>
                                    <span className="truncate max-w-[110px] font-semibold">Struktur Data</span>
                                    <span className="text-sky-600 font-bold">IF-B</span>
                                    <span>Sel 10:00-12:30</span>
                                    <span>Pat. 2-1</span>
                                </div>
                            </div>

                            {/* Floating Copy Badge */}
                            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#141413] text-white text-[9.5px] font-mono shadow-md animate-pulse">
                                <span>Ctrl + C</span>
                            </div>
                        </div>

                        {/* 2. 3 Clear Sub-steps in Gaegu Doodle Font */}
                        <div className="space-y-1.5 bg-[#fbfbfa] border border-[#e6e6e3] rounded-xl p-3">
                            <div className="flex items-start gap-2">
                                <span className="font-doodle font-bold text-[18px] text-[#5b82a6] leading-none shrink-0">
                                    01
                                </span>
                                <p className="text-[12px] text-[#4a4a52] leading-tight">
                                    Log in to{" "}
                                    <a
                                        href="https://bima.upnyk.ac.id/login"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#141413] font-semibold underline hover:text-[#5b82a6] inline-flex items-center gap-0.5"
                                    >
                                        bima.upnyk.ac.id <ExternalLink className="w-2.5 h-2.5" />
                                    </a>{" "}
                                    → <strong>Menu Perkuliahan → Dosen → Jadwal Dosen</strong>.
                                </p>
                            </div>

                            <div className="flex items-start gap-2">
                                <span className="font-doodle font-bold text-[18px] text-[#5b82a6] leading-none shrink-0">
                                    02
                                </span>
                                <p className="text-[12px] text-[#4a4a52] leading-tight">
                                    Select the <strong>entire table rows</strong> (from first column <em>Program Studi</em> to <em>Ruang/Dosen</em>) and copy (<strong>Ctrl + C</strong>).
                                </p>
                            </div>

                            <div className="flex items-start gap-2">
                                <span className="font-doodle font-bold text-[18px] text-[#5b82a6] leading-none shrink-0">
                                    03
                                </span>
                                <p className="text-[12px] text-[#4a4a52] leading-tight">
                                    Click the <strong>Source menu ▾</strong> at the top-left → <strong>+ Import new BIMA source</strong> and paste!
                                </p>
                            </div>
                        </div>

                        {/* 3. Parser Format Tip (Doodle Note & Snippet Box) */}
                        <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-2.5 space-y-1">
                            <div className="font-mono text-[9px] text-[#6e6e77] bg-white/90 p-1.5 rounded border border-amber-200/60 leading-tight">
                                <span className="text-amber-900 font-semibold">Informatika  123001  Pemrograman Web  3  IF-A  40  Senin 07:00-09:30  Lab. 1</span>
                                <br />
                                <span className="text-[#8e8e93]">Dr. Ir. Budi Santoso, M.T.</span>
                            </div>
                            <div className="font-doodle text-[14px] text-amber-800 font-bold leading-tight flex items-center gap-1">
                                <span>← don&apos;t worry about messy tabs or lecturer lines — the engine cleans it up automatically!</span>
                            </div>
                        </div>

                        {/* Toggle screenshot / Action button */}
                        <div className="flex items-center gap-2 pt-1">
                            {onOpenImport && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onOpenImport();
                                        handleNext();
                                    }}
                                    className="btn-tactile-dark flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Open BIMA Importer →</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowBimaScreenshot(!showBimaScreenshot)}
                                className="btn-tactile-light py-1.5 px-2.5 rounded-lg text-xs font-medium text-[#6e6e77] hover:text-[#141413] flex items-center gap-1"
                                title="Toggle official BIMA screenshot reference"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>{showBimaScreenshot ? "Hide Image" : "Screenshot"}</span>
                            </button>
                        </div>

                        {/* Optional Reference Screenshot Preview */}
                        {showBimaScreenshot && (
                            <div className="rounded-xl border border-[#d8d8d4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                <div className="relative w-full h-44 bg-neutral-100">
                                    <Image
                                        src="/bima_reference.png"
                                        alt="BIMA Jadwal Dosen Table Reference"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-1.5 bg-neutral-50 text-[10px] text-[#6e6e77] text-center font-mono">
                                    Official BIMA Table Selection Area
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* STEP 2: ADDING COURSES DEMO                               */}
                {/* ========================================================= */}
                {stepIndex === 1 && (
                    <div className="space-y-3">
                        <p className="text-[13px] text-[#6e6e77] leading-relaxed">
                            Click <strong>+ add course</strong> in the left sidebar to browse your university catalog.
                            Every course you check <strong>immediately pops onto the timetable canvas</strong> with a conflict-free default section!
                        </p>

                        {/* Animated Demo: Checkbox ticking + block popping into calendar */}
                        <div className="rounded-xl border border-[#e2e2de] bg-[#f9f9f8] p-3 space-y-2 select-none shadow-2xs overflow-hidden">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e6e6e3] shadow-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-[#141413] text-white flex items-center justify-center text-[12px] font-bold animate-scale-check">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-semibold text-[#141413]">Basis Data</div>
                                        <div className="text-[10px] text-[#6e6e77]">3 SKS · 4 kelas tersedia</div>
                                    </div>
                                </div>
                                <span className="font-doodle text-[13.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    added!
                                </span>
                            </div>

                            {/* Mini 3-day calendar grid */}
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                                <div className="h-14 rounded-lg bg-white border border-dashed border-[#d8d8d4] p-1 flex flex-col justify-between">
                                    <span className="text-[8.5px] font-bold text-[#8e8e93] uppercase">Senin</span>
                                    <div className="p-1 rounded bg-amber-100/90 border border-amber-300 text-[8.5px] font-semibold text-amber-900 leading-tight animate-bounce-short">
                                        Basis Data (IF-A)
                                    </div>
                                </div>
                                <div className="h-14 rounded-lg bg-white border border-[#e6e6e3] p-1">
                                    <span className="text-[8.5px] font-bold text-[#8e8e93] uppercase">Selasa</span>
                                </div>
                                <div className="h-14 rounded-lg bg-white border border-[#e6e6e3] p-1">
                                    <span className="text-[8.5px] font-bold text-[#8e8e93] uppercase">Rabu</span>
                                </div>
                            </div>
                        </div>

                        <div className="font-doodle text-[15px] font-bold text-[#5b82a6] flex items-center gap-1.5">
                            <span>← search by course code (e.g. &quot;123001&quot;) or name anytime!</span>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* STEP 3: DRAGGING & LIVE GHOST DROP-ZONES                  */}
                {/* ========================================================= */}
                {stepIndex === 2 && (
                    <div className="space-y-3">
                        <p className="text-[13px] text-[#6e6e77] leading-relaxed">
                            Click or drag any card on the grid. Notice those <strong>dashed amber slots</strong> that lit up on the calendar?
                            They show every alternative section available for that course!
                        </p>

                        {/* Animated Demo: Card sliding into dashed ghost slot */}
                        <div className="rounded-xl border border-[#e2e2de] bg-[#f9f9f8] p-3 space-y-2 select-none shadow-2xs overflow-hidden">
                            <div className="grid grid-cols-2 gap-2.5 items-center">
                                {/* Solid card */}
                                <div className="p-2 rounded-xl bg-white border border-[#dcdcd6] shadow-xs flex flex-col justify-between h-16">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10.5px] font-semibold text-[#141413] truncate">Web Prog</span>
                                        <span className="px-1 py-0.2 rounded bg-neutral-100 text-[8.5px] font-mono">IF-A</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-[#6e6e77]">Sen 07:00–09:30</div>
                                </div>

                                {/* Ghost Drop Zone */}
                                <div className="p-2 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/70 text-amber-800 flex flex-col justify-between h-16 animate-pulse">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9.5px] font-bold text-amber-700">Drop here</span>
                                        <span className="px-1 py-0.2 rounded bg-amber-200/60 text-[8.5px] font-mono text-amber-900">IF-B</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-amber-700">Kam 10:00–12:30</div>
                                </div>
                            </div>

                            <div className="text-center font-doodle text-[14px] font-bold text-amber-700">
                                <span>← click or drop into any dashed slot right now!</span>
                            </div>
                        </div>

                        {/* Interactive swap celebration alert */}
                        {hasMovedCourse ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in zoom-in-95 duration-200">
                                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-doodle text-[16px]">nice move! ✓ section swapped live on the canvas</span>
                            </div>
                        ) : (
                            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-900 font-sans">
                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Try clicking a dashed amber slot on the timetable behind this card!</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* STEP 4: LOCKING FAVORITES & SOLVER RULES                  */}
                {/* ========================================================= */}
                {stepIndex === 3 && (
                    <div className="space-y-3">
                        <p className="text-[13px] text-[#6e6e77] leading-relaxed">
                            Found a favorite lecturer or class time? Click the <strong>🔒 Lock icon</strong> on its card to pin it. The solver will keep that course locked in place forever!
                        </p>

                        {/* Animated Demo: Lock Icon Clicking Shut + Rule Pills */}
                        <div className="rounded-xl border border-[#e2e2de] bg-[#f9f9f8] p-3 space-y-2.5 select-none shadow-2xs">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e6e6e3]">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-[#141413] text-white flex items-center justify-center animate-wiggle">
                                        <Lock className="w-3.5 h-3.5 text-amber-300" />
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-semibold text-[#141413]">Algoritma (IF-C)</div>
                                        <div className="text-[10px] text-[#6e6e77]">Fav Lecturer: Prof. Sri</div>
                                    </div>
                                </div>
                                <span className="font-doodle text-[13.5px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    pinned 🔒
                                </span>
                            </div>

                            {/* Active Rule Pills */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-[#e2e2de] text-[10.5px] font-medium text-[#141413]">
                                    🚫 No Friday
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-[#e2e2de] text-[10.5px] font-medium text-[#141413]">
                                    ☀️ Start after 09:00
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-[#e2e2de] text-[10.5px] font-medium text-[#141413]">
                                    ⏱️ Max 2 hr gap
                                </span>
                            </div>
                        </div>

                        <p className="text-[12px] text-[#6e6e77] leading-tight">
                            Use the <strong>Rules</strong> button in the top bar to ban whole days, avoid early morning classes, or minimize gaps between courses.
                        </p>
                    </div>
                )}

                {/* ========================================================= */}
                {/* STEP 5: AUTO-SCHEDULE, SHUFFLE & EXPORT                  */}
                {/* ========================================================= */}
                {stepIndex === 4 && (
                    <div className="space-y-3">
                        <p className="text-[13px] text-[#6e6e77] leading-relaxed">
                            Click <strong>Auto-Schedule</strong> (or just tap the <strong>Spacebar</strong>!) to instantly preview conflict-free timetables that honor all your locked courses and rules.
                        </p>

                        {/* Animated Demo: Spacebar Keycap Press + Shuffling Blocks */}
                        <div className="rounded-xl border border-[#e2e2de] bg-[#f9f9f8] p-3 space-y-2.5 select-none shadow-2xs overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#d8d8d4] text-center font-mono font-bold text-[12px] text-[#141413] shadow-xs animate-key-press">
                                    [ Spacebar ]
                                </div>
                                <span className="font-doodle text-[16px] font-bold text-[#5b82a6]">→</span>
                                <div className="px-3 py-1.5 rounded-lg bg-[#141413] text-white text-[12px] font-medium flex items-center gap-1.5 shadow-sm">
                                    <RotateCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                                    <span>Auto-Schedule</span>
                                </div>
                            </div>

                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center text-emerald-800 text-[11px] font-medium flex items-center justify-center gap-2">
                                <span>🎉 0 Conflicts Found</span>
                                <span className="font-mono text-[10px] bg-emerald-200/60 px-1.5 py-0.2 rounded font-semibold text-emerald-900">
                                    ↵ Accept
                                </span>
                            </div>
                        </div>

                        <p className="text-[12px] text-[#6e6e77] leading-tight">
                            A floating bottom bar lets you <strong>Accept (↵)</strong>, <strong>Shuffle (Space)</strong>, or <strong>Cancel (Esc)</strong>. Save your top variations with <strong>+ Save</strong> and download the image with <strong>Export</strong>!
                        </p>
                    </div>
                )}

                {/* ========================================================= */}
                {/* FOOTER CONTROLS: Dots, Back, Next                         */}
                {/* ========================================================= */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f0f0ed]">
                    {/* Animated Progress Dots */}
                    <div className="flex items-center gap-1.5 select-none">
                        {STEPS.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setStepIndex(idx)}
                                className={cn(
                                    "h-2 rounded-full transition-all duration-300 cursor-pointer",
                                    idx === stepIndex
                                        ? "w-6 bg-[#141413]"
                                        : "w-2 bg-[#d8d8d4] hover:bg-[#a1a1aa]"
                                )}
                                title={`Go to step ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {stepIndex > 0 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Back</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-[12.5px] font-medium text-[#a1a1aa] hover:text-[#141413] px-2 py-1 transition-colors cursor-pointer"
                            >
                                Skip tour
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleNext}
                            className="btn-tactile-dark px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-all select-none shadow-sm cursor-pointer"
                        >
                            <span>{stepIndex === STEPS.length - 1 ? "Done! ✓" : "Next step"}</span>
                            {stepIndex < STEPS.length - 1 && (
                                <ArrowRight className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
