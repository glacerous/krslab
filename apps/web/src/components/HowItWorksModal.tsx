"use client";

import { X, ArrowRight, Sparkles, Calendar, Lock, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenImport?: () => void;
}

export function HowItWorksModal({ isOpen, onClose, onOpenImport }: HowItWorksModalProps) {
    if (!isOpen) return null;

    const steps = [
        {
            num: "01",
            title: "Import your BIMA schedule",
            desc: "Copy the raw course table from bima.upnyk.ac.id (Menu Perkuliahan → Dosen → Jadwal Dosen) and paste it into KRSlab. Or use 'Try Sample Data' to test immediately without logging in.",
            icon: Calendar,
            highlight: "One-click copy & paste"
        },
        {
            num: "02",
            title: "Explore sections & lock favorites",
            desc: "Click or drag any course card on the timetable grid to reveal all available alternative sections as ghost drop zones. Click the lock (🔒) button to pin classes you want to keep unchanged.",
            icon: Lock,
            highlight: "Direct timetable manipulation"
        },
        {
            num: "03",
            title: "Set rules & hit Auto-Schedule",
            desc: "Define your study preferences (no classes before 9 AM, no Friday lectures, cluster classes together) under Rules. Then click Auto-Schedule or simply tap Space to generate conflict-free timetable options.",
            icon: SlidersHorizontal,
            highlight: "Spacebar to shuffle combinations"
        }
    ];

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Card */}
            <div
                className="relative w-full max-w-xl bg-white border border-[#e6e6e3] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-[#e6e6e3] flex items-start justify-between bg-[#fbfbfa]">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-doodle text-[16px] font-bold text-[#5b82a6] select-none">
                                ✦ guide & tips
                            </span>
                        </div>
                        <h2 className="text-[20px] font-semibold text-[#141413] tracking-tight">
                            How KRSlab works
                        </h2>
                        <p className="text-[13px] text-[#6e6e77] mt-0.5">
                            Three simple steps to build your ideal conflict-free college schedule.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#6e6e77] hover:text-[#141413] hover:bg-neutral-100 transition-colors"
                        title="Close guide"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body: 3 Steps */}
                <div className="p-6 space-y-5 bg-white">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.num} className="flex items-start gap-4 group">
                                <div className="font-doodle text-[24px] font-bold text-[#5b82a6] w-7 shrink-0 leading-none pt-0.5 select-none">
                                    {step.num}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[14.5px] font-semibold text-[#141413]">
                                            {step.title}
                                        </h3>
                                        <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-[#6e6e77] border border-[#e8e8e3]">
                                            {step.highlight}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-[#6e6e77] leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-[#e6e6e3] bg-[#fbfbfa] flex items-center justify-between gap-3">
                    {onOpenImport ? (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onOpenImport();
                            }}
                            className="text-[13px] font-medium text-[#5b82a6] hover:underline flex items-center gap-1"
                        >
                            <span>Open BIMA Import</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-tactile-dark px-4 py-1.5 rounded-lg text-[13px] font-medium text-white transition-all select-none"
                    >
                        Got it, let&apos;s schedule
                    </button>
                </div>
            </div>
        </div>
    );
}
