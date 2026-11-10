"use client";

import React, { useEffect, useRef } from "react";
import { X, Trash2, Clock, CalendarX, Calendar, Hourglass, ArrowRight } from "lucide-react";
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

const DAYS: Day[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function RulesLab({ isOpen, onClose, rules, onUpdateRules, onGenerate }: RulesLabProps) {
    const listRef = useRef<HTMLDivElement>(null);

    const toggleRule = (id: string) => {
        onUpdateRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    };

    const removeRule = (id: string) => {
        onUpdateRules(rules.filter((r) => r.id !== id));
    };

    const updateRuleData = (id: string, data: Partial<Rule>) => {
        onUpdateRules(rules.map((r) => (r.id === id ? ({ ...r, ...data } as Rule) : r)));
    };

    // ESC to close drawer
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const addOrFocusRule = (type: Rule["type"]) => {
        const existing = rules.find((r) => r.type === type);
        if (existing) {
            if (!existing.enabled) {
                toggleRule(existing.id);
            }
            const el = document.getElementById(`rule-card-${existing.id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            return;
        }

        const id = crypto.randomUUID();
        let newRule: Rule;

        switch (type) {
            case "noDay":
                newRule = { id, type: "noDay", enabled: true, days: ["Sabtu"], label: "Ban Days" };
                break;
            case "timeWindow":
                newRule = {
                    id,
                    type: "timeWindow",
                    enabled: true,
                    scope: "allDays",
                    earliestStartMin: 480, // 08:00
                    latestEndMin: 1080,   // 18:00
                    label: "Time Window"
                };
                break;
            case "maxDaysPerWeek":
                newRule = { id, type: "maxDaysPerWeek", enabled: true, maxDays: 4, label: "Max Days on Campus" };
                break;
            case "maxGap":
                newRule = { id, type: "maxGap", enabled: true, maxGapMin: 60, label: "Max Gap Between Classes" };
                break;
            default:
                return;
        }

        onUpdateRules([...rules, newRule]);
    };

    return (
        <>
            {isOpen && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[120] animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity cursor-pointer"
                        onClick={onClose}
                    />

                    {/* Drawer Panel */}
                    <div
                        className="absolute top-0 right-0 h-full w-[410px] max-w-[90vw] bg-white dark:bg-[#1c1c1f] border-l border-[#e6e6e3] dark:border-[#2e2e34] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-[125]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 px-6 border-b border-[#e6e6e3] dark:border-[#2e2e34] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#18181b] shrink-0">
                            <div>
                                <h2 className="text-[16px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight">
                                    Rules & Preferences
                                </h2>
                                <p className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] mt-0.5">
                                    Configure solver schedule constraints
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                aria-label="Close rules drawer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Rules List */}
                        <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white dark:bg-[#1c1c1f]">
                            {rules.length === 0 ? (
                                <div className="py-8 px-4 flex flex-col items-center justify-center border border-dashed border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl text-center bg-[#fafaf9]/70 dark:bg-[#18181b]/70 space-y-2">
                                    <p className="font-doodle text-[17px] font-bold text-[#6e6e77] dark:text-[#a1a1aa] leading-snug max-w-[240px]">
                                        no rules yet — add one below to filter schedules
                                    </p>
                                    <svg className="w-5 h-6 text-[#5b82a6] dark:text-[#7dd3fc] stroke-current fill-none stroke-[2] translate-y-1" viewBox="0 0 20 24">
                                        <path d="M10 2 L10 20" strokeLinecap="round" />
                                        <path d="M5 15 L10 20 L15 15" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            ) : (
                                rules.map((rule) => (
                                    <RuleCard
                                        key={rule.id}
                                        rule={rule}
                                        onToggle={() => toggleRule(rule.id)}
                                        onRemove={() => removeRule(rule.id)}
                                        onUpdate={(data) => updateRuleData(rule.id, data)}
                                    />
                                ))
                            )}

                            {/* Add Rules Section */}
                            <div className="pt-4 border-t border-[#e6e6e3] dark:border-[#2e2e34] space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-doodle text-[19px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] select-none">
                                        add a rule
                                    </span>
                                    <span className="text-[11px] font-mono text-[#a1a1aa]">
                                        tap to add / focus
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <AddRuleButton
                                        num="01"
                                        label="No free day / Ban day"
                                        isActive={rules.some((r) => r.type === "noDay" && r.enabled)}
                                        onClick={() => addOrFocusRule("noDay")}
                                    />
                                    <AddRuleButton
                                        num="02"
                                        label="Time window"
                                        isActive={rules.some((r) => r.type === "timeWindow" && r.enabled)}
                                        onClick={() => addOrFocusRule("timeWindow")}
                                    />
                                    <AddRuleButton
                                        num="03"
                                        label="Max days on campus"
                                        isActive={rules.some((r) => r.type === "maxDaysPerWeek" && r.enabled)}
                                        onClick={() => addOrFocusRule("maxDaysPerWeek")}
                                    />
                                    <AddRuleButton
                                        num="04"
                                        label="Max gap between classes"
                                        isActive={rules.some((r) => r.type === "maxGap" && r.enabled)}
                                        onClick={() => addOrFocusRule("maxGap")}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 px-6 border-t border-[#e6e6e3] dark:border-[#2e2e34] bg-[#fbfbfa] dark:bg-[#18181b] shrink-0">
                            <button
                                onClick={onGenerate}
                                className="w-full btn-tactile-dark py-2.5 rounded-xl font-medium text-[13px] text-white flex items-center justify-center gap-2 select-none"
                            >
                                <span>Run Auto-Schedule</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function AddRuleButton({ num, label, isActive, onClick }: {
    num: string;
    label: string;
    isActive?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "tactile-btn flex items-start gap-2 p-2.5 rounded-xl border transition-all text-left shadow-2xs group cursor-pointer",
                isActive
                    ? "bg-neutral-50 dark:bg-[#202024] border-[#5b82a6]/40 dark:border-[#7dd3fc]/40"
                    : "bg-white dark:bg-[#18181b] border-[#e2e2de] dark:border-[#2e2e34] hover:bg-neutral-50 dark:hover:bg-[#202024] hover:border-[#141413]/30 dark:hover:border-white/30"
            )}
        >
            <span className="font-doodle text-[17px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] shrink-0 leading-none pt-0.5 select-none">
                {num}
            </span>
            <span className="text-[12px] font-medium text-[#141413] dark:text-[#f4f4f6] leading-snug line-clamp-2">
                {label}
            </span>
        </button>
    );
}

function RuleCard({ rule, onToggle, onRemove, onUpdate }: {
    rule: Rule;
    onToggle: () => void;
    onRemove: () => void;
    onUpdate: (data: Partial<Rule>) => void;
}) {
    return (
        <div
            id={`rule-card-${rule.id}`}
            className={cn(
                "rounded-xl border transition-all",
                rule.enabled
                    ? "bg-white dark:bg-[#18181b] border-[#e6e6e3] dark:border-[#2e2e34] shadow-xs"
                    : "bg-neutral-50/60 dark:bg-[#141416] border-[#e6e6e3] dark:border-[#2e2e34] opacity-60"
            )}
        >
            {/* Card Header */}
            <div className="p-3.5 px-4 flex items-center justify-between border-b border-[#e6e6e3]/60 dark:border-[#2e2e34]">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "p-2 rounded-lg",
                            rule.enabled
                                ? "bg-neutral-100 dark:bg-white/[0.08] text-[#141413] dark:text-[#f4f4f6]"
                                : "bg-neutral-200/50 dark:bg-white/[0.04] text-[#a1a1aa] dark:text-[#71717a]"
                        )}
                    >
                        {rule.type === "noDay" && <CalendarX className="w-3.5 h-3.5" />}
                        {rule.type === "timeWindow" && <Clock className="w-3.5 h-3.5" />}
                        {rule.type === "maxDaysPerWeek" && <Calendar className="w-3.5 h-3.5" />}
                        {rule.type === "maxGap" && <Hourglass className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-[#141413] dark:text-[#f4f4f6]">
                            {rule.label}
                        </h3>
                        {rule.type === "noDay" && (rule as NoDayRule).days.length === 0 && (
                            <span className="text-[11px] text-[#a1a1aa] font-mono mt-0.5 block">
                                tap days below to ban
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Switch checked={rule.enabled} onChange={onToggle} />
                    <button
                        onClick={onRemove}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors text-neutral-400 dark:text-[#71717a]"
                        aria-label={`Remove rule ${rule.id}`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Card Content */}
            {rule.enabled && (
                <div className="p-4 animate-in slide-in-from-top-1 duration-200">
                    {rule.type === "noDay" && (
                        <NoDayPicker
                            selectedDays={(rule as NoDayRule).days}
                            onChange={(days) => onUpdate({ days })}
                        />
                    )}
                    {rule.type === "timeWindow" && (
                        <TimeWindowPicker
                            earliestMin={(rule as TimeWindowRule).earliestStartMin}
                            latestMin={(rule as TimeWindowRule).latestEndMin}
                            onChange={(start, end) => onUpdate({ earliestStartMin: start, latestEndMin: end })}
                        />
                    )}
                    {rule.type === "maxDaysPerWeek" && (
                        <NumberInput
                            value={(rule as MaxDaysPerWeekRule).maxDays}
                            min={1}
                            max={6}
                            label="Max Days per Week"
                            onChange={(val) => onUpdate({ maxDays: val })}
                        />
                    )}
                    {rule.type === "maxGap" && (
                        <NumberInput
                            value={(rule as MaxGapRule).maxGapMin}
                            min={15}
                            max={480}
                            step={15}
                            label="Max Gap (Minutes)"
                            unit="min"
                            onChange={(val) => onUpdate({ maxGapMin: val })}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={cn(
                "w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer",
                checked ? "bg-[#141413] dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"
            )}
            role="switch"
            aria-checked={checked}
        >
            <div
                className={cn(
                    "w-3.5 h-3.5 rounded-full transition-transform shadow-xs",
                    checked
                        ? "translate-x-3.5 bg-white dark:bg-[#141413]"
                        : "translate-x-0 bg-white dark:bg-neutral-300"
                )}
            />
        </button>
    );
}

function NoDayPicker({ selectedDays, onChange }: { selectedDays: Day[]; onChange: (days: Day[]) => void }) {
    const language = useAppStore((s) => s.language);
    const toggleDay = (day: Day) => {
        if (selectedDays.includes(day)) {
            onChange(selectedDays.filter((d) => d !== day));
        } else {
            onChange([...selectedDays, day]);
        }
    };

    return (
        <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase text-[#6e6e77] dark:text-[#a1a1aa] tracking-wider">
                Exclude Days
            </p>
            <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                        <button
                            key={day}
                            onClick={() => toggleDay(day)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer",
                                isSelected
                                    ? "bg-[#141413] text-white border-[#141413] dark:bg-white dark:text-[#141413] dark:border-white shadow-2xs"
                                    : "bg-neutral-50 dark:bg-white/[0.04] border-[#e2e2de] dark:border-[#2e2e34] text-[#6e6e77] dark:text-[#a1a1aa] hover:border-[#141413]/30 dark:hover:border-white/30"
                            )}
                        >
                            {formatDay(day, language)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function TimeWindowPicker({ earliestMin, latestMin, onChange }: {
    earliestMin?: number;
    latestMin?: number;
    onChange: (start: number, end: number) => void;
}) {
    const formatTime = (min?: number) => {
        if (min === undefined) return "";
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    const handleTimeChange = (type: "start" | "end", val: string) => {
        if (!val) return;
        const [h, m] = val.split(":").map(Number);
        const total = h * 60 + m;
        if (type === "start") onChange(total, latestMin ?? 1080);
        else onChange(earliestMin ?? 480, total);
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase text-[#6e6e77] dark:text-[#a1a1aa] tracking-wider">
                        Earliest Start
                    </p>
                    <input
                        type="time"
                        value={formatTime(earliestMin)}
                        onChange={(e) => handleTimeChange("start", e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-white/[0.04] border border-[#e2e2de] dark:border-[#2e2e34] rounded-lg p-2 text-[12px] font-mono text-[#141413] dark:text-[#f4f4f6] focus:outline-none focus:border-[#141413] dark:focus:border-white transition-colors"
                    />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase text-[#6e6e77] dark:text-[#a1a1aa] tracking-wider">
                        Latest End
                    </p>
                    <input
                        type="time"
                        value={formatTime(latestMin)}
                        onChange={(e) => handleTimeChange("end", e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-white/[0.04] border border-[#e2e2de] dark:border-[#2e2e34] rounded-lg p-2 text-[12px] font-mono text-[#141413] dark:text-[#f4f4f6] focus:outline-none focus:border-[#141413] dark:focus:border-white transition-colors"
                    />
                </div>
            </div>
        </div>
    );
}

function NumberInput({ value, min, max, label, unit, step = 1, onChange }: {
    value: number;
    min: number;
    max: number;
    label: string;
    unit?: string;
    step?: number;
    onChange: (val: number) => void;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase text-[#6e6e77] dark:text-[#a1a1aa] tracking-wider">
                    {label}
                </p>
                <span className="text-[11px] font-mono font-bold text-[#141413] dark:text-[#f4f4f6] bg-neutral-100 dark:bg-white/[0.08] px-2 py-0.5 rounded">
                    {value} {unit}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 accent-[#141413] dark:accent-white h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full cursor-pointer"
                />
            </div>
        </div>
    );
}
