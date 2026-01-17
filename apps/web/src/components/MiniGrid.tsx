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

// Helper to generate a consistent color based on string hash
const getSubjectColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Use HSL for consistent vibrance and lightness
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 55%)`;
};

export function MiniGrid({ mapping, datasource }: MiniGridProps) {
    const blocks = useMemo(() => {
        const results: { day: number; top: number; height: number; key: string; color: string }[] = [];

        Object.entries(mapping).forEach(([subId, classId]) => {
            const sub = datasource.subjects.find(s => s.subjectId === subId);
            const cls = sub?.classes.find(c => c.classId === classId);
            if (!cls) return;

            const color = getSubjectColor(subId);

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
                    key: `${subId}-${classId}-${idx}`,
                    color
                });
            });
        });

        return results;
    }, [mapping, datasource]);

    return (
        <div className="w-full aspect-[16/10] bg-zinc-950/40 rounded-xl border border-white/5 relative overflow-hidden p-1 shadow-2xl group transition-all duration-500 hover:border-white/10">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Very Subtle Grid Lines */}
            <div className="absolute inset-0 flex px-1">
                {DAYS.map((_, i) => (
                    <div key={i} className="flex-1 border-r border-white-[0.03] last:border-r-0" />
                ))}
            </div>
            <div className="absolute inset-0 flex flex-col py-1">
                {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                    <div key={i} className="flex-1 border-b border-white-[0.03] last:border-b-0" />
                ))}
            </div>

            {/* Content Container */}
            <div className="relative h-full w-full">
                {blocks.map((b) => (
                    <div
                        key={b.key}
                        className="absolute transition-all duration-500"
                        style={{
                            left: `${(b.day / DAYS.length) * 100}%`,
                            width: `${(1 / DAYS.length) * 100}%`,
                            top: `${b.top}%`,
                            height: `${b.height}%`,
                            padding: "1px"
                        }}
                    >
                        {/* The Block itself */}
                        <div
                            className="w-full h-full rounded-[2px] relative overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-[1.02] transition-transform duration-300"
                            style={{
                                backgroundColor: b.color,
                                backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)`
                            }}
                        >
                            {/* Inner Shine */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />

                            {/* Glow Effect */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                                style={{
                                    boxShadow: `inset 0 0 10px 2px ${b.color}`
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
