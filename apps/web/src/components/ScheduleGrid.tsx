"use client";

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import {
    AlertTriangle,
    Lock,
    Trash2,
    Unlock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Meeting, Subject, useAppStore } from "@/lib/store";
import { getSubjectColor } from "@/lib/colors";
import { checkClassConflict } from "@krs/engine";
import { formatDay } from "@/lib/i18n";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const START_HOUR = 7;
const GRID_START_MINUTES = START_HOUR * 60;
const TOP_OFFSET = 12;

const SLOTS = Array.from({ length: 13 * 2 }, (_, i) => {
    const h = Math.floor(i / 2) + START_HOUR;
    const m = (i % 2) * 30;
    return { h, m, isMajor: m === 0 };
});

const DayHeaders = memo(function DayHeaders({ compact, language }: { compact: boolean; language: string }) {
    return (
        <div className="flex bg-[#fafaf9] dark:bg-[#141418] shrink-0 z-20 border-b border-[#e6e6e3] dark:border-[#1e1e24] sticky top-0">
            <div
                className={cn(
                    "w-14 border-r border-[#e6e6e3] dark:border-[#1e1e24] flex items-center justify-center p-2 bg-neutral-50/60 dark:bg-[#141418] sticky left-0 z-20",
                    compact && "w-12"
                )}
            >
                <span className="font-doodle font-bold text-[17px] text-[#6e6e77] dark:text-[#a1a1aa] leading-none">
                    time
                </span>
            </div>
            {DAYS.map((day) => (
                <div
                    key={day}
                    className={cn(
                        "flex-1 py-2 px-3 text-center transition-colors border-r last:border-r-0 border-[#e6e6e3] dark:border-[#1e1e24] bg-[#fafaf9] dark:bg-[#141418]",
                        compact && "py-1 px-2"
                    )}
                >
                    <span className="font-doodle font-bold text-[20px] text-[#141413] dark:text-[#f4f4f6] tracking-normal leading-tight">
                        {compact ? formatDay(day, language, true) : formatDay(day, language)}
                    </span>
                </div>
            ))}
        </div>
    );
});

const GridBackground = memo(function GridBackground({ rowHeight }: { rowHeight: number }) {
    return (
        <div
            className="absolute inset-0 flex flex-col pointer-events-none"
            style={{ top: `${TOP_OFFSET}px` }}
        >
            {SLOTS.map((slot) => (
                <div
                    key={`${slot.h}-${slot.m}`}
                    style={{ height: `${rowHeight / 2}px` }}
                    className={cn(
                        "w-full relative",
                        slot.isMajor
                            ? "border-b border-[#e6e6e3]/90 dark:border-[#1e1e24]"
                            : "border-b border-[#e6e6e3]/40 dark:border-[#1e1e24]/60"
                    )}
                />
            ))}
        </div>
    );
});

