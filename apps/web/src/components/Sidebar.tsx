"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Database, Calendar, ClipboardList } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function Sidebar() {
    const pathname = usePathname();
    const activePlanId = useAppStore((state) => state.activePlanId);
    const plans = useAppStore((state) => state.plans);
    const activePlan = plans.find(p => p.id === activePlanId);

    const navItems = [
        { name: "Plans", href: "/", icon: LayoutDashboard },
        { name: "Datasource", href: "/datasource", icon: Database },
        { name: "View", href: "/view", icon: Calendar, disabled: !activePlanId },
    ];

    return (
        <aside className="w-64 border-r bg-white dark:bg-zinc-950 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                    KRS Plan
                </h1>
                {activePlan && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Active Plan</p>
                        <p className="text-sm font-semibold truncate">{activePlan.name}</p>
                        <Link href={`/plan/${activePlanId}`} className="text-[10px] text-blue-500 hover:underline block mt-1">
                            Modify Selection
                        </Link>
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                    if (item.disabled) {
                        return (
                            <div
                                key={item.name}
                                className="flex items-center gap-3 px-3 py-2 text-zinc-400 cursor-not-allowed grayscale opacity-50"
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium",
                                isActive
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t text-center">
                <p className="text-xs text-zinc-500">v0.2.0-beta</p>
            </div>
        </aside>
    );
}
