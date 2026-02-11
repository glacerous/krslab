"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Database, CalendarDays, Zap, ShieldCheck, Sun, Moon, X, Github, ExternalLink, Cpu } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const activePlanId = useAppStore((state) => state.activePlanId);
    const plans = useAppStore((state) => state.plans);
    const datasources = useAppStore((state) => state.datasources);
    const _hasHydrated = useAppStore((state) => state._hasHydrated);
    const activePlan = plans.find(p => p.id === activePlanId);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isDismissed, setIsDismissed] = useState(true); // Default to true until checked
    const [isCreditsOpen, setIsCreditsOpen] = useState(false);

    const showOnboarding = mounted && _hasHydrated && !isDismissed && datasources.length === 0;

    // Initial check and auto-nav
    useEffect(() => {
        setMounted(true);
        const dismissed = localStorage.getItem("krs_onboard_ds_dismissed") === "1";
        setIsDismissed(dismissed);

        if (_hasHydrated && !dismissed && datasources.length === 0 && window.location.pathname !== "/datasource") {
            router.push("/datasource");
        }
    }, [datasources.length, router, _hasHydrated]);

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.setItem("krs_onboard_ds_dismissed", "1");
        setIsDismissed(true);
    };

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Datasources", href: "/datasource", icon: Database },
        { name: "Master Schedule", href: "/view", icon: CalendarDays, disabled: !activePlanId },
    ];

    return (
        <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0 z-50 overflow-hidden transition-colors">
            <div className="p-6 border-b border-border/50">
                <Link href="/" className="flex items-center gap-2.5 group hover:opacity-90 transition-soft">

                    <span className="flex items-baseline gap-1 leading-none">
                        <span className="text-[22px] font-black tracking-tight text-foreground">
                            KRS
                        </span>
                        <span className="text-[18px] font-extrabold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
                            lab
                        </span>
                    </span>
                </Link>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1">
                <div className="mb-4 px-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Navigation</p>
                </div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                    if (item.disabled) {
                        return (
                            <div
                                key={item.name}
                                className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground/30 cursor-not-allowed select-none transition-soft"
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-[13px] font-medium">{item.name}</span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-soft font-medium text-[13px] relative group",
                                isActive
                                    ? "text-primary bg-primary/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                item.name === "Datasources" && showOnboarding && "bg-primary/5 animate-glow border-primary/50"
                            )}
                        >
                            <Icon className={cn("w-4 h-4 transition-soft", isActive ? "text-primary" : "group-hover:text-foreground")} />
                            {item.name}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                            )}

                            {item.name === "Datasources" && showOnboarding && (
                                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-[100] animate-in slide-in-from-left-2 duration-300">
                                    <div className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl shadow-[0_0_40px_rgba(132,204,22,0.4)] relative w-60 border border-white/20">
                                        {/* Tooltip Arrow */}
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-primary" />

                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 leading-none">Phase 1</p>
                                                <p className="text-[11px] font-bold leading-relaxed">
                                                    CREATE DATASOURCE FIRST
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
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 space-y-4">
                {activePlan && (
                    <div className="p-4 bg-muted/50 border border-border/50 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider italic">Active Plan</p>
                        </div>
                        <p className="text-[13px] font-bold text-foreground truncate">{activePlan.name}</p>
                        <Link
                            href={`/plan/${activePlanId}`}
                            className="bg-primary text-primary-foreground text-[11px] font-black py-2 rounded-lg flex items-center justify-center gap-1 transition-soft hover:bg-primary/90 active:scale-95 shadow-sm"
                        >
                            MODIFY
                        </Link>
                    </div>
                )}

                <div className="flex items-center justify-between px-2 pt-2 border-t border-border/50">
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-soft active:scale-95"
                        aria-label="Toggle Theme"
                    >
                        {mounted && (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
                    </button>
                    <div className="flex items-center gap-1.5 text-muted-foreground/40">
                        <button
                            onClick={() => setIsCreditsOpen(true)}
                            className="text-[9px] font-bold uppercase tracking-widest hover:text-foreground/50 transition-colors mr-2"
                        >
                            Credits
                        </button>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">V1.0</span>
                    </div>
                </div>
            </div>

            {/* Credits Modal */}
            {isCreditsOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-md" onClick={() => setIsCreditsOpen(false)} />
                    <div className="relative bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-500 realistic-shadow">
                        {/* Header Gradient */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Infrastructure</h3>
                                    <p className="text-lg font-black tracking-tight text-foreground">Credits</p>
                                </div>
                                <button
                                    onClick={() => setIsCreditsOpen(false)}
                                    className="p-2 hover:bg-muted rounded-full transition-soft text-muted-foreground/30 hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* App Ownership - Floating Style */}
                                <div className="px-5 py-6 rounded-2xl bg-muted/20 border border-border/10 transition-soft hover:bg-primary/[0.03] hover:border-primary/10 text-center flex flex-col items-center">
                                    <h4 className="text-[16px] font-black text-foreground tracking-tight mb-1">KRSlab</h4>
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[13px] font-medium text-muted-foreground/80">built by <span className="text-foreground font-bold">Azzaky Raihan</span></p>
                                        <a
                                            href="https://github.com/glacerous"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/10 text-[10px] font-bold text-muted-foreground hover:text-primary transition-soft group/az"
                                        >
                                            <Github className="w-3 h-3 opacity-30 group-hover/az:opacity-100 transition-opacity" />
                                            @glacerous
                                        </a>
                                    </div>
                                </div>

                                {/* Engine Credit - Integrated Look */}
                                <div className="p-5 rounded-2xl bg-muted/5 border border-border/5 transition-soft hover:bg-muted/10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center shrink-0">
                                                <Github className="w-4 h-4 text-foreground/40" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/30">Adapted Engine</p>
                                        </div>

                                        <div className="space-y-2.5 pl-1">
                                            <p className="text-[13px] font-bold text-foreground leading-snug">
                                                Scheduling engine adapted from <span className="text-primary italic">KRSPlan Engine</span>
                                            </p>

                                            <div className="space-y-2">
                                                <a
                                                    href="https://github.com/farhanisty/krsplan-engine"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-primary/10 text-[11px] font-bold text-muted-foreground hover:text-primary transition-soft group/link"
                                                >
                                                    Original author: @farhanisty
                                                    <ExternalLink className="w-3 h-3 opacity-30 group-hover/link:opacity-100 transition-opacity" />
                                                </a>
                                                <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider pl-1">
                                                    No license was specified in the original repository.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Content */}
                            <div className="pt-2 flex flex-col items-center">
                                <div className="px-4 py-2 rounded-full bg-muted/10 border border-border/5 mb-4">
                                    <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] text-center italic">
                                        Adapted and extended for educational/experimental use.
                                    </p>
                                </div>
                                <div className="w-12 h-0.5 bg-primary/10 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </aside>
    );
}
