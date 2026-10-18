"use client";

import { useState, useMemo } from "react";
import { Plan, Datasource } from "@/lib/store";
import { useAppStore } from "@/lib/store";
import {
    Search,
    Check,
    X,
    Lock,
    Unlock,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSubjectColor } from "@/lib/colors";
import { toast } from "sonner";

interface CoursePanelProps {
    plan: Plan;
    datasource: Datasource;
    activeTab: "selected" | "catalog";
    onTabChange: (tab: "selected" | "catalog") => void;
    conflicts: Record<string, boolean>;
    effectiveMapping: Record<string, string>;
    selectedSubjectIdForDetail?: string | null;
    onSelectSubjectDetail?: (subjectId: string | null) => void;
    onHoverSubject?: (subjectId: string | null) => void;
    onHoverClass?: (classId: string | null) => void;
}

export function CoursePanel({
    plan,
    datasource,
    activeTab,
    onTabChange,
    conflicts,
    effectiveMapping,
    onHoverSubject,
    onHoverClass
}: CoursePanelProps) {
    const {
        toggleSubjectInPlan,
        removeSubjectFromPlan,
        setSelectedClassForSubject,
        toggleFreezeSubject,
        setPreviewOverride
    } = useAppStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

    // Selected courses list
    const selectedSubjects = useMemo(() => {
        return datasource.subjects.filter((s) =>
            (plan.selectedSubjectIds ?? []).includes(s.subjectId)
        );
    }, [datasource.subjects, plan.selectedSubjectIds]);

    // Filtered catalog courses
    const filteredCatalog = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return datasource.subjects;
        return datasource.subjects.filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                s.code.toLowerCase().includes(query)
        );
    }, [datasource.subjects, searchQuery]);

    const handleClassSelect = (subjectId: string, classId: string, isPreview: boolean) => {
        const isFrozen = (plan.frozenSubjectIds ?? []).includes(subjectId);
        if (isFrozen) {
            toast.error("Course is locked", {
                description: "Unlock it first to switch class section."
            });
            return;
        }

        if (isPreview) {
            setPreviewOverride(plan.id, subjectId, classId);
            toast.success("Section preview updated");
        } else {
            setSelectedClassForSubject(plan.id, subjectId, classId);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white/95 px-6 py-6 select-none overflow-hidden">
            {/* 1. Editorial Intro Paragraph (Inspired by nexvyn.dev) */}
            <p className="text-[13.5px] text-[#6e6e77] leading-relaxed mb-6 shrink-0">
                Drag any class on the canvas or click to explore{" "}
                <span className="text-[#141413] font-medium border-b-[1.5px] border-dashed border-amber-500 pb-[1px]">
                    conflict-free
                </span>{" "}
                alternatives.
            </p>

            {/* 2. Section Header & Mode Toggle */}
            <div className="flex items-baseline justify-between mb-1.5 shrink-0">
                <h3 className="font-doodle text-[19px] font-bold text-[#6e6e77] tracking-tight">
                    {activeTab === "selected" ? "selected courses" : "add courses"}
                </h3>

                <button
                    id="tour-add-course-btn"
                    onClick={() => onTabChange(activeTab === "selected" ? "catalog" : "selected")}
                    className="font-doodle text-[15px] font-bold text-[#6e6e77] hover:text-[#141413] transition-colors"
                >
                    {activeTab === "selected" ? "+ add course" : "← view selected"}
                </button>
            </div>

            {/* Subtle Active Source Context Header */}
            <div
                key={datasource.id}
                className="flex items-center gap-1.5 text-[12px] text-[#6e6e77] mb-3 px-0.5 shrink-0 animate-in fade-in duration-200"
            >
                <span className="font-medium text-[#141413] truncate max-w-[170px]" title={datasource.name}>
                    {datasource.name}
                </span>
                <span className="text-[#a1a1aa]">·</span>
                <span className="whitespace-nowrap">
                    {datasource.subjects.length} courses available
                </span>
            </div>

            {/* 3. Course List Rows (Clean Typography-First with Doodle Index Numbers) */}
            {activeTab === "selected" ? (
                <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1 custom-scrollbar">
                    {selectedSubjects.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                            <p className="text-[13px] text-[#6e6e77]">
                                No courses added yet.
                            </p>
                            <button
                                onClick={() => onTabChange("catalog")}
                                className="font-doodle text-[16px] font-bold text-[#141413] underline decoration-dashed decoration-amber-500 underline-offset-4"
                            >
                                Browse course catalog
                            </button>
                        </div>
                    ) : (
                        selectedSubjects.map((sub, idx) => {
                            const currentClassId = effectiveMapping[sub.subjectId];
                            const currentClass = sub.classes.find((c) => c.classId === currentClassId);
                            const isFrozen = (plan.frozenSubjectIds ?? []).includes(sub.subjectId);
                            const isConflicting = currentClass ? conflicts[currentClass.classId] : false;
                            const isExpanded = expandedSubjectId === sub.subjectId;
                            const indexNumber = (idx + 1).toString().padStart(2, "0");
                            const color = getSubjectColor(sub.subjectId, idx);

                            const meeting = currentClass?.meetings?.[0];

                            return (
                                <div key={sub.subjectId} className="group">
                                    <div
                                        onMouseEnter={() => onHoverSubject?.(sub.subjectId)}
                                        onMouseLeave={() => onHoverSubject?.(null)}
                                        className={cn(
                                            "flex items-center gap-3 p-2 -mx-2 rounded-xl cursor-pointer transition-all hover:bg-neutral-100/70",
                                            isExpanded && "bg-neutral-100/60"
                                        )}
                                        onClick={() => setExpandedSubjectId(isExpanded ? null : sub.subjectId)}
                                    >
                                        {/* Handwritten Doodle Index Number (01, 02, ...) */}
                                        <span className="font-doodle text-[18px] font-bold text-[#5b82a6] w-6 shrink-0 tabular-nums select-none leading-none">
                                            {indexNumber}
                                        </span>

                                        {/* Course Info */}
                                        <div className="flex-1 min-w-0">
                                            {/* Row 1: Name + SKS */}
                                            <div className="flex items-baseline justify-between gap-1.5">
                                                <h4 className="text-[13.5px] font-medium text-[#141413] truncate leading-tight">
                                                    {sub.name}
                                                </h4>
                                                <span className="font-doodle text-[15px] font-bold text-[#6e6e77] shrink-0 leading-none">
                                                    {sub.sks} sks
                                                </span>
                                            </div>

                                            {/* Row 2: Inline Section Badge + Day & Time + Actions */}
                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {currentClass ? (
                                                        <span className={cn("px-1.5 py-0.5 border rounded text-[10.5px] font-semibold shrink-0 leading-none", color.pillBg)}>
                                                            {currentClass.className}
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10.5px] font-medium text-amber-800 shrink-0 leading-none">
                                                            No Class
                                                        </span>
                                                    )}
                                                    <p className="text-[12px] text-[#6e6e77] truncate leading-tight">
                                                        {meeting
                                                            ? `${meeting.day}, ${meeting.start}–${meeting.end}`
                                                            : "No schedule set"}
                                                    </p>
                                                </div>

                                                {/* Hover Action Buttons */}
                                                <div
                                                    className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!currentClassId) return;
                                                            toggleFreezeSubject(plan.id, sub.subjectId);
                                                            toast.success(isFrozen ? "Class unlocked" : "Class locked");
                                                        }}
                                                        className={cn(
                                                            "p-1 rounded text-[#6e6e77] hover:text-[#141413] transition-colors",
                                                            isFrozen && "text-blue-600 opacity-100"
                                                        )}
                                                        title={isFrozen ? "Unlock class" : "Lock class"}
                                                    >
                                                        {isFrozen ? (
                                                            <Lock className="w-3.5 h-3.5 text-blue-600" />
                                                        ) : (
                                                            <Unlock className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            removeSubjectFromPlan(plan.id, sub.subjectId);
                                                            toast.info(`Removed ${sub.name}`);
                                                        }}
                                                        className="p-1 rounded text-[#6e6e77] hover:text-rose-600 transition-colors"
                                                        title="Remove course"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Switcher Accordion with Doodle Hint */}
                                    {isExpanded && (
                                        <div className="ml-9 pl-3 pr-1 py-1.5 space-y-1 border-l-2 border-[#e6e6e3] animate-in slide-in-from-top-1 duration-150">
                                            <div className="font-doodle text-[13.5px] font-bold text-[#5b82a6] -rotate-1 pb-0.5 select-none">
                                                click to swap class ↓
                                            </div>
                                            {sub.classes.map((cls) => {
                                                const isSelected = currentClassId === cls.classId;
                                                const m = cls.meetings?.[0];

                                                return (
                                                    <div
                                                        key={cls.classId}
                                                        onMouseEnter={() => onHoverClass?.(cls.classId)}
                                                        onMouseLeave={() => onHoverClass?.(null)}
                                                        onClick={() =>
                                                            handleClassSelect(
                                                                sub.subjectId,
                                                                cls.classId,
                                                                Boolean(plan.activeVariantIndex !== null && plan.activeVariantIndex !== undefined)
                                                            )
                                                        }
                                                        className={cn(
                                                            "px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-between",
                                                            isSelected
                                                                ? "bg-[#141413] text-white font-medium"
                                                                : "text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100/80"
                                                        )}
                                                    >
                                                        <div className="truncate">
                                                            <span className="font-semibold mr-1.5">
                                                                Kelas {cls.className}
                                                            </span>
                                                            {m && (
                                                                <span className={isSelected ? "text-neutral-300" : "text-[#a1a1aa]"}>
                                                                    {m.day} {m.start}–{m.end}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isSelected && <Check className="w-3.5 h-3.5 ml-2 shrink-0 stroke-[2.5]" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* Course Search & Catalog View */
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="relative mb-3">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search course title or code..."
                            className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-100/70 border border-[#e6e6e3] rounded-lg outline-none focus:border-[#141413] text-[#141413] placeholder:text-[#a1a1aa] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#141413]"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1 custom-scrollbar">
                        {filteredCatalog.map((sub) => {
                            const isSelected = (plan.selectedSubjectIds ?? []).includes(sub.subjectId);

                            return (
                                <div
                                    key={sub.subjectId}
                                    onMouseEnter={() => onHoverSubject?.(sub.subjectId)}
                                    onMouseLeave={() => onHoverSubject?.(null)}
                                    onClick={() => toggleSubjectInPlan(plan.id, sub.subjectId)}
                                    className={cn(
                                        "p-2 -mx-1.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2.5",
                                        isSelected
                                            ? "bg-neutral-100 text-[#141413]"
                                            : "hover:bg-neutral-100/60 text-[#141413]"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-1">
                                            <h4 className="text-[13px] font-medium truncate">
                                                {sub.name}
                                            </h4>
                                            <span className="font-doodle text-[15px] font-bold text-[#6e6e77] shrink-0 leading-none">
                                                {sub.sks} sks
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-[#6e6e77] truncate">
                                            <span className="font-mono">{sub.code}</span> · {sub.classes.length} classes
                                        </p>
                                    </div>

                                    <div
                                        className={cn(
                                            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                                            isSelected
                                                ? "bg-[#141413] border-[#141413] text-white"
                                                : "border-[#d4d4d0]"
                                        )}
                                    >
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
