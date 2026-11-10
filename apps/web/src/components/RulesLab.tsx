"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { X, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Rule, TimeWindowRule, NoDayRule, MaxDaysPerWeekRule, MaxGapRule, Day } from "@krs/engine";
import { createPortal } from "react-dom";
import { useAppStore } from "@/lib/store";
import { formatDay } from "@/lib/i18n";

interface RulesLabProps {
    isOpen: boolean;
    onClose: () => void;
    rules: Rule[];
    onUpdateRules: (rules: Rule[]) => void;
    onGenerate: () => void;
}

const ALL_DAYS: Day[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Hand-drawn doodle SVG icons matching KRSlab papercraft style
function DoodleWeekendIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="4.5" />
            <path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3l1.3-1.3M14 6l1.3-1.3" />
        </svg>
    );
}

function DoodleClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6.2v4.2l3 1.8" />
            <path d="M16.5 3.5l1 1M18.5 2.5l-1 1" />
        </svg>
    );
}

function DoodleCompactIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 2.5L4.5 11h5l-1.5 6.5 7.5-9h-5.5L11 2.5z" />
        </svg>
    );
}

function DoodleCalendarX({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
            <path d="M6.5 2.5v3M13.5 2.5v3M3 8.5h14" />
            <path d="M7.8 11.2l4.4 4.4M12.2 11.2l-4.4 4.4" />
        </svg>
    );
}

function DoodleTimeWindow({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 5.8v4.5l3.2 2" />
        </svg>
    );
}

function DoodleDaysCount({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
            <path d="M6.5 2.5v3M13.5 2.5v3M3 8.5h14" />
            <circle cx="7" cy="12" r="1" fill="currentColor" />
            <circle cx="10" cy="12" r="1" fill="currentColor" />
            <circle cx="13" cy="12" r="1" fill="currentColor" />
            <circle cx="7" cy="14.5" r="1" fill="currentColor" />
        </svg>
    );
}

function DoodleHourglass({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 3.5h9M5.5 16.5h9" />
            <path d="M6.5 3.5c0 4 3.5 4.5 3.5 6.5s-3.5 2.5-3.5 6.5h7c0-4-3.5-4.5-3.5-6.5s3.5-2.5 3.5-6.5h-7z" />
        </svg>
    );
}