const TimeColumn = memo(function TimeColumn({ compact, rowHeight }: { compact: boolean; rowHeight: number }) {
    return (
        <div
            className={cn(
                "w-14 border-r border-[#e6e6e3] dark:border-[#1e1e24] shrink-0 h-full transition-colors sticky left-0 z-40 bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md",
                compact && "w-12"
            )}
            style={{ paddingTop: `${TOP_OFFSET}px` }}
        >
            {SLOTS.map((slot) => (
                <div
                    key={`${slot.h}-${slot.m}`}
                    style={{ height: `${rowHeight / 2}px` }}
                    className="pr-2.5 relative flex items-start justify-end"
                >
                    {slot.isMajor && (
                        <span className="font-mono text-[11px] font-medium text-[#6e6e77] dark:text-[#a1a1aa] tabular-nums -mt-2">
                            {slot.h.toString().padStart(2, "0")}:00
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
});

const DayColumns = memo(function DayColumns() {
    return (
        <div className="flex-1 flex pointer-events-none">
            {DAYS.map((day) => (
                <div
                    key={day}
                    className="flex-1 border-r last:border-r-0 border-[#e6e6e3]/50 dark:border-[#1e1e24] bg-transparent"
                />
            ))}
        </div>
    );
});

interface ScheduleGridProps {
    selectedClasses: any[];
    conflicts: Record<string, boolean>;
    frozenSubjectIds?: string[];
    onToggleFreeze?: (subjectId: string) => void;
    onBlockClick?: (subjectId: string) => void;
    onSelectClass?: (subjectId: string, classId: string) => void;
    allSubjects?: Subject[];
    hoveredSubjectId?: string | null;
    hoveredClassId?: string | null;
    compact?: boolean;
    focusedSubjectId?: string | null;
    onFocusSubject?: (subjectId: string | null) => void;
    activeDatasourceName?: string;
    activePlanName?: string;
    onOpenCustomCourse?: () => void;
    onOpenImportData?: () => void;
    onBrowseCatalog?: () => void;
    onRemoveSubject?: (subjectId: string) => void;
    onDragRemoveHoverChange?: (hovering: boolean) => void;
    onDragRemoveDrop?: () => void;
}

interface PointerDragState {
    subjectId: string;
    classId: string;
    meetingIdx: number;
    pointerId: number;
    subjectName: string;
    className: string;
    timeText: string;
    room?: string;
    startX: number;
    startY: number;
    currentDx: number;
    currentDy: number;
    clientX: number;
    clientY: number;
    isMoved: boolean;
    isDragging: boolean;
    targetElem: HTMLElement | null;
}

interface FloatingDragCard {
    subjectName: string;
    className: string;
    timeText: string;
    room?: string;
    left: number;
    top: number;
    width: number;
    height: number;
    initialDx: number;
    initialDy: number;
    removing: boolean;
}

export const ScheduleGrid = memo(function ScheduleGrid({
    selectedClasses,
    conflicts,
    frozenSubjectIds = [],
    onToggleFreeze,
    onBlockClick,
    onSelectClass,
    allSubjects = [],
    hoveredSubjectId = null,
    hoveredClassId = null,
    compact = false,
    focusedSubjectId: propFocusedSubjectId,
    onFocusSubject,
    activeDatasourceName,
    activePlanName,
    onOpenCustomCourse,
    onOpenImportData,
    onBrowseCatalog,
    onRemoveSubject,
    onDragRemoveHoverChange,
    onDragRemoveDrop
}: ScheduleGridProps) {
    const language = useAppStore((state: any) => state.language);
    const [rowHeight, setRowHeight] = useState(compact ? 56 : 74);
    const [internalFocusedSubjectId, setInternalFocusedSubjectId] = useState<string | null>(null);
    const focusedSubjectId = propFocusedSubjectId !== undefined ? propFocusedSubjectId : internalFocusedSubjectId;
    const setFocusedSubjectId = useCallback((idOrUpdater: string | null | ((prev: string | null) => string | null)) => {
        const nextId = typeof idOrUpdater === "function" ? idOrUpdater(focusedSubjectId) : idOrUpdater;
        setInternalFocusedSubjectId(nextId);
        onFocusSubject?.(nextId);
    }, [focusedSubjectId, onFocusSubject]);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredGhostClassId, setHoveredGhostClassId] = useState<string | null>(null);
    const [isOverRemoveZone, setIsOverRemoveZone] = useState(false);
    const [floatingCard, setFloatingCard] = useState<FloatingDragCard | null>(null);
    const [isSpringingBack, setIsSpringingBack] = useState(false);
    const [justDroppedSubjectId, setJustDroppedSubjectId] = useState<string | null>(null);
    const [droppedOptimisticPicks, setDroppedOptimisticPicks] = useState<Record<string, string>>({});
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    const rafIdRef = useRef<number | null>(null);
    const hoveredGhostRef = useRef<string | null>(null);
    const isRemoveZoneRef = useRef(false);
    const floatingCardRef = useRef<HTMLDivElement | null>(null);
    const cachedGhostRectsRef = useRef<{ classId: string; left: number; right: number; top: number; bottom: number }[]>([]);
    const cachedLeftPanelRightRef = useRef<number | null>(null);
    const springTimeoutRef = useRef<number | null>(null);
    const removeCardTimeoutRef = useRef<number | null>(null);
    const removeOverlayTimeoutRef = useRef<number | null>(null);
    const justDroppedTimeoutRef = useRef<number | null>(null);

    const updateRemoveHover = useCallback((next: boolean) => {
        if (isRemoveZoneRef.current === next) return;
        isRemoveZoneRef.current = next;
        setIsOverRemoveZone(next);
        onDragRemoveHoverChange?.(next);
    }, [onDragRemoveHoverChange]);

    const clearDragTimeouts = useCallback(() => {
        if (springTimeoutRef.current !== null) {
            window.clearTimeout(springTimeoutRef.current);
            springTimeoutRef.current = null;
        }
        if (removeCardTimeoutRef.current !== null) {
            window.clearTimeout(removeCardTimeoutRef.current);
            removeCardTimeoutRef.current = null;
        }
        if (removeOverlayTimeoutRef.current !== null) {
            window.clearTimeout(removeOverlayTimeoutRef.current);
            removeOverlayTimeoutRef.current = null;
        }
        if (justDroppedTimeoutRef.current !== null) {
            window.clearTimeout(justDroppedTimeoutRef.current);
            justDroppedTimeoutRef.current = null;
        }
    }, []);

    const cancelActiveDrag = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        clearDragTimeouts();

        const state = pointerDragRef.current;
        if (state) {
            try {
                state.targetElem?.releasePointerCapture(state.pointerId);
            } catch {}
            if (state.targetElem) {
                state.targetElem.style.transform = "";
                state.targetElem.style.transition = "";
            }
            pointerDragRef.current = null;
        }

        cachedGhostRectsRef.current = [];
        cachedLeftPanelRightRef.current = null;
        hoveredGhostRef.current = null;
        setFloatingCard(null);
        setIsSpringingBack(false);
        setIsDragging(false);
        setHoveredGhostClassId(null);
        updateRemoveHover(false);
        setActiveDraggingCard(null);
    }, [clearDragTimeouts, updateRemoveHover]);

    useEffect(() => {
        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
            }
            clearDragTimeouts();
        };
    }, [clearDragTimeouts]);

    // Always cancel stuck drag on Alt+Tab, window blur, tab switch, or context menu
    useEffect(() => {
        const handleWindowBlur = () => {
            if (pointerDragRef.current) cancelActiveDrag();
        };
        const handleVisibilityChange = () => {
            if (document.hidden && pointerDragRef.current) cancelActiveDrag();
        };
        const handleContextMenu = () => {
            if (pointerDragRef.current) cancelActiveDrag();
        };
        const handleGlobalPointerUp = () => {
            if (pointerDragRef.current) cancelActiveDrag();
        };
        const handleGlobalPointerCancel = () => {
            if (pointerDragRef.current) cancelActiveDrag();
        };

        window.addEventListener("blur", handleWindowBlur);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("contextmenu", handleContextMenu);
        window.addEventListener("pointerup", handleGlobalPointerUp);
        window.addEventListener("pointercancel", handleGlobalPointerCancel);
        return () => {
            window.removeEventListener("blur", handleWindowBlur);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("pointerup", handleGlobalPointerUp);
            window.removeEventListener("pointercancel", handleGlobalPointerCancel);
        };
    }, [cancelActiveDrag]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener?.("change", handler);
        return () => mediaQuery.removeEventListener?.("change", handler);
    }, []);

    // Clean up optimistic picks once parent selectedClasses catches up
    useEffect(() => {
        setDroppedOptimisticPicks((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const [subId, classId] of Object.entries(next)) {
                const current = selectedClasses.find((c) => c?.subjectId === subId);
                if (current && current.classId === classId) {
                    delete next[subId];
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [selectedClasses]);
    const [activeDraggingCard, setActiveDraggingCard] = useState<{
        subjectId: string;
        classId: string;
        meetingIdx: number;
    } | null>(null);

    const [pulse, setPulse] = useState(0);
    const gridRef = useRef<HTMLDivElement>(null);
    const pointerDragRef = useRef<PointerDragState | null>(null);

    const totalHeight = TOP_OFFSET + (SLOTS.length / 2) * rowHeight + 28;

    // Trigger grid pulse and clear optimistic picks when selectedClasses change (e.g. Shuffle)
    const signature = selectedClasses.map((c) => c?.classId || "").join(",");
    useEffect(() => {
        setPulse((p) => p + 1);
        setDroppedOptimisticPicks({});
        setJustDroppedSubjectId(null);
    }, [signature]);

    // Precompute conflict names lookup once per selectedClasses change (O(N^2) once, not inside card render loops)
    const conflictNamesByClassId = useMemo(() => {
        const map: Record<string, string> = {};
        for (let i = 0; i < selectedClasses.length; i++) {
            const c1 = selectedClasses[i];
            if (!c1) continue;
            const names: string[] = [];
            for (let j = 0; j < selectedClasses.length; j++) {
                if (i === j) continue;
                const c2 = selectedClasses[j];
                if (c2 && checkClassConflict(c1 as any, c2 as any)) {
                    const name = c2.subjectName || c2.subjectCode;
                    if (name && !names.includes(name)) {
                        names.push(name);
                    }
                }
            }
            if (names.length > 0) {
                map[c1.classId] = names.join(", ");
            }
        }
        return map;
    }, [selectedClasses]);

    // Close focus or cancel drag on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (pointerDragRef.current) {
                    cancelActiveDrag();
                }
                setFocusedSubjectId(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setFocusedSubjectId, cancelActiveDrag]);

    const getPosition = useCallback((meeting: Meeting) => {
        const dayIndex = DAYS.indexOf(meeting.day);
        if (dayIndex === -1) return null;

        const [startH, startM] = meeting.start.split(":").map(Number);
        const [endH, endM] = meeting.end.split(":").map(Number);

        const startInMinutes = startH * 60 + startM;
        const endInMinutes = endH * 60 + endM;

        const top = TOP_OFFSET + ((startInMinutes - GRID_START_MINUTES) / 60) * rowHeight;
        const height = ((endInMinutes - startInMinutes) / 60) * rowHeight;

        return { dayIndex, top, height };
    }, [rowHeight]);

    // Effective focused subject: either explicitly clicked/dragged on grid, or hovered in sidebar
    const activeGhostSubjectId = focusedSubjectId || hoveredSubjectId;

    const activeGhostSubject = useMemo(() => {
        if (!activeGhostSubjectId) return null;
        return allSubjects.find((s) => s.subjectId === activeGhostSubjectId) || null;
    }, [activeGhostSubjectId, allSubjects]);

    // Currently assigned classId for ghost subject
    const currentActiveClassId = useMemo(() => {
        if (!activeGhostSubjectId) return null;
        return selectedClasses.find((c) => c.subjectId === activeGhostSubjectId)?.classId || null;
    }, [activeGhostSubjectId, selectedClasses]);

    // Available alternative sections for ghost subject
    const ghostSections = useMemo(() => {
        if (!activeGhostSubject) return [];
        return activeGhostSubject.classes.filter(
            (c) => c.classId !== currentActiveClassId
        );
    }, [activeGhostSubject, currentActiveClassId]);

    // Calculate conflicts for ghost sections against other currently selected classes
    const ghostConflictMap = useMemo(() => {
        const map: Record<string, { hasConflict: boolean; clashingName: string | null }> = {};
        if (!activeGhostSubjectId) return map;

        const otherSelectedClasses = selectedClasses.filter(
            (c) => c.subjectId !== activeGhostSubjectId
        );

        ghostSections.forEach((sec) => {
            let hasConflict = false;
            let clashingName: string | null = null;

            for (const other of otherSelectedClasses) {
                if (checkClassConflict(sec as any, other as any)) {
                    hasConflict = true;
                    clashingName = other.subjectName || other.subjectCode;
                    break;
                }
            }

            map[sec.classId] = { hasConflict, clashingName };
        });

        return map;
    }, [ghostSections, selectedClasses, activeGhostSubjectId]);

    // Layout computation: Decouple coordinate calculation from render order
    interface ComputedSlotLayout {
        cls: any;
        meeting: Meeting;
        mIdx: number;
        day: string;
        dayIdx: number;
        pos: { dayIndex: number; top: number; height: number };
        durationMin: number;
        subColIndex: number;
        clusterSize: number;
        hasDayConflict: boolean;
        isOverlapping: boolean;
        zIndex: number;
        top: number;
        height: number;
        left: string;
        width: string;
        dayLeft: string;
        dayWidth: string;
        isCompact: boolean;
        isMedium: boolean;
        isFull: boolean;
    }

    // Step A: Calculate all slot coordinates and store in a lookup Map keyed by `${subjectId}-${meetingIdx}`
    const computedSlotMap = useMemo(() => {
        const map = new Map<string, ComputedSlotLayout>();
        const slotsByDay: Record<string, {
            key: string;
            cls: any;
            meeting: Meeting;
            mIdx: number;
            day: string;
            dayIdx: number;
            startMin: number;
            endMin: number;
            durationMin: number;
            pos: { dayIndex: number; top: number; height: number };
        }[]> = {};

        DAYS.forEach((d) => {
            slotsByDay[d] = [];
        });

        selectedClasses.forEach((propCls) => {
            if (!propCls) return;
            const subject = allSubjects.find((s) => s.subjectId === propCls.subjectId);
            const optimisticClassId = droppedOptimisticPicks[propCls.subjectId];
            const optimisticClass = optimisticClassId && subject
                ? subject.classes.find((c) => c.classId === optimisticClassId)
                : null;
            const cls = optimisticClass
                ? {
                      ...propCls,
                      classId: optimisticClass.classId,
                      className: optimisticClass.className,
                      meetings: optimisticClass.meetings,
                      lecturers: optimisticClass.lecturers
                  }
                : propCls;

            (cls.meetings || []).forEach((m: Meeting, mIdx: number) => {
                const dayIdx = DAYS.indexOf(m.day);
                if (dayIdx === -1) return;
                const pos = getPosition(m);
                if (!pos) return;

                const [startH, startM] = m.start.split(":").map(Number);
                const [endH, endM] = m.end.split(":").map(Number);
                const startMin = startH * 60 + startM;
                const endMin = endH * 60 + endM;
                const durationMin = endMin - startMin;

                const key = `${cls.subjectId}-${mIdx}`;
                slotsByDay[m.day].push({
                    key,
                    cls,
                    meeting: m,
                    mIdx,
                    day: m.day,
                    dayIdx,
                    startMin,
                    endMin,
                    durationMin,
                    pos
                });
            });
        });

        // Detect overlapping clusters per day and compute sub-column layout
        DAYS.forEach((day) => {
            const daySlots = slotsByDay[day] || [];
            if (daySlots.length === 0) return;

            daySlots.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

            const clusters: typeof daySlots[] = [];
            let currentCluster: typeof daySlots = [];
            let clusterEnd = -1;

            for (const slot of daySlots) {
                if (currentCluster.length === 0) {
                    currentCluster.push(slot);
                    clusterEnd = slot.endMin;
                } else if (slot.startMin < clusterEnd) {
                    currentCluster.push(slot);
                    clusterEnd = Math.max(clusterEnd, slot.endMin);
                } else {
                    clusters.push(currentCluster);
                    currentCluster = [slot];
                    clusterEnd = slot.endMin;
                }
            }
            if (currentCluster.length > 0) {
                clusters.push(currentCluster);
            }

            for (const cluster of clusters) {
                const columnEndTimes: number[] = [];
                const subColAssignments: number[] = [];

                for (const slot of cluster) {
                    let assignedCol = -1;
                    for (let c = 0; c < columnEndTimes.length; c++) {
                        if (columnEndTimes[c] <= slot.startMin) {
                            assignedCol = c;
                            columnEndTimes[c] = slot.endMin;
                            break;
                        }
                    }
                    if (assignedCol === -1) {
                        assignedCol = columnEndTimes.length;
                        columnEndTimes.push(slot.endMin);
                    }
                    subColAssignments.push(assignedCol);
                }

                const clusterSize = Math.max(1, columnEndTimes.length);
                const hasDayConflict = cluster.length > 1;
                const isOverlapping = cluster.length > 1 && clusterSize > 1;

                cluster.forEach((slot, idx) => {
                    const subColIndex = subColAssignments[idx];
                    const dayLeftPercent = (slot.dayIdx * 100) / DAYS.length;
                    const dayWidthPercent = 100 / DAYS.length;

                    // Standard full day dimensions
                    const dayLeft = `calc(${dayLeftPercent}% + 4px)`;
                    const dayWidth = `calc(${dayWidthPercent}% - 8px)`;

                    let left = dayLeft;
                    let width = dayWidth;
                    const zIndex = isOverlapping ? 15 + subColIndex : 10;

                    if (isOverlapping) {
                        // Cascading Overlap:
                        // Each overlapping card gets 76% of the column width (colWidth * 0.76)
                        // Stagger horizontal offset across the remaining 24%
                        const cardWidthPercent = dayWidthPercent * 0.76;
                        const remainingWidthPercent = dayWidthPercent * 0.24;
                        const offsetPercent = clusterSize > 1
                            ? (subColIndex / (clusterSize - 1)) * remainingWidthPercent
                            : 0;
                        const subLeftPercent = dayLeftPercent + offsetPercent;

                        left = `calc(${subLeftPercent}% + 2px)`;
                        width = `calc(${cardWidthPercent}% - 4px)`;
                    }

                    const durationMin = slot.durationMin;
                    const isCompact = durationMin <= 75;
                    const isMedium = durationMin > 75 && durationMin <= 110;
                    const isFull = durationMin > 110;

                    map.set(slot.key, {
                        cls: slot.cls,
                        meeting: slot.meeting,
                        mIdx: slot.mIdx,
                        day: slot.day,
                        dayIdx: slot.dayIdx,
                        pos: slot.pos,
                        durationMin,
                        subColIndex,
                        clusterSize,
                        hasDayConflict,
                        isOverlapping,
                        zIndex,
                        top: slot.pos.top + 2,
                        height: slot.pos.height - 4,
                        left,
                        width,
                        dayLeft,
                        dayWidth,
                        isCompact,
                        isMedium,
                        isFull
                    });
                });
            }
        });

        return map;
    }, [selectedClasses, allSubjects, droppedOptimisticPicks, getPosition]);

    // Step B: Build an immutable, strictly deterministic array sorted by subjectId
    // The DOM tree order NEVER changes when days or times change!
    const stableCourseEntries = useMemo(() => {
        const list: {
            cls: any;
            subjectId: string;
            meetings: { m: Meeting; mIdx: number; key: string }[];
        }[] = [];

        const sortedClasses = [...selectedClasses].filter(Boolean).sort((a, b) =>
            (a.subjectId || "").localeCompare(b.subjectId || "")
        );

        sortedClasses.forEach((propCls) => {
            const subject = allSubjects.find((s) => s.subjectId === propCls.subjectId);
            const optimisticClassId = droppedOptimisticPicks[propCls.subjectId];
            const optimisticClass = optimisticClassId && subject
                ? subject.classes.find((c) => c.classId === optimisticClassId)
                : null;
            const cls = optimisticClass
                ? {
                      ...propCls,
                      classId: optimisticClass.classId,
                      className: optimisticClass.className,
                      meetings: optimisticClass.meetings,
                      lecturers: optimisticClass.lecturers
                  }
                : propCls;

            const meetings = (cls.meetings || []).map((m: Meeting, mIdx: number) => ({
                m,
                mIdx,
                key: `${cls.subjectId}-${mIdx}`
            }));

            list.push({
                cls,
                subjectId: cls.subjectId,
                meetings
            });
        });

        return list;
    }, [selectedClasses, allSubjects, droppedOptimisticPicks]);

    // =========================================================
    // POINTER DRAG HANDLERS (Butter-smooth, 60fps, no browser ghost)
    // =========================================================
    const handlePointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
        cls: any,
        meetingIdx: number
    ) => {
        if (e.button !== 0) return;

        // Clean up any leftover spring-back or remove animation before starting a new drag
        if (springTimeoutRef.current !== null) {
            window.clearTimeout(springTimeoutRef.current);
            springTimeoutRef.current = null;
            setIsSpringingBack(false);
            setFloatingCard(null);
        }

        const isFrozen = frozenSubjectIds.includes(cls.subjectId);
        const target = e.currentTarget;

        try {
            target.setPointerCapture(e.pointerId);
        } catch {}

        const m = cls.meetings?.[meetingIdx];
        pointerDragRef.current = {
            subjectId: cls.subjectId,
            classId: cls.classId,
            meetingIdx,
            pointerId: e.pointerId,
            subjectName: cls.subjectName || "",
            className: cls.className || "",
            timeText: m ? `${m.start}-${m.end}` : "",
            room: m?.room,
            startX: e.clientX,
            startY: e.clientY,
            currentDx: 0,
            currentDy: 0,
            clientX: e.clientX,
            clientY: e.clientY,
            isMoved: false,
            isDragging: false,
            targetElem: target
        };

        if (!isFrozen) {
            setActiveDraggingCard({
                subjectId: cls.subjectId,
                classId: cls.classId,
                meetingIdx
            });
        }

        if (focusedSubjectId !== cls.subjectId) {
            setFocusedSubjectId(cls.subjectId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerDragRef.current;
        if (!state || state.targetElem !== e.currentTarget) return;

        // If primary mouse button was released outside window and cursor re-entered, cancel immediately
        if (e.pointerType === "mouse" && (e.buttons & 1) === 0) {
            cancelActiveDrag();
            return;
        }

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;

        if (!state.isMoved && Math.hypot(dx, dy) > 4) {
            const isFrozen = frozenSubjectIds.includes(state.subjectId);
            if (!isFrozen) {
                state.isMoved = true;
                state.isDragging = true;
                setIsDragging(true);

                // Cache hit-test rects once at drag start to avoid per-frame layout flushes
                const leftPanelRect = document.getElementById("tour-course-panel")?.getBoundingClientRect();
                cachedLeftPanelRightRef.current =
                    onRemoveSubject && leftPanelRect && leftPanelRect.width > 0
                        ? leftPanelRect.right
                        : null;

                const ghostNodes = gridRef.current?.querySelectorAll("[data-ghost-class-id]") || [];
                cachedGhostRectsRef.current = Array.from(ghostNodes).map((el) => {
                    const r = el.getBoundingClientRect();
                    return {
                        classId: el.getAttribute("data-ghost-class-id") || "",
                        left: r.left,
                        right: r.right,
                        top: r.top,
                        bottom: r.bottom,
                    };
                }).filter((g) => g.classId);

                const rect = state.targetElem.getBoundingClientRect();
                setFloatingCard({
                    subjectName: state.subjectName,
                    className: state.className,
                    timeText: state.timeText,
                    room: state.room,
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    initialDx: dx,
                    initialDy: dy,
                    removing: false,
                });
            }
        }

        if (state.isMoved) {
            state.currentDx = dx;
            state.currentDy = dy;
            state.clientX = e.clientX;
            state.clientY = e.clientY;

            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(() => {
                    rafIdRef.current = null;
                    const curState = pointerDragRef.current;
                    if (!curState || !curState.isMoved) return;

                    if (floatingCardRef.current) {
                        floatingCardRef.current.style.transform = `translate3d(${curState.currentDx}px, ${curState.currentDy}px, 0) scale(1.02)`;
                        floatingCardRef.current.style.transition = "none";
                    }

                    const leftRight = cachedLeftPanelRightRef.current;
                    const overRemove = Boolean(leftRight !== null && curState.clientX <= leftRight);
                    updateRemoveHover(overRemove);

                    if (overRemove) {
                        if (hoveredGhostRef.current !== null) {
                            hoveredGhostRef.current = null;
                            setHoveredGhostClassId(null);
                        }
                    } else {
                        const cx = curState.clientX;
                        const cy = curState.clientY;
                        const hit = cachedGhostRectsRef.current.find(
                            (g) => cx >= g.left && cx <= g.right && cy >= g.top && cy <= g.bottom
                        );
                        const targetClassId = hit?.classId || null;
                        if (targetClassId !== hoveredGhostRef.current) {
                            hoveredGhostRef.current = targetClassId;
                            setHoveredGhostClassId(targetClassId);
                        }
                    }
                });
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerDragRef.current;
        if (!state) return;

        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        try {
            state.targetElem?.releasePointerCapture(e.pointerId);
        } catch {}

        if (state.isMoved) {
            const targetClassId = hoveredGhostRef.current;
            if (isRemoveZoneRef.current && onRemoveSubject) {
                const droppedSubId = state.subjectId;
                const dropDx = state.currentDx;
                const dropDy = state.currentDy;
                const leftPanelRect = document.getElementById("tour-course-panel")?.getBoundingClientRect();
                const cardRect = floatingCardRef.current?.getBoundingClientRect();

                // Fly card into the center of the left-panel trash target
                const binDx = leftPanelRect && cardRect
                    ? dropDx + (leftPanelRect.left + leftPanelRect.width / 2 - (cardRect.left + cardRect.width / 2))
                    : dropDx - 40;
                const binDy = leftPanelRect && cardRect
                    ? dropDy + (leftPanelRect.top + leftPanelRect.height / 2 - (cardRect.top + cardRect.height / 2))
                    : dropDy;

                setFloatingCard((prev) =>
                    prev ? { ...prev, initialDx: dropDx, initialDy: dropDy, removing: true } : null
                );

                requestAnimationFrame(() => {
                    if (floatingCardRef.current) {
                        floatingCardRef.current.style.transition =
                            "transform 240ms cubic-bezier(0.32, 0, 0.2, 1), opacity 180ms ease-in 60ms";
                        floatingCardRef.current.style.transform =
                            `translate3d(${binDx}px, ${binDy}px, 0) scale(0.16)`;
                        floatingCardRef.current.style.opacity = "0";
                    }
                });

                onRemoveSubject(droppedSubId);
                onDragRemoveDrop?.();
                setFocusedSubjectId(null);
                setIsDragging(false);
                hoveredGhostRef.current = null;
                setHoveredGhostClassId(null);
                setActiveDraggingCard(null);
                pointerDragRef.current = null;

                removeCardTimeoutRef.current = window.setTimeout(() => {
                    removeCardTimeoutRef.current = null;
                    setFloatingCard((prev) => (prev?.removing ? null : prev));
                }, 240);

                removeOverlayTimeoutRef.current = window.setTimeout(() => {
                    removeOverlayTimeoutRef.current = null;
                    updateRemoveHover(false);
                }, 360);
            } else if (targetClassId) {
                const droppedSubId = state.subjectId;

                setFloatingCard(null);
                setJustDroppedSubjectId(droppedSubId);
                setDroppedOptimisticPicks((prev) => ({ ...prev, [droppedSubId]: targetClassId }));
                onSelectClass?.(droppedSubId, targetClassId);
                setFocusedSubjectId(null);
                setIsDragging(false);
                hoveredGhostRef.current = null;
                setHoveredGhostClassId(null);
                updateRemoveHover(false);
                setActiveDraggingCard(null);
                pointerDragRef.current = null;

                justDroppedTimeoutRef.current = window.setTimeout(() => {
                    justDroppedTimeoutRef.current = null;
                    setJustDroppedSubjectId((prev) => (prev === droppedSubId ? null : prev));
                }, 300);
            } else {
                updateRemoveHover(false);
                setIsSpringingBack(true);
                if (floatingCardRef.current) {
                    floatingCardRef.current.style.transition = "transform 200ms ease-out";
                    floatingCardRef.current.style.transform = "translate3d(0, 0, 0) scale(1)";
                }
                springTimeoutRef.current = window.setTimeout(() => {
                    springTimeoutRef.current = null;
                    setFloatingCard(null);
                    setIsSpringingBack(false);
                    setIsDragging(false);
                    hoveredGhostRef.current = null;
                    setHoveredGhostClassId(null);
                    setActiveDraggingCard(null);
                    pointerDragRef.current = null;
                }, 200);
            }
        } else {
            if (state.targetElem) {
                state.targetElem.style.transform = "";
                state.targetElem.style.transition = "";
            }
            setFocusedSubjectId((prev) => (prev === state.subjectId ? null : state.subjectId));
            onBlockClick?.(state.subjectId);
            setIsDragging(false);
            setActiveDraggingCard(null);
            pointerDragRef.current = null;
        }
    };

    const handlePointerCancel = () => {
        cancelActiveDrag();
    };

    return (
        <div
            id="tour-schedule-board"
            ref={gridRef}
            onClick={() => {
                if (!isDragging) {
                    setFocusedSubjectId(null);
                }
            }}
            className={cn(
                "flex-1 bg-dot-matrix flex flex-col h-full relative selection:bg-none select-none overflow-hidden bg-[#f9f9f8] dark:bg-[#0c0c0e]",
                compact ? "rounded-xl" : "rounded-none"
            )}
        >
            {/* Horizontal Scroll Wrapper */}
            <div className="flex-1 flex flex-col overflow-x-auto no-scrollbar">
                <div
                    className={cn(
                        "flex-1 flex flex-col min-w-full h-full",
                        compact ? "min-w-[600px]" : "min-w-[680px] lg:min-w-[860px]"
                    )}
                >
                    {/* Header Days */}
                    <DayHeaders compact={compact} language={language} />

                    {/* Grid Area with Architectural Dot Matrix */}
                    <div className="flex-1 relative overflow-y-auto no-scrollbar bg-transparent">
                        <div
                            className="relative flex"
                            style={{ height: `${totalHeight}px` }}
                        >
                            {/* Grid Background Horizontal Lines */}
                            <GridBackground rowHeight={rowHeight} />

                            {/* Time Column - Space Mono Hourly Labels */}
                            <TimeColumn compact={compact} rowHeight={rowHeight} />

                            {/* Day Column Verticals */}
                            <DayColumns />

                            {/* Overlays Container (Ghost Drop Zones + Active Nodes) */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ left: compact ? "48px" : "56px" }}
                            >
                    {/* Ghost Drop Zones (per day columns) */}
                                <div className="relative h-full flex pointer-events-none">
                                    {DAYS.map((day) => (
                                        <div key={day} className="flex-1 relative">
                                            {/* ========================================================= */}
                                            {/* GHOST NODES (Alternative drop targets)                    */}
                                            {/* ========================================================= */}
                                            {activeGhostSubject &&
                                                ghostSections.map((sec) => {
                                                    const conflictInfo = ghostConflictMap[sec.classId] || {
                                                        hasConflict: false,
                                                        clashingName: null
                                                    };
                                                    const isDirectHovered = hoveredClassId === sec.classId;
                                                    const isMagneticHovered = hoveredGhostClassId === sec.classId || isDirectHovered;

                                                    return (sec.meetings || [])
                                                        .filter((m) => m.day === day)
                                                        .map((m, mIdx) => {
                                                            const pos = getPosition(m);
                                                            if (!pos) return null;

                                                            const [startH, startM] = m.start.split(":").map(Number);
                                                            const [endH, endM] = m.end.split(":").map(Number);
                                                            const ghostDurationMin = (endH * 60 + endM) - (startH * 60 + startM);
                                                            const isGhostCompact = ghostDurationMin <= 75;

                                                            return (
                                                                <div
                                                                    key={`ghost-${sec.classId}-${mIdx}`}
                                                                    data-tour="ghost-dropzone"
                                                                    data-ghost-class-id={sec.classId}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    aria-label={`Switch ${activeGhostSubject.name} to section ${sec.className}, ${m.day} ${m.start}-${m.end}${conflictInfo.hasConflict ? `, clashes with ${conflictInfo.clashingName || "other class"}` : ""}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onSelectClass?.(activeGhostSubject.subjectId, sec.classId);
                                                                        setFocusedSubjectId(null);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            onSelectClass?.(activeGhostSubject.subjectId, sec.classId);
                                                                            setFocusedSubjectId(null);
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "absolute left-[4px] right-[4px] rounded-xl border-[1.5px] border-dashed transition-all duration-300 overflow-hidden flex flex-col justify-between pointer-events-auto cursor-pointer z-40 select-none animate-in fade-in zoom-in-95 duration-200",
                                                                        isGhostCompact ? "px-2 py-1.5" : "p-2.5",
                                                                        conflictInfo.hasConflict
                                                                            ? "border-rose-400 dark:border-rose-500/80 bg-rose-50/90 dark:bg-rose-500/[0.12] text-rose-800 dark:text-rose-200 shadow-sm"
                                                                            : !currentActiveClassId
                                                                                ? "border-[#5b82a6]/70 dark:border-sky-400/70 bg-[#f0f6fc]/85 dark:bg-sky-500/[0.12] hover:bg-[#e4effa] dark:hover:bg-sky-500/[0.20] text-[#141413] dark:text-[#f4f4f6] shadow-sm"
                                                                                : "border-amber-500 dark:border-amber-400/80 bg-amber-50/90 dark:bg-amber-500/[0.12] hover:bg-amber-100/90 dark:hover:bg-amber-500/[0.20] text-[#141413] dark:text-[#f4f4f6] shadow-sm",
                                                                        isMagneticHovered && "scale-[1.02] ring-2 ring-amber-500 dark:ring-amber-400 shadow-lg z-50"
                                                                    )}
                                                                    style={{
                                                                        top: `${pos.top + 2}px`,
                                                                        height: `${pos.height - 4}px`
                                                                    }}
                                                                    title={
                                                                        conflictInfo.hasConflict
                                                                            ? `Clashes with ${conflictInfo.clashingName || "other class"}`
                                                                            : `Switch to Kelas ${sec.className}`
                                                                    }
                                                                >
                                                                    {isGhostCompact ? (
                                                                        <div className="flex flex-col h-full justify-between">
                                                                            <div className="flex items-center justify-between gap-1 text-[11px] leading-tight">
                                                                                <span className="font-semibold text-[#141413] dark:text-[#f4f4f6] truncate">Kelas {sec.className}</span>
                                                                                <span className="font-mono text-[9.5px] text-[#6e6e77] dark:text-[#cbd5e1] tabular-nums shrink-0">{formatDay(m.day, language, true)} {m.start}-{m.end}</span>
                                                                            </div>
                                                                            <div className="truncate">
                                                                                {conflictInfo.hasConflict ? (
                                                                                    <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                                                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Clashes
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-doodle font-bold text-[13px] text-[#5b82a6] dark:text-[#7dd3fc] select-none">
                                                                                        ← drop here
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div>
                                                                                <div className="font-semibold text-[12px] text-[#141413] dark:text-[#f4f4f6] leading-tight">
                                                                                    Kelas {sec.className}
                                                                                </div>
                                                                                <div className="text-[11px] text-[#6e6e77] dark:text-[#cbd5e1] mt-0.5 font-medium">
                                                                                    <span className="font-mono">{formatDay(m.day, language, true)}, {m.start}-{m.end}</span>
                                                                                    {m.room && <span className="text-[#4a4a52] dark:text-[#cbd5e1]"> · {m.room}</span>}
                                                                                </div>
                                                                            </div>

                                                                            <div className="mt-auto pt-1">
                                                                                {conflictInfo.hasConflict ? (
                                                                                    <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                                                        <AlertTriangle className="w-3 h-3" /> clashes with {conflictInfo.clashingName || "class"}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-doodle font-bold text-[15px] text-[#5b82a6] dark:text-[#7dd3fc] select-none">
                                                                                        ← click or drop here
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                })}
                                        </div>
                                    ))}
                                </div>

                                {/* ACTIVE COURSE NODES (Deterministic, immutable DOM order by subjectId) */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* IMPORTANT: DO NOT sort rendered nodes by day/time or change key—DOM reordering cancels CSS transitions in Chromium! */}
                                    {stableCourseEntries.map((entry, entryIdx) => {
                                        const { cls, subjectId, meetings } = entry;
                                        const isFrozen = frozenSubjectIds.includes(subjectId);
                                        const isFocused = focusedSubjectId === subjectId;
                                        const isThisCardJustDropped = justDroppedSubjectId === subjectId;

                                        return meetings.map(({ m, mIdx, key }) => {
                                            const layout = computedSlotMap.get(key);
                                            if (!layout) return null;

                                            const isConflicting = conflicts[cls.classId] || layout.hasDayConflict;
                                            const isThisCardDragging =
                                                activeDraggingCard?.subjectId === subjectId &&
                                                activeDraggingCard?.classId === cls.classId &&
                                                activeDraggingCard?.meetingIdx === mIdx &&
                                                isDragging;

                                            const conflictingNames = isConflicting ? conflictNamesByClassId[cls.classId] || "" : "";
                                            const cardAriaLabel = `${cls.subjectName}, ${cls.className}, ${m.day} ${m.start}-${m.end}${
                                                isConflicting
                                                    ? conflictingNames
                                                        ? `, conflicts with ${conflictingNames}`
                                                        : ", has schedule conflict"
                                                    : ""
                                            }`;

                                            return (
                                                <div
                                                    key={key}
                                                    id={entryIdx === 0 && mIdx === 0 ? "tour-first-node" : undefined}
                                                    data-subject-id={subjectId}
                                                    data-class-id={cls.classId}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={cardAriaLabel}
                                                    aria-expanded={isFocused}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            setFocusedSubjectId((prev) => (prev === subjectId ? null : subjectId));
                                                            onBlockClick?.(subjectId);
                                                        } else if (e.key === "Escape") {
                                                            e.preventDefault();
                                                            setFocusedSubjectId(null);
                                                        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                                                            const sub = allSubjects.find((s) => s.subjectId === subjectId);
                                                            if (sub && sub.classes.length > 1) {
                                                                e.preventDefault();
                                                                const currIdx = sub.classes.findIndex((c) => c.classId === cls.classId);
                                                                const nextIdx = (currIdx + 1) % sub.classes.length;
                                                                onSelectClass?.(subjectId, sub.classes[nextIdx].classId);
                                                            }
                                                        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                                                            const sub = allSubjects.find((s) => s.subjectId === subjectId);
                                                            if (sub && sub.classes.length > 1) {
                                                                e.preventDefault();
                                                                const currIdx = sub.classes.findIndex((c) => c.classId === cls.classId);
                                                                const prevIdx = (currIdx - 1 + sub.classes.length) % sub.classes.length;
                                                                onSelectClass?.(subjectId, sub.classes[prevIdx].classId);
                                                            }
                                                        }
                                                    }}
                                                    onPointerDown={(e) => handlePointerDown(e, cls, mIdx)}
                                                    onPointerMove={handlePointerMove}
                                                    onPointerUp={handlePointerUp}
                                                    onPointerCancel={handlePointerCancel}
                                                    className={cn(
                                                        // Clean solid white card, flowing naturally from top
                                                        "group absolute rounded-xl flex flex-col justify-start pointer-events-auto select-none overflow-hidden",
                                                        isFocused ? "touch-none" : "lg:touch-none",
                                                        "bg-white dark:bg-[#202027] dark:hover:bg-[#26262f] border border-[#dcdcd6] dark:border-[#343440] border-b-[2px] border-b-[#c6c6be] dark:border-b-[#464656] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] hover:border-[#b8b8b0] dark:hover:border-[#464656]",
                                                        layout.isCompact ? "px-2.5 py-1.5" : layout.isMedium ? "p-2" : "p-3",
                                                        isFocused && "border-[#141413] dark:border-[#f4f4f6] ring-1 ring-[#141413] dark:ring-[#f4f4f6] shadow-md -translate-y-[1px] z-30",
                                                        isThisCardDragging
                                                            ? isOverRemoveZone
                                                                ? "!z-50 shadow-2xl ring-2 ring-rose-500 border-rose-400 opacity-75 cursor-grabbing"
                                                                : "!z-50 shadow-2xl ring-2 ring-[#141413] dark:ring-[#f4f4f6] cursor-grabbing"
                                                            : "cursor-grab active:cursor-grabbing hover:shadow-md",
                                                        isConflicting && "border-rose-400 border-b-[2px] border-b-rose-400 bg-rose-50/70 dark:bg-rose-950/40",
                                                        // Cascading overlap expansion on hover
                                                        layout.isOverlapping && !isThisCardDragging && "krs-cascading-node hover:!z-50 hover:shadow-xl hover:border-[#141413]/40 dark:hover:border-[#f4f4f6]/40",
                                                        // Hover-to-expand for short duration nodes
                                                        !isThisCardDragging && layout.durationMin <= 90 && "hover:!h-auto hover:!z-50 hover:shadow-xl hover:overflow-visible hover:border-[#141413]/40 dark:hover:border-[#f4f4f6]/40"
                                                    )}
                                                    style={{
                                                        top: `${layout.top}px`,
                                                        height: `${layout.height}px`,
                                                        minHeight: `${layout.height}px`,
                                                        ...(layout.isOverlapping && !isThisCardDragging
                                                            ? {
                                                                  left: "var(--node-left)",
                                                                  width: "var(--node-width)",
                                                                  zIndex: layout.zIndex,
                                                                  ["--node-left" as any]: layout.left,
                                                                  ["--node-width" as any]: layout.width,
                                                                  ["--node-day-left" as any]: layout.dayLeft,
                                                                  ["--node-day-width" as any]: layout.dayWidth,
                                                                  ["--node-z" as any]: layout.zIndex,
                                                              }
                                                            : {
                                                                  left: layout.left,
                                                                  width: layout.width,
                                                                  zIndex: isFocused ? 30 : layout.zIndex,
                                                              }),
                                                        opacity: isThisCardDragging ? 0 : 1, // Floating portal renders above everything while dragging
                                                        willChange: isThisCardJustDropped ? "left, top, height, width" : undefined,
                                                        transition: prefersReducedMotion
                                                            ? "none"
                                                            : isThisCardDragging || isThisCardJustDropped
                                                            ? (isSpringingBack ? "transform 200ms ease-out" : "none")
                                                            : "left 300ms cubic-bezier(0.22, 1, 0.36, 1), top 340ms cubic-bezier(0.22, 1, 0.36, 1), height 340ms cubic-bezier(0.22, 1, 0.36, 1), width 300ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease",
                                                        ...(isThisCardDragging
                                                            ? {
                                                                  zIndex: 50,
                                                                  transition: isSpringingBack
                                                                      ? "transform 200ms ease-out"
                                                                      : "none"
                                                              }
                                                            : {})
                                                    }}
                                                >
                                                    {/* 1. Compact Mode (durationMin <= 75, e.g. 1 SKS) */}
                                                    {layout.isCompact ? (
                                                        <div className="flex flex-col h-full justify-between">
                                                            {/* Row 1: Course Name on left + [Badge] + Lock on right */}
                                                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                                                                <h4 className="text-[12px] font-semibold text-[#141413] dark:text-[#f4f4f6] truncate group-hover:whitespace-normal group-hover:line-clamp-none leading-tight min-w-0 flex-1">
                                                                    {cls.subjectName}
                                                                </h4>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <span className="px-1 py-0.5 rounded bg-[#f3f3f0] dark:bg-[#2e2e38] border border-[#e2e2de] dark:border-[#454554] text-[9.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] shrink-0 leading-none">
                                                                        {cls.className}
                                                                    </span>
                                                                    {onToggleFreeze && (
                                                                        <button
                                                                            type="button"
                                                                            aria-label={isFrozen ? `Unlock ${cls.subjectName}` : `Lock ${cls.subjectName}`}
                                                                            onPointerDown={(e) => e.stopPropagation()}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onToggleFreeze(cls.subjectId);
                                                                            }}
                                                                            className={cn(
                                                                                "w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors",
                                                                                isFrozen
                                                                                    ? "text-[#141413] dark:text-[#f4f4f6] bg-neutral-100 dark:bg-white/[0.08]"
                                                                                    : "text-[#a1a1aa] dark:text-[#71717a] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] opacity-0 group-hover:opacity-100"
                                                                            )}
                                                                            title={isFrozen ? "Click to unlock" : "Click to lock"}
                                                                        >
                                                                            {isFrozen ? (
                                                                                <Lock className="w-2.5 h-2.5 text-[#141413] dark:text-[#f4f4f6]" />
                                                                            ) : (
                                                                                <Unlock className="w-2.5 h-2.5" />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Row 2: Time + Room */}
                                                            <div className={cn(
                                                                "text-[#6e6e77] dark:text-[#a1a1aa] truncate mt-0.5 flex items-center gap-1 font-mono leading-tight",
                                                                layout.isOverlapping ? "text-[9.5px] tracking-tighter" : "text-[10px]"
                                                            )}>
                                                                <span>{m.start}-{m.end}</span>
                                                                {m.room && <span className="font-sans font-medium text-[#4a4a52] dark:text-[#d4d4d8]">· {m.room}</span>}
                                                            </div>

                                                            {/* Hidden expandable details on hover (reveals full room & lecturer) */}
                                                            {cls.lecturers?.[0] && (
                                                                <div className="hidden group-hover:block text-[10px] text-[#71717a] dark:text-[#9ca3af] truncate mt-1 pt-1 border-t border-[#e6e6e3] dark:border-[#2e2e34] font-sans">
                                                                    {cls.lecturers[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : layout.isMedium ? (
                                                        /* 2. Medium Mode (75 < durationMin <= 110, e.g. 2 SKS) */
                                                        <div className="flex flex-col h-full justify-start">
                                                            {/* Row 1: Section + Time + Lock */}
                                                            <div className="flex items-center justify-between gap-1.5 shrink-0 min-w-0">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span className="px-1.5 py-0.5 rounded bg-[#f3f3f0] dark:bg-[#2e2e38] border border-[#e2e2de] dark:border-[#454554] text-[10.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] shrink-0 leading-none">
                                                                        {cls.className}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "font-mono text-[#6e6e77] dark:text-[#a1a1aa] whitespace-nowrap tabular-nums",
                                                                        layout.isOverlapping ? "text-[9.5px] tracking-tighter" : "text-[10.5px]"
                                                                    )}>
                                                                        {m.start}-{m.end}
                                                                    </span>
                                                                </div>
                                                                {onToggleFreeze && (
                                                                    <button
                                                                        type="button"
                                                                        aria-label={isFrozen ? `Unlock ${cls.subjectName}` : `Lock ${cls.subjectName}`}
                                                                        onPointerDown={(e) => e.stopPropagation()}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onToggleFreeze(cls.subjectId);
                                                                        }}
                                                                        className={cn(
                                                                            "w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors",
                                                                            isFrozen
                                                                                ? "text-[#141413] dark:text-[#f4f4f6] bg-neutral-100 dark:bg-white/[0.08]"
                                                                                : "text-[#a1a1aa] dark:text-[#71717a] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] opacity-0 group-hover:opacity-100"
                                                                        )}
                                                                        title={isFrozen ? "Click to unlock" : "Click to lock"}
                                                                    >
                                                                        {isFrozen ? (
                                                                            <Lock className="w-3 h-3 text-[#141413] dark:text-[#f4f4f6]" />
                                                                        ) : (
                                                                            <Unlock className="w-3 h-3" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Row 2: Course Name (wrapped onto 2 lines, never single-line truncate) */}
                                                            <h4 className={cn(
                                                                "font-semibold text-[#141413] dark:text-[#f4f4f6] mt-1 leading-tight",
                                                                layout.isOverlapping
                                                                    ? "text-[12px] line-clamp-2"
                                                                    : "text-[12.5px] line-clamp-2 group-hover:line-clamp-none"
                                                            )}>
                                                                {cls.subjectName}
                                                            </h4>

                                                            {/* Row 3: Room */}
                                                            {m.room && (
                                                                <div className="text-[10.5px] font-medium text-[#4a4a52] dark:text-[#d4d4d8] truncate mt-0.5 leading-tight">
                                                                    {m.room}
                                                                </div>
                                                            )}

                                                            {/* Row 4: Lecturer */}
                                                            {cls.lecturers?.[0] && (
                                                                <div className="text-[10px] text-[#71717a] dark:text-[#9ca3af] font-normal truncate mt-0.5 leading-tight">
                                                                    {cls.lecturers[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        /* 3. Full Mode (> 110 min, e.g. 3+ SKS) */
                                                        <div className="flex flex-col h-full justify-start">
                                                            {/* Row 1: Section & Time + Lock Icon */}
                                                            <div className="flex items-center justify-between gap-1.5 shrink-0 min-w-0">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span className="px-1.5 py-0.5 rounded bg-[#f3f3f0] dark:bg-[#2e2e38] border border-[#e2e2de] dark:border-[#454554] text-[10.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] shrink-0 leading-none">
                                                                        {cls.className}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "font-mono text-[#6e6e77] dark:text-[#a1a1aa] whitespace-nowrap tabular-nums",
                                                                        layout.isOverlapping ? "text-[9.5px] tracking-tighter" : "text-[10.5px]"
                                                                    )}>
                                                                        {m.start}-{m.end}
                                                                    </span>
                                                                </div>

                                                                {onToggleFreeze && (
                                                                    <button
                                                                        type="button"
                                                                        aria-label={isFrozen ? `Unlock ${cls.subjectName}` : `Lock ${cls.subjectName}`}
                                                                        onPointerDown={(e) => e.stopPropagation()}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onToggleFreeze(cls.subjectId);
                                                                        }}
                                                                        className={cn(
                                                                            "w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors",
                                                                            isFrozen
                                                                                ? "text-[#141413] dark:text-[#f4f4f6] bg-neutral-100 dark:bg-white/[0.08]"
                                                                                : "text-[#a1a1aa] dark:text-[#71717a] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] opacity-0 group-hover:opacity-100"
                                                                        )}
                                                                        title={isFrozen ? "Click to unlock class in solver" : "Click to lock this class"}
                                                                    >
                                                                        {isFrozen ? (
                                                                            <Lock className="w-3 h-3 text-[#141413] dark:text-[#f4f4f6]" />
                                                                        ) : (
                                                                            <Unlock className="w-3 h-3" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Row 2: Course Name */}
                                                            <h4 className={cn(
                                                                "font-semibold text-[#141413] dark:text-[#f4f4f6] leading-tight line-clamp-2 mt-1.5",
                                                                layout.isOverlapping ? "text-[12px]" : "text-[13.5px] leading-snug"
                                                            )}>
                                                                {cls.subjectName}
                                                            </h4>

                                                            {/* Row 3: Room */}
                                                            {m.room && (
                                                                <div className="text-[11px] font-medium text-[#4a4a52] dark:text-[#d4d4d8] leading-tight truncate mt-1">
                                                                    {m.room}
                                                                </div>
                                                            )}

                                                            {/* Row 4: Lecturer */}
                                                            {cls.lecturers?.[0] && (
                                                                <div className="text-[10.5px] text-[#71717a] dark:text-[#9ca3af] leading-tight truncate mt-0.5">
                                                                    {cls.lecturers[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pure Unboxed Doodle Watermark when 0 selected courses on grid */}
            {selectedClasses.length === 0 && (
                <div
                    className={cn(
                        "pointer-events-none select-none absolute inset-0 flex flex-col items-center justify-center z-10 transition-opacity duration-200",
                        compact ? "left-12 top-8" : "left-14 top-10",
                        hoveredSubjectId ? "opacity-10" : "opacity-100"
                    )}
                >
                    {/* Line 1 (Kaomoji) */}
                    <div className="font-doodle text-4xl sm:text-5xl text-[#5b82a6]/65 dark:text-[#7dd3fc]/65 tracking-wider mb-1.5 -rotate-2">
                        ( ; ´ - ` ;)
                    </div>

                    {/* Line 2 (Headline in Gaegu) */}
                    <h3 className="font-doodle text-2xl sm:text-3xl font-bold text-[#5b82a6] dark:text-[#7dd3fc] text-center px-4">
                        {allSubjects.length > 0
                            ? (language === "id" ? "0 SKS... minggu ini masih kosong melompong" : "0 SKS... this week is wide open")
                            : (language === "id" ? "0 SKS... lembar jadwal ini masih kosong" : "0 SKS... this sheet is completely blank")}
                    </h3>

                    {/* Line 3 (Subline in Gaegu) */}
                    <p className="font-doodle text-lg sm:text-xl text-zinc-400 dark:text-zinc-500 mt-0.5 text-center">
                        {language === "id"
                            ? `belum ada kelas di ${activePlanName || "Plan 1"}`
                            : `nothing scheduled in ${activePlanName || "Plan 1"} yet`}
                    </p>
                </div>
            )}
            {floatingCard && typeof document !== "undefined" && createPortal(
                <div
                    ref={floatingCardRef}
                    style={{
                        position: "fixed",
                        left: `${floatingCard.left}px`,
                        top: `${floatingCard.top}px`,
                        width: `${floatingCard.width}px`,
                        height: `${floatingCard.height}px`,
                        zIndex: 9999,
                        pointerEvents: "none",
                        transform: `translate3d(${floatingCard.initialDx}px, ${floatingCard.initialDy}px, 0) scale(1.02)`,
                        willChange: "transform, opacity",
                    }}
                    className={cn(
                        "rounded-xl p-2.5 flex flex-col justify-start select-none overflow-hidden shadow-2xl transition-colors duration-150",
                        isOverRemoveZone || floatingCard.removing
                            ? "bg-rose-50 dark:bg-rose-950/95 border border-rose-400 dark:border-rose-500 ring-2 ring-rose-500"
                            : "bg-white dark:bg-[#202027] border border-[#dcdcd6] dark:border-[#343440] ring-2 ring-[#141413] dark:ring-[#f4f4f6]"
                    )}
                >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-[#f3f3f0] dark:bg-[#2e2e38] border border-[#e2e2de] dark:border-[#454554] text-[10.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] shrink-0 leading-none">
                            {floatingCard.className}
                        </span>
                        {(isOverRemoveZone || floatingCard.removing) ? (
                            <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                            <span className="font-mono text-[10.5px] text-[#6e6e77] dark:text-[#a1a1aa] truncate tabular-nums">
                                {floatingCard.timeText}
                            </span>
                        )}
                    </div>
                    <h4 className="font-semibold text-[12.5px] text-[#141413] dark:text-[#f4f4f6] mt-1 leading-tight line-clamp-2">
                        {floatingCard.subjectName}
                    </h4>
                    {floatingCard.room && (
                        <span className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] truncate mt-0.5">
                            {floatingCard.room}
                        </span>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
});
