"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Maximize2, Minimize2, ZoomIn, AlertTriangle, Zap, User, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Meeting } from "@/lib/store";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const SLOTS = Array.from({ length: 13 * 2 }, (_, i) => {
    const h = Math.floor(i / 2) + 7;
    const m = (i % 2) * 30;
    return { h, m, isMajor: m === 0 };
});

interface ScheduleGridProps {
    selectedClasses: any[];
    conflicts: Record<string, boolean>;
    frozenSubjectIds?: string[];
    onToggleFreeze?: (subjectId: string) => void;
    onBlockClick?: (subjectId: string) => void;
    compact?: boolean;
}

export function ScheduleGrid({ selectedClasses, conflicts, frozenSubjectIds = [], onToggleFreeze, onBlockClick, compact = false }: ScheduleGridProps) {
    const [rowHeight, setRowHeight] = useState(compact ? 50 : 65);
    const [pulsingSubject, setPulsingSubject] = useState<string | null>(null);
    const [pulse, setPulse] = useState(0);
    const totalHeight = (SLOTS.length / 2) * rowHeight;

    // Trigger grid pulse when selectedClasses change
    const signature = JSON.stringify(selectedClasses.map(c => c?.classId));
    useEffect(() => {
        setPulse(p => p + 1);
    }, [signature]);

    const getPosition = (meeting: Meeting) => {
        const dayIndex = DAYS.indexOf(meeting.day);
        if (dayIndex === -1) return null;

        const [startH, startM] = meeting.start.split(":").map(Number);
        const [endH, endM] = meeting.end.split(":").map(Number);

        const startInMinutes = startH * 60 + startM;
        const endInMinutes = endH * 60 + endM;

        const gridStartInMinutes = 7 * 60;
        const top = ((startInMinutes - gridStartInMinutes) / 60) * rowHeight;
        const height = ((endInMinutes - startInMinutes) / 60) * rowHeight;

        return { dayIndex, top, height };
    };

    return (
        <div className={cn(
            "flex-1 bg-background flex flex-col h-full relative group/grid selection:bg-none select-none transition-colors overflow-hidden",
            compact ? "rounded-xl" : "rounded-none"
        )}>
            {/* Zoom Controls Overlay */}
            {!compact && (
                <div className="absolute top-20 right-6 z-[70] flex flex-col gap-2 transition-soft sm:opacity-0 sm:group-hover/grid:opacity-100">
                    {[
                        { h: 50, icon: Minimize2, label: "Compact" },
                        { h: 65, icon: Maximize2, label: "Default" },
                        { h: 100, icon: ZoomIn, label: "Expanded" }
                    ].map(btn => (
                        <button
                            key={btn.h}
                            onClick={() => setRowHeight(btn.h)}
                            className={cn(
                                "p-2.5 rounded-lg border transition-soft realistic-shadow flex items-center justify-center",
                                rowHeight === btn.h
                                    ? "bg-primary border-primary text-primary-foreground scale-105"
                                    : "bg-background border-border text-muted-foreground/40 hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <btn.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            )}

            {/* Horizontal Scroll Wrapper */}
            <div className="flex-1 flex flex-col overflow-x-auto no-scrollbar">
                <div
                    className="flex-1 flex flex-col min-w-full h-full"
                    style={{ minWidth: compact ? "600px" : "1000px" }}
                >
                    {/* Header Days - Sticky */}
                    <div className="flex bg-card shrink-0 z-50 border-b border-border shadow-sm transition-colors sticky top-0">
                        <div className={cn("w-16 border-r border-border flex items-center justify-center p-2 bg-muted/30 sticky left-0 z-50", compact && "w-12")}>
                            <Zap className="w-3.5 h-3.5 text-primary" fill="currentColor" />
                        </div>
                        {DAYS.map(day => (
                            <div key={day} className={cn(
                                "flex-1 p-2.5 text-center transition-colors border-r last:border-r-0 border-border bg-card",
                                compact && "p-1.5"
                            )}>
                                <span className={cn(
                                    "font-black uppercase tracking-[0.2em] text-foreground/80",
                                    compact ? "text-[8px] tracking-normal" : "text-[10px]"
                                )}>{compact ? day.substring(0, 3) : day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Area */}
                    <div className="flex-1 relative overflow-y-auto no-scrollbar bg-muted/[0.03]">
                        <div
                            className="relative flex"
                            style={{ height: `${totalHeight}px` }}
                        >
                            {/* Grid Background & Interactive Rows */}
                            <div className="absolute inset-0 flex flex-col pointer-events-none">
                                {SLOTS.map((slot, idx) => (
                                    <div
                                        key={`${slot.h}-${slot.m}`}
                                        style={{ height: `${rowHeight / 2}px` }}
                                        className={cn(
                                            "w-full relative transition-colors pointer-events-auto group/row",
                                            "dark:slot-major-dark dark:slot-minor-dark light:slot-major-light light:slot-minor-light",
                                            slot.isMajor
                                                ? "bg-foreground/[0.04] dark:bg-foreground/[0.04] border-b-2 border-border/80 dark:border-border/80"
                                                : "bg-foreground/[0.015] dark:bg-foreground/[0.02] border-b border-border/30 dark:border-border/30"
                                        )}
                                    >
                                        {/* Row Hover Glow */}
                                        <div className="absolute inset-0 bg-primary/[0.04] opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>

                            {/* Time Column - Sticky */}
                            <div className={cn(
                                "w-16 border-r border-border shrink-0 h-full transition-colors sticky left-0 z-40 bg-card/95 backdrop-blur-md",
                                "shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.8)]",
                                compact && "w-12"
                            )}>
                                {SLOTS.map((slot, idx) => (
                                    <div
                                        key={`${slot.h}-${slot.m}`}
                                        style={{ height: `${rowHeight / 2}px` }}
                                        className={cn(
                                            "p-1.5 text-right pr-4 group/hour relative flex flex-col justify-center",
                                            slot.isMajor ? "opacity-100" : "opacity-30"
                                        )}
                                    >
                                        <span className={cn(
                                            "font-black tracking-tight tabular-nums transition-soft group-hover/hour:text-primary leading-none text-foreground",
                                            slot.isMajor ? (compact ? "text-[10px]" : "text-[13px]") : (compact ? "text-[7px]" : "text-[8px]")
                                        )}>
                                            {slot.h.toString().padStart(2, '0')}:{slot.m.toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Day Column Verticals & Tints */}
                            <div className="flex-1 flex pointer-events-none">
                                {DAYS.map((day, idx) => (
                                    <div key={day} className={cn(
                                        "flex-1 border-r last:border-r-0 border-border/40",
                                        idx % 2 === 0 ? "bg-foreground/[0.005] dark:bg-foreground/[0.01]" : "bg-transparent"
                                    )} />
                                ))}
                            </div>

                            {/* Overlays */}
                            <div
                                key={pulse}
                                className="absolute inset-0 pointer-events-none transition-all duration-150 ease-out animate-in fade-in-90 zoom-in-[0.995]"
                                style={{ left: compact ? "48px" : "64px" }}
                            >
                                <div className="relative h-full flex">
                                    {DAYS.map((day) => (
                                        <div key={day} className="flex-1 relative">
                                            {selectedClasses.map(cls => {
                                                if (!cls) return null;
                                                return (cls.meetings || [])
                                                    .filter((m: Meeting) => m.day === day)
                                                    .map((m: Meeting, mIdx: number) => {
                                                        const pos = getPosition(m);
                                                        if (!pos) return null;
                                                        const isConflicting = conflicts[cls.classId];
                                                        const isFrozen = frozenSubjectIds.includes(cls.subjectId);
                                                        const isPulsing = pulsingSubject === cls.subjectId;

                                                        return (
                                                            <div
                                                                key={`${cls.classId}-${mIdx}`}
                                                                onClick={() => onBlockClick?.(cls.subjectId)}
                                                                className={cn(
                                                                    "absolute left-[3px] right-[3px] rounded-md border transition-soft overflow-hidden flex flex-col pointer-events-auto group/block realistic-shadow cursor-pointer",
                                                                    isConflicting
                                                                        ? "bg-destructive/15 border-destructive shadow-lg shadow-destructive/10 z-20"
                                                                        : isFrozen
                                                                            ? "bg-card border-border/80 dark:border-border/80 z-10 hover:z-30 hover:-translate-y-0.5"
                                                                            : "bg-card border-border/50 dark:border-border/80 hover:border-primary/50 hover:bg-muted/30 dark:hover:bg-muted/30 z-10 hover:z-30 hover:-translate-y-0.5",
                                                                    compact ? "p-1.5" : "p-2.5"
                                                                )}
                                                                style={{ top: `${pos.top + 2}px`, height: `${pos.height - 4}px` }}
                                                            >
                                                                {/* Structural Gradient Edge for Frozen (Lab-grade) */}
                                                                {isFrozen && !isConflicting && (
                                                                    <div
                                                                        className="absolute inset-0 pointer-events-none rounded-[inherit] border-[1.5px] border-transparent"
                                                                        style={{
                                                                            background: "linear-gradient(to bottom right, rgba(34, 211, 238, 0.6), rgba(56, 189, 248, 0.5), rgba(59, 130, 246, 0.6)) border-box",
                                                                            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                                                                            WebkitMaskComposite: "destination-out",
                                                                            maskComposite: "exclude"
                                                                        }}
                                                                    />
                                                                )}

                                                                {/* Freeze Toggle Button (Hover-only) */}
                                                                {onToggleFreeze && (
                                                                    <div className="absolute top-1.5 right-1.5 z-50">
                                                                        {isPulsing && (
                                                                            <div className="absolute inset-0 rounded-md bg-cyan-400 animate-ping opacity-50" />
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onToggleFreeze(cls.subjectId);
                                                                                setPulsingSubject(cls.subjectId);
                                                                                setTimeout(() => setPulsingSubject(null), 250);
                                                                            }}
                                                                            className={cn(
                                                                                "relative p-1 rounded-md border transition-soft",
                                                                                "bg-card shadow-sm hover:scale-110 active:scale-90",
                                                                                isFrozen
                                                                                    ? "border-cyan-200/50 text-cyan-500 opacity-100"
                                                                                    : "border-border text-muted-foreground/30 hover:text-foreground opacity-0 group-hover/block:opacity-100"
                                                                            )}
                                                                        >
                                                                            <Snowflake className={cn(compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5")} fill={isFrozen ? "currentColor" : "none"} />
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {/* Accent strip */}
                                                                {isConflicting ? (
                                                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-destructive" />
                                                                ) : isFrozen ? (
                                                                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-cyan-400/40" />
                                                                ) : (
                                                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/30 group-hover/block:bg-primary transition-colors" />
                                                                )}

                                                                <div className="flex-1 min-w-0 flex flex-col mt-0.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={cn("font-black tracking-[0.05em] text-foreground/30 uppercase truncate", compact ? "text-[7px]" : "text-[8px]")}>
                                                                            {cls.subjectCode}
                                                                        </span>
                                                                        {isConflicting && <AlertTriangle className={cn("animate-pulse text-destructive", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />}
                                                                    </div>
                                                                    <h4 className={cn("font-extrabold leading-tight transition-soft text-foreground truncate", compact ? "text-[9px]" : "text-[12px]")}>
                                                                        {cls.subjectName}
                                                                    </h4>
                                                                    {/* Time Line - Prioritized */}
                                                                    <div className={cn(
                                                                        "flex items-center gap-1.5 mt-0.5 tabular-nums font-bold text-foreground/80 shrink-0",
                                                                        compact ? "text-[8px]" : "text-[10px]"
                                                                    )}>
                                                                        <Clock className={cn("opacity-40", compact ? "w-2 h-2" : "w-2.5 h-2.5")} />
                                                                        <span>{m.start}—{m.end}</span>
                                                                        {cls.meetings?.length > 1 && (
                                                                            <span className="text-primary/60 font-black text-[7px] bg-primary/5 px-1 rounded-sm">
                                                                                (+{cls.meetings.length - 1})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="mt-1.5 space-y-0.5 opacity-40 group-hover/block:opacity-70 transition-opacity overflow-hidden">
                                                                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                                        <span className={cn("font-bold uppercase truncate", compact ? "text-[7px]" : "text-[8px]")}>{cls.className}</span>
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            <MapPin className={cn(compact ? "w-2 h-2" : "w-2.5 h-2.5")} />
                                                                            <span className={cn("font-bold truncate max-w-[40px]", compact ? "text-[7px]" : "text-[8px]")}>{m.room}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col pt-0.5 border-t border-border/30">
                                                                        <div className="flex items-center gap-1 text-[7px] font-bold truncate">
                                                                            <User className="w-2.5 h-2.5 shrink-0 opacity-50" />
                                                                            <span className="truncate">{cls.lecturers?.[0] || "No Lecturer"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Watermark for Export */}
                    <div className="absolute bottom-4 right-6 pointer-events-none opacity-30 z-[60]">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">semangat</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
