"use client";

import { useAppStore, Plan, Datasource } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { Bookmark, Trash2, Check, Eye, X, ChevronRight, Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { MiniGrid } from "./MiniGrid";

interface SavedVariantsProps {
    plan: Plan;
    datasource: Datasource;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SavedVariants({ plan, datasource, isOpen, onOpenChange }: SavedVariantsProps) {
    const { deleteSavedVariant, setActiveSavedVariant, applyActiveSavedVariantToPlan } = useAppStore();

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
            <button
                onClick={() => onOpenChange(true)}
                className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-soft border shadow-sm",
                    savedCount > 0
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted-foreground/10"
                )}
            >
                <Bookmark className={cn("w-3.5 h-3.5", savedCount > 0 ? "fill-amber-500" : "opacity-40")} />
                Saved {savedCount > 0 && `(${savedCount})`}
            </button>

            {/* SHEET OVERLAY & DRAWER */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[100] animate-in fade-in duration-300 pointer-events-none"
                >
                    <div className="absolute inset-0 bg-black/5 transition-opacity pointer-events-none" />

                    {/* DRAWER BODY */}
                    <div
                        className="absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 z-[110] pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-primary" />
                                <h3 className="font-black text-[13px] uppercase tracking-tight text-foreground">Saved Archive</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full uppercase">
                                    {savedCount} Slots Used
                                </span>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="p-1 hover:bg-muted rounded-md transition-soft"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                            {savedCount === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
                                    <Bookmark className="w-12 h-12 text-muted-foreground" />
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        No variants archived yet.<br /><span className="text-[10px] opacity-60">Save generated variants to see them here.</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {plan.savedVariants?.map((sv) => {
                                        const isActive = plan.activeSavedVariantId === sv.id;

                                        return (
                                            <div
                                                key={sv.id}
                                                className={cn(
                                                    "p-6 transition-all group relative",
                                                    isActive ? "bg-amber-500/5" : "hover:bg-muted/30"
                                                )}
                                            >
                                                {isActive && (
                                                    <div className="absolute inset-y-0 left-0 w-1 bg-amber-500 animate-in slide-in-from-left duration-300" />
                                                )}

                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                                                                {new Date(sv.createdAt).toLocaleDateString()} at {new Date(sv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                                                {Object.keys(sv.mapping).length} Subjects
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteSavedVariant(plan.id, sv.id)}
                                                        className="p-2 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-soft"
                                                        title="Delete Archive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Mini Grid Preview */}
                                                <div className="mb-6">
                                                    <MiniGrid mapping={sv.mapping} datasource={datasource} />
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setActiveSavedVariant(plan.id, isActive ? null : sv.id);
                                                            if (!isActive) onOpenChange(false); // Close on preview
                                                        }}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-soft border shadow-sm",
                                                            isActive
                                                                ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                                                                : "bg-muted text-foreground hover:bg-muted-foreground/10 border-border/50"
                                                        )}
                                                    >
                                                        {isActive ? <X className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        {isActive ? "Close Preview" : "Preview Archive"}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            applyActiveSavedVariantToPlan(plan.id);
                                                            onOpenChange(false);
                                                            setActiveSavedVariant(plan.id, null); // Clear preview after apply
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-soft active:scale-95 shadow-md"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Apply to Plan
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* BOTTOM CLOSE BUTTON FOR ACCESSIBILITY */}
                        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
                            <button
                                onClick={() => onOpenChange(false)}
                                className="w-full py-3 bg-muted hover:bg-muted-foreground/10 text-foreground border border-border/50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-soft"
                            >
                                Close Archive
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
