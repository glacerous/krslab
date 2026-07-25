"use client";

import { useAppStore } from "@/lib/store";
import { Plus, Calendar, Settings2, Trash2, FolderDot, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function HomePage() {
    const { plans, activePlanId, setActivePlanId, deletePlan, datasources } = useAppStore();
    const [mounted, setMounted] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsDismissed(localStorage.getItem("krs_onboard_ds_dismissed") === "1");
    }, []);

    const showPlanOnboarding = mounted && !isDismissed && plans.length === 0 && datasources.length > 0;

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        localStorage.setItem("krs_onboard_ds_dismissed", "1");
        setIsDismissed(true);
    };

    const handleSetActive = (id: string, name: string) => {
        setActivePlanId(id);
        toast.success("Schedule Activated", { description: `${name} is now the primary plan.` });
    };

    const handleDeletePlan = (e: React.MouseEvent, id: string, name: string) => {
        e.preventDefault();
        e.stopPropagation();
        deletePlan(id);
        toast.error("Plan Deleted", { description: `"${name}" removed from infrastructure.` });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Plans</h1>
                    <p className="text-sm text-muted-foreground font-medium">Manage and optimize your academic blueprints.</p>
                </div>

                <div className="relative">
                    <Link
                        href="/plan/create"
                        className={cn(
                            "flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-black text-[12px] uppercase tracking-wider shadow-sm transition-soft hover:bg-primary/90 active:scale-95 group",
                            showPlanOnboarding && "animate-glow"
                        )}
                    >
                        <Plus className="w-4 h-4 transition-soft group-hover:rotate-90" />
                        New Plan
                    </Link>

                    {showPlanOnboarding && (
                        <div className="absolute right-0 top-full mt-4 z-[100] animate-in slide-in-from-top-2 duration-300">
                            <div className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(132,204,22,0.4)] relative w-60 border border-white/20">
                                {/* Tooltip Arrow */}
                                <div className="absolute bottom-full right-10 border-8 border-transparent border-b-primary" />

                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 leading-none">Step 8</p>
                                        <p className="text-[11px] font-bold leading-relaxed">
                                            NOW CREATE YOUR FIRST PLAN
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDismiss}
                                        className="hover:bg-white/10 p-1 rounded-full transition-colors -mr-1 -mt-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <section className="space-y-6">
                {!mounted ? (
                    <div className="py-20 flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : plans.length === 0 ? (
                    <div className="py-20 bg-muted/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <FolderDot className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[13px] font-bold text-foreground">No plans detected</h4>
                            <p className="text-xs text-muted-foreground font-medium">Create your first plan to start scheduling.</p>
                        </div>
                        <Link
                            href="/plan/create"
                            className="text-primary font-bold text-[11px] uppercase tracking-widest hover:underline"
                        >
                            Initialize System
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {plans.map((p) => {
                            const isActive = activePlanId === p.id;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => handleSetActive(p.id, p.name)}
                                    className={cn(
                                        "group relative flex flex-col p-6 rounded-xl border transition-soft cursor-pointer bg-card realistic-shadow hover:translate-y-[-2px] hover:border-primary/30",
                                        isActive ? "border-primary/50 bg-primary/[0.02]" : "border-border"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center border transition-soft",
                                            isActive
                                                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                                : "bg-muted border-border text-muted-foreground/50"
                                        )}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <button
                                            onClick={(e) => handleDeletePlan(e, p.id, p.name)}
                                            className="p-1.5 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-md transition-soft md:opacity-0 md:group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-1 mb-6">
                                        <h4 className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-soft leading-snug">
                                            {p.name}
                                        </h4>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {p.selectedSubjectIds.length} Subjects
                                        </p>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-3">
                                        <Link
                                            href={`/plan/${p.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-soft border border-transparent"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Settings2 className="w-3.5 h-3.5" />
                                            Configure
                                        </Link>
                                    </div>

                                    {isActive && (
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-300">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Active</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Frequently Asked Questions */}
            <section className="space-y-8 pt-10 border-t border-border/50">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">Frequently Asked Questions</h2>
                    <p className="text-xs text-muted-foreground font-medium">Answers to common queries about KRSlab utility.</p>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    <details className="group bg-card border border-border/80 rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex justify-between items-center cursor-pointer select-none">
                            <h4 className="text-xs md:text-sm font-bold text-foreground">Is my data secure on KRSlab?</h4>
                            <span className="shrink-0 transition-transform duration-300 group-open:-rotate-180">
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </span>
                        </summary>
                        <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                            Absolutely. KRSlab relies on client-side state stored locally on your device via Zustand persist (localStorage). No academic data is sent to external databases or servers.
                        </p>
                    </details>

                    <details className="group bg-card border border-border/80 rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex justify-between items-center cursor-pointer select-none">
                            <h4 className="text-xs md:text-sm font-bold text-foreground">Can I use it for other universities?</h4>
                            <span className="shrink-0 transition-transform duration-300 group-open:-rotate-180">
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </span>
                        </summary>
                        <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                            Currently, the default parsing layout is optimized for UPN Veteran Yogyakarta&apos;s BIMA &apos;Jadwal Dosen&apos; text structure. However, if your portal uses a similar tabular layout, it may parse successfully. In future versions, we aim to support custom templates.
                        </p>
                    </details>

                    <details className="group bg-card border border-border/80 rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex justify-between items-center cursor-pointer select-none">
                            <h4 className="text-xs md:text-sm font-bold text-foreground">What does &apos;Freeze Subject&apos; mean?</h4>
                            <span className="shrink-0 transition-transform duration-300 group-open:-rotate-180">
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </span>
                        </summary>
                        <p className="mt-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
                            If you want to lock a specific class section (for example, with a preferred lecturer or group of friends), you can &apos;freeze&apos; it. The solver engine will maintain that choice and only optimize the rest of your courses.
                        </p>
                    </details>
                </div>
            </section>
        </div>
    );
}
