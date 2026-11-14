import { cache } from "react";
import type { Metadata } from "next";
import { ViewClient } from "@/app/view/ViewClient";
import { getShareRecord } from "@/lib/redis";
import type { SharePayload } from "@/lib/share";

const loadSharePayload = cache(async (id: string): Promise<SharePayload | null> => {
    if (!id || !/^[A-Za-z0-9_-]{4,32}$/.test(id)) return null;
    const raw = await getShareRecord(id);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== 1 || (parsed.t !== "plan" && parsed.t !== "workspace")) {
            return null;
        }
        return parsed as SharePayload;
    } catch {
        return null;
    }
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const payload = await loadSharePayload(params.id);

    if (!payload) {
        return {
            title: "Jadwal KRS | KRSlab",
            description: "Lihat jadwal kuliah mingguan atau salin ke ruang kerjamu di KRSlab.",
            openGraph: {
                title: "Jadwal KRS | KRSlab",
                description: "Lihat jadwal kuliah mingguan atau salin ke ruang kerjamu di KRSlab.",
                type: "website",
                siteName: "KRSlab",
                images: [{ url: "/share-og.png", width: 1200, height: 630, alt: "KRSlab" }]
            },
            twitter: {
                card: "summary_large_image",
                title: "Jadwal KRS | KRSlab",
                description: "Lihat jadwal kuliah mingguan atau salin ke ruang kerjamu di KRSlab.",
                images: ["/share-og.png"]
            }
        };
    }

    if (payload.t === "workspace") {
        const title = `Transfer Ruang Kerja (${payload.plans.length} Plan) | KRSlab`;
        const description = `Buka untuk menyalin ruang kerja KRS (${payload.datasources.length} sumber data, ${payload.plans.length} rencana jadwal) ke perangkat ini.`;
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: "website",
                siteName: "KRSlab",
                images: [{ url: "/share-og.png", width: 1200, height: 630, alt: title }]
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: ["/share-og.png"]
            }
        };
    }

    const totalSks = payload.subjects.reduce((sum, s) => sum + (s.sks || 0), 0);
    const title = `${payload.name} (${totalSks} SKS) | KRSlab`;
    const description = `${payload.subjects.length} mata kuliah · Lihat jadwal lengkap atau salin ke ruang kerjamu di KRSlab.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            siteName: "KRSlab",
            images: [{ url: "/share-og.png", width: 1200, height: 630, alt: title }]
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/share-og.png"]
        }
    };
}

export default async function ShortSharePage({ params }: { params: { id: string } }) {
    const payload = await loadSharePayload(params.id);
    return <ViewClient initialPayload={payload} />;
}
