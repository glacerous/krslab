"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-md z-40">
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="flex items-baseline gap-0.5 leading-none">
                            <span className="text-[18px] font-black tracking-tight text-foreground">
                                KRS
                            </span>
                            <span className="text-[15px] font-extrabold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
                                lab
                            </span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Open Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto relative no-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
