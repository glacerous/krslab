import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
// @ts-ignore
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
    title: {
        default: "KRSlab - UPNYK Academic Schedule Optimizer & KRS Planner",
        template: "%s | KRSlab"
    },
    description: "Optimize your university academic schedule (KRS) instantly. Auto-resolve class conflicts, manage schedule plans, and visualize your weekly classes. Supports BIMA UPNYK table imports.",
    keywords: [
        "KRS", "KRS UPNYK", "BIMA UPNYK", "KRSlab", "Kartu Rencana Studi", "academic schedule",
        "schedule optimizer", "class conflict resolver", "jadwal kuliah", "UPN Veteran Yogyakarta",
        "BIMA schedule planner", "university planner", "mahasiswa", "automatic schedule generator"
    ],
    authors: [{ name: "Azzaky Raihan", url: "https://github.com/glacerous" }],
    creator: "Azzaky Raihan",
    metadataBase: new URL("https://krslab.vercel.app"),
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://krslab.vercel.app",
        title: "KRSlab - UPNYK Academic Schedule Optimizer & KRS Planner",
        description: "Optimize your university academic schedule (KRS) instantly. Auto-resolve class conflicts, manage schedule plans, and visualize your weekly classes.",
        siteName: "KRSlab",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "KRSlab - Academic Schedule Optimizer",
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "KRSlab - UPNYK Academic Schedule Optimizer & KRS Planner",
        description: "Optimize your university academic schedule (KRS) instantly. Auto-resolve class conflicts, manage schedule plans, and visualize your weekly classes.",
        images: ["/og-image.png"],
        creator: "@glacerous",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
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
                {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
                    <Script
                        defer
                        src="https://cloud.umami.is/script.js"
                        data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
                    />
                )}
            </body>
        </html>
    );
}
