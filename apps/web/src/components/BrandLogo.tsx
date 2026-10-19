"use client";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
    showWordmark?: boolean;
}

export function BrandLogo({ className, showWordmark = true }: BrandLogoProps) {
    return (
        <div className={cn("flex items-center gap-2.5 select-none shrink-0", className)}>
            {/* Clean interlocking blocks mark */}
            <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                {/* Back offset amber square */}
                <div className="absolute w-4 h-4 rounded-[4px] bg-amber-400 rotate-6 -bottom-0.5 -right-0.5 shadow-2xs" />
                {/* Front rounded square containing 3 thin horizontal schedule lines */}
                <div className="relative w-5 h-5 rounded-[5px] bg-[#141413] dark:bg-white text-white dark:text-[#141413] shadow-xs flex flex-col justify-center items-center gap-[2px] p-1">
                    <div className="w-full h-[1.5px] rounded-full bg-current opacity-90" />
                    <div className="w-3/4 h-[1.5px] rounded-full bg-current opacity-60 self-start" />
                    <div className="w-full h-[1.5px] rounded-full bg-current opacity-90" />
                </div>
            </div>

            {/* Clean single-font KRSlab wordmark */}
            {showWordmark && (
                <span className="font-semibold text-[15px] tracking-tight text-[#141413] dark:text-[#f4f4f6]">
                    KRSlab
                </span>
            )}
        </div>
    );
}
