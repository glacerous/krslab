"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    eyebrow?: string;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    eyebrow = "confirm",
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const cancelBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const raf = window.requestAnimationFrame(() => cancelBtnRef.current?.focus());
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
            }
        };
        window.addEventListener("keydown", onKeyDown, true);
        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener("keydown", onKeyDown, true);
        };
    }, [isOpen, onCancel]);

    if (!isOpen || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-[2px] animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-desc"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
            >
                <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <span className="font-doodle text-[16px] font-bold text-rose-600 dark:text-rose-400 block leading-none">
                                {eyebrow}
                            </span>
                            <h2
                                id="confirm-dialog-title"
                                className="text-[15.5px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight leading-snug"
                            >
                                {title}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            aria-label={cancelLabel}
                            className="p-1.5 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p
                        id="confirm-dialog-desc"
                        className="text-[13px] text-[#6e6e77] dark:text-[#a1a1aa] leading-relaxed"
                    >
                        {description}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            ref={cancelBtnRef}
                            type="button"
                            onClick={onCancel}
                            className="btn-tactile-light px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors inline-flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{confirmLabel}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
