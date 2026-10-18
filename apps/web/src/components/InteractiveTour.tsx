"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface InteractiveTourProps {
    isOpen: boolean;
    onClose: () => void;
    onFocusFirstCourse: () => void;
    onClearFocus: () => void;
    onOpenImport?: () => void;
    onOpenSourceMenu?: () => void;
    onOpenPlanMenu?: () => void;
    selectedClasses?: any[];
}

interface StepConfig {
    targetId: string;
    label: string;
    title: string;
    body: string;
    placement: "bottom" | "right";
    actionType?: "source-menu" | "bima-preview" | "plan-menu";
}

const STEPS: StepConfig[] = [
    {
        targetId: "tour-datasource-btn",
        label: "1 of 6",
        title: "Manage schedule sources",
        body: "Click here to switch between semester datasets, rename or duplicate a source, or add a new BIMA schedule.",
        placement: "bottom",
        actionType: "source-menu"
    },
    {
        targetId: "tour-datasource-btn",
        label: "2 of 6",
        title: "Importing BIMA table data",
        body: "In bima.upnyk.ac.id (Menu Perkuliahan → Dosen → Jadwal Dosen), highlight all table rows (Ctrl+C) and paste into + Import new BIMA source. Messy tabs & lecturer lines parse automatically.",
        placement: "bottom",
        actionType: "bima-preview"
    },
    {
        targetId: "tour-plan-btn",
        label: "3 of 6",
        title: "Create & switch plans",
        body: "Build multiple schedule backups (Plan 1, Plan 2) for the same source. Click here to switch, rename, duplicate, or create a new plan.",
        placement: "bottom",
        actionType: "plan-menu"
    },
    {
        targetId: "tour-add-course-btn",
        label: "4 of 6",
        title: "Pick your semester courses",
        body: "Browse the course catalog and check the subjects you need. Every selected course is placed onto the timetable grid automatically.",
        placement: "right"
    },
    {
        targetId: "tour-first-node",
        label: "5 of 6",
        title: "Drag or click to swap classes",
        body: "Drag any course block (or click the dashed amber slots on the grid) to switch to a different day, time, or lecturer.",
        placement: "right"
    },
    {
        targetId: "tour-solver-bar",
        label: "6 of 6",
        title: "Lock, set rules & auto-schedule",
        body: "Lock favorite classes on the grid, add day/gap constraints in Rules, and press Space to shuffle conflict-free combinations.",
        placement: "bottom"
    }
];

// Generates a 2-pass organic hand-drawn doodle marker loop
function generateScribblePath(w: number, h: number): string {
    const x0 = 10;
    const y0 = 8;
    const x1 = w - 10;
    const y1 = h - 8;
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;

    return [
        `M ${midX - 12} ${y0}`,
        `C ${x1 - 10} ${y0 - 2}, ${x1 + 3} ${y0 + 4}, ${x1 + 3} ${y0 + 10}`,
        `C ${x1 + 4} ${midY}, ${x1} ${y1 - 10}, ${x1} ${y1 - 4}`,
        `C ${x1 - 2} ${y1 + 3}, ${x1 - 12} ${y1 + 2}, ${midX} ${y1 + 2}`,
        `C ${x0 + 10} ${y1 + 1}, ${x0 - 3} ${y1 - 3}, ${x0 - 3} ${y1 - 10}`,
        `C ${x0 - 4} ${midY}, ${x0 - 1} ${y0 + 10}, ${x0 - 1} ${y0 + 4}`,
        `C ${x0} ${y0 - 2}, ${x0 + 8} ${y0 - 1}, ${midX + 6} ${y0 - 1}`,
        // Pass 2 with slight offset to look like pen circling twice
        `C ${x1 - 6} ${y0 + 1}, ${x1 - 2} ${y0 + 6}, ${x1 - 2} ${y0 + 12}`,
        `C ${x1 - 1} ${midY + 4}, ${x1 - 3} ${y1 - 8}, ${x1 - 3} ${y1 - 2}`,
        `C ${x1 - 4} ${y1 + 1}, ${x1 - 10} ${y1 - 1}, ${midX - 6} ${y1 - 1}`,
        `C ${x0 + 8} ${y1 - 2}, ${x0 + 2} ${y1 - 6}, ${x0 + 2} ${midY}`,
        `C ${x0 + 3} ${y0 + 8}, ${x0 + 5} ${y0 + 2}, ${midX + 16} ${y0 + 1}`
    ].join(" ");
}

