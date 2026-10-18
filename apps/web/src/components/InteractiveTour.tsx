"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
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
    label: string;
    title: string;
    body: string;
    placement: "bottom" | "right";
}

const STEPS: StepConfig[] = [
    {
        targetId: "tour-datasource-btn",
        label: "1 of 4",
        title: "Import your BIMA schedule",
        body: "In BIMA, open Menu Perkuliahan → Dosen → Jadwal Dosen, copy the table rows, and paste them here.",
        placement: "bottom"
    },
    {
        targetId: "tour-add-course-btn",
        label: "2 of 4",
        title: "Pick your courses",
        body: "Select the courses you're taking this semester. They appear on the timetable right away.",
        placement: "right"
    },
    {
        targetId: "tour-first-node",
        label: "3 of 4",
        title: "Drag or click to swap",
        body: "Click or drag any block on the grid to see all its other class times and move it.",
        placement: "right"
    },
    {
        targetId: "tour-auto-schedule-btn",
        label: "4 of 4",
        title: "Magic-solve conflicts",
        body: "Lock classes you want to keep, set day rules, and press Space to shuffle conflict-free schedules.",
        placement: "bottom"
    }
];

export function InteractiveTour({
    isOpen,
    onClose,
    onFocusFirstCourse,
    onClearFocus
}: InteractiveTourProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [showImage, setShowImage] = useState(false);

    const step = STEPS[stepIndex] || STEPS[0];

    // Reset when tour opens
    useEffect(() => {
        if (isOpen) {
            setStepIndex(0);
            setShowImage(false);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        onClearFocus();
        onClose();
    }, [onClearFocus, onClose]);

    const handleNext = useCallback(() => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex((i) => i + 1);
            setShowImage(false);
        } else {
            handleClose();
        }
    }, [stepIndex, handleClose]);

    const handleBack = useCallback(() => {
        if (stepIndex > 0) {
            setStepIndex((i) => i - 1);
            setShowImage(false);
        }
    }, [stepIndex]);

    // Keyboard navigation: ESC to close, arrows for next/back
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

    // When Step 3 is active, trigger ghost drop-zones on first course
    useEffect(() => {
        if (!isOpen) return;

        if (stepIndex === 2) {
            onFocusFirstCourse();
        } else {
            onClearFocus();
        }
    }, [stepIndex, isOpen, onFocusFirstCourse, onClearFocus]);

    // Measure target element
    useEffect(() => {
        if (!isOpen || !step) return;

        const updateRect = () => {
            let el = document.getElementById(step.targetId);
            if (!el && stepIndex === 1) {
                el = document.getElementById("tour-course-panel");
            }
            if (!el && stepIndex === 3) {
                el = document.getElementById("tour-solver-bar");
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

    // Position anchored popover
    let popoverStyle: React.CSSProperties = {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 140
    };

    const CARD_WIDTH = 290;

    if (targetRect) {
        if (step.placement === "right") {
            const top = Math.max(16, Math.min(window.innerHeight - 260, targetRect.top - 6));
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, targetRect.right + 14);
            popoverStyle = {
                position: "fixed",
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 140
            };
        } else if (step.placement === "bottom") {
            const top = Math.min(window.innerHeight - 260, targetRect.bottom + 12);
            const left = Math.max(16, Math.min(window.innerWidth - CARD_WIDTH - 16, targetRect.left - 4));
            popoverStyle = {
                position: "fixed",
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 140
            };
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[130] animate-in fade-in duration-150">
            {/* Subtle Dim Backdrop */}
            <div
                className="absolute inset-0 bg-black/15 cursor-pointer"
                onClick={handleClose}
            />

            {/* Target Highlight Box (Spotlight Ring) */}
            {targetRect && (
                <div
                    className="fixed rounded-xl ring-2 ring-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)] pointer-events-none transition-all duration-200 z-[135]"
                    style={{
                        top: `${targetRect.top - 4}px`,
                        left: `${targetRect.left - 4}px`,
                        width: `${targetRect.width + 8}px`,
                        height: `${targetRect.height + 8}px`
                    }}
                />
            )}

            {/* Ultra-Clean Anchored Popover Card (Zero Nested Boxes) */}
            <div
                style={popoverStyle}
                className="w-[290px] bg-white rounded-2xl border border-[#d8d8d4] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-5 z-[140] pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header row: doodle label + close */}
                <div className="flex items-center justify-between">
                    <span className="font-doodle text-[16px] font-bold text-[#5b82a6] select-none">
                        {step.label}
                    </span>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-[#a1a1aa] hover:text-[#141413] transition-colors p-0.5"
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-semibold text-[#141413] mt-0.5 leading-snug">
                    {step.title}
                </h3>

                {/* Body (1 sentence) */}
                <p className="text-[13px] text-[#6e6e77] leading-relaxed mt-1.5">
                    {step.body}
                </p>

                {/* Step 1 Optional Link: Plain text link toggles screenshot preview */}
                {stepIndex === 0 && (
                    <div className="mt-2">
                        <button
                            type="button"
                            onClick={() => setShowImage(!showImage)}
                            className="text-[12px] text-[#5b82a6] hover:text-[#141413] underline decoration-dashed underline-offset-4 cursor-pointer"
                        >
                            {showImage ? "hide example" : "view BIMA table example"}
                        </button>
                        {showImage && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-[#e6e6e3] relative w-full h-32">
                                <Image
                                    src="/bima_reference.png"
                                    alt="BIMA table reference"
                                    fill
                                    sizes="250px"
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Footer: Single Clean Row */}
                <div className="mt-4 pt-3 border-t border-[#ecece8] flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-[12px] text-[#6e6e77] hover:text-[#141413] transition-colors cursor-pointer"
                    >
                        Skip
                    </button>

                    <div className="flex items-center gap-2">
                        {stepIndex > 0 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="text-[12.5px] text-[#6e6e77] hover:text-[#141413] px-1.5 py-1 transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="btn-tactile-dark px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-white flex items-center gap-1 transition-all select-none shadow-xs cursor-pointer"
                        >
                            <span>{stepIndex === STEPS.length - 1 ? "Done" : "Next →"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
