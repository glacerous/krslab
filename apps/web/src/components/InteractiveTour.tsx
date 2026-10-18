"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, ArrowLeft, Check, Database, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface InteractiveTourProps {
    isOpen: boolean;
    onClose: () => void;
    onFocusFirstCourse: () => void;
    onClearFocus: () => void;
    onOpenImport?: () => void;
}

interface StepConfig {
    targetId: string;
    stepLabel: string;
    title: string;
    description: string;
    placement: "right" | "bottom" | "left";
    showImportButton?: boolean;
    showSwapPrompt?: boolean;
}

const STEPS: StepConfig[] = [
    {
        targetId: "tour-datasource-btn",
        stepLabel: "step 01 / 04",
        title: "Load or switch schedule data",
        description: "Import your university BIMA schedule table, or test the solver with our realistic sample Informatics data.",
        placement: "bottom",
        showImportButton: true
    },
    {
        targetId: "tour-course-panel",
        stepLabel: "step 02 / 04",
        title: "Pick your courses",
        description: "Browse the Catalog tab to add courses. Every course is automatically assigned a non-conflicting section and pops onto the timetable instantly.",
        placement: "right"
    },
    {
        targetId: "tour-first-node",
        stepLabel: "step 03 / 04",
        title: "Drag & swap live on grid",
        description: "See those dashed amber slots? Drag any block or click a dashed slot to move this class to another day or time.",
        placement: "right",
        showSwapPrompt: true
    },
    {
        targetId: "tour-solver-bar",
        stepLabel: "step 04 / 04",
        title: "Solve, shuffle & save",
        description: "Set day/time rules, tap Auto-Schedule (or press Space anytime!) to cycle conflict-free setups, and hit + Save to archive your favorites.",
        placement: "bottom"
    }
];

export function InteractiveTour({
    isOpen,
    onClose,
    onFocusFirstCourse,
    onClearFocus,
    onOpenImport
}: InteractiveTourProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = STEPS[stepIndex] || STEPS[0];

    // Reset step when opened
    useEffect(() => {
        if (isOpen) {
            setStepIndex(0);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        onClearFocus();
        onClose();
    }, [onClearFocus, onClose]);

    // Handle ESC to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose]);

    // When Step 3 is active (index 2), trigger ghost drop zones on first course
    useEffect(() => {
        if (!isOpen) return;

        if (stepIndex === 2) {
            onFocusFirstCourse();
        } else {
            onClearFocus();
        }
    }, [stepIndex, isOpen, onFocusFirstCourse, onClearFocus]);

    // Update target element bounding rect
    useEffect(() => {
        if (!isOpen || !step) return;

        const updateRect = () => {
            const el = document.getElementById(step.targetId);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        const interval = setInterval(updateRect, 300);
        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, true);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", updateRect);
            window.removeEventListener("scroll", updateRect, true);
        };
    }, [stepIndex, isOpen, step]);

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex((i) => i + 1);
        } else {
            handleClose();
        }
    };

    const handleBack = () => {
        if (stepIndex > 0) {
            setStepIndex((i) => i - 1);
        }
    };

    if (!isOpen || typeof document === "undefined") return null;

    // Calculate popover positioning relative to targetRect
    let popoverStyle: React.CSSProperties = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 140
    };

    if (targetRect) {
        if (step.placement === "right") {
            const top = Math.max(16, Math.min(window.innerHeight - 300, targetRect.top + 8));
            const left = Math.min(window.innerWidth - 350, targetRect.right + 18);
            popoverStyle = {
                position: "fixed",
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 140
            };
        } else if (step.placement === "bottom") {
            const top = Math.min(window.innerHeight - 300, targetRect.bottom + 14);
            const left = Math.max(16, Math.min(window.innerWidth - 350, targetRect.left - 20));
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
                className="absolute inset-0 bg-black/25 backdrop-blur-[1px] cursor-pointer"
                onClick={handleClose}
            />

            {/* Target Highlight Box (Spotlight Ring) */}
            {targetRect && (
                <div
                    className="fixed rounded-xl ring-4 ring-amber-400/85 shadow-[0_0_35px_rgba(245,158,11,0.3)] pointer-events-none transition-all duration-300 z-[135]"
                    style={{
                        top: `${targetRect.top - 4}px`,
                        left: `${targetRect.left - 4}px`,
                        width: `${targetRect.width + 8}px`,
                        height: `${targetRect.height + 8}px`
                    }}
                />
            )}

            {/* Floating Editorial Popover Card */}
            <div
                style={popoverStyle}
                className="w-[335px] bg-white border border-[#e6e6e3] rounded-2xl shadow-2xl p-5 space-y-3.5 animate-in zoom-in-95 duration-200 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header: doodle step badge + close button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-doodle text-[18px] font-bold text-[#5b82a6] select-none bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/70">
                            {step.stepLabel}
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#141413] hover:bg-neutral-100 transition-colors"
                        title="Close tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                    <h3 className="text-[16px] font-semibold text-[#141413] leading-snug">
                        {step.title}
                    </h3>
                    <p className="text-[12.5px] text-[#6e6e77] leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {/* Step 1 Extra: Quick Open BIMA Importer Button */}
                {step.showImportButton && onOpenImport && (
                    <button
                        type="button"
                        onClick={() => {
                            onOpenImport();
                            handleNext();
                        }}
                        className="w-full tactile-btn py-1.5 px-3 rounded-lg text-xs font-medium text-[#141413] flex items-center justify-center gap-1.5 bg-neutral-50 hover:bg-neutral-100 border border-[#e2e2de]"
                    >
                        <Database className="w-3.5 h-3.5 text-[#5b82a6]" />
                        <span>Open BIMA Importer</span>
                    </button>
                )}

                {/* Step 3 Extra: Live interactive tip */}
                {step.showSwapPrompt && (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-900 font-sans">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>Click or drag to the dashed slot on the grid right now, or click <strong>Next</strong>!</span>
                    </div>
                )}

                {/* Footer Controls: Back, Skip, Next */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f0f0ed]">
                    <div className="flex items-center gap-2">
                        {stepIndex > 0 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-2 py-1 rounded-md text-[12px] font-medium text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100 transition-colors flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Back</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-[12px] font-medium text-[#a1a1aa] hover:text-[#141413] transition-colors"
                            >
                                Skip
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleNext}
                        className="btn-tactile-dark px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium text-white flex items-center gap-1.5 transition-all select-none shadow-sm"
                    >
                        <span>{stepIndex === STEPS.length - 1 ? "Done! ✓" : "Next"}</span>
                        {stepIndex < STEPS.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
