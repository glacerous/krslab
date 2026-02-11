"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Clipboard, GraduationCap, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Step {
    title: string;
    description: string;
    image?: string;
    cta?: string;
    ctaUrl?: string;
}

const STEPS: Step[] = [
    {
        title: "Initial Sync",
        description: "Let's build your academic infrastructure. First, we need your schedule data from BIMA.",
    },
    {
        title: "Login to BIMA",
        description: "Open your BIMA dashboard in a new tab and log in with your credentials.",
        cta: "Go to BIMA",
        ctaUrl: "https://bima.upnyk.ac.id/login",
    },
    {
        title: "Open Jadwal Dosen",
        description: "On the left sidebar, navigate to 'Menu Perkuliahan' -> 'Dosen' -> 'Jadwal Dosen'.",
    },
    {
        title: "Copy Everything",
        description: "Highlight the entire table (from the first row to the last row) and copy it (Ctrl+C).",
        image: "/bima_reference.png",
    },
    {
        title: "Paste into Raw Data",
        description: "Go back to KRSLAB and paste the content into the large 'Raw Data' box.",
    },
    {
        title: "Click Sync / Extract",
        description: "Click the 'Sync' button to extract subjects from the raw text.",
    },
    {
        title: "Name & Deploy",
        description: "Give your datasource a name (e.g. 'Semester 1') and click 'Deploy'.",
    },
    {
        title: "Create First Plan",
        description: "Great! Your source is ready. Now, go to the Dashboard to create your first scheduling plan.",
        cta: "Start Planning",
    }
];

interface OnboardingTutorialProps {
    currentStep: number;
    onStepChange: (step: number) => void;
    onDismiss: () => void;
    onComplete: () => void;
}

export function OnboardingTutorial({ currentStep, onStepChange, onDismiss, onComplete }: OnboardingTutorialProps) {
    const step = STEPS[currentStep] || STEPS[0];
    const isFirst = currentStep === 0;
    const isLast = currentStep === STEPS.length - 1;

    return (
        <div className="bg-card border border-primary/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-w-[calc(100vw-2rem)] md:max-w-md w-full relative z-[60]">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 h-1 bg-muted w-full">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                />
            </div>

            <div className="p-5 md:p-6 pt-7 md:pt-8 space-y-5 md:space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0">
                                {currentStep + 1}
                            </span>
                            <h3 className="text-[13px] md:text-sm font-black uppercase tracking-widest text-foreground">
                                {step.title}
                            </h3>
                        </div>
                        <p className="text-[11px] md:text-[12px] text-muted-foreground font-medium leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground/40 hover:text-foreground shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {step.image && (
                    <div className="hidden sm:block rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video relative group">
                        <Image
                            src={step.image}
                            alt="BIMA Reference"
                            fill
                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] font-black text-foreground uppercase tracking-widest bg-card/80 px-3 py-1.5 rounded-full border border-border shadow-sm">
                                Reference Layout
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 md:gap-4 pt-1 md:pt-2">
                    <div className="flex gap-1.5 md:gap-2">
                        <button
                            disabled={isFirst}
                            onClick={() => onStepChange(currentStep - 1)}
                            className="p-2 md:p-2.5 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-20 transition-soft shrink-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={isLast}
                            onClick={() => onStepChange(currentStep + 1)}
                            className="p-2 md:p-2.5 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-20 transition-soft shrink-0"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {isLast ? (
                        <button
                            onClick={onComplete}
                            className="flex-1 bg-primary text-primary-foreground py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-soft flex items-center justify-center gap-2"
                        >
                            Start Planning <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : step.cta ? (
                        <a
                            href={step.ctaUrl || "#"}
                            target={step.ctaUrl ? "_blank" : undefined}
                            rel={step.ctaUrl ? "noopener noreferrer" : undefined}
                            onClick={(e) => {
                                if (!step.ctaUrl) {
                                    e.preventDefault();
                                    onStepChange(currentStep + 1);
                                }
                            }}
                            className="flex-1 bg-primary text-primary-foreground py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-soft flex items-center justify-center gap-2"
                        >
                            {step.cta} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    ) : (
                        <button
                            onClick={() => onStepChange(currentStep + 1)}
                            className="flex-1 bg-muted text-foreground py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-[11px] uppercase tracking-widest hover:bg-muted-foreground/10 transition-soft"
                        >
                            Next Step
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