export function InteractiveTour({
    isOpen,
    onClose,
    onFocusFirstCourse,
    onClearFocus,
    onOpenImport,
    onOpenSourceMenu,
    onOpenPlanMenu
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

    // Step 5 (5 of 6): Auto-focus first course on grid so ghost drop-zones light up live
    useEffect(() => {
        if (!isOpen) return;

        if (stepIndex === 4) {
            onFocusFirstCourse();
        } else {
            onClearFocus();
        }
    }, [stepIndex, isOpen, onFocusFirstCourse, onClearFocus]);

    // Measure target element with resilient fallbacks
    useEffect(() => {
        if (!isOpen || !step) return;

        const updateRect = () => {
            let el = document.getElementById(step.targetId);
            if (!el && stepIndex === 3) {
                el = document.getElementById("tour-course-panel");
            }
            if (!el && stepIndex === 4) {
                el = document.getElementById("krs-grid-capture");
            }
            if (!el && stepIndex === 5) {
                el = document.getElementById("tour-auto-schedule-btn") || document.getElementById("tour-solver-bar");
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

    // Card position calculation
    const CARD_WIDTH = 315;
    const popoverCoords = useMemo(() => {
        if (!targetRect) {
            return {
                top: window.innerHeight / 2 - 130,
                left: window.innerWidth / 2 - CARD_WIDTH / 2
            };
        }

        if (step.placement === "right") {
            const top = Math.max(16, Math.min(window.innerHeight - 300, targetRect.top - 8));
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, targetRect.right + 22);
            return { top, left };
        } else {
            // "bottom"
            const top = Math.min(window.innerHeight - 300, targetRect.bottom + 20);
            const left = Math.max(16, Math.min(window.innerWidth - CARD_WIDTH - 16, targetRect.left - 6));
            return { top, left };
        }
    }, [targetRect, step.placement]);

    // Connector arrow path calculation
    const connectorArrow = useMemo(() => {
        if (!targetRect) return null;

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let ctrlX = 0;
        let ctrlY = 0;

        if (step.placement === "bottom") {
            startX = popoverCoords.left + 45;
            startY = popoverCoords.top;
            endX = Math.min(
                popoverCoords.left + 65,
                Math.max(targetRect.left + 15, targetRect.left + targetRect.width / 2)
            );
            endY = targetRect.bottom + 8;
            ctrlX = (startX + endX) / 2 + 18;
            ctrlY = (startY + endY) / 2;
        } else {
            // "right"
            startX = popoverCoords.left;
            startY = popoverCoords.top + 34;
            endX = targetRect.right + 8;
            endY = Math.min(
                popoverCoords.top + 34,
                Math.max(targetRect.top + 10, targetRect.top + targetRect.height / 2)
            );
            ctrlX = (startX + endX) / 2;
            ctrlY = (startY + endY) / 2 - 16;
        }

        const dx = endX - ctrlX;
        const dy = endY - ctrlY;
        const angle = Math.atan2(dy, dx);
        const headLen = 7.5;
        const x1 = endX - headLen * Math.cos(angle - Math.PI / 6.5);
        const y1 = endY - headLen * Math.sin(angle - Math.PI / 6.5);
        const x2 = endX - headLen * Math.cos(angle + Math.PI / 6.5);
        const y2 = endY - headLen * Math.sin(angle + Math.PI / 6.5);

        return {
            pathD: `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`,
            arrowPoints: `${endX},${endY} ${x1},${y1} ${x2},${y2}`
        };
    }, [targetRect, popoverCoords, step.placement]);

    if (!isOpen || typeof document === "undefined") return null;

    // Dimensions for hand-drawn scribble highlight
    const scribbleW = targetRect ? Math.round(targetRect.width + 20) : 0;
    const scribbleH = targetRect ? Math.round(targetRect.height + 16) : 0;
    const scribbleTop = targetRect ? Math.round(targetRect.top - 8) : 0;
    const scribbleLeft = targetRect ? Math.round(targetRect.left - 10) : 0;

    return createPortal(
        <div className="fixed inset-0 z-[130] animate-in fade-in duration-150">
            {/* Subtle Dim Backdrop */}
            <div
                className="absolute inset-0 bg-black/15 cursor-pointer"
                onClick={handleClose}
            />

            {/* Hand-Drawn SVG Scribble Circle/Loop Highlight */}
            {targetRect && (
                <div
                    className="fixed pointer-events-none z-[136] transition-all duration-200"
                    style={{
                        top: `${scribbleTop}px`,
                        left: `${scribbleLeft}px`,
                        width: `${scribbleW}px`,
                        height: `${scribbleH}px`
                    }}
                >
                    <svg
                        width={scribbleW}
                        height={scribbleH}
                        viewBox={`0 0 ${scribbleW} ${scribbleH}`}
                        fill="none"
                        className="w-full h-full overflow-visible"
                    >
                        <filter id="tour-scribble-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <path
                            key={stepIndex}
                            d={generateScribblePath(scribbleW, scribbleH)}
                            stroke="#f59e0b"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#tour-scribble-glow)"
                            className="animate-scribble"
                        />
                    </svg>
                </div>
            )}

            {/* Hand-Drawn Curved Pointer Arrow */}
            {connectorArrow && (
                <svg className="fixed inset-0 w-full h-full pointer-events-none z-[138]">
                    <path
                        key={`arrow-${stepIndex}`}
                        d={connectorArrow.pathD}
                        stroke="#5b82a6"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <polygon
                        key={`arrowhead-${stepIndex}`}
                        points={connectorArrow.arrowPoints}
                        fill="#5b82a6"
                    />
                </svg>
            )}

            {/* Warm Paper-Feel Popover Card (Zero Nested Boxes) */}
            <div
                style={{
                    position: "fixed",
                    top: `${popoverCoords.top}px`,
                    left: `${popoverCoords.left}px`,
                    zIndex: 140
                }}
                className="w-[315px] max-w-[315px] bg-[#fcfcfa] rounded-2xl border border-[#d8d8d4] border-b-[3px] border-b-[#c2c2bc] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-5 z-[140] pointer-events-auto animate-in fade-in zoom-in-95 duration-150 text-left select-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header row: doodle label + close */}
                <div className="flex items-center justify-between">
                    <span className="font-doodle text-[16.5px] font-bold text-[#5b82a6] select-none">
                        {step.label}
                    </span>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-[#a1a1aa] hover:text-[#141413] transition-colors p-0.5"
                        title="Close tour"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-semibold text-[#141413] mt-1 leading-snug">
                    {step.title}
                </h3>

                {/* Subtle hand-drawn title underline doodle */}
                <svg className="w-14 h-1.5 text-[#f59e0b] stroke-current stroke-[1.8] fill-none mt-1" viewBox="0 0 56 6">
                    <path d="M 1 3.5 C 14 1, 28 5.5, 42 2 C 48 0.5, 53 4, 55 3" strokeLinecap="round" />
                </svg>

                {/* Body (1–2 concise sentences) */}
                <p className="text-[13px] text-[#6e6e77] leading-relaxed mt-2">
                    {step.body}
                </p>

                {/* Step 1 Interactive Link: Open Source Menu */}
                {step.actionType === "source-menu" && (
                    <div className="mt-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                onOpenSourceMenu?.();
                            }}
                            className="text-[12px] font-medium text-[#141413] nexvyn-dash hover:text-black cursor-pointer inline-flex items-center gap-1"
                        >
                            open source menu ▾
                        </button>
                    </div>
                )}

                {/* Step 2 Inline Preview Toggle: View BIMA Table Example */}
                {step.actionType === "bima-preview" && (
                    <div className="mt-2.5">
                        <button
                            type="button"
                            onClick={() => setShowImage(!showImage)}
                            className="text-[12px] text-[#5b82a6] hover:text-[#141413] underline decoration-dashed underline-offset-4 cursor-pointer"
                        >
                            {showImage ? "hide example" : "view BIMA table example"}
                        </button>
                        {showImage && (
                            <div className="mt-2.5 rounded-lg overflow-hidden border border-[#e6e6e3] relative w-full h-32">
                                <Image
                                    src="/bima_reference.png"
                                    alt="BIMA table reference"
                                    fill
                                    sizes="280px"
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3 Interactive Link: Open Plan Menu */}
                {step.actionType === "plan-menu" && (
                    <div className="mt-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                onOpenPlanMenu?.();
                            }}
                            className="text-[12px] font-medium text-[#141413] nexvyn-dash hover:text-black cursor-pointer inline-flex items-center gap-1"
                        >
                            open plan menu ▾
                        </button>
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
                                className="text-[12.5px] text-[#6e6e77] hover:text-[#141413] px-2 py-1 transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="btn-tactile-dark px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium text-white flex items-center gap-1 transition-all select-none shadow-xs cursor-pointer"
                        >
                            <span>{stepIndex === STEPS.length - 1 ? "Finish" : "Next →"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