export function RulesLab({ isOpen, onClose, rules, onUpdateRules, onGenerate }: RulesLabProps) {
    const language = useAppStore((s) => s.language);
    const isId = language === "id";

    // Index rules by type for O(1) canonical access
    const ruleByType = useMemo(() => {
        const map = new Map<string, Rule>();
        for (const r of rules) {
            map.set(r.type, r);
        }
        return map;
    }, [rules]);

    const activeRulesCount = useMemo(() => {
        return rules.filter(r => {
            if (!r.enabled) return false;
            if (r.type === "noDay") return Array.isArray(r.days) && r.days.length > 0;
            return true;
        }).length;
    }, [rules]);

    // Handle ESC to close and ENTER to run
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "Enter" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                e.preventDefault();
                onGenerate();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose, onGenerate]);

    // Helper to update or create a rule by type
    const upsertRule = useCallback((type: Rule["type"], updater: (current: Rule | undefined) => Rule) => {
        const existingIdx = rules.findIndex(r => r.type === type);
        let next: Rule[];
        if (existingIdx >= 0) {
            const updated = updater(rules[existingIdx]);
            next = [...rules];
            next[existingIdx] = updated;
        } else {
            const created = updater(undefined);
            next = [...rules, created];
        }
        onUpdateRules(next);
    }, [rules, onUpdateRules]);

    // Reset all rules
    const handleResetAll = useCallback(() => {
        onUpdateRules([]);
    }, [onUpdateRules]);

    // Presets
    const applyPreset = useCallback((preset: "longWeekend" | "no7am" | "compact4") => {
        let next = [...rules];
        const updateOrAdd = (rule: Rule) => {
            const idx = next.findIndex(r => r.type === rule.type);
            if (idx >= 0) next[idx] = rule;
            else next.push(rule);
        };

        if (preset === "longWeekend") {
            updateOrAdd({
                id: crypto.randomUUID(),
                type: "noDay",
                enabled: true,
                days: ["Jumat", "Sabtu"],
                label: "No Day"
            });
        } else if (preset === "no7am") {
            updateOrAdd({
                id: crypto.randomUUID(),
                type: "timeWindow",
                enabled: true,
                scope: "allDays",
                earliestStartMin: 480, // 08:00
                latestEndMin: 1080,   // 18:00
                label: "Time Window"
            });
        } else if (preset === "compact4") {
            updateOrAdd({
                id: crypto.randomUUID(),
                type: "maxDaysPerWeek",
                enabled: true,
                maxDays: 4,
                label: "Max Days"
            });
        }
        onUpdateRules(next);
    }, [rules, onUpdateRules]);

    // Rule states
    const noDayRule = ruleByType.get("noDay") as NoDayRule | undefined;
    const timeRule = ruleByType.get("timeWindow") as TimeWindowRule | undefined;
    const maxDaysRule = ruleByType.get("maxDaysPerWeek") as MaxDaysPerWeekRule | undefined;
    const gapRule = ruleByType.get("maxGap") as MaxGapRule | undefined;

    return (
        <>
            {isOpen && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[120] animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/15 backdrop-blur-[1px] transition-opacity cursor-pointer"
                        onClick={onClose}
                    />

                    {/* Drawer Panel */}
                    <div
                        className="absolute top-0 right-0 h-full w-[430px] max-w-[92vw] bg-white dark:bg-[#1c1c1f] border-l border-[#e6e6e3] dark:border-[#2e2e34] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-[125]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 px-5 border-b border-[#e6e6e3] dark:border-[#2e2e34] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#18181b] shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-[15px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight">
                                            {isId ? "Aturan & Preferensi" : "Rules & Constraints"}
                                        </h2>
                                        {activeRulesCount > 0 && (
                                            <span className="bg-[#141413] dark:bg-white text-white dark:text-[#141413] rounded-full px-2 py-0.5 text-[11px] font-bold font-mono">
                                                {activeRulesCount} {isId ? "aktif" : "active"}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                        {isId ? "Saring jadwal otomatis sesuai preferensi kuliah" : "Filter auto-schedule combinations to your liking"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {activeRulesCount > 0 && (
                                    <button
                                        onClick={handleResetAll}
                                        className="text-[12px] font-medium text-[#6e6e77] hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                        title={isId ? "Hapus semua aturan" : "Reset all rules"}
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] cursor-pointer"
                                    aria-label="Close rules drawer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Presets Bar */}
                        <div className="px-5 py-2.5 bg-[#f5f5f3] dark:bg-[#151517] border-b border-[#e6e6e3] dark:border-[#2e2e34] shrink-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-[#6e6e77] dark:text-[#a1a1aa] flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>{isId ? "Preset Cepat:" : "Quick Presets:"}</span>
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <PresetChip
                                    icon={<DoodleWeekendIcon className="w-3.5 h-3.5 text-amber-500" />}
                                    label={isId ? "Libur Jum-Sab" : "Free Fri & Sat"}
                                    isActive={Boolean(noDayRule?.enabled && noDayRule.days.includes("Jumat") && noDayRule.days.includes("Sabtu"))}
                                    onClick={() => applyPreset("longWeekend")}
                                />
                                <PresetChip
                                    icon={<DoodleClockIcon className="w-3.5 h-3.5 text-sky-500" />}
                                    label={isId ? "Tanpa Jam 7 Pagi" : "No 7 AM Class"}
                                    isActive={Boolean(timeRule?.enabled && timeRule.earliestStartMin === 480)}
                                    onClick={() => applyPreset("no7am")}
                                />
                                <PresetChip
                                    icon={<DoodleCompactIcon className="w-3.5 h-3.5 text-emerald-500" />}
                                    label={isId ? "Maks 4 Hari" : "4-Day Week"}
                                    isActive={Boolean(maxDaysRule?.enabled && maxDaysRule.maxDays === 4)}
                                    onClick={() => applyPreset("compact4")}
                                />
                            </div>
                        </div>

                        {/* Rules List Container */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar bg-[#fafaf9] dark:bg-[#141416]">
                            {/* 1. FREE DAYS / BAN DAYS */}
                            <RuleSectionCard
                                icon={<DoodleCalendarX className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                                title={isId ? "Hari Libur Kuliah" : "Free Days (No Classes)"}
                                subtitle={isId ? "Pilih hari yang tidak ingin ada perkuliahan" : "Keep specific days completely class-free"}
                                isEnabled={Boolean(noDayRule?.enabled)}
                                onToggle={() => {
                                    upsertRule("noDay", (curr) => {
                                        if (curr) {
                                            const nextEnabled = !curr.enabled;
                                            const days = (curr as NoDayRule).days?.length ? (curr as NoDayRule).days : ["Sabtu"];
                                            return { ...curr, enabled: nextEnabled, days } as NoDayRule;
                                        }
                                        return {
                                            id: crypto.randomUUID(),
                                            type: "noDay",
                                            enabled: true,
                                            days: ["Sabtu"],
                                            label: "No Day"
                                        };
                                    });
                                }}
                            >
                                <div className="space-y-2 pt-1">
                                    <div className="flex flex-wrap gap-1.5">
                                        {ALL_DAYS.map((day) => {
                                            const isSelected = (noDayRule?.days || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        upsertRule("noDay", (curr) => {
                                                            const baseDays = (curr as NoDayRule)?.days || [];
                                                            const nextDays = isSelected
                                                                ? baseDays.filter(d => d !== day)
                                                                : [...baseDays, day];
                                                            return {
                                                                id: curr?.id || crypto.randomUUID(),
                                                                type: "noDay",
                                                                enabled: true,
                                                                days: nextDays,
                                                                label: "No Day"
                                                            };
                                                        });
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border transition-all select-none cursor-pointer",
                                                        isSelected
                                                            ? "bg-amber-500 border-amber-600 text-white shadow-xs"
                                                            : "bg-white dark:bg-[#1e1e22] border-[#e6e6e3] dark:border-[#2e2e34] text-[#141413] dark:text-[#e4e4e7] hover:bg-neutral-50 dark:hover:bg-[#25252a]"
                                                    )}
                                                >
                                                    {formatDay(day, language)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {(!noDayRule?.days || noDayRule.days.length === 0) && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            {isId ? "Pilih minimal satu hari untuk diliburkan." : "Tap days above to keep them free."}
                                        </p>
                                    )}
                                </div>
                            </RuleSectionCard>

                            {/* 2. TIME WINDOW */}
                            <RuleSectionCard
                                icon={<DoodleTimeWindow className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                                title={isId ? "Rentang Jam Kuliah" : "Class Time Window"}
                                subtitle={isId ? "Atur batas jam paling pagi dan paling malam" : "Limit earliest start & latest finish hours"}
                                isEnabled={Boolean(timeRule?.enabled)}
                                onToggle={() => {
                                    upsertRule("timeWindow", (curr) => {
                                        if (curr) return { ...curr, enabled: !curr.enabled };
                                        return {
                                            id: crypto.randomUUID(),
                                            type: "timeWindow",
                                            enabled: true,
                                            scope: "allDays",
                                            earliestStartMin: 480, // 08:00
                                            latestEndMin: 1080,   // 18:00
                                            label: "Time Window"
                                        };
                                    });
                                }}
                            >
                                <div className="space-y-3 pt-1">
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e77] dark:text-[#a1a1aa]">
                                                {isId ? "Paling Pagi" : "Earliest Start"}
                                            </label>
                                            <input
                                                type="time"
                                                value={formatMinToTime(timeRule?.earliestStartMin ?? 480)}
                                                onChange={(e) => {
                                                    const min = parseTimeToMin(e.target.value);
                                                    upsertRule("timeWindow", (curr) => ({
                                                        id: curr?.id || crypto.randomUUID(),
                                                        type: "timeWindow",
                                                        enabled: true,
                                                        scope: "allDays",
                                                        earliestStartMin: min,
                                                        latestEndMin: (curr as TimeWindowRule)?.latestEndMin ?? 1080,
                                                        label: "Time Window"
                                                    }));
                                                }}
                                                className="w-full bg-white dark:bg-[#1e1e22] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-lg p-2 text-xs font-mono font-medium text-[#141413] dark:text-[#f4f4f6] focus:outline-none focus:ring-1 focus:ring-[#141413]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e77] dark:text-[#a1a1aa]">
                                                {isId ? "Paling Malam" : "Latest Finish"}
                                            </label>
                                            <input
                                                type="time"
                                                value={formatMinToTime(timeRule?.latestEndMin ?? 1080)}
                                                onChange={(e) => {
                                                    const min = parseTimeToMin(e.target.value);
                                                    upsertRule("timeWindow", (curr) => ({
                                                        id: curr?.id || crypto.randomUUID(),
                                                        type: "timeWindow",
                                                        enabled: true,
                                                        scope: "allDays",
                                                        earliestStartMin: (curr as TimeWindowRule)?.earliestStartMin ?? 480,
                                                        latestEndMin: min,
                                                        label: "Time Window"
                                                    }));
                                                }}
                                                className="w-full bg-white dark:bg-[#1e1e22] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-lg p-2 text-xs font-mono font-medium text-[#141413] dark:text-[#f4f4f6] focus:outline-none focus:ring-1 focus:ring-[#141413]"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                upsertRule("timeWindow", (curr) => ({
                                                    id: curr?.id || crypto.randomUUID(),
                                                    type: "timeWindow",
                                                    enabled: true,
                                                    scope: "allDays",
                                                    earliestStartMin: 480,
                                                    latestEndMin: (curr as TimeWindowRule)?.latestEndMin ?? 1080,
                                                    label: "Time Window"
                                                }));
                                            }}
                                            className="px-2 py-1 rounded bg-[#f3f3f0] dark:bg-[#242428] hover:bg-neutral-200 text-[10.5px] font-mono text-[#4a4a52] dark:text-[#d4d4d8] cursor-pointer"
                                        >
                                            {isId ? "Mulai 08:00" : "Start 08:00"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                upsertRule("timeWindow", (curr) => ({
                                                    id: curr?.id || crypto.randomUUID(),
                                                    type: "timeWindow",
                                                    enabled: true,
                                                    scope: "allDays",
                                                    earliestStartMin: 540,
                                                    latestEndMin: (curr as TimeWindowRule)?.latestEndMin ?? 1080,
                                                    label: "Time Window"
                                                }));
                                            }}
                                            className="px-2 py-1 rounded bg-[#f3f3f0] dark:bg-[#242428] hover:bg-neutral-200 text-[10.5px] font-mono text-[#4a4a52] dark:text-[#d4d4d8] cursor-pointer"
                                        >
                                            {isId ? "Mulai 09:00" : "Start 09:00"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                upsertRule("timeWindow", (curr) => ({
                                                    id: curr?.id || crypto.randomUUID(),
                                                    type: "timeWindow",
                                                    enabled: true,
                                                    scope: "allDays",
                                                    earliestStartMin: (curr as TimeWindowRule)?.earliestStartMin ?? 480,
                                                    latestEndMin: 1020,
                                                    label: "Time Window"
                                                }));
                                            }}
                                            className="px-2 py-1 rounded bg-[#f3f3f0] dark:bg-[#242428] hover:bg-neutral-200 text-[10.5px] font-mono text-[#4a4a52] dark:text-[#d4d4d8] cursor-pointer"
                                        >
                                            {isId ? "Selesai 17:00" : "End 17:00"}
                                        </button>
                                    </div>
                                </div>
                            </RuleSectionCard>

                            {/* 3. MAX DAYS PER WEEK */}
                            <RuleSectionCard
                                icon={<DoodleDaysCount className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                title={isId ? "Maksimal Hari Kuliah" : "Max Campus Days / Week"}
                                subtitle={isId ? "Padatkan perkuliahan dalam beberapa hari saja" : "Condense classes into fewer active days"}
                                isEnabled={Boolean(maxDaysRule?.enabled)}
                                onToggle={() => {
                                    upsertRule("maxDaysPerWeek", (curr) => {
                                        if (curr) return { ...curr, enabled: !curr.enabled };
                                        return {
                                            id: crypto.randomUUID(),
                                            type: "maxDaysPerWeek",
                                            enabled: true,
                                            maxDays: 4,
                                            label: "Max Days"
                                        };
                                    });
                                }}
                            >
                                <div className="space-y-2 pt-1">
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[3, 4, 5, 6].map((daysCount) => {
                                            const isSelected = (maxDaysRule?.maxDays ?? 4) === daysCount;
                                            return (
                                                <button
                                                    key={daysCount}
                                                    type="button"
                                                    onClick={() => {
                                                        upsertRule("maxDaysPerWeek", (curr) => ({
                                                            id: curr?.id || crypto.randomUUID(),
                                                            type: "maxDaysPerWeek",
                                                            enabled: true,
                                                            maxDays: daysCount,
                                                            label: "Max Days"
                                                        }));
                                                    }}
                                                    className={cn(
                                                        "py-2 rounded-lg text-xs font-semibold border transition-all text-center select-none cursor-pointer",
                                                        isSelected
                                                            ? "bg-emerald-600 border-emerald-700 text-white shadow-xs font-bold"
                                                            : "bg-white dark:bg-[#1e1e22] border-[#e6e6e3] dark:border-[#2e2e34] text-[#141413] dark:text-[#e4e4e7] hover:bg-neutral-50 dark:hover:bg-[#25252a]"
                                                    )}
                                                >
                                                    {daysCount} {isId ? "hari" : "days"}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </RuleSectionCard>

                            {/* 4. MAX GAP BETWEEN CLASSES */}
                            <RuleSectionCard
                                icon={<DoodleHourglass className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                title={isId ? "Jeda Maksimal Antarkelas" : "Max Gap Between Classes"}
                                subtitle={isId ? "Hindari jam kosong yang terlalu lama di kampus" : "Avoid excessive waiting hours between lectures"}
                                isEnabled={Boolean(gapRule?.enabled)}
                                onToggle={() => {
                                    upsertRule("maxGap", (curr) => {
                                        if (curr) return { ...curr, enabled: !curr.enabled };
                                        return {
                                            id: crypto.randomUUID(),
                                            type: "maxGap",
                                            enabled: true,
                                            maxGapMin: 60,
                                            label: "Max Gap"
                                        };
                                    });
                                }}
                            >
                                <div className="space-y-2 pt-1">
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            { min: 30, label: "30m" },
                                            { min: 60, label: "1h" },
                                            { min: 90, label: "1.5h" },
                                            { min: 120, label: "2h" }
                                        ].map((item) => {
                                            const isSelected = (gapRule?.maxGapMin ?? 60) === item.min;
                                            return (
                                                <button
                                                    key={item.min}
                                                    type="button"
                                                    onClick={() => {
                                                        upsertRule("maxGap", (curr) => ({
                                                            id: curr?.id || crypto.randomUUID(),
                                                            type: "maxGap",
                                                            enabled: true,
                                                            maxGapMin: item.min,
                                                            label: "Max Gap"
                                                        }));
                                                    }}
                                                    className={cn(
                                                        "py-2 rounded-lg text-xs font-semibold border transition-all text-center select-none font-mono cursor-pointer",
                                                        isSelected
                                                            ? "bg-purple-600 border-purple-700 text-white shadow-xs font-bold"
                                                            : "bg-white dark:bg-[#1e1e22] border-[#e6e6e3] dark:border-[#2e2e34] text-[#141413] dark:text-[#e4e4e7] hover:bg-neutral-50 dark:hover:bg-[#25252a]"
                                                    )}
                                                >
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </RuleSectionCard>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 px-5 border-t border-[#e6e6e3] dark:border-[#2e2e34] bg-[#fbfbfa] dark:bg-[#18181b] shrink-0 space-y-2">
                            <button
                                onClick={onGenerate}
                                className="w-full btn-tactile-dark py-3 rounded-xl font-medium text-[13px] text-white flex items-center justify-center gap-2 select-none shadow-sm cursor-pointer"
                            >
                                <span>{isId ? "Susun Otomatis" : "Run Auto-Schedule"}</span>
                                {activeRulesCount > 0 && (
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-mono">
                                        {activeRulesCount}
                                    </span>
                                )}
                                <ArrowRight className="w-3.5 h-3.5" />
                                <kbd className="hidden sm:inline-block bg-white/15 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/80 ml-1">
                                    Enter
                                </kbd>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function PresetChip({
    icon,
    label,
    isActive,
    onClick
}: {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-all select-none flex items-center gap-1.5 cursor-pointer",
                isActive
                    ? "bg-[#141413] text-white border-[#141413] dark:bg-white dark:text-[#141413]"
                    : "bg-white dark:bg-[#1e1e22] text-[#4a4a52] dark:text-[#d4d4d8] border-[#d8d8d4] dark:border-[#2e2e34] hover:border-[#141413] dark:hover:border-white"
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function RuleSectionCard({
    icon,
    title,
    subtitle,
    isEnabled,
    onToggle,
    children
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    isEnabled: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className={cn(
            "rounded-2xl border transition-all overflow-hidden",
            isEnabled
                ? "bg-white dark:bg-[#1c1c1f] border-[#dcdcd6] dark:border-[#2e2e34] shadow-xs"
                : "bg-white/60 dark:bg-[#18181b]/60 border-[#e6e6e3] dark:border-[#242428] opacity-75 hover:opacity-100"
        )}>
            {/* Header row */}
            <div
                className="p-3.5 px-4 flex items-center justify-between cursor-pointer select-none"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-xl border transition-colors",
                        isEnabled
                            ? "bg-neutral-100 dark:bg-white/[0.08] border-[#e6e6e3] dark:border-white/[0.08]"
                            : "bg-neutral-50 dark:bg-white/[0.02] border-transparent opacity-70"
                    )}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-[#141413] dark:text-[#f4f4f6] leading-snug">
                            {title}
                        </h3>
                        <p className="text-[11px] text-[#6e6e77] dark:text-[#a1a1aa] leading-tight">
                            {subtitle}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    className={cn(
                        "w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 cursor-pointer",
                        isEnabled ? "bg-[#141413] dark:bg-white" : "bg-[#d8d8d4] dark:bg-[#34343a]"
                    )}
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full transition-transform",
                        isEnabled
                            ? "translate-x-4 bg-white dark:bg-[#141413]"
                            : "translate-x-0 bg-white"
                    )} />
                </button>
            </div>

            {/* Expandable configuration area */}
            {isEnabled && (
                <div className="px-4 pb-4 border-t border-[#f0f0ed] dark:border-[#242428] bg-[#fdfdfc] dark:bg-[#1a1a1d] animate-in fade-in duration-150">
                    {children}
                </div>
            )}
        </div>
    );
}

function formatMinToTime(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function parseTimeToMin(timeStr: string): number {
    if (!timeStr) return 480;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}
