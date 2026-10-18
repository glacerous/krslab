"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    AlertTriangle,
    Lock,
    Unlock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Meeting, Subject } from "@/lib/store";
import { getSubjectColor } from "@/lib/colors";
import { checkClassConflict } from "@krs/engine";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const START_HOUR = 7;
const GRID_START_MINUTES = START_HOUR * 60;
const TOP_OFFSET = 12;

const SLOTS = Array.from({ length: 13 * 2 }, (_, i) => {
    const h = Math.floor(i / 2) + START_HOUR;
    const m = (i % 2) * 30;
    return { h, m, isMajor: m === 0 };
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
}

interface PointerDragState {
    subjectId: string;
    classId: string;
    meetingIdx: number;
    startX: number;
    startY: number;
    isMoved: boolean;
    isDragging: boolean;
    targetElem: HTMLElement | null;
}

export function ScheduleGrid({
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
    onFocusSubject
}: ScheduleGridProps) {
    const [rowHeight, setRowHeight] = useState(compact ? 56 : 74);
    const [internalFocusedSubjectId, setInternalFocusedSubjectId] = useState<string | null>(null);
    const focusedSubjectId = propFocusedSubjectId !== undefined ? propFocusedSubjectId : internalFocusedSubjectId;
    const setFocusedSubjectId = useCallback((idOrUpdater: string | null | ((prev: string | null) => string | null)) => {
        const nextId = typeof idOrUpdater === "function" ? idOrUpdater(focusedSubjectId) : idOrUpdater;
        setInternalFocusedSubjectId(nextId);
        onFocusSubject?.(nextId);
    }, [focusedSubjectId, onFocusSubject]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
    const [hoveredGhostClassId, setHoveredGhostClassId] = useState<string | null>(null);
    const [isSpringingBack, setIsSpringingBack] = useState(false);
    const [justDroppedSubjectId, setJustDroppedSubjectId] = useState<string | null>(null);
    const [droppedOptimisticPicks, setDroppedOptimisticPicks] = useState<Record<string, string>>({});

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
    const signature = JSON.stringify(selectedClasses.map((c) => c?.classId));
    useEffect(() => {
        setPulse((p) => p + 1);
        setDroppedOptimisticPicks({});
        setJustDroppedSubjectId(null);
    }, [signature]);

    // Close focus on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setFocusedSubjectId(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setFocusedSubjectId]);

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
        top: number;
        height: number;
        left: string;
        width: string;
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

                cluster.forEach((slot, idx) => {
                    const subColIndex = subColAssignments[idx];
                    const dayLeftPercent = (slot.dayIdx * 100) / DAYS.length;
                    const dayWidthPercent = 100 / DAYS.length;
                    const subWidthPercent = dayWidthPercent / clusterSize;
                    const subLeftPercent = dayLeftPercent + subColIndex * subWidthPercent;

                    const left = clusterSize > 1
                        ? `calc(${subLeftPercent}% + 2px)`
                        : `calc(${subLeftPercent}% + 4px)`;
                    const width = clusterSize > 1
                        ? `calc(${subWidthPercent}% - 4px)`
                        : `calc(${subWidthPercent}% - 8px)`;

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
                        top: slot.pos.top + 2,
                        height: slot.pos.height - 4,
                        left,
                        width,
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

        const isFrozen = frozenSubjectIds.includes(cls.subjectId);
        const target = e.currentTarget;

        try {
            target.setPointerCapture(e.pointerId);
        } catch {}

        pointerDragRef.current = {
            subjectId: cls.subjectId,
            classId: cls.classId,
            meetingIdx,
            startX: e.clientX,
            startY: e.clientY,
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

        setFocusedSubjectId(cls.subjectId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerDragRef.current;
        if (!state || state.targetElem !== e.currentTarget) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;

        if (!state.isMoved && Math.hypot(dx, dy) > 4) {
            const isFrozen = frozenSubjectIds.includes(state.subjectId);
            if (!isFrozen) {
                state.isMoved = true;
                state.isDragging = true;
                setIsDragging(true);
            }
        }

        if (state.isMoved) {
            setDragDelta({ dx, dy });

            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const ghostEl = elements.find((el) => el.hasAttribute("data-ghost-class-id"));
            const targetClassId = ghostEl?.getAttribute("data-ghost-class-id") || null;
            setHoveredGhostClassId(targetClassId);
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerDragRef.current;
        if (!state) return;

        try {
            state.targetElem?.releasePointerCapture(e.pointerId);
        } catch {}

        if (state.isMoved) {
            if (hoveredGhostClassId) {
                const droppedSubId = state.subjectId;
                const targetClassId = hoveredGhostClassId;

                setJustDroppedSubjectId(droppedSubId);
                setDroppedOptimisticPicks((prev) => ({ ...prev, [droppedSubId]: targetClassId }));
                onSelectClass?.(droppedSubId, targetClassId);
                setFocusedSubjectId(null);
                setIsDragging(false);
                setDragDelta({ dx: 0, dy: 0 });
                setHoveredGhostClassId(null);
                setActiveDraggingCard(null);
                pointerDragRef.current = null;

                setTimeout(() => {
                    setJustDroppedSubjectId((prev) => (prev === droppedSubId ? null : prev));
                }, 300);
            } else {
                setIsSpringingBack(true);
                setDragDelta({ dx: 0, dy: 0 });
                setTimeout(() => {
                    setIsSpringingBack(false);
                    setIsDragging(false);
                    setHoveredGhostClassId(null);
                    setActiveDraggingCard(null);
                    pointerDragRef.current = null;
                }, 200);
            }
        } else {
            setFocusedSubjectId((prev) => (prev === state.subjectId ? null : state.subjectId));
            onBlockClick?.(state.subjectId);
            setIsDragging(false);
            setDragDelta({ dx: 0, dy: 0 });
            setActiveDraggingCard(null);
            pointerDragRef.current = null;
        }
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerDragRef.current;
        if (!state) return;

        try {
            state.targetElem?.releasePointerCapture(e.pointerId);
        } catch {}

        setIsDragging(false);
        setDragDelta({ dx: 0, dy: 0 });
        setHoveredGhostClassId(null);
        setActiveDraggingCard(null);
        pointerDragRef.current = null;
    };

    return (
        <div
            ref={gridRef}
            onClick={() => {
                if (!isDragging) {
                    setFocusedSubjectId(null);
                }
            }}
            className={cn(
                "flex-1 bg-dot-matrix flex flex-col h-full relative selection:bg-none select-none overflow-hidden",
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
                    {/* Header Days - Gaegu Doodle Font text-[20px] (Z-Index 20 so header popovers float above) */}
                    <div className="flex bg-white shrink-0 z-20 border-b border-[#e6e6e3] sticky top-0">
                        {/* Top-left corner time label in Gaegu text-[17px] */}
                        <div
                            className={cn(
                                "w-14 border-r border-[#e6e6e3] flex items-center justify-center p-2 bg-neutral-50/60 sticky left-0 z-20",
                                compact && "w-12"
                            )}
                        >
                            <span className="font-doodle font-bold text-[17px] text-[#6e6e77] leading-none">
                                time
                            </span>
                        </div>
                        {DAYS.map((day) => (
                            <div
                                key={day}
                                className={cn(
                                    "flex-1 py-2 px-3 text-center transition-colors border-r last:border-r-0 border-[#e6e6e3] bg-white",
                                    compact && "py-1 px-2"
                                )}
                            >
                                <span className="font-doodle font-bold text-[20px] text-[#141413] tracking-normal leading-tight">
                                    {compact ? day.substring(0, 3) : day}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Area with Architectural Dot Matrix */}
                    <div className="flex-1 relative overflow-y-auto no-scrollbar bg-transparent">
                        <div
                            className="relative flex"
                            style={{ height: `${totalHeight}px` }}
                        >
                            {/* Grid Background Horizontal Lines */}
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
                                                ? "border-b border-[#e6e6e3]/90"
                                                : "border-b border-[#e6e6e3]/40"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Time Column - Space Mono Hourly Labels */}
                            <div
                                className={cn(
                                    "w-14 border-r border-[#e6e6e3] shrink-0 h-full transition-colors sticky left-0 z-40 bg-white/95 backdrop-blur-md",
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
                                            <span className="font-mono text-[11px] font-medium text-[#6e6e77] tabular-nums -mt-2">
                                                {slot.h.toString().padStart(2, "0")}:00
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Day Column Verticals */}
                            <div className="flex-1 flex pointer-events-none">
                                {DAYS.map((day) => (
                                    <div
                                        key={day}
                                        className="flex-1 border-r last:border-r-0 border-[#e6e6e3]/50 bg-transparent"
                                    />
                                ))}
                            </div>

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
                                                                    data-ghost-class-id={sec.classId}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onSelectClass?.(activeGhostSubject.subjectId, sec.classId);
                                                                        setFocusedSubjectId(null);
                                                                    }}
                                                                    className={cn(
                                                                        "absolute left-[4px] right-[4px] rounded-xl border-[1.5px] border-dashed transition-all duration-300 overflow-hidden flex flex-col justify-between pointer-events-auto cursor-pointer z-40 select-none animate-in fade-in zoom-in-95 duration-200",
                                                                        isGhostCompact ? "px-2 py-1.5" : "p-2.5",
                                                                        conflictInfo.hasConflict
                                                                            ? "border-rose-400 bg-rose-50/90 text-rose-800 shadow-sm"
                                                                            : "border-amber-500 bg-amber-50/90 text-amber-900 shadow-sm",
                                                                        isMagneticHovered && "scale-[1.02] ring-2 ring-amber-500 shadow-lg z-50"
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
                                                                                <span className="font-semibold text-[#141413] truncate">Kelas {sec.className}</span>
                                                                                <span className="font-mono text-[9.5px] text-[#6e6e77] tabular-nums shrink-0">{m.start}–{m.end}</span>
                                                                            </div>
                                                                            <div className="truncate">
                                                                                {conflictInfo.hasConflict ? (
                                                                                    <span className="text-[10px] font-medium text-rose-600 flex items-center gap-1">
                                                                                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Clashes
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-doodle font-bold text-[13px] text-[#5b82a6] select-none">
                                                                                        ← drop here
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div>
                                                                                <div className="font-semibold text-[12px] text-[#141413] leading-tight">
                                                                                    Kelas {sec.className}
                                                                                </div>
                                                                                <div className="text-[11px] text-[#6e6e77] mt-0.5 font-medium">
                                                                                    <span className="font-mono">{m.start}–{m.end}</span>
                                                                                    {m.room && <span> · {m.room}</span>}
                                                                                </div>
                                                                            </div>

                                                                            <div className="mt-auto pt-1">
                                                                                {conflictInfo.hasConflict ? (
                                                                                    <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                                                                                        <AlertTriangle className="w-3 h-3" /> clashes with {conflictInfo.clashingName || "class"}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-doodle font-bold text-[15px] text-[#5b82a6] select-none">
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

                                            return (
                                                <div
                                                    key={key}
                                                    id={entryIdx === 0 && mIdx === 0 ? "tour-first-node" : undefined}
                                                    data-subject-id={subjectId}
                                                    data-class-id={cls.classId}
                                                    onPointerDown={(e) => handlePointerDown(e, cls, mIdx)}
                                                    onPointerMove={handlePointerMove}
                                                    onPointerUp={handlePointerUp}
                                                    onPointerCancel={handlePointerCancel}
                                                    className={cn(
                                                        // Clean solid white card, flowing naturally from top
                                                        "group absolute rounded-xl flex flex-col justify-start pointer-events-auto select-none touch-none overflow-hidden",
                                                        "bg-white border border-[#dcdcd6] border-b-[2px] border-b-[#c6c6be] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#b8b8b0]",
                                                        layout.isCompact ? "px-2.5 py-1.5" : layout.isMedium ? "p-2" : "p-3",
                                                        isFocused && "border-[#141413] ring-1 ring-[#141413] shadow-md -translate-y-[1px] z-30",
                                                        isThisCardDragging
                                                            ? "z-50 shadow-2xl ring-2 ring-[#141413] cursor-grabbing"
                                                            : "cursor-grab active:cursor-grabbing hover:shadow-md",
                                                        isConflicting && "border-rose-400 border-b-[2px] border-b-rose-400 bg-rose-50/70",
                                                        // Hover-to-expand for short duration nodes
                                                        !isThisCardDragging && layout.durationMin <= 90 && "hover:!h-auto hover:!z-50 hover:shadow-xl hover:overflow-visible hover:border-[#141413]/40"
                                                    )}
                                                    style={{
                                                        top: `${layout.top}px`,
                                                        height: `${layout.height}px`,
                                                        minHeight: `${layout.height}px`,
                                                        left: layout.left,
                                                        width: layout.width,
                                                        opacity: 1, // ALWAYS 100% OPAQUE
                                                        willChange: isThisCardDragging ? "transform" : "left, top, height, width",
                                                        transition: isThisCardDragging || isThisCardJustDropped
                                                            ? (isSpringingBack ? "transform 200ms ease-out" : "none")
                                                            : "left 340ms cubic-bezier(0.22, 1, 0.36, 1), top 340ms cubic-bezier(0.22, 1, 0.36, 1), height 340ms cubic-bezier(0.22, 1, 0.36, 1), width 340ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease",
                                                        ...(isThisCardDragging
                                                            ? {
                                                                  transform: `translate3d(${dragDelta.dx}px, ${dragDelta.dy}px, 0) scale(1.02)`,
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
                                                                <h4 className="text-[12px] font-semibold text-[#141413] truncate group-hover:whitespace-normal group-hover:line-clamp-none leading-tight min-w-0 flex-1">
                                                                    {cls.subjectName}
                                                                </h4>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <span className="px-1 py-0.5 rounded bg-[#f3f3f0] border border-[#e2e2de] text-[9.5px] font-semibold text-[#141413] shrink-0 leading-none">
                                                                        {cls.className}
                                                                    </span>
                                                                    {onToggleFreeze && (
                                                                        <button
                                                                            type="button"
                                                                            onPointerDown={(e) => e.stopPropagation()}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onToggleFreeze(cls.subjectId);
                                                                            }}
                                                                            className={cn(
                                                                                "w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors",
                                                                                isFrozen
                                                                                    ? "text-[#141413] bg-neutral-100"
                                                                                    : "text-[#a1a1aa] hover:text-[#141413] hover:bg-neutral-100 opacity-0 group-hover:opacity-100"
                                                                            )}
                                                                            title={isFrozen ? "Click to unlock" : "Click to lock"}
                                                                        >
                                                                            {isFrozen ? (
                                                                                <Lock className="w-2.5 h-2.5 text-[#141413]" />
                                                                            ) : (
                                                                                <Unlock className="w-2.5 h-2.5" />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Row 2: Time + Room */}
                                                            <div className="text-[10px] text-[#6e6e77] truncate mt-0.5 flex items-center gap-1 font-mono leading-tight">
                                                                <span>{m.start}–{m.end}</span>
                                                                {m.room && <span className="font-sans">· {m.room}</span>}
                                                            </div>

                                                            {/* Hidden expandable details on hover (reveals full room & lecturer) */}
                                                            {cls.lecturers?.[0] && (
                                                                <div className="hidden group-hover:block text-[10px] text-[#71717a] truncate mt-1 pt-1 border-t border-[#e6e6e3] font-sans">
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
                                                                    <span className="px-1.5 py-0.5 rounded bg-[#f3f3f0] border border-[#e2e2de] text-[10.5px] font-semibold text-[#141413] shrink-0 leading-none">
                                                                        {cls.className}
                                                                    </span>
                                                                    <span className="font-mono text-[10.5px] text-[#6e6e77] whitespace-nowrap tabular-nums">
                                                                        {m.start}–{m.end}
                                                                    </span>
                                                                </div>
                                                                {onToggleFreeze && (
                                                                    <button
                                                                        type="button"
                                                                        onPointerDown={(e) => e.stopPropagation()}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onToggleFreeze(cls.subjectId);
                                                                        }}
                                                                        className={cn(
                                                                            "w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors",
                                                                            isFrozen
                                                                                ? "text-[#141413] bg-neutral-100"
                                                                                : "text-[#a1a1aa] hover:text-[#141413] hover:bg-neutral-100 opacity-0 group-hover:opacity-100"
                                                                        )}
                                                                        title={isFrozen ? "Click to unlock" : "Click to lock"}
                                                                    >
                                                                        {isFrozen ? (
                                                                            <Lock className="w-3 h-3 text-[#141413]" />
                                                                        ) : (
                                                                            <Unlock className="w-3 h-3" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Row 2: Course Name */}
                                                            <h4 className="text-[12.5px] font-semibold text-[#141413] line-clamp-1 group-hover:line-clamp-none mt-0.5 leading-snug">
                                                                {cls.subjectName}
                                                            </h4>

                                                            {/* Row 3: Room and Lecturer */}
                                                            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#4a4a52] truncate mt-0.5 leading-tight">
                                                                {m.room && <span>{m.room}</span>}
                                                                {m.room && cls.lecturers?.[0] && <span className="text-[#a1a1aa]">·</span>}
                                                                {cls.lecturers?.[0] && (
                                                                    <span className="text-[10px] text-[#71717a] font-normal truncate">
                                                                        {cls.lecturers[0]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* 3. Full Mode (> 110 min, e.g. 3+ SKS) */
                                                        <div className="flex flex-col h-full justify-start">
                                                            {/* Row 1: Section & Time + Lock Icon */}
                                                            <div className="flex items-center justify-between gap-1.5 shrink-0 min-w-0">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span className="px-1.5 py-0.5 rounded bg-[#f3f3f0] border border-[#e2e2de] text-[10.5px] font-semibold text-[#141413] shrink-0 leading-none">
                                                                        {cls.className}
                                                                    </span>
                                                                    <span className="font-mono text-[10.5px] text-[#6e6e77] whitespace-nowrap tabular-nums">
                                                                        {m.start}–{m.end}
                                                                    </span>
                                                                </div>

                                                                {onToggleFreeze && (
                                                                    <button
                                                                        type="button"
                                                                        onPointerDown={(e) => e.stopPropagation()}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onToggleFreeze(cls.subjectId);
                                                                        }}
                                                                        className={cn(
                                                                            "w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors",
                                                                            isFrozen
                                                                                ? "text-[#141413] bg-neutral-100"
                                                                                : "text-[#a1a1aa] hover:text-[#141413] hover:bg-neutral-100 opacity-0 group-hover:opacity-100"
                                                                        )}
                                                                        title={isFrozen ? "Click to unlock class in solver" : "Click to lock this class"}
                                                                    >
                                                                        {isFrozen ? (
                                                                            <Lock className="w-3 h-3 text-[#141413]" />
                                                                        ) : (
                                                                            <Unlock className="w-3 h-3" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Row 2: Course Name (mt-1.5) */}
                                                            <h4 className="text-[13.5px] font-semibold text-[#141413] leading-snug line-clamp-2 mt-1.5">
                                                                {cls.subjectName}
                                                            </h4>

                                                            {/* Row 3: Room (mt-1 directly below Course Name) */}
                                                            {m.room && (
                                                                <div className="text-[11.5px] font-medium text-[#4a4a52] leading-tight truncate mt-1">
                                                                    {m.room}
                                                                </div>
                                                            )}

                                                            {/* Row 4: Lecturer (mt-0.5 directly below Room) */}
                                                            {cls.lecturers?.[0] && (
                                                                <div className="text-[11px] text-[#71717a] leading-tight truncate mt-0.5">
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
        </div>
    );
}
