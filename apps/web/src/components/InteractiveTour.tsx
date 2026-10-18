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
    label: string;
    title: string;
    body: string;
    actionType?: "bima-preview";
}

const STEPS: StepConfig[] = [
    {
        label: "1 of 6",
        title: "Manage schedule sources",
        body: "Switch between semester datasets, duplicate or rename a source, or add a new BIMA schedule from the live menu."
    },
    {
        label: "2 of 6",
        title: "Importing BIMA table data",
        body: "In bima.upnyk.ac.id (Menu Perkuliahan → Dosen → Jadwal Dosen), copy the table rows (Ctrl+C) and paste into the box. Lecturers and rooms parse automatically.",
        actionType: "bima-preview"
    },
    {
        label: "3 of 6",
        title: "Create & switch plans",
        body: "Build multiple schedule backups (Plan 1, Plan 2) for the same source. Switch, rename, duplicate, or create a new plan here."
    },
    {
        label: "4 of 6",
        title: "Pick your semester courses",
        body: "Browse the course catalog and check the subjects you need. Every selected course is placed onto the timetable grid automatically."
    },
    {
        label: "5 of 6",
        title: "Drag or click to swap classes",
        body: "Drag any course block (or click the dashed amber slots on the grid) to switch to a different day, time, or lecturer."
    },
    {
        label: "6 of 6",
        title: "Lock, set rules & auto-schedule",
        body: "Lock favorite classes on the grid, add day/gap constraints in Rules, and press Space to shuffle conflict-free combinations."
    }
];

// Helper to compute union bounding box of multiple rects
interface SimpleRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

function computeUnionRect(rects: SimpleRect[]): SimpleRect | null {
    if (rects.length === 0) return null;
    let minLeft = rects[0].left;
    let minTop = rects[0].top;
    let maxRight = rects[0].right;
    let maxBottom = rects[0].bottom;

    for (let i = 1; i < rects.length; i++) {
        minLeft = Math.min(minLeft, rects[i].left);
        minTop = Math.min(minTop, rects[i].top);
        maxRight = Math.max(maxRight, rects[i].right);
        maxBottom = Math.max(maxBottom, rects[i].bottom);
    }

    return {
        left: minLeft,
        top: minTop,
        right: maxRight,
        bottom: maxBottom,
        width: maxRight - minLeft,
        height: maxBottom - minTop
    };
}

