import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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

import { AppLayout } from "@/components/AppLayout";

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
                    <AppLayout>
                        {children}
                    </AppLayout>
                    <Toaster position="bottom-right" richColors closeButton visibleToasts={2} />
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    );
}
