import type { Metadata } from "next";
import { ChangelogView } from "@/components/onboarding/ChangelogView";

export const metadata: Metadata = {
    title: "Changelog",
    description: "Release notes and updates for KRSlab — UPNYK Academic Schedule Optimizer & KRS Planner.",
};

export default function ChangelogPage() {
    return <ChangelogView />;
}
