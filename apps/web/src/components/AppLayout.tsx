"use client";

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-3.5 focus:py-2 focus:bg-[#141413] focus:text-[#f4f4f6] dark:focus:bg-[#f4f4f6] dark:focus:text-[#141413] focus:rounded-md focus:shadow-lg focus:text-xs focus:font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#141413] dark:focus:ring-[#f4f4f6] transition-transform"
            >
                Skip to main content
            </a>
            <main id="main-content" tabIndex={-1} className="flex-1 overflow-hidden relative flex flex-col outline-none">
                {children}
            </main>
        </div>
    );
}
