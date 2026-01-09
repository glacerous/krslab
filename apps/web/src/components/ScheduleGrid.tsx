"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Meeting } from "@/lib/store";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 - 19:00

interface ScheduleGridProps {
    selectedClasses: any[];
    conflicts: Record<string, boolean>;
    compact?: boolean;
}

export function ScheduleGrid({ selectedClasses, conflicts, compact = false }: ScheduleGridProps) {
    const hourHeight = compact ? 60 : 100;
    const totalHeight = HOURS.length * hourHeight;

    const getPosition = (meeting: Meeting) => {
        const dayIndex = DAYS.indexOf(meeting.day);
        if (dayIndex === -1) return null;

        const [startH, startM] = meeting.start.split(":").map(Number);
        const [endH, endM] = meeting.end.split(":").map(Number);

        const startInMinutes = startH * 60 + startM;
        const endInMinutes = endH * 60 + endM;

        const gridStartInMinutes = 7 * 60;
        const top = ((startInMinutes - gridStartInMinutes) / 60) * hourHeight;
        const height = ((endInMinutes - startInMinutes) / 60) * hourHeight;

        return { dayIndex, top, height };
    };

    return (
        <div className={cn(
            "flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-full",
            compact && "rounded-2xl shadow-sm"
        )}>
            {/* Header Days */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
                <div className={cn("w-20 border-r border-zinc-100 dark:border-zinc-800 p-4 text-center text-[10px] font-black text-zinc-400", compact && "w-12 p-2")}>
                    {compact ? "" : "TIME"}
                </div>
                {DAYS.map(day => (
                    <div key={day} className={cn(
                        "flex-1 p-4 text-center text-[10px] font-black tracking-[0.2em] text-zinc-600 dark:text-zinc-400 uppercase border-r last:border-r-0 border-zinc-100 dark:border-zinc-800",
                        compact && "p-2 tracking-normal"
                    )}>
                        {compact ? day.substring(0, 3) : day}
                    </div>
                ))}
            </div>

            {/* Grid Content */}
            <div className="flex-1 relative overflow-y-auto overflow-x-hidden min-h-0">
                <div
                    className="relative flex"
                    style={{ height: `${totalHeight}px`, minWidth: "100%" }}
                >
                    {/* Time labels column */}
                    <div className={cn("w-20 bg-zinc-50/30 dark:bg-zinc-950/30 border-r border-zinc-100 dark:border-zinc-800 shrink-0 h-full", compact && "w-12")}>
                        {HOURS.map(hour => (
                            <div key={hour} style={{ height: `${hourHeight}px` }} className="border-b border-zinc-50 dark:border-zinc-900/50 p-2 text-right pr-4">
                                <span className="text-[10px] font-black text-zinc-400">{hour.toString().padStart(2, '0')}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid columns */}
                    {DAYS.map((day) => (
                        <div key={day} className="flex-1 relative border-r last:border-r-0 border-zinc-100 dark:border-zinc-800 h-full">
                            {HOURS.map(hour => (
                                <div key={hour} style={{ height: `${hourHeight}px` }} className="border-b border-zinc-50 dark:border-zinc-900/50" />
                            ))}
                        </div>
                    ))}

                    {/* Schedule Blocks Overlay */}
                    <div
                        className={cn("absolute inset-0 pointer-events-none")}
                        style={{ left: compact ? "48px" : "80px" }}
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

                                                return (
                                                    <div
                                                        key={`${cls.classId}-${mIdx}`}
                                                        className={cn(
                                                            "absolute left-1 right-1 p-2 rounded-xl border-2 shadow-sm transition-all overflow-hidden flex flex-col justify-between pointer-events-auto",
                                                            isConflicting
                                                                ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400 z-20"
                                                                : "bg-blue-600/10 border-blue-600 text-blue-800 dark:text-blue-300 z-10 hover:z-30",
                                                            compact ? "rounded-lg p-1.5" : "p-3"
                                                        )}
                                                        style={{ top: `${pos.top}px`, height: `${pos.height}px` }}
                                                    >
                                                        <div className="overflow-hidden">
                                                            <p className={cn("font-black uppercase tracking-widest opacity-60 truncate", compact ? "text-[7px]" : "text-[9px]")}>
                                                                {cls.subjectCode}
                                                            </p>
                                                            <h4 className={cn("font-black leading-tight line-clamp-2", compact ? "text-[8px]" : "text-xs")}>
                                                                {cls.subjectName}
                                                            </h4>
                                                        </div>
                                                        {!compact && (
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-[10px] font-black opacity-80">CLASS {cls.className}</span>
                                                                <span className="text-[9px] font-bold opacity-60">{m.room}</span>
                                                            </div>
                                                        )}
                                                        {isConflicting && (
                                                            <div className="absolute top-1 right-1">
                                                                <AlertCircle className={cn("text-red-500 animate-pulse", compact ? "w-2 h-2" : "w-3 h-3")} />
                                                            </div>
                                                        )}
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
        </div>
    );
}
