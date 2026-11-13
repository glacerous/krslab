import type { ClassSchedule, Datasource, Plan, Subject } from "./store";
import type { Language } from "./i18n";

export interface ScheduledCourseItem {
    subject: Subject;
    classSchedule: ClassSchedule;
}

const DAY_INDEX: Record<string, number> = {
    monday: 1,
    senin: 1,
    tuesday: 2,
    selasa: 2,
    wednesday: 3,
    rabu: 3,
    thursday: 4,
    kamis: 4,
    friday: 5,
    jumat: 5,
    "jum'at": 5,
    saturday: 6,
    sabtu: 6,
    sunday: 0,
    minggu: 0,
};

const DAY_RRULE: Record<number, string> = {
    0: "SU",
    1: "MO",
    2: "TU",
    3: "WE",
    4: "TH",
    5: "FR",
    6: "SA",
};

const DAY_LABEL_ID: Record<number, string> = {
    0: "Minggu",
    1: "Senin",
    2: "Selasa",
    3: "Rabu",
    4: "Kamis",
    5: "Jumat",
    6: "Sabtu",
};

export function getScheduledItems(
    datasource: Datasource | null | undefined,
    plan: Plan | null | undefined,
    previewMapping?: Record<string, string> | null
): ScheduledCourseItem[] {
    if (!datasource || !plan) return [];
    const subjectMap = new Map(datasource.subjects.map((s) => [s.subjectId, s]));
    const items: ScheduledCourseItem[] = [];

    for (const subId of plan.selectedSubjectIds ?? []) {
        const subject = subjectMap.get(subId);
        if (!subject) continue;
        const classId = previewMapping?.[subId] ?? plan.selectedClassBySubjectId?.[subId];
        if (!classId) continue;
        const classSchedule = subject.classes.find((c) => c.classId === classId);
        if (!classSchedule) continue;
        items.push({ subject, classSchedule });
    }
    return items;
}

function formatDayName(day: string, lang: Language): string {
    if (lang !== "id") return day;
    const idx = DAY_INDEX[day.trim().toLowerCase()];
    return idx !== undefined ? DAY_LABEL_ID[idx] : day;
}

export function buildKrsChecklistText(params: {
    planName: string;
    items: ScheduledCourseItem[];
    lang: Language;
}): string {
    const { planName, items, lang } = params;
    const totalSks = items.reduce((sum, item) => sum + item.subject.sks, 0);
    const header =
        lang === "id"
            ? `KRSlab: ${planName} (${items.length} matkul, ${totalSks} SKS)`
            : `KRSlab: ${planName} (${items.length} courses, ${totalSks} SKS)`;

    const lines = items.map(({ subject, classSchedule }, i) => {
        const slots = classSchedule.meetings
            .map((m) => {
                const room = m.room ? ` @ ${m.room}` : "";
                return `${formatDayName(m.day, lang)} ${m.start}-${m.end}${room}`;
            })
            .join(", ");
        const codePrefix = subject.code ? `[${subject.code}] ` : "";
        return `${i + 1}. ${codePrefix}${subject.name} (${classSchedule.className}, ${subject.sks} SKS)\n   ${slots}`;
    });

    return [header, "", ...lines].join("\n");
}

function escapeIcsText(value: string): string {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

function nextWeekdayDate(fromDate: Date, targetDow: number): Date {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const diff = (targetDow - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    return d;
}

function formatIcsDateTime(date: Date, hhmm: string): string {
    const [hh = "07", mm = "00"] = hhmm.split(":");
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(Number(hh))}${pad2(Number(mm))}00`;
}

export function buildScheduleIcs(params: {
    planName: string;
    items: ScheduledCourseItem[];
    baseDate?: Date;
}): string {
    const { planName, items, baseDate = new Date() } = params;
    const stamp = `${baseDate.getUTCFullYear()}${pad2(baseDate.getUTCMonth() + 1)}${pad2(baseDate.getUTCDate())}T${pad2(baseDate.getUTCHours())}${pad2(baseDate.getUTCMinutes())}${pad2(baseDate.getUTCSeconds())}Z`;

    const events: string[] = [];
    for (const { subject, classSchedule } of items) {
        const lecturers = classSchedule.lecturers?.filter(Boolean).join(", ");
        const descParts = [
            `Class: ${classSchedule.className}`,
            `SKS: ${subject.sks}`,
            subject.code ? `Code: ${subject.code}` : "",
            lecturers ? `Lecturer: ${lecturers}` : "",
        ].filter(Boolean);

        classSchedule.meetings.forEach((meeting, mIdx) => {
            const dow = DAY_INDEX[meeting.day.trim().toLowerCase()];
            if (dow === undefined) return;
            const firstDate = nextWeekdayDate(baseDate, dow);
            const dtStart = formatIcsDateTime(firstDate, meeting.start);
            const dtEnd = formatIcsDateTime(firstDate, meeting.end);
            const uid = `${subject.subjectId}-${classSchedule.classId}-${mIdx}@krslab`;

            events.push(
                [
                    "BEGIN:VEVENT",
                    `UID:${escapeIcsText(uid)}`,
                    `DTSTAMP:${stamp}`,
                    `DTSTART:${dtStart}`,
                    `DTEND:${dtEnd}`,
                    `RRULE:FREQ=WEEKLY;COUNT=16;BYDAY=${DAY_RRULE[dow]}`,
                    `SUMMARY:${escapeIcsText(`${subject.name} (${classSchedule.className})`)}`,
                    meeting.room ? `LOCATION:${escapeIcsText(meeting.room)}` : "",
                    `DESCRIPTION:${escapeIcsText(descParts.join("\n"))}`,
                    "END:VEVENT",
                ]
                    .filter(Boolean)
                    .join("\r\n")
            );
        });
    }

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//KRSlab//Schedule Export//EN",
        "CALSCALE:GREGORIAN",
        `X-WR-CALNAME:${escapeIcsText(`KRSlab - ${planName}`)}`,
        ...events,
        "END:VCALENDAR",
        "",
    ].join("\r\n");
}
