import type { Metadata } from "next";
import { ViewClient } from "./ViewClient";

type ViewPageProps = {
    searchParams?: {
        n?: string;
        sks?: string;
        c?: string;
        mode?: string;
        p?: string;
        ds?: string;
    };
};

export function generateMetadata({ searchParams }: ViewPageProps): Metadata {
    const mode = searchParams?.mode;
    const planName = searchParams?.n?.trim();
    const sks = searchParams?.sks?.trim();
    const courseCount = searchParams?.c?.trim();
    const planCount = searchParams?.p?.trim();
    const dsCount = searchParams?.ds?.trim();

    if (mode === "workspace") {
        const title = planCount
            ? `Transfer Ruang Kerja (${planCount} Plan) — KRSlab`
            : "Transfer Ruang Kerja — KRSlab";
        const description = dsCount && planCount
            ? `Buka untuk menyalin ruang kerja KRS (${dsCount} sumber data, ${planCount} rencana jadwal) ke perangkat ini.`
            : "Buka tautan ini untuk menyalin ruang kerja KRS ke perangkat kamu.";
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: "website",
                siteName: "KRSlab",
                images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }]
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: ["/og-image.png"]
            }
        };
    }

    const title = planName
        ? (sks ? `${planName} (${sks} SKS) — KRSlab` : `${planName} — KRSlab`)
        : "Jadwal KRS — KRSlab";

    const description = courseCount
        ? `${courseCount} mata kuliah · Lihat jadwal lengkap atau salin ke ruang kerjamu di KRSlab.`
        : "Lihat jadwal kuliah mingguan atau salin ke ruang kerjamu di KRSlab.";

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            siteName: "KRSlab",
            images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }]
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/og-image.png"]
        }
    };
}

export default function ViewPage() {
    return <ViewClient />;
}
