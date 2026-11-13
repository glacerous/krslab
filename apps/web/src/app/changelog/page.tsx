import type { Metadata } from "next";
import { ChangelogView } from "@/components/onboarding/ChangelogView";

export const metadata: Metadata = {
    title: "Changelog",
    description: "Release notes and updates for KRSlab: UPNYK Academic Schedule Optimizer & KRS Planner.",
    openGraph: {
        title: "KRSlab Changelog",
        description: "Release notes and updates for KRSlab.",
        images: ["/changelog/milestone-632.jpg"],
    },
    twitter: {
        card: "summary_large_image",
        title: "KRSlab Changelog",
        description: "Release notes and updates for KRSlab.",
        images: ["/changelog/milestone-632.jpg"],
    },
};

export default function ChangelogPage() {
    return <ChangelogView />;
}
