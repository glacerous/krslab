"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ViewPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/");
    }, [router]);

    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Redirecting to Schedule Studio...
                </span>
            </div>
        </div>
    );
}
