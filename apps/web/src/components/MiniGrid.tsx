"use client";

import { useMemo } from "react";
import { Datasource, Meeting } from "@/lib/store";
import { cn } from "@/lib/utils";

interface MiniGridProps {
    mapping: Record<string, string>;
    datasource: Datasource;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const START_HOUR = 7;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

export function MiniGrid({ mapping, datasource }: MiniGridProps) {
    const blocks = useMemo(() => {
        const results: { day: number; top: number; height: number; key: string }[] = [];

        Object.entries(mapping).forEach(([subId, classId]) => {
            const sub = datasource.subjects.find(s => s.subjectId === subId);
            const cls = sub?.classes.find(c => c.classId === classId);
            if (!cls) return;

            cls.meetings.forEach((m: Meeting, idx: number) => {
                const dayIdx = DAYS.indexOf(m.day);
                if (dayIdx === -1) return;

                const [startH, startM] = m.start.split(":").map(Number);
                const [endH, endM] = m.end.split(":").map(Number);

                const startMin = (startH - START_HOUR) * 60 + startM;
                const endMin = (endH - START_HOUR) * 60 + endM;

                if (startMin < 0) return;

                const top = (startMin / (TOTAL_HOURS * 60)) * 100;
                const height = ((endMin - startMin) / (TOTAL_HOURS * 60)) * 100;

                results.push({
                    day: dayIdx,
                    top,
                    height,
                    key: `${subId}-${classId}-${idx}`
                });
            });
        });

        return results;
    }, [mapping, datasource]);

    return (
        <div className="w-full aspect-[4/3] bg-muted/20 rounded-lg border border-border/50 relative overflow-hidden p-1 shadow-inner group-hover:bg-muted/40 transition-colors">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex">
                {DAYS.map((_, i) => (
                    <div key={i} className="flex-1 border-r border-border/10 last:border-r-0" />
                ))}
            </div>
            <div className="absolute inset-0 flex flex-col">
                {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                    <div key={i} className="flex-1 border-b border-border/10 last:border-b-0" />
                ))}
            </div>

            {/* Blocks */}
            <div className="relative h-full w-full">
                {blocks.map((b) => (
                    <div
                        key={b.key}
                        className="absolute bg-primary/40 border border-primary/20 rounded-[1px] shadow-[0_0_8px_rgba(var(--primary),0.1)]"
                        style={{
                            left: `${(b.day / DAYS.length) * 100}%`,
                            width: `${(1 / DAYS.length) * 100}%`,
                            top: `${b.top}%`,
                            height: `${b.height}%`,
                            padding: "0.5px"
                        }}
                    >
                        <div className="w-full h-full bg-primary/60 rounded-[0.5px]" />
                    </div>
                ))}
            </div>
        </div>
    );
}
