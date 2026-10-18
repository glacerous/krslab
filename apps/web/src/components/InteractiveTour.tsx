"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface InteractiveTourProps {
    isOpen: boolean;
    onClose: () => void;
    tourStep?: number;
    onStepChange?: (stepIndex: number) => void;
    onFocusFirstCourse?: () => void;
    onClearFocus?: () => void;
    selectedClasses?: any[];
}

interface StepConfig {
    targetId: string;
    label: string;
    title: string;
    body: string;
    actionType?: "bima-preview";
}

const STEPS: StepConfig[] = [
    {
        targetId: "tour-datasource-btn",
        label: "1 of 6",
        title: "Manage schedule sources",
        body: "Switch between semester datasets, duplicate or rename a source, or add a new BIMA schedule from the live menu."
    },
    {
        targetId: "tour-data-modal",
        label: "2 of 6",
        title: "Importing BIMA table data",
        body: "In bima.upnyk.ac.id (Menu Perkuliahan → Dosen → Jadwal Dosen), copy the table rows (Ctrl+C) and paste into the box. Lecturers and rooms parse automatically.",
        actionType: "bima-preview"
    },
    {
        targetId: "tour-plan-btn",
        label: "3 of 6",
        title: "Create & switch plans",
        body: "Build multiple schedule backups (Plan 1, Plan 2) for the same source. Switch, rename, duplicate, or create a new plan here."
    },
    {
        targetId: "tour-course-panel",
        label: "4 of 6",
        title: "Pick your semester courses",
        body: "Browse the course catalog and check the subjects you need. Every selected course is placed onto the timetable grid automatically."
    },
    {
        targetId: "tour-first-node",
        label: "5 of 6",
        title: "Drag or click to swap classes",
        body: "Drag any course block (or click the dashed amber slots on the grid) to switch to a different day, time, or lecturer."
    },
    {
        targetId: "tour-solver-bar",
        label: "6 of 6",
        title: "Lock, set rules & auto-schedule",
        body: "Lock favorite classes on the grid, add day/gap constraints in Rules, and press Space to shuffle conflict-free combinations."
    }
];

// Generates a single organic hand-drawn doodle frame with subtle natural curvature
function generateSingleScribblePath(w: number, h: number): string {
    const r = Math.min(10, Math.min(w, h) / 4);
    const x0 = 2;
    const y0 = 2;
    const x1 = w - 2;
    const y1 = h - 2;
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;

    return [
        `M ${x0 + r} ${y0 + 0.5}`,
        `C ${midX - 8} ${y0 - 0.7}, ${midX + 8} ${y0 + 0.5}, ${x1 - r} ${y0}`,
        `C ${x1} ${y0 + 0.4}, ${x1 + 0.7} ${y0 + r}, ${x1} ${y0 + r + 2}`,
        `C ${x1 + 0.5} ${midY - 6}, ${x1 - 0.6} ${midY + 6}, ${x1} ${y1 - r}`,
        `C ${x1 + 0.4} ${y1}, ${x1 - 0.8} ${y1 + 0.7}, ${x1 - r} ${y1}`,
        `C ${midX + 8} ${y1 + 0.7}, ${midX - 8} ${y1 - 0.5}, ${x0 + r} ${y1}`,
        `C ${x0} ${y1 - 0.4}, ${x0 - 0.7} ${y1 - r}, ${x0} ${y1 - r - 2}`,
        `C ${x0 - 0.6} ${midY + 6}, ${x0 + 0.5} ${midY - 6}, ${x0} ${y0 + r}`,
        `C ${x0 - 0.3} ${y0 + 2}, ${x0 + 1.5} ${y0 - 0.4}, ${x0 + r + 3} ${y0 + 0.2}`
    ].join(" ");
}

