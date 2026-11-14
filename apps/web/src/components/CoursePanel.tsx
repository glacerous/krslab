"use client";

import { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Plan, Datasource, Subject } from "@/lib/store";
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
import { getTranslation, formatDay } from "@/lib/i18n";

interface CoursePanelProps {
    plan: Plan;
    datasource: Datasource;
    activeTab: "selected" | "catalog";
    onTabChange: (tab: "selected" | "catalog") => void;
    conflicts: Record<string, boolean>;
    effectiveMapping: Record<string, string>;
    selectedSubjectIdForDetail?: string | null;
    onSelectSubjectDetail?: (subjectId: string | null) => void;
    onSelectClass?: (subjectId: string, classId: string) => void;
    onHoverSubject?: (subjectId: string | null) => void;
    onHoverClass?: (classId: string | null) => void;
    onOpenImportModal?: () => void;
    onOpenStartVideo?: () => void;
}

type SidebarDragVisual = {
    subject: Subject;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    originWidth: number;
    originHeight: number;
    inGrid: boolean;
    hoveredGhostClassId: string | null;
    hoveredGhostWidth: number | null;
    hoveredGhostHeight: number | null;
    hoveredGhostLabel: string | null;
    hoveredGhostTime: string | null;
    settling: boolean;
};

export const CoursePanel = memo(function CoursePanel({
    plan,
    datasource,
    activeTab,
    onTabChange,
    conflicts,
    effectiveMapping,
    onSelectClass,
    onHoverSubject,
    onHoverClass,
    onOpenImportModal,
    onOpenStartVideo
}: CoursePanelProps) {
    const toggleSubjectInPlan = useAppStore((state) => state.toggleSubjectInPlan);
    const removeSubjectFromPlan = useAppStore((state) => state.removeSubjectFromPlan);
    const setSelectedClassForSubject = useAppStore((state) => state.setSelectedClassForSubject);
    const toggleFreezeSubject = useAppStore((state) => state.toggleFreezeSubject);
    const setPreviewOverride = useAppStore((state) => state.setPreviewOverride);
    const setIsCustomCourseModalOpen = useAppStore((state) => state.setIsCustomCourseModalOpen);
    const language = useAppStore((state) => state.language);

    const t = useMemo(() => getTranslation(language), [language]);
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
        } else if (onSelectClass) {
            onSelectClass(subjectId, classId);
        } else {
            setSelectedClassForSubject(plan.id, subjectId, classId);
        }
    };

    const [sidebarDrag, setSidebarDrag] = useState<SidebarDragVisual | null>(null);
    const floatingDragCardRef = useRef<HTMLDivElement | null>(null);
    const sidebarDragStateRef = useRef<{
        subject: Subject;
        pointerId: number;
        startX: number;
        startY: number;
        originRect: DOMRect;
        active: boolean;
        lastX: number;
        lastY: number;
        inGrid: boolean;
        hoveredGhostClassId: string | null;
    } | null>(null);
    const didSidebarDragRef = useRef(false);
    const dragRafRef = useRef<number | null>(null);
    const dragSettleTimeoutRef = useRef<number | null>(null);

    const cleanupSidebarDrag = useCallback(() => {
        if (dragRafRef.current !== null) {
            cancelAnimationFrame(dragRafRef.current);
            dragRafRef.current = null;
        }
        if (dragSettleTimeoutRef.current !== null) {
            window.clearTimeout(dragSettleTimeoutRef.current);
            dragSettleTimeoutRef.current = null;
        }
        if (sidebarDragStateRef.current?.active) {
            onHoverClass?.(null);
            onHoverSubject?.(null);
        }
        sidebarDragStateRef.current = null;
        setSidebarDrag(null);
    }, [onHoverClass, onHoverSubject]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && sidebarDragStateRef.current) {
                cleanupSidebarDrag();
            }
        };
        const handleWindowBlur = () => {
            if (sidebarDragStateRef.current) cleanupSidebarDrag();
        };
        const handleVisibilityChange = () => {
            if (document.hidden && sidebarDragStateRef.current) cleanupSidebarDrag();
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("blur", handleWindowBlur);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("blur", handleWindowBlur);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            cleanupSidebarDrag();
        };
    }, [cleanupSidebarDrag]);

    const handleCatalogPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, sub: Subject) => {
        if (e.button !== 0 || e.pointerType === "touch") return;
        const originRect = e.currentTarget.getBoundingClientRect();

        if (dragSettleTimeoutRef.current !== null) {
            window.clearTimeout(dragSettleTimeoutRef.current);
            dragSettleTimeoutRef.current = null;
        }

        sidebarDragStateRef.current = {
            subject: sub,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            originRect,
            active: false,
            lastX: e.clientX,
            lastY: e.clientY,
            inGrid: false,
            hoveredGhostClassId: null
        };
        didSidebarDragRef.current = false;

        const updateVisualFrame = () => {
            dragRafRef.current = null;
            const st = sidebarDragStateRef.current;
            if (!st || !st.active) return;

            const dx = st.lastX - st.startX;
            const dy = st.lastY - st.startY;
            if (floatingDragCardRef.current) {
                floatingDragCardRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${st.inGrid ? 1 : 1.03})`;
            }

            const gridElem = document.getElementById("krs-grid-capture");
            const gridRect = gridElem?.getBoundingClientRect();
            const nextInGrid = Boolean(
                gridRect &&
                st.lastX >= gridRect.left &&
                st.lastX <= gridRect.right &&
                st.lastY >= gridRect.top &&
                st.lastY <= gridRect.bottom
            );

            let nextGhostId: string | null = null;
            let nextGhostW: number | null = null;
            let nextGhostH: number | null = null;
            let nextGhostLabel: string | null = null;
            let nextGhostTime: string | null = null;

            if (nextInGrid) {
                const ghostNodes = document.querySelectorAll<HTMLElement>("[data-ghost-class-id]");
                for (let i = 0; i < ghostNodes.length; i++) {
                    const node = ghostNodes[i]!;
                    const r = node.getBoundingClientRect();
                    if (st.lastX >= r.left && st.lastX <= r.right && st.lastY >= r.top && st.lastY <= r.bottom) {
                        const cId = node.dataset.ghostClassId ?? null;
                        if (cId) {
                            nextGhostId = cId;
                            nextGhostW = r.width;
                            nextGhostH = r.height;
                            const cls = st.subject.classes.find((c) => c.classId === cId);
                            nextGhostLabel = cls?.className ?? null;
                            const firstMeeting = cls?.meetings?.[0];
                            nextGhostTime = firstMeeting ? `${firstMeeting.start}-${firstMeeting.end}` : null;
                        }
                        break;
                    }
                }
            }

            if (nextInGrid !== st.inGrid || nextGhostId !== st.hoveredGhostClassId) {
                st.inGrid = nextInGrid;
                st.hoveredGhostClassId = nextGhostId;
                onHoverClass?.(nextGhostId);
                setSidebarDrag((prev) =>
                    prev
                        ? {
                              ...prev,
                              inGrid: nextInGrid,
                              hoveredGhostClassId: nextGhostId,
                              hoveredGhostWidth: nextGhostW,
                              hoveredGhostHeight: nextGhostH,
                              hoveredGhostLabel: nextGhostLabel,
                              hoveredGhostTime: nextGhostTime
                          }
                        : null
                );
            }
        };

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const st = sidebarDragStateRef.current;
            if (!st || moveEvent.pointerId !== st.pointerId) return;

            st.lastX = moveEvent.clientX;
            st.lastY = moveEvent.clientY;

            if (!st.active) {
                const dist = Math.hypot(moveEvent.clientX - st.startX, moveEvent.clientY - st.startY);
                if (dist < 6) return;
                st.active = true;
                didSidebarDragRef.current = true;
                onHoverSubject?.(st.subject.subjectId);
                setSidebarDrag({
                    subject: st.subject,
                    startX: st.startX,
                    startY: st.startY,
                    originLeft: st.originRect.left,
                    originTop: st.originRect.top,
                    originWidth: st.originRect.width,
                    originHeight: st.originRect.height,
                    inGrid: false,
                    hoveredGhostClassId: null,
                    hoveredGhostWidth: null,
                    hoveredGhostHeight: null,
                    hoveredGhostLabel: null,
                    hoveredGhostTime: null,
                    settling: false
                });
            }

            if (dragRafRef.current === null) {
                dragRafRef.current = requestAnimationFrame(updateVisualFrame);
            }
        };

        const finishGesture = (endEvent: PointerEvent, cancelled: boolean) => {
            const st = sidebarDragStateRef.current;
            if (!st || endEvent.pointerId !== st.pointerId) return;

            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerCancel);

            if (dragRafRef.current !== null) {
                cancelAnimationFrame(dragRafRef.current);
                dragRafRef.current = null;
            }

            if (!st.active) {
                sidebarDragStateRef.current = null;
                return;
            }

            const droppedInGrid = !cancelled && st.inGrid;
            const droppedGhostClassId = !cancelled ? st.hoveredGhostClassId : null;
            const droppedSubjectId = st.subject.subjectId;
            const alreadySelected = (plan.selectedSubjectIds ?? []).includes(droppedSubjectId);

            if (droppedGhostClassId) {
                if (onSelectClass) {
                    onSelectClass(droppedSubjectId, droppedGhostClassId);
                } else {
                    setSelectedClassForSubject(plan.id, droppedSubjectId, droppedGhostClassId);
                }
            } else if (droppedInGrid && !alreadySelected) {
                toggleSubjectInPlan(plan.id, droppedSubjectId);
            }

            onHoverClass?.(null);
            onHoverSubject?.(null);

            const el = floatingDragCardRef.current;
            if (el) {
                setSidebarDrag((prev) => (prev ? { ...prev, settling: true } : null));
                if (droppedInGrid) {
                    el.style.transition = "transform 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease";
                    el.style.transform = `translate3d(${st.lastX - st.startX}px, ${st.lastY - st.startY}px, 0) scale(0.92)`;
                    el.style.opacity = "0";
                } else {
                    el.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease";
                    el.style.transform = "translate3d(0px, 0px, 0) scale(1)";
                    el.style.opacity = "0";
                }
                sidebarDragStateRef.current = null;
                dragSettleTimeoutRef.current = window.setTimeout(() => {
                    dragSettleTimeoutRef.current = null;
                    setSidebarDrag(null);
                }, 200);
            } else {
                sidebarDragStateRef.current = null;
                setSidebarDrag(null);
            }
        };

        const handlePointerUp = (upEvent: PointerEvent) => finishGesture(upEvent, false);
        const handlePointerCancel = (cancelEvent: PointerEvent) => finishGesture(cancelEvent, true);

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerCancel);
    }, [plan.id, plan.selectedSubjectIds, onSelectClass, setSelectedClassForSubject, toggleSubjectInPlan, onHoverClass, onHoverSubject]);

    return (
        <div className="w-full h-full flex flex-col bg-white/95 dark:bg-[#141418] px-6 py-6 select-none overflow-hidden">
            {/* 1. Editorial Intro Paragraph (Inspired by nexvyn.dev) */}
            <p className="text-[13.5px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed mb-6 shrink-0">
                {t.dragIntroPre}
                <span className="text-[#141413] dark:text-[#f4f4f6] font-medium border-b-[1.5px] border-dashed border-amber-500 pb-[1px]">
                    {t.dragIntroHighlight}
                </span>
                {t.dragIntroPost}
            </p>

            {/* 2. Section Header & Mode Toggle (Strictly 2 single-line items with whitespace-nowrap) */}
            <div className="flex items-baseline justify-between mb-3 shrink-0 gap-2">
                <h3 className="font-doodle text-[19px] font-bold text-[#6e6e77] dark:text-[#a1a1aa] tracking-tight whitespace-nowrap">
                    {activeTab === "selected" ? t.selectedCourses : t.addCourses}
                </h3>

                <div className="relative inline-block">
                    <button
                        id="tour-add-course-btn"
                        onClick={() => onTabChange(activeTab === "selected" ? "catalog" : "selected")}
                        className="font-doodle text-[15px] font-bold text-[#6e6e77] hover:text-[#141413] dark:text-[#a1a1aa] dark:hover:text-[#f4f4f6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                        {activeTab === "selected" ? t.addCourseBtn : t.viewSelected}
                    </button>
                    {activeTab === "selected" && selectedSubjects.length === 0 && datasource.subjects.length > 0 && (
                        <svg className="absolute -bottom-1 left-0 w-full h-[6px] pointer-events-none" viewBox="0 0 60 6" fill="none">
                            <path
                                d="M1 4.5C12 2 24 5.5 36 3.5C48 1.5 54 4 59 3"
                                stroke="#F59E0B"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeDasharray="60"
                                className="animate-pen-stroke"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {/* 3. Course List Rows (Clean Typography-First with Doodle Index Numbers) */}
            {activeTab === "selected" ? (
                <div className="flex-1 overflow-y-auto -mr-2 pr-2 pt-1 pb-4 space-y-1 custom-scrollbar">
                    {selectedSubjects.length === 0 ? (
                        datasource.subjects.length === 0 ? (
                            <EmptySourceChecklist
                                language={language}
                                onOpenCustomCourse={() => setIsCustomCourseModalOpen(true)}
                                onOpenImportModal={onOpenImportModal}
                                onOpenStartVideo={onOpenStartVideo}
                            />
                        ) : (
                            <div className="py-8 px-1">
                                <button
                                    type="button"
                                    onClick={() => onTabChange("catalog")}
                                    className="group flex items-baseline gap-2.5 text-left cursor-pointer transition-colors"
                                >
                                    <span className="font-doodle text-lg text-amber-500 font-bold shrink-0">
                                        01
                                    </span>
                                    <span className="font-doodle text-lg text-[#5b82a6] dark:text-[#7dd3fc] group-hover:underline underline-offset-4">
                                        {language === "id"
                                            ? `← buka tab "+ tambah matkul" (${datasource.subjects.length} tersedia)`
                                            : `← switch to "+ add courses" (${datasource.subjects.length} available)`}
                                    </span>
                                </button>
                            </div>
                        )
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
                                            "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-neutral-100/70 dark:hover:bg-white/[0.04]",
                                            isExpanded && "bg-neutral-100/60 dark:bg-white/[0.06]"
                                        )}
                                        onClick={() => setExpandedSubjectId(isExpanded ? null : sub.subjectId)}
                                    >
                                        {/* Handwritten Doodle Index Number (01, 02, ...) */}
                                        <span className="font-doodle text-[18px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] w-6 shrink-0 tabular-nums select-none leading-none">
                                            {indexNumber}
                                        </span>

                                        {/* Course Info */}
                                        <div className="flex-1 min-w-0">
                                            {/* Row 1: Name + SKS */}
                                            <div className="flex items-baseline justify-between gap-1.5">
                                                <h4 className="text-[13.5px] font-medium text-[#141413] dark:text-[#f4f4f6] truncate leading-tight">
                                                    {sub.name}
                                                </h4>
                                                <span className="font-doodle text-[15px] font-bold text-[#6e6e77] dark:text-[#a1a1aa] shrink-0 leading-none">
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
                                                        <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded text-[10.5px] font-medium text-amber-800 dark:text-amber-300 shrink-0 leading-none">
                                                            No Class
                                                        </span>
                                                    )}
                                                    <p className="text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] truncate leading-tight">
                                                        {meeting
                                                            ? `${formatDay(meeting.day, language)}, ${meeting.start}-${meeting.end}`
                                                            : (language === "id" ? "Jadwal belum disetel" : "No schedule set")}
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
                                                            "p-1 rounded text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-200/50 dark:hover:bg-white/[0.08] transition-colors",
                                                            isFrozen && "text-blue-600 dark:text-blue-400 opacity-100"
                                                        )}
                                                        title={isFrozen ? "Unlock class" : "Lock class"}
                                                        aria-label={isFrozen ? `Unlock section for ${sub.name}` : `Lock section for ${sub.name}`}
                                                    >
                                                        {isFrozen ? (
                                                            <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                                                        className="p-1 rounded text-[#6e6e77] dark:text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/50 dark:hover:bg-white/[0.08] transition-colors"
                                                        title="Remove course"
                                                        aria-label={`Remove ${sub.name} from plan`}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Switcher Accordion with Doodle Hint */}
                                    {isExpanded && (
                                        <div className="ml-9 pl-3 pr-1 py-1.5 space-y-1 border-l-2 border-[#e6e6e3] dark:border-[#27272a] animate-in slide-in-from-top-1 duration-150">
                                            <div className="font-doodle text-[13.5px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] -rotate-1 pb-0.5 select-none">
                                                {t.clickToSwap}
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
                                                                ? "bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] font-medium"
                                                                : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100/80 dark:hover:bg-white/[0.06]"
                                                        )}
                                                    >
                                                        <div className="truncate">
                                                            <span className="font-semibold mr-1.5">
                                                                Kelas {cls.className}
                                                            </span>
                                                            {m && (
                                                                <span className={isSelected ? "text-neutral-300 dark:text-neutral-700" : "text-[#a1a1aa] dark:text-[#71717a]"}>
                                                                    {formatDay(m.day, language)} {m.start}-{m.end}
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
                    {/* Active Source Context Header (Only in Catalog View) */}
                    <div
                        key={datasource.id}
                        className="flex items-center gap-1.5 text-[12px] text-[#6e6e77] dark:text-[#a1a1aa] mb-2 px-0.5 shrink-0 animate-in fade-in duration-200"
                    >
                        <span className="font-medium text-[#141413] dark:text-[#f4f4f6] truncate max-w-[170px]" title={datasource.name}>
                            {datasource.name}
                        </span>
                        <span className="text-[#a1a1aa] dark:text-[#71717a]">·</span>
                        <span className="whitespace-nowrap">
                            {datasource.subjects.length} {t.coursesAvailable}
                        </span>
                    </div>

                    {datasource.subjects.length === 0 ? (
                        <EmptySourceChecklist
                            language={language}
                            onOpenCustomCourse={() => setIsCustomCourseModalOpen(true)}
                            onOpenImportModal={onOpenImportModal}
                            onOpenStartVideo={onOpenStartVideo}
                        />
                    ) : (
                        <>
                            <div id="tour-catalog-search-area" className="relative mb-2">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] dark:text-[#71717a]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t.searchPlaceholder}
                                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-100/70 dark:bg-[#202023] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-lg outline-none focus:border-[#141413] dark:focus:border-[#f4f4f6] text-[#141413] dark:text-[#f4f4f6] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a1a1aa] dark:text-[#71717a] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                        aria-label="Clear search input"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Quick Custom Course Trigger Row */}
                            <button
                                type="button"
                                onClick={() => setIsCustomCourseModalOpen(true)}
                                className="w-full text-left text-[12.5px] font-medium text-[#5b82a6] dark:text-[#7dd3fc] hover:underline pt-1 pb-2 mb-1 px-0.5 border-b border-[#e6e6e3]/70 dark:border-[#26262e]/70 cursor-pointer select-none shrink-0"
                            >
                                {language === "id"
                                    ? "+ Tambah matkul manual"
                                    : "+ Add manual course"}
                            </button>


                            <div className="flex-1 overflow-y-auto -mr-2 pr-2 pt-1 pb-4 space-y-1 custom-scrollbar">
                                {filteredCatalog.length === 0 ? (
                                    <div className="py-10 text-center space-y-2">
                                        <p className="text-[13px] text-[#6e6e77] dark:text-[#a1a1aa]">
                                            {searchQuery
                                                ? (language === "id" ? `Tidak ada matkul "${searchQuery}"` : `No courses matching "${searchQuery}"`)
                                                : (language === "id" ? "Belum ada mata kuliah." : "No courses available.")}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setIsCustomCourseModalOpen(true)}
                                            className="font-doodle text-[15px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] underline decoration-dashed underline-offset-4"
                                        >
                                            {language === "id" ? "+ Buat matkul manual" : "+ Add as custom course"}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredCatalog.map((sub, idx) => {
                                            const isSelected = (plan.selectedSubjectIds ?? []).includes(sub.subjectId);
                                            const isThisRowDragging = sidebarDrag?.subject.subjectId === sub.subjectId && !sidebarDrag.settling;

                                            return (
                                                <div
                                                    key={sub.subjectId}
                                                    id={idx === 0 ? "tour-catalog-first-row" : idx === 1 ? "tour-catalog-second-row" : undefined}
                                                    onPointerDown={(e) => handleCatalogPointerDown(e, sub)}
                                                    onMouseEnter={() => {
                                                        if (!sidebarDragStateRef.current?.active) onHoverSubject?.(sub.subjectId);
                                                    }}
                                                    onMouseLeave={() => {
                                                        if (!sidebarDragStateRef.current?.active) onHoverSubject?.(null);
                                                    }}
                                                    onClick={() => {
                                                        if (didSidebarDragRef.current) {
                                                            didSidebarDragRef.current = false;
                                                            return;
                                                        }
                                                        toggleSubjectInPlan(plan.id, sub.subjectId);
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center justify-between gap-2.5",
                                                        isThisRowDragging && "opacity-40 scale-[0.98]",
                                                        isSelected
                                                            ? "bg-neutral-100/90 dark:bg-white/[0.08] border border-neutral-200/80 dark:border-white/[0.14] text-[#141413] dark:text-white"
                                                            : "bg-transparent hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] text-[#141413] dark:text-[#f4f4f6]"
                                                    )}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-baseline justify-between gap-1">
                                                            <h4 className="text-[13px] font-medium truncate">
                                                                {sub.name}
                                                            </h4>
                                                            <span className="font-doodle text-[15px] font-bold text-[#6e6e77] dark:text-[#9ca3af] shrink-0 leading-none">
                                                                {sub.sks} sks
                                                            </span>
                                                        </div>
                                                        <p className="text-[11.5px] text-[#6e6e77] dark:text-[#9ca3af] truncate">
                                                            <span className="font-mono">{sub.code}</span> · {sub.classes.length} classes
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={cn(
                                                            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                                                            isSelected
                                                                ? "bg-[#141413] dark:bg-[#f4f4f6] border-[#141413] dark:border-[#f4f4f6] text-white dark:text-[#141413]"
                                                                : "border-[#d4d4d0] dark:border-[#3f3f46]"
                                                        )}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
            {sidebarDrag && typeof document !== "undefined" && createPortal(
                (() => {
                    const targetWidth = sidebarDrag.inGrid
                        ? (sidebarDrag.hoveredGhostWidth
                            ? Math.min(Math.max(sidebarDrag.hoveredGhostWidth, 132), 220)
                            : 168)
                        : sidebarDrag.originWidth;
                    const targetHeight = sidebarDrag.inGrid
                        ? (sidebarDrag.hoveredGhostHeight
                            ? Math.min(Math.max(sidebarDrag.hoveredGhostHeight, 64), 144)
                            : 84)
                        : sidebarDrag.originHeight;

                    // Keep the morphed card centered under the cursor as it shrinks from wide row to timetable card
                    const grabOffsetX = sidebarDrag.startX - sidebarDrag.originLeft;
                    const grabOffsetY = sidebarDrag.startY - sidebarDrag.originTop;
                    const morphShiftX = sidebarDrag.inGrid ? grabOffsetX - targetWidth / 2 : 0;
                    const morphShiftY = sidebarDrag.inGrid ? grabOffsetY - targetHeight / 2 : 0;

                    return (
                        <div
                            ref={floatingDragCardRef}
                            style={{
                                position: "fixed",
                                left: `${sidebarDrag.originLeft}px`,
                                top: `${sidebarDrag.originTop}px`,
                                zIndex: 9999,
                                pointerEvents: "none",
                                transform: "translate3d(0px, 0px, 0) scale(1.03)",
                                willChange: "transform, opacity"
                            }}
                        >
                            <div
                                style={{
                                    width: `${targetWidth}px`,
                                    height: `${targetHeight}px`,
                                    marginLeft: `${morphShiftX}px`,
                                    marginTop: `${morphShiftY}px`,
                                    transition: "width 240ms cubic-bezier(0.22, 1, 0.36, 1), height 240ms cubic-bezier(0.22, 1, 0.36, 1), margin-left 240ms cubic-bezier(0.22, 1, 0.36, 1), margin-top 240ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease"
                                }}
                                className={cn(
                                    "relative rounded-xl overflow-hidden select-none shadow-2xl border bg-white dark:bg-[#202027] transition-colors duration-200",
                                    sidebarDrag.hoveredGhostClassId
                                        ? "border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/80 dark:ring-sky-400/80"
                                        : "border-[#dcdcd6] dark:border-[#343440] ring-2 ring-[#141413] dark:ring-[#f4f4f6]"
                                )}
                            >
                                {/* Sidebar Pill Layout */}
                                <div
                                    className={cn(
                                        "absolute inset-0 px-2.5 py-2 flex items-center justify-between gap-2.5 transition-opacity duration-150",
                                        sidebarDrag.inGrid ? "opacity-0" : "opacity-100"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-1">
                                            <h4 className="text-[13px] font-medium text-[#141413] dark:text-white truncate">
                                                {sidebarDrag.subject.name}
                                            </h4>
                                            <span className="font-doodle text-[15px] font-bold text-[#6e6e77] dark:text-[#9ca3af] shrink-0 leading-none">
                                                {sidebarDrag.subject.sks} sks
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-[#6e6e77] dark:text-[#9ca3af] truncate">
                                            <span className="font-mono">{sidebarDrag.subject.code}</span> · {sidebarDrag.subject.classes.length} classes
                                        </p>
                                    </div>
                                </div>

                                {/* Timetable Card Layout */}
                                <div
                                    className={cn(
                                        "absolute inset-0 p-2.5 flex flex-col justify-start transition-opacity duration-200",
                                        sidebarDrag.inGrid ? "opacity-100" : "opacity-0"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                                        <span className="px-1.5 py-0.5 rounded bg-[#f3f3f0] dark:bg-[#2e2e38] border border-[#e2e2de] dark:border-[#454554] text-[10.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] shrink-0 leading-none">
                                            {sidebarDrag.hoveredGhostLabel
                                                ? `Kelas ${sidebarDrag.hoveredGhostLabel}`
                                                : `${sidebarDrag.subject.sks} SKS`}
                                        </span>
                                        <span className="font-mono text-[10px] text-[#6e6e77] dark:text-[#a1a1aa] truncate tabular-nums">
                                            {sidebarDrag.hoveredGhostTime || (language === "id" ? "lepas di sini" : "drop on grid")}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-[12px] text-[#141413] dark:text-[#f4f4f6] mt-1 leading-tight line-clamp-2">
                                        {sidebarDrag.subject.name}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}
        </div>
    );
});

function EmptySourceChecklist({
    language,
    onOpenCustomCourse,
    onOpenImportModal,
    onOpenStartVideo
}: {
    language: string;
    onOpenCustomCourse: () => void;
    onOpenImportModal?: () => void;
    onOpenStartVideo?: () => void;
}) {
    const t = getTranslation(language === "id" ? "id" : "en");
    return (
        <div className="py-2 space-y-3">
            {/* Header whisper in Gaegu */}
            <span className="font-doodle text-base text-[#5b82a6] dark:text-[#7dd3fc] block px-0.5">
                {language === "id" ? "sumber kosong: cara mulai:" : "blank source: how to start:"}
            </span>

            <div className="border-t border-b border-zinc-200/70 dark:border-zinc-800/70">
                {/* Row 01 */}
                <div
                    onClick={onOpenCustomCourse}
                    className="group py-3 px-1 flex items-baseline justify-between cursor-pointer transition-colors hover:bg-neutral-50/50 dark:hover:bg-white/[0.02]"
                >
                    <div className="flex items-baseline gap-3">
                        <span className="font-doodle text-lg text-amber-500 font-bold shrink-0">
                            01
                        </span>
                        <div>
                            <div className="font-medium text-xs text-zinc-800 dark:text-zinc-200 group-hover:underline underline-offset-2">
                                {language === "id" ? "Buat mata kuliah kustom manual" : "Draft a custom course manually"}
                            </div>
                            <p className="font-doodle text-base text-zinc-400 dark:text-zinc-500 mt-0.5">
                                {language === "id"
                                    ? "tambah nama matkul, SKS & jam kelas →"
                                    : "add course name, SKS & class times →"}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0 ml-2">
                        →
                    </span>
                </div>

                {/* Row 02 */}
                <div
                    onClick={() => onOpenImportModal?.()}
                    className="group py-3 px-1 flex items-baseline justify-between cursor-pointer transition-colors hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] border-t border-zinc-200/70 dark:border-zinc-800/70"
                >
                    <div className="flex items-baseline gap-3">
                        <span className="font-doodle text-lg text-[#5b82a6] dark:text-[#7dd3fc] font-bold shrink-0">
                            02
                        </span>
                        <div>
                            <div className="font-medium text-xs text-zinc-800 dark:text-zinc-200 group-hover:underline underline-offset-2">
                                {language === "id" ? "Tempel tabel dari SIAKAD / BIMA" : "Paste table from SIAKAD / BIMA"}
                            </div>
                            <p className="font-doodle text-base text-zinc-400 dark:text-zinc-500 mt-0.5">
                                {language === "id"
                                    ? "auto-parse baris dari portal kampusmu ↵"
                                    : "auto-parse rows from your campus portal ↵"}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0 ml-2">
                        ↵
                    </span>
                </div>
            </div>

            {onOpenStartVideo && (
                <button
                    type="button"
                    onClick={onOpenStartVideo}
                    className="min-h-[44px] sm:min-h-0 px-1 py-1 text-[12px] font-medium text-[#5b82a6] dark:text-[#7dd3fc] hover:underline underline-offset-4 transition-colors text-left"
                >
                    {t.seeHowToStart}
                </button>
            )}
        </div>
    );
}
