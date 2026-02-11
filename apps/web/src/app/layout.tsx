import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
// @ts-ignore
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
    title: "KRSlab — Academic Schedule Optimizer",
    description: "A professional tool for optimizing your academic schedule.",
};

import { Monitor } from "lucide-react";

function MobileBlock() {
    return (
        <div className="md:hidden fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-48 h-48 bg-neutral-900/50 rounded-full flex items-center justify-center mb-12 animate-in zoom-in-95 duration-700">
                <Monitor className="w-20 h-20 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-6 max-w-[280px]">
                Use desktop for the best experience
            </h1>
            <p className="text-neutral-500 text-[15px] font-medium leading-relaxed max-w-[320px]">
                This site is not developed for mobile devices. Please open <span className="text-white font-bold">KRSlab</span> on a desktop or laptop for a better experience.
            </p>
        </div>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} bg-background text-foreground transition-colors duration-200 antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <MobileBlock />
                    <div className="hidden md:flex h-screen overflow-hidden">
                        <Sidebar />
                        <main className="flex-1 overflow-y-auto relative no-scrollbar">
                            {children}
                        </main>
                    </div>
                    <Toaster position="bottom-right" richColors closeButton visibleToasts={2} />
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    );
}
