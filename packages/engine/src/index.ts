import { Schedule } from "krsplan-engine";
export { Schedule };

export interface MeetingRaw {
  day: string;
  start: string;
  end: string;
  room: string;
}

export interface ClassScheduleRaw {
  classId: string;
  className: string;
  meetings: MeetingRaw[];
  lecturers: string[];
}

export interface SubjectRaw {
  subjectId: string;
  code: string;
  name: string;
  sks: number;
  classes: ClassScheduleRaw[];
}

function normalizeTime(timeStr: string): string {
  if (!timeStr) return "00:00";
  const [hours, minutes] = timeStr.split(":").map(s => s.trim());
  return `${hours.padStart(2, '0')}:${(minutes || "00").padStart(2, '0')}`;
}

export function parseBimaMasterText(text: string): SubjectRaw[] {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  const subjectsMap: Record<string, SubjectRaw> = {};

  let currentClass: ClassScheduleRaw | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split("\t");

    // Check if it's a main record line (usually starts with study program or has many columns)
    if (columns.length >= 7) {
      const code = columns[1]?.trim();
      const name = columns[2]?.trim();
      const sks = parseInt(columns[3]) || 0;
      const className = columns[4]?.trim();
      const scheduleStr = columns[6]?.trim(); // "Senin 07:00-09:30"
      const room = columns[7]?.trim() || "";

      if (!code || !name) continue;

      const subjectId = `${code}-${name}`;
      if (!subjectsMap[subjectId]) {
        subjectsMap[subjectId] = {
          subjectId,
          code,
          name,
          sks,
          classes: [],
        };
      }

      const scheduleParts = scheduleStr.split(" ");
      const day = scheduleParts[0];
      const timeRange = scheduleParts[1] || "";
      const [startRaw, endRaw] = timeRange.split("-");

      const meeting: MeetingRaw = {
        day,
        start: normalizeTime(startRaw),
        end: normalizeTime(endRaw),
        room,
      };

      const classId = `${subjectId}-${className}`;
      let existingClass = subjectsMap[subjectId].classes.find(c => c.classId === classId);

      if (!existingClass) {
        existingClass = {
          classId,
          className,
          meetings: [meeting],
          lecturers: [],
        };
        subjectsMap[subjectId].classes.push(existingClass);
      } else {
        // Handle multiple meetings for the same class (sometimes listed on separate lines or we detect it)
        // For now, if we see the same classId, we add the meeting if it's different
        existingClass.meetings.push(meeting);
      }
      currentClass = existingClass;
    } else if (currentClass && columns.length === 1) {
      // It's likely a lecturer line
      const lecturer = columns[0].trim();
      if (lecturer && !currentClass.lecturers.includes(lecturer)) {
        currentClass.lecturers.push(lecturer);
      }
    }
  }

  return Object.values(subjectsMap);
}

export function checkMeetingConflict(m1: MeetingRaw, m2: MeetingRaw): boolean {
  try {
    const s1 = Schedule.buildFromString(`${m1.day} ${m1.start}-${m1.end}`);
    const s2 = Schedule.buildFromString(`${m2.day} ${m2.start}-${m2.end}`);
    return s1.isOverlap(s2);
  } catch (e) {
    console.warn("Invalid schedule format for overlap check:", m1, m2);
    return false;
  }
}

export function checkClassConflict(c1: ClassScheduleRaw, c2: ClassScheduleRaw): boolean {
  for (const m1 of c1.meetings) {
    for (const m2 of c2.meetings) {
      if (checkMeetingConflict(m1, m2)) return true;
    }
  }
  return false;
}
