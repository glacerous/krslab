"use client";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
    size?: "sm" | "md";
    showWordmark?: boolean;
}

export function BrandLogo({ className, size = "md", showWordmark = true }: BrandLogoProps) {
    const isSm = size === "sm";

    return (
        <div className={cn("flex items-center gap-2.5 select-none shrink-0", className)}>
            {/* Custom 3-block asymmetric timetable/calendar SVG icon in tactile squircle */}
            <div
                className={cn(
                    "rounded-[8px] bg-[#141413] dark:bg-[#f4f4f6] text-white dark:text-[#141413] shadow-sm flex items-center justify-center shrink-0 transition-transform hover:scale-[1.03]",
                    isSm ? "w-6 h-6 rounded-[7px]" : "w-7 h-7 rounded-[8px]"
                )}
                aria-hidden="true"
            >
                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(isSm ? "w-3.5 h-3.5" : "w-4 h-4")}
                >
                    {/* Left column - top schedule block */}
                    <rect x="3.5" y="3.5" width="5.5" height="7" rx="1.5" fill="currentColor" fillOpacity="0.9" />
                    {/* Left column - bottom schedule block */}
                    <rect x="3.5" y="12" width="5.5" height="4.5" rx="1.5" fill="currentColor" fillOpacity="0.45" />
                    {/* Right column - middle schedule block accented in warm amber */}
                    <rect x="11" y="5.5" width="5.5" height="9" rx="1.5" fill="#f59e0b" />
                </svg>
            </div>

            {/* Expressive Wordmark: KRS + doodle lab with amber dashed underline */}
            {showWordmark && (
                <div className="flex items-baseline">
                    <span className="font-sans font-semibold text-[15px] tracking-tight text-[#141413] dark:text-[#f4f4f6]">
                        KRS
                    </span>
                    <span className="font-doodle font-bold text-[20px] text-[#5b82a6] dark:text-[#7dd3fc] -ml-0.5 border-b-[1.5px] border-dashed border-amber-500 leading-none">
                        lab
                    </span>
                </div>
            )}
        </div>
    );
}