export function InteractiveTour({
    isOpen,
    onClose,
    tourStep,
    onStepChange,
    onFocusFirstCourse,
    onClearFocus
}: InteractiveTourProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [showImage, setShowImage] = useState(false);

    // Sync external tourStep if provided
    useEffect(() => {
        if (tourStep !== undefined && tourStep !== stepIndex) {
            setStepIndex(tourStep);
        }
    }, [tourStep, stepIndex]);

    const step = STEPS[stepIndex] || STEPS[0];

    const goToStep = useCallback((newIndex: number) => {
        setStepIndex(newIndex);
        setShowImage(false);
        onStepChange?.(newIndex);
    }, [onStepChange]);

    // Reset when tour opens
    useEffect(() => {
        if (isOpen) {
            setStepIndex(0);
            setShowImage(false);
            onStepChange?.(0);
        }
    }, [isOpen, onStepChange]);

    const handleClose = useCallback(() => {
        onClearFocus?.();
        onClose();
    }, [onClearFocus, onClose]);

    const handleNext = useCallback(() => {
        if (stepIndex < STEPS.length - 1) {
            goToStep(stepIndex + 1);
        } else {
            handleClose();
        }
    }, [stepIndex, goToStep, handleClose]);

    const handleBack = useCallback(() => {
        if (stepIndex > 0) {
            goToStep(stepIndex - 1);
        }
    }, [stepIndex, goToStep]);

    // Keyboard navigation: ESC to close, Enter/ArrowRight for next, ArrowLeft for back
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
            if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
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
            onFocusFirstCourse?.();
        } else {
            onClearFocus?.();
        }
    }, [stepIndex, isOpen, onFocusFirstCourse, onClearFocus]);

    // Measure target element with resilient fallbacks
    useEffect(() => {
        if (!isOpen || !step) return;

        const updateRect = () => {
            let el = document.getElementById(step.targetId);
            if (!el && stepIndex === 1) {
                el = document.getElementById("tour-data-modal");
            }
            if (!el && stepIndex === 3) {
                el = document.getElementById("tour-course-panel") || document.getElementById("tour-add-course-btn");
            }
            if (!el && stepIndex === 4) {
                el = document.getElementById("tour-first-node") || document.getElementById("krs-grid-capture");
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
        const interval = setInterval(updateRect, 150);
        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, true);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", updateRect);
            window.removeEventListener("scroll", updateRect, true);
        };
    }, [stepIndex, isOpen, step]);

    // Card position calculation: intelligent per-step placement
    const CARD_WIDTH = 315;
    const popoverCoords = useMemo(() => {
        if (!targetRect) {
            return {
                top: Math.max(20, window.innerHeight / 2 - 130),
                left: Math.max(16, window.innerWidth / 2 - CARD_WIDTH / 2)
            };
        }

        // Step 1 (1 of 6): Manage schedule sources
        // Position directly to the right of the open source dropdown menu card
        if (stepIndex === 0) {
            const menuEl = document.getElementById("tour-source-menu-card");
            if (menuEl) {
                const menuRect = menuEl.getBoundingClientRect();
                const left = Math.min(window.innerWidth - CARD_WIDTH - 16, menuRect.right + 16);
                const top = Math.max(16, Math.min(window.innerHeight - 300, menuRect.top + 8));
                return { top, left };
            }
            // Fallback if menu card is mounting
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, 360);
            const top = Math.max(16, targetRect.bottom + 10);
            return { top, left };
        }

        // Step 2 (2 of 6): Importing BIMA table data (DataModal)
        // Position to the right of the modal if space permits, else bottom-right pinned
        if (stepIndex === 1) {
            const modalEl = document.getElementById("tour-data-modal");
            const mRect = modalEl ? modalEl.getBoundingClientRect() : targetRect;
            const spaceOnRight = window.innerWidth - mRect.right;
            if (spaceOnRight >= CARD_WIDTH + 20) {
                const left = mRect.right + 18;
                const top = Math.max(20, Math.min(window.innerHeight - 340, mRect.top + 24));
                return { top, left };
            } else {
                const left = Math.max(16, window.innerWidth - CARD_WIDTH - 20);
                const top = Math.min(window.innerHeight - 320, mRect.bottom - 160);
                return { top, left };
            }
        }

        // Step 3 (3 of 6): Create & switch plans
        // Position directly to the right of the open plan manager dropdown menu card
        if (stepIndex === 2) {
            const menuEl = document.getElementById("tour-plan-menu-card");
            if (menuEl) {
                const menuRect = menuEl.getBoundingClientRect();
                const left = Math.min(window.innerWidth - CARD_WIDTH - 16, menuRect.right + 16);
                const top = Math.max(16, Math.min(window.innerHeight - 300, menuRect.top + 8));
                return { top, left };
            }
            // Fallback
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, targetRect.right + 20);
            const top = Math.max(16, targetRect.bottom + 10);
            return { top, left };
        }

        // Step 4 (4 of 6): Pick your semester courses (Left Sidebar)
        // Position to the right of the Left Sidebar (left: 340px)
        if (stepIndex === 3) {
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, 340);
            const top = Math.max(80, Math.min(window.innerHeight - 320, 140));
            return { top, left };
        }

        // Step 5 (5 of 6): Drag or click to swap classes (Grid node)
        // CRITICAL: NEVER cover ghost drop-zones!
        // Ghost drop-zones are typically in columns to the right.
        if (stepIndex === 4) {
            const availableLeft = targetRect.left - 340;
            if (availableLeft >= CARD_WIDTH + 16) {
                // Place cleanly to the LEFT of the course node
                const left = targetRect.left - CARD_WIDTH - 16;
                const top = Math.max(80, Math.min(window.innerHeight - 300, targetRect.top));
                return { top, left };
            } else {
                // Course is in Monday/Tuesday; position at bottom-left of grid canvas
                // well below the node so both the node and any ghost slots across all columns are uncovered!
                const left = 340;
                const top = Math.min(window.innerHeight - 290, Math.max(targetRect.bottom + 40, window.innerHeight - 310));
                return { top, left };
            }
        }

        // Step 6 (6 of 6): Lock, set rules & auto-schedule
        if (stepIndex === 5) {
            const top = Math.min(window.innerHeight - 300, targetRect.bottom + 16);
            const left = Math.max(16, Math.min(window.innerWidth - CARD_WIDTH - 16, targetRect.left - 40));
            return { top, left };
        }

        // Default fallback
        const top = Math.min(window.innerHeight - 300, targetRect.bottom + 20);
        const left = Math.max(16, Math.min(window.innerWidth - CARD_WIDTH - 16, targetRect.left - 6));
        return { top, left };
    }, [targetRect, stepIndex]);

    // Connector arrow path calculation (only rendered if distance >= 28px)
    const connectorArrow = useMemo(() => {
        if (!targetRect) return null;

        const popoverRight = popoverCoords.left + CARD_WIDTH;
        const popoverBottom = popoverCoords.top + 220; // estimated card height

        // Calculate edge-to-edge distance between target and popover card
        const dx = Math.max(0, Math.max(targetRect.left - popoverRight, popoverCoords.left - targetRect.right));
        const dy = Math.max(0, Math.max(targetRect.top - popoverBottom, popoverCoords.top - targetRect.bottom));
        const distance = Math.hypot(dx, dy);

        // Suppress arrow if distance is less than 28px
        if (distance < 28) return null;

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let ctrlX = 0;
        let ctrlY = 0;

        if (popoverCoords.left >= targetRect.right) {
            // Popover is to the RIGHT of target
            startX = popoverCoords.left;
            startY = Math.min(popoverCoords.top + 36, popoverCoords.top + 100);
            endX = targetRect.right + 6;
            endY = Math.max(targetRect.top + 6, Math.min(targetRect.bottom - 6, startY));
            ctrlX = (startX + endX) / 2;
            ctrlY = (startY + endY) / 2 - 12;
        } else if (popoverRight <= targetRect.left) {
            // Popover is to the LEFT of target
            startX = popoverRight;
            startY = Math.min(popoverCoords.top + 36, popoverCoords.top + 100);
            endX = targetRect.left - 6;
            endY = Math.max(targetRect.top + 6, Math.min(targetRect.bottom - 6, startY));
            ctrlX = (startX + endX) / 2;
            ctrlY = (startY + endY) / 2 - 12;
        } else if (popoverCoords.top >= targetRect.bottom) {
            // Popover is BELOW target
            startX = popoverCoords.left + 50;
            startY = popoverCoords.top;
            endX = Math.min(popoverCoords.left + 65, Math.max(targetRect.left + 15, targetRect.left + targetRect.width / 2));
            endY = targetRect.bottom + 6;
            ctrlX = (startX + endX) / 2 + 16;
            ctrlY = (startY + endY) / 2;
        } else {
            // Popover is ABOVE target
            startX = popoverCoords.left + 50;
            startY = popoverBottom;
            endX = Math.min(popoverCoords.left + 65, Math.max(targetRect.left + 15, targetRect.left + targetRect.width / 2));
            endY = targetRect.top - 6;
            ctrlX = (startX + endX) / 2 - 16;
            ctrlY = (startY + endY) / 2;
        }

        const adx = endX - ctrlX;
        const ady = endY - ctrlY;
        const angle = Math.atan2(ady, adx);
        const headLen = 6.5;
        const x1 = endX - headLen * Math.cos(angle - Math.PI / 6.5);
        const y1 = endY - headLen * Math.sin(angle - Math.PI / 6.5);
        const x2 = endX - headLen * Math.cos(angle + Math.PI / 6.5);
        const y2 = endY - headLen * Math.sin(angle + Math.PI / 6.5);

        return {
            pathD: `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`,
            arrowPoints: `${endX},${endY} ${x1},${y1} ${x2},${y2}`
        };
    }, [targetRect, popoverCoords]);

    if (!isOpen || typeof document === "undefined") return null;

    // Dimensions for single hand-drawn scribble highlight with 6px padding offset
    const PAD = 6;
    const scribbleW = targetRect ? Math.round(targetRect.width + PAD * 2) : 0;
    const scribbleH = targetRect ? Math.round(targetRect.height + PAD * 2) : 0;
    const scribbleTop = targetRect ? Math.round(targetRect.top - PAD) : 0;
    const scribbleLeft = targetRect ? Math.round(targetRect.left - PAD) : 0;

    return createPortal(
        <div className="fixed inset-0 z-[10000] animate-in fade-in duration-150">
            {/* Subtle Dim Backdrop */}
            <div
                className="absolute inset-0 bg-black/15 cursor-pointer pointer-events-auto"
                onClick={handleClose}
            />

            {/* Hand-Drawn SVG Scribble Loop Highlight (Single 1.35px Slate-Blue Stroke) */}
            {targetRect && (
                <div
                    className="fixed pointer-events-none z-[10001] transition-all duration-200"
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
                        <path
                            key={stepIndex}
                            d={generateSingleScribblePath(scribbleW, scribbleH)}
                            stroke="#6488a8"
                            strokeWidth="1.35"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            className="animate-scribble"
                        />
                    </svg>
                </div>
            )}

            {/* Hand-Drawn Curved Pointer Arrow (Only if distance >= 28px) */}
            {connectorArrow && (
                <svg className="fixed inset-0 w-full h-full pointer-events-none z-[10001]">
                    <path
                        key={`arrow-${stepIndex}`}
                        d={connectorArrow.pathD}
                        stroke="#6488a8"
                        strokeWidth="1.25"
                        strokeDasharray="4 3"
                        vectorEffect="non-scaling-stroke"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <polygon
                        key={`arrowhead-${stepIndex}`}
                        points={connectorArrow.arrowPoints}
                        fill="#6488a8"
                    />
                </svg>
            )}

            {/* Warm Paper-Feel Popover Card (Zero Nested Boxes) */}
            <div
                style={{
                    position: "fixed",
                    top: `${popoverCoords.top}px`,
                    left: `${popoverCoords.left}px`,
                    zIndex: 10002
                }}
                className="w-[315px] max-w-[315px] bg-[#fcfcfa] rounded-2xl border border-[#d8d8d4] border-b-[3px] border-b-[#c2c2bc] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-5 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 text-left select-none"
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
                <h3 className="text-[15px] font-semibold text-[#141413] mt-1.5 leading-snug">
                    {step.title}
                </h3>

                {/* Body (1–2 concise sentences) */}
                <p className="text-[13px] text-[#6e6e77] leading-relaxed mt-2">
                    {step.body}
                </p>

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
