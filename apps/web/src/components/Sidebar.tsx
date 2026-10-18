"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    CalendarDays,
    Database,
    Sun,
    Moon,
    X,
    Github,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Info
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { activePlanId, plans, datasources, setIsDataModalOpen } = useAppStore();
    const activePlan = plans.find((p) => p.id === activePlanId);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isCreditsOpen, setIsCreditsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        setMounted(true);
        const savedCollapsed = localStorage.getItem("krslab_sidebar_collapsed");
        if (savedCollapsed !== null) {
            setIsCollapsed(savedCollapsed === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem("krslab_sidebar_collapsed", String(next));
    };

    // Close on navigation (mobile)
    useEffect(() => {
        if (onClose) onClose();
    }, [pathname, onClose]);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90] md:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 border-r border-border bg-card flex flex-col h-screen z-[100] transition-all duration-300 ease-in-out md:sticky md:translate-x-0 overflow-hidden shrink-0",
                    isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
                    isCollapsed ? "md:w-14" : "md:w-56"
                )}
            >
                {/* Brand & Collapse Header */}
                <div className="h-14 border-b border-border/60 flex items-center justify-between px-3 shrink-0">
                    <Link
                        href="/"
                        className="flex items-center gap-2 group hover:opacity-90 transition-opacity overflow-hidden"
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary shrink-0">
                            KRS
                        </div>
                        {(!isCollapsed || isOpen) && (
                            <span className="text-sm font-black tracking-tight text-foreground truncate">
                                KRS<span className="text-primary font-extrabold">lab</span>
                            </span>
                        )}
                    </Link>

                    {/* Mobile close button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    {/* Desktop collapse toggle */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden md:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
                    {/* Studio / Workspace Link */}
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors font-bold text-xs group relative",
                            pathname === "/" || pathname === "/view"
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        title="Schedule Studio"
                    >
                        <CalendarDays className="w-4 h-4 shrink-0 text-primary" />
                        {(!isCollapsed || isOpen) && <span className="truncate">Schedule Studio</span>}
                    </Link>

                    {/* BIMA Data Manager */}
                    <button
                        onClick={() => setIsDataModalOpen(true)}
                        className={cn(
                            "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 group text-left",
                            datasources.length === 0 && "text-primary bg-primary/5 animate-pulse"
                        )}
                        title="BIMA Schedule Data"
                    >
                        <Database className="w-4 h-4 shrink-0" />
                        {(!isCollapsed || isOpen) && (
                            <div className="flex-1 flex items-center justify-between min-w-0">
                                <span className="truncate">BIMA Data</span>
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                    {datasources.length}
                                </span>
                            </div>
                        )}
                    </button>
                </nav>

                {/* Footer Cluster */}
                <div className="p-2 border-t border-border/60 space-y-2 shrink-0">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs font-bold"
                        title="Toggle Dark / Light Theme"
                    >
                        {mounted && (theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />)}
                        {(!isCollapsed || isOpen) && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                    </button>

                    {/* Credits Button */}
                    <button
                        onClick={() => setIsCreditsOpen(true)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-xs font-bold"
                        title="Credits & Attribution"
                    >
                        <Info className="w-4 h-4 shrink-0 opacity-60" />
                        {(!isCollapsed || isOpen) && <span>Credits</span>}
                    </button>
                </div>

                {/* Credits Modal */}
                {isCreditsOpen && mounted && createPortal(
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsCreditsOpen(false)} />
                        <div className="relative bg-card border border-border/80 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                            <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-0.5">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">About KRSlab</h3>
                                        <p className="text-base font-black tracking-tight text-foreground">Credits & License</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreditsOpen(false)}
                                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center flex flex-col items-center">
                                        <h4 className="text-sm font-black text-foreground">KRSlab Studio</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Built by <span className="text-foreground font-bold">Azzaky Raihan</span>
                                        </p>
                                        <a
                                            href="https://github.com/glacerous"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-muted hover:bg-primary/10 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Github className="w-3.5 h-3.5" />
                                            @glacerous
                                        </a>
                                    </div>

                                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                                        <p className="text-xs font-bold text-foreground">
                                            Scheduling engine adapted from <span className="text-primary italic">KRSPlan Engine</span>
                                        </p>
                                        <a
                                            href="https://github.com/farhanisty/krsplan-engine"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                                        >
                                            Original author: @farhanisty
                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                        </a>
                                        <p className="text-[10px] text-muted-foreground/60">
                                            Adapted and extended for educational and experimental use.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsCreditsOpen(false)}
                                    className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </aside>
        </>
    );
}
