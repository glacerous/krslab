"use client";

import { useAppStore, Plan, Datasource } from "@/lib/store";
import { useEffect } from "react";
import { Bookmark, Trash2, Check, Eye, X, Clock, Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { MiniGrid } from "./MiniGrid";

interface SavedVariantsProps {
    plan: Plan;
    datasource: Datasource;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    hideTrigger?: boolean;
}

export function SavedVariants({ plan, datasource, isOpen, onOpenChange, hideTrigger = false }: SavedVariantsProps) {
    const { deleteSavedVariant, setActiveSavedVariant, applyActiveSavedVariantToPlan, saveActiveVariant } = useAppStore();

    const savedCount = plan.savedVariants?.length ?? 0;

    // Handle ESC to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onOpenChange]);

    return (
        <>
            {!hideTrigger && (
                <button
                    onClick={() => onOpenChange(true)}
                    className="btn-tactile-light flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[13px] font-medium text-[#141413]"
                >
                    <Bookmark className="w-3.5 h-3.5 text-[#6e6e77]" />
                    <span>Saved</span>
                    {savedCount > 0 && (
                        <span className="font-mono text-[10.5px] text-[#6e6e77]">({savedCount})</span>
                    )}
                </button>
            )}

            {/* SHEET OVERLAY & DRAWER */}
            {isOpen && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[120] animate-in fade-in duration-200">
                    {/* Clickable Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/15 backdrop-blur-[1px] transition-opacity cursor-pointer"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* DRAWER BODY */}
                    <div
                        className="absolute top-0 right-0 h-full w-[410px] max-w-[90vw] bg-white border-l border-[#e6e6e3] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-[125]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 px-6 border-b border-[#e6e6e3] bg-[#fbfbfa] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <Bookmark className="w-4 h-4 text-[#141413]" />
                                <h3 className="font-semibold text-[16px] text-[#141413] tracking-tight">
                                    Saved combinations
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-mono text-[#6e6e77] bg-neutral-100 px-2 py-0.5 rounded-full border border-[#e8e8e3]">
                                    {savedCount} saved
                                </span>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="p-1.5 hover:bg-neutral-100 rounded-lg text-[#6e6e77] hover:text-[#141413] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Save Current Schedule Action */}
                        <div className="p-4 px-6 border-b border-[#f0f0ed] bg-white shrink-0">
                            <button
                                onClick={() => {
                                    saveActiveVariant(plan.id);
                                    toast.success("Schedule saved to archive");
                                }}
                                className="w-full btn-tactile-dark py-2 px-3 rounded-xl text-[13px] font-medium text-white flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Save current schedule</span>
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            {savedCount === 0 ? (
                                <div className="py-12 px-4 flex flex-col items-center justify-center border border-dashed border-[#e6e6e3] rounded-2xl text-center bg-[#fafaf9]/70 space-y-2">
                                    <Bookmark className="w-8 h-8 text-[#a1a1aa] stroke-[1.5]" />
                                    <p className="font-doodle text-[17px] font-bold text-[#6e6e77] leading-snug">
                                        no saved combinations yet
                                    </p>
                                    <p className="text-[12px] text-[#a1a1aa] max-w-[220px]">
                                        Click &quot;+ Save&quot; in the top bar to archive your favorite combinations.
                                    </p>
                                </div>
                            ) : (
                                plan.savedVariants?.map((sv, idx) => {
                                    const isActive = plan.activeSavedVariantId === sv.id;

                                    return (
                                        <div
                                            key={sv.id}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all bg-white shadow-2xs space-y-3",
                                                isActive
                                                    ? "border-[#141413] ring-1 ring-[#141413]"
                                                    : "border-[#e6e6e3] hover:border-[#141413]/30"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-doodle text-[16px] font-bold text-[#5b82a6]">
                                                            saved {(idx + 1).toString().padStart(2, "0")}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-[#a1a1aa]">
                                                            {new Date(sv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11.5px] text-[#6e6e77]">
                                                        {Object.keys(sv.mapping).length} courses selected
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => deleteSavedVariant(plan.id, sv.id)}
                                                    className="p-1.5 text-[#a1a1aa] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete saved combination"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Mini Grid Preview */}
                                            <div className="rounded-lg overflow-hidden border border-[#e6e6e3] bg-[#fcfcfb] p-2">
                                                <MiniGrid mapping={sv.mapping} datasource={datasource} />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setActiveSavedVariant(plan.id, isActive ? null : sv.id);
                                                        if (!isActive) onOpenChange(false);
                                                    }}
                                                    className="flex-1 btn-tactile-light py-1.5 rounded-lg text-[12px] font-medium text-[#141413] flex items-center justify-center gap-1.5"
                                                >
                                                    <Eye className="w-3 h-3 text-[#6e6e77]" />
                                                    <span>{isActive ? "Close Preview" : "Preview"}</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        applyActiveSavedVariantToPlan(plan.id, sv.id);
                                                        onOpenChange(false);
                                                        setActiveSavedVariant(plan.id, null);
                                                    }}
                                                    className="flex-1 btn-tactile-dark py-1.5 rounded-lg text-[12px] font-medium text-white flex items-center justify-center gap-1.5 select-none"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    <span>Apply Plan</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 px-6 border-t border-[#e6e6e3] bg-[#fbfbfa] shrink-0">
                            <button
                                onClick={() => onOpenChange(false)}
                                className="w-full btn-tactile-light py-2 rounded-xl text-[12.5px] font-medium text-[#6e6e77] hover:text-[#141413] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
