"use client";

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
            <main className="flex-1 overflow-hidden relative flex flex-col">
                {children}
            </main>
        </div>
    );
}