// Generates an authentic hand-drawn organic scribble loop using cubic Beziers with natural wobble, corner overshoot, and overlapping tail
function generateOrganicScribblePath(w: number, h: number, pad: number = 2): string {
    const x0 = pad;
    const y0 = pad;
    const x1 = w - pad;
    const y1 = h - pad;
    const rx = Math.min(12, Math.max(4, w * 0.06));
    const ry = Math.min(12, Math.max(4, h * 0.06));
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;

    return [
        // Start on top edge, slightly right of top-left corner
        `M ${x0 + rx + 4} ${y0 + 0.8}`,
        // Top edge: subtle organic bow with slight upward arch
        `C ${midX - 12} ${y0 - 1.4}, ${midX + 14} ${y0 + 0.5}, ${x1 - rx} ${y0 - 0.2}`,
        // Top-right corner: curves around and slightly overshoots
        `C ${x1 + 2.5} ${y0 - 0.4}, ${x1 + 3.2} ${y0 + ry * 0.8}, ${x1 + 1.2} ${y0 + ry + 3}`,
        // Right edge: slight inward wobble
        `C ${x1 - 1.2} ${midY - 10}, ${x1 + 1.8} ${midY + 10}, ${x1 + 0.5} ${y1 - ry - 2}`,
        // Bottom-right corner: organic turn
        `C ${x1 + 1.0} ${y1 + 2.2}, ${x1 - rx * 0.6} ${y1 + 2.6}, ${x1 - rx - 3} ${y1 + 1.2}`,
        // Bottom edge: gentle curve
        `C ${midX + 12} ${y1 + 1.8}, ${midX - 14} ${y1 - 1.0}, ${x0 + rx + 2} ${y1 + 0.6}`,
        // Bottom-left corner: organic turn
        `C ${x0 - 2.2} ${y1 + 1.2}, ${x0 - 2.8} ${y1 - ry * 0.8}, ${x0 - 1.2} ${y1 - ry - 3}`,
        // Left edge: slight natural bow
        `C ${x0 + 1.2} ${midY + 10}, ${x0 - 1.8} ${midY - 10}, ${x0 - 0.5} ${y0 + ry + 2}`,
        // Top-left corner: curves past start with authentic loop-closure overshoot tail
        `C ${x0 - 1.0} ${y0 - 1.2}, ${x0 + rx * 0.5} ${y0 - 2.0}, ${x0 + rx + 12} ${y0 - 0.6}`
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
    const [spotlightRect, setSpotlightRect] = useState<SimpleRect | null>(null);
    const [scribbleRect, setScribbleRect] = useState<SimpleRect | null>(null);
    const [showImage, setShowImage] = useState(false);

    // Sync external tourStep if provided
    useEffect(() => {
        if (tourStep !== undefined && tourStep !== stepIndex) {
            setStepIndex(tourStep);
        }
    }, [tourStep, stepIndex]);

    const step = STEPS[stepIndex] || STEPS[0];

    // Per-step cutout parameters:
    // Steps 1, 3, 4, 5 are self-contained bordered containers -> offset = 0px (flush, zero gap/halo!)
    // Step 2 is DataModal with its own backdrop -> omitCutout = true (zero grey gap frame!)
    // Step 6 is multi-button group -> offset = 8px (pill padding)
    const stepCutoutConfig = useMemo(() => {
        switch (stepIndex) {
            case 0: // Step 1: Sources dropdown menu
                return { offset: 0, borderRadius: "12px", scribblePad: 2, omitCutout: false };
            case 1: // Step 2: BIMA Import Modal (DataModal already has full-screen backdrop)
                return { offset: 0, borderRadius: "16px", scribblePad: 2, omitCutout: true };
            case 2: // Step 3: Plan manager dropdown menu
                return { offset: 0, borderRadius: "12px", scribblePad: 2, omitCutout: false };
            case 3: // Step 4: Course catalog sidebar (flush to left/top/bottom edges)
                return { offset: 0, borderRadius: "0px", scribblePad: 2, omitCutout: false };
            case 4: // Step 5: Grid course node
                return { offset: 0, borderRadius: "12px", scribblePad: 2, omitCutout: false };
            case 5: // Step 6: Multi-button solver group
                return { offset: 8, borderRadius: "14px", scribblePad: 6, omitCutout: false };
            default:
                return { offset: 0, borderRadius: "12px", scribblePad: 2, omitCutout: false };
        }
    }, [stepIndex]);

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

    // Continuous dynamic measurement of spotlightRect (cutout) and scribbleRect (hand-drawn highlight)
    useEffect(() => {
        if (!isOpen) return;

        const measureTargets = () => {
            // STEP 0 (1 of 6): Sources Dropdown Menu (Flush 0px cutout around the open menu)
            if (stepIndex === 0) {
                const menuEl = document.getElementById("tour-source-menu-card");
                const btnEl = document.getElementById("tour-datasource-btn");
                const target = menuEl || btnEl;
                const rect = target ? target.getBoundingClientRect() : null;
                setSpotlightRect(rect);
                setScribbleRect(rect);
                return;
            }

            // STEP 1 (2 of 6): BIMA Import Modal
            if (stepIndex === 1) {
                const modalEl = document.getElementById("tour-data-modal");
                const pasteAreaEl = document.getElementById("tour-bima-paste-area");
                const mRect = modalEl ? modalEl.getBoundingClientRect() : null;
                const pRect = pasteAreaEl ? pasteAreaEl.getBoundingClientRect() : null;

                setSpotlightRect(mRect);
                setScribbleRect(pRect || mRect);
                return;
            }

            // STEP 2 (3 of 6): Plan Manager Dropdown Menu (Flush 0px cutout around the open menu)
            if (stepIndex === 2) {
                const menuEl = document.getElementById("tour-plan-menu-card");
                const btnEl = document.getElementById("tour-plan-btn");
                const target = menuEl || btnEl;
                const rect = target ? target.getBoundingClientRect() : null;
                setSpotlightRect(rect);
                setScribbleRect(rect);
                return;
            }

            // STEP 3 (4 of 6): Course Catalog Sidebar (Flush 0px cutout around the entire sidebar)
            if (stepIndex === 3) {
                const sidebarEl = document.getElementById("tour-course-panel");
                const searchEl = document.getElementById("tour-catalog-search-area");
                const row1El = document.getElementById("tour-catalog-first-row");
                const row2El = document.getElementById("tour-catalog-second-row");

                const sRect = sidebarEl ? sidebarEl.getBoundingClientRect() : null;
                setSpotlightRect(sRect);

                const topAreaRects: SimpleRect[] = [];
                if (searchEl) topAreaRects.push(searchEl.getBoundingClientRect());
                if (row1El) topAreaRects.push(row1El.getBoundingClientRect());
                if (row2El) topAreaRects.push(row2El.getBoundingClientRect());

                if (topAreaRects.length > 0) {
                    setScribbleRect(computeUnionRect(topAreaRects));
                } else if (sRect) {
                    setScribbleRect({
                        left: sRect.left + 8,
                        top: sRect.top + 80,
                        right: sRect.right - 8,
                        bottom: sRect.top + 280,
                        width: sRect.width - 16,
                        height: 200
                    });
                } else {
                    setScribbleRect(null);
                }
                return;
            }

            // STEP 4 (5 of 6): Grid Course Node (Flush 0px cutout around the course card)
            if (stepIndex === 4) {
                const nodeEl = document.getElementById("tour-first-node");
                const nRect = nodeEl ? nodeEl.getBoundingClientRect() : null;
                setSpotlightRect(nRect);
                setScribbleRect(nRect);
                return;
            }

            // STEP 5 (6 of 6): Solver Controls Bar (Pill cutout with +8px padding)
            if (stepIndex === 5) {
                const solverEl = document.getElementById("tour-solver-bar") || document.getElementById("tour-auto-schedule-btn");
                const sRect = solverEl ? solverEl.getBoundingClientRect() : null;
                setSpotlightRect(sRect);
                setScribbleRect(sRect);
                return;
            }

            setSpotlightRect(null);
            setScribbleRect(null);
        };

        measureTargets();
        const interval = setInterval(measureTargets, 150);
        window.addEventListener("resize", measureTargets);
        window.addEventListener("scroll", measureTargets, true);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", measureTargets);
            window.removeEventListener("scroll", measureTargets, true);
        };
    }, [stepIndex, isOpen]);

    // Intelligent per-step tour card position calculation
    const CARD_WIDTH = 315;
    const popoverCoords = useMemo(() => {
        if (!scribbleRect) {
            return {
                top: Math.max(20, window.innerHeight / 2 - 130),
                left: Math.max(16, window.innerWidth / 2 - CARD_WIDTH / 2)
            };
        }

        // Step 1 (1 of 6): Manage schedule sources
        // Position directly to the right of the open source dropdown menu card
        if (stepIndex === 0) {
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, scribbleRect.right + 18);
            const top = Math.max(16, Math.min(window.innerHeight - 300, scribbleRect.top + 8));
            return { top, left };
        }

        // Step 2 (2 of 6): Importing BIMA table data (DataModal)
        // Position to the right of the modal if space permits, else bottom-right pinned
        if (stepIndex === 1) {
            const modalEl = document.getElementById("tour-data-modal");
            const mRect = modalEl ? modalEl.getBoundingClientRect() : scribbleRect;
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
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, scribbleRect.right + 18);
            const top = Math.max(16, Math.min(window.innerHeight - 300, scribbleRect.top + 8));
            return { top, left };
        }

        // Step 4 (4 of 6): Pick your semester courses (Left Sidebar)
        // Position to the right of the Left Sidebar (left: 340px)
        if (stepIndex === 3) {
            const left = Math.min(window.innerWidth - CARD_WIDTH - 16, 340);
            const top = Math.max(80, Math.min(window.innerHeight - 320, 130));
            return { top, left };
        }

        // Step 5 (5 of 6): Drag or click to swap classes (Grid node)
        // CRITICAL: NEVER cover ghost drop-zones!
        if (stepIndex === 4) {
            const availableLeft = scribbleRect.left - 340;
            if (availableLeft >= CARD_WIDTH + 16) {
                // Place cleanly to the LEFT of the course node
                const left = scribbleRect.left - CARD_WIDTH - 16;
                const top = Math.max(80, Math.min(window.innerHeight - 300, scribbleRect.top));
                return { top, left };
            } else {
                // Course is in Monday/Tuesday; position at bottom-left of grid canvas
                // well below daytime slots so both the node and any ghost slots across all columns are uncovered!
                const left = 340;
                const top = Math.min(window.innerHeight - 290, Math.max(scribbleRect.bottom + 40, window.innerHeight - 310));
                return { top, left };
            }
        }

        // Step 6 (6 of 6): Lock, set rules & auto-schedule
        if (stepIndex === 5) {
            const top = Math.min(window.innerHeight - 300, scribbleRect.bottom + 16);
            const left = Math.max(16, Math.min(window.innerWidth - CARD_WIDTH - 16, scribbleRect.left - 40));
            return { top, left };
        }

        // Default fallback
        const top = Math.min(window.innerHeight - 300, scribbleRect.bottom + 20);
        const left = Math.max(16, Math.min(window.innerWidth - CARD_WIDTH - 16, scribbleRect.left - 6));
        return { top, left };
    }, [scribbleRect, stepIndex]);

    // Connector arrow path calculation (Connects between NEAREST EDGES so it NEVER cuts across open menus!)
    const connectorArrow = useMemo(() => {
        if (!scribbleRect) return null;

        const popoverRight = popoverCoords.left + CARD_WIDTH;
        const popoverBottom = popoverCoords.top + 220; // estimated card height

        // Calculate edge-to-edge distance between scribbleRect and popover card
        const dx = Math.max(0, Math.max(scribbleRect.left - popoverRight, popoverCoords.left - scribbleRect.right));
        const dy = Math.max(0, Math.max(scribbleRect.top - popoverBottom, popoverCoords.top - scribbleRect.bottom));
        const distance = Math.hypot(dx, dy);

        // Suppress arrow if distance is less than 28px
        if (distance < 28) return null;

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let ctrlX = 0;
        let ctrlY = 0;

        if (popoverCoords.left >= scribbleRect.right) {
            // Popover is to the RIGHT of scribble target:
            // Connect from the LEFT edge of the popover card to the RIGHT edge of the scribble loop!
            startX = popoverCoords.left;
            startY = Math.max(popoverCoords.top + 24, Math.min(popoverCoords.top + 80, scribbleRect.top + scribbleRect.height / 2));
            endX = scribbleRect.right + 4;
            endY = Math.max(scribbleRect.top + 10, Math.min(scribbleRect.bottom - 10, startY));
            ctrlX = (startX + endX) / 2;
            ctrlY = (startY + endY) / 2 - 12;
        } else if (popoverRight <= scribbleRect.left) {
            // Popover is to the LEFT of scribble target:
            // Connect from the RIGHT edge of the popover card to the LEFT edge of the scribble loop!
            startX = popoverRight;
            startY = Math.max(popoverCoords.top + 24, Math.min(popoverCoords.top + 80, scribbleRect.top + scribbleRect.height / 2));
            endX = scribbleRect.left - 4;
            endY = Math.max(scribbleRect.top + 10, Math.min(scribbleRect.bottom - 10, startY));
            ctrlX = (startX + endX) / 2;
            ctrlY = (startY + endY) / 2 - 12;
        } else if (popoverCoords.top >= scribbleRect.bottom) {
            // Popover is BELOW scribble target:
            // Connect from the TOP edge of the popover card to the BOTTOM edge of the scribble loop!
            startX = Math.max(popoverCoords.left + 30, Math.min(popoverRight - 30, scribbleRect.left + scribbleRect.width / 2));
            startY = popoverCoords.top;
            endX = Math.max(scribbleRect.left + 15, Math.min(scribbleRect.right - 15, startX));
            endY = scribbleRect.bottom + 4;
            ctrlX = (startX + endX) / 2 + 14;
            ctrlY = (startY + endY) / 2;
        } else {
            // Popover is ABOVE scribble target:
            // Connect from the BOTTOM edge of the popover card to the TOP edge of the scribble loop!
            startX = Math.max(popoverCoords.left + 30, Math.min(popoverRight - 30, scribbleRect.left + scribbleRect.width / 2));
            startY = popoverBottom;
            endX = Math.max(scribbleRect.left + 15, Math.min(scribbleRect.right - 15, startX));
            endY = scribbleRect.top - 4;
            ctrlX = (startX + endX) / 2 - 14;
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
    }, [scribbleRect, popoverCoords]);

    if (!isOpen || typeof document === "undefined") return null;

    // Dimensions for organic hand-drawn scribble highlight (flush along border with 2px padding offset)
    const scribblePad = stepCutoutConfig.scribblePad;
    const scribbleW = scribbleRect ? Math.round(scribbleRect.width + scribblePad * 2) : 0;
    const scribbleH = scribbleRect ? Math.round(scribbleRect.height + scribblePad * 2) : 0;
    const scribbleTop = scribbleRect ? Math.round(scribbleRect.top - scribblePad) : 0;
    const scribbleLeft = scribbleRect ? Math.round(scribbleRect.left - scribblePad) : 0;

    return createPortal(
        <div className="fixed inset-0 z-[10000] pointer-events-none animate-in fade-in duration-150">
            {/* Cutout Spotlight (100% Bright & Interactive Inside, Zero Gap around self-contained containers!) */}
            {spotlightRect && !stepCutoutConfig.omitCutout && (
                <div
                    className="fixed pointer-events-none transition-all duration-200"
                    style={{
                        top: `${Math.round(spotlightRect.top - stepCutoutConfig.offset)}px`,
                        left: `${Math.round(spotlightRect.left - stepCutoutConfig.offset)}px`,
                        width: `${Math.round(spotlightRect.width + stepCutoutConfig.offset * 2)}px`,
                        height: `${Math.round(spotlightRect.height + stepCutoutConfig.offset * 2)}px`,
                        borderRadius: stepCutoutConfig.borderRadius,
                        boxShadow: "0 0 0 9999px rgba(20, 20, 19, 0.25)",
                        zIndex: 10000
                    }}
                />
            )}

            {/* Hand-Drawn SVG Organic Scribble Loop Highlight (Freehand Cubic Beziers in #5b82a6) */}
            {scribbleRect && (
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
                            d={generateOrganicScribblePath(scribbleW, scribbleH, scribblePad)}
                            stroke="#5b82a6"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            className="animate-scribble"
                        />
                    </svg>
                </div>
            )}

            {/* Hand-Drawn Curved Pointer Arrow (Only to Nearest Edge if distance >= 28px) */}
            {connectorArrow && (
                <svg className="fixed inset-0 w-full h-full pointer-events-none z-[10001]">
                    <path
                        key={`arrow-${stepIndex}`}
                        d={connectorArrow.pathD}
                        stroke="#5b82a6"
                        strokeWidth="1.25"
                        strokeDasharray="4 3"
                        vectorEffect="non-scaling-stroke"
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
