"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
    height?: number;
}

export function BrandLogo({ className, height = 34 }: BrandLogoProps) {
    // Aspect ratio based on viewBox="0 0 140 50"
    const width = Math.round((height / 50) * 140);

    return (
        <svg
            width={width}
            height={height}
            viewBox="10 4 140 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("select-none shrink-0 text-[#141413] dark:text-[#F4F4F6]", className)}
            aria-label="KRSlab"
        >
            {/* Bold "KRS" */}
            <text
                x="14"
                y="38"
                fill="currentColor"
                style={{ fontFamily: "var(--font-sans), Inter, sans-serif" }}
                fontWeight="800"
                fontSize="27"
                letterSpacing="-1.3"
            >
                KRS
            </text>

            {/* Medium "lab" */}
            <text
                x="76"
                y="38"
                fill="currentColor"
                style={{ fontFamily: "var(--font-sans), Inter, sans-serif" }}
                fontWeight="500"
                fontSize="26"
                letterSpacing="-0.8"
            >
                lab
            </text>

            {/* Hand-drawn wavy dashed amber underline under KRS */}
            <path
                d="M15 45.5C23 44.2 31 46.4 40 45.1C48 44 56 46 65 44.8"
                stroke="#F59E0B"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4.5 3.5"
            />

            {/* Expressive 1.5-pass hand-drawn pen loop around "lab" with crossed tails */}
            <path
                d="M75 14C64 18 65 36 75 42C88 49 117 46 124 33C130 21 116 10 95 11C75 12 66 25 72 37C78 47 110 48 123 37C128 32 130 24 124 17"
                className="stroke-[#5B82A6] dark:stroke-[#7DD3FC]"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Hand-drawn 4-point doodle spark at top-right */}
            <path
                d="M137 8C137 12.5 137 12.5 141.5 12.5C137 12.5 137 12.5 137 17C137 12.5 137 12.5 132.5 12.5C137 12.5 137 12.5 137 8Z"
                stroke="#F59E0B"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
