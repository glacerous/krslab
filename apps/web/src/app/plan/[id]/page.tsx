"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function PlanDetailRedirect() {
    const router = useRouter();
    const params = useParams();
    const setActivePlanId = useAppStore((state) => state.setActivePlanId);

    useEffect(() => {
        if (params?.id && typeof params.id === "string") {
            setActivePlanId(params.id);
        }
        router.replace("/");
    }, [params, setActivePlanId, router]);

    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Loading Plan in Studio...
                </span>
            </div>
        </div>
    );
}
