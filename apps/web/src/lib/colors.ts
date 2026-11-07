export interface CourseColor {
    id: string;
    name: string;
    hex: string;
    gradient: string;
    cardBg: string;
    footerBg: string;
    pillClass: string;
    dotClass: string;
    watermarkClass: string;
    // Backwards-compatible props
    pillBg: string;
    pillText: string;
    spine: string;
    bgTint: string;
}

export const COURSE_COLORS: CourseColor[] = [
    {
        id: "sky",
        name: "Sky",
        hex: "#0284c7",
        gradient: "from-[#0284c7] to-[#0369a1]",
        cardBg: "bg-[#f8fbff] border-[#cde0f5] border-b-[#b4d0f0]",
        footerBg: "bg-[#eef5ff] border-t-[#dce9fa]",
        pillClass: "bg-white border-[#c2daf5] text-[#1e40af]",
        dotClass: "bg-blue-500",
        watermarkClass: "text-blue-900/[0.035]",
        pillBg: "bg-sky-50 text-sky-700 border-sky-200/80",
        pillText: "text-sky-700",
        spine: "bg-[#0284c7]",
        bgTint: "bg-sky-50/20"
    },
    {
        id: "emerald",
        name: "Emerald",
        hex: "#059669",
        gradient: "from-[#059669] to-[#047857]",
        cardBg: "bg-[#f7fdf9] border-[#c6ebd3] border-b-[#aadfc0]",
        footerBg: "bg-[#ebf9f0] border-t-[#d5f0df]",
        pillClass: "bg-white border-[#bce6cc] text-[#065f46]",
        dotClass: "bg-emerald-500",
        watermarkClass: "text-emerald-900/[0.035]",
        pillBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        pillText: "text-emerald-700",
        spine: "bg-[#059669]",
        bgTint: "bg-emerald-50/20"
    },
    {
        id: "violet",
        name: "Violet",
        hex: "#7c3aed",
        gradient: "from-[#7c3aed] to-[#6d28d9]",
        cardBg: "bg-[#faf8ff] border-[#ddd4f7] border-b-[#c9baf2]",
        footerBg: "bg-[#f2eeff] border-t-[#e4dcfb]",
        pillClass: "bg-white border-[#d4c8f5] text-[#5b21b6]",
        dotClass: "bg-violet-500",
        watermarkClass: "text-violet-900/[0.035]",
        pillBg: "bg-violet-50 text-violet-700 border-violet-200/80",
        pillText: "text-violet-700",
        spine: "bg-[#7c3aed]",
        bgTint: "bg-violet-50/20"
    },
    {
        id: "amber",
        name: "Amber",
        hex: "#d97706",
        gradient: "from-[#d97706] to-[#b45309]",
        cardBg: "bg-[#fffdf7] border-[#f5dfa6] border-b-[#edd085]",
        footerBg: "bg-[#fef8e6] border-t-[#f7e8be]",
        pillClass: "bg-white border-[#f2d894] text-[#92400e]",
        dotClass: "bg-amber-500",
        watermarkClass: "text-amber-900/[0.035]",
        pillBg: "bg-amber-50 text-amber-800 border-amber-200/80",
        pillText: "text-amber-800",
        spine: "bg-[#d97706]",
        bgTint: "bg-amber-50/20"
    },
    {
        id: "rose",
        name: "Rose",
        hex: "#e11d48",
        gradient: "from-[#e11d48] to-[#be123c]",
        cardBg: "bg-[#fff8f9] border-[#f7ced5] border-b-[#f0b6c0]",
        footerBg: "bg-[#ffeff2] border-t-[#fadce1]",
        pillClass: "bg-white border-[#f5c4cd] text-[#9f1239]",
        dotClass: "bg-rose-500",
        watermarkClass: "text-rose-900/[0.035]",
        pillBg: "bg-rose-50 text-rose-700 border-rose-200/80",
        pillText: "text-rose-700",
        spine: "bg-[#e11d48]",
        bgTint: "bg-rose-50/20"
    },
    {
        id: "teal",
        name: "Teal",
        hex: "#0d9488",
        gradient: "from-[#0d9488] to-[#0f766e]",
        cardBg: "bg-[#f6fdfc] border-[#bfe8e4] border-b-[#a3ded8]",
        footerBg: "bg-[#eafaf8] border-t-[#d2f2ee]",
        pillClass: "bg-white border-[#b6e6e1] text-[#115e59]",
        dotClass: "bg-teal-500",
        watermarkClass: "text-teal-900/[0.035]",
        pillBg: "bg-teal-50 text-teal-700 border-teal-200/80",
        pillText: "text-teal-700",
        spine: "bg-[#0d9488]",
        bgTint: "bg-teal-50/20"
    }
];

export function getSubjectColor(subjectId: string, index?: number): CourseColor {
    if (typeof index === "number" && index >= 0) {
        return COURSE_COLORS[index % COURSE_COLORS.length];
    }
    let hash = 0;
    for (let i = 0; i < subjectId.length; i++) {
        hash = (hash << 5) - hash + subjectId.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % COURSE_COLORS.length;
    return COURSE_COLORS[idx];
}
