import { MeetingRaw, ClassScheduleRaw, SubjectRaw } from "./base-types";

export type { MeetingRaw, ClassScheduleRaw, SubjectRaw };

export const DAY_NORMALIZATION_MAP: Record<string, string> = {
  // Indonesian full & abbreviations
  senin: "Senin", sen: "Senin",
  selasa: "Selasa", sel: "Selasa",
  rabu: "Rabu", rab: "Rabu",
  kamis: "Kamis", kam: "Kamis",
  jumat: "Jumat", jum: "Jumat", "jum'at": "Jumat",
  sabtu: "Sabtu", sab: "Sabtu",
  minggu: "Minggu", min: "Minggu", ahad: "Minggu",
  // English full & abbreviations
  monday: "Senin", mon: "Senin",
  tuesday: "Selasa", tue: "Selasa", tues: "Selasa",
  wednesday: "Rabu", wed: "Rabu",
  thursday: "Kamis", thu: "Kamis", thur: "Kamis", thurs: "Kamis",
  friday: "Jumat", fri: "Jumat",
  saturday: "Sabtu", sat: "Sabtu",
  sunday: "Minggu", sun: "Minggu",
};

export function normalizeDay(dayRaw: string): string | null {
  if (!dayRaw) return null;
  const clean = dayRaw.trim().toLowerCase().replace(/[^a-z']/g, "");
  return DAY_NORMALIZATION_MAP[clean] || null;
}

export function normalizeTime(timeStr: string): string {
  if (!timeStr) return "00:00";
  // Replace dot with colon if it's HH.MM
  const clean = timeStr.trim().replace(/^(\d{1,2})\.(\d{2})$/, "$1:$2");
  const parts = clean.split(":");
  if (parts.length === 1) return `${parts[0].padStart(2, "0")}:00`;
  const hours = parts[0].trim();
  const minutes = parts[1].trim();
  return `${hours.padStart(2, "0")}:${(minutes || "00").padStart(2, "0")}`;
}

export function parseAndNormalizeTimeRange(timeStr: string): { start: string; end: string } | null {
  if (!timeStr) return null;
  // Clean timezone markers like WIB, WITA, WIT, UTC, GMT
  let cleaned = timeStr.replace(/\b(wib|wita|wit|utc|gmt)\b/gi, "").trim();
  // Normalize range separators "s/d", "s.d.", "sd", "to", "sampai" to "-"
  cleaned = cleaned.replace(/\s+(s\/d|s\.d\.|sd|to|sampai)\s+/gi, "-");
  // Normalize dot notation e.g. "07.30 - 10.00" -> "07:30 - 10:00"
  cleaned = cleaned.replace(/(\d{1,2})\.(\d{2})/g, "$1:$2");
  // Remove spaces around hyphens
  cleaned = cleaned.replace(/\s*-\s*/g, "-");

  const match = cleaned.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (match) {
    return {
      start: normalizeTime(match[1]),
      end: normalizeTime(match[2]),
    };
  }
  return null;
}

export function parseDayAndTime(scheduleStr: string): { day: string; start: string; end: string } | null {
  if (!scheduleStr) return null;
  // Look for day token in the string
  // Examples: "Senin 07:00-09:30", "Senin, 07.30 - 10.00 WIB", "Wednesday 08:00 to 10:30", "Rab 07:30-10:00"
  const tokens = scheduleStr.trim().split(/[\s,]+/);
  for (let i = 0; i < tokens.length; i++) {
    const normDay = normalizeDay(tokens[i]);
    if (normDay) {
      // Look for time range in the remainder
      const rest = scheduleStr.substring(scheduleStr.indexOf(tokens[i]) + tokens[i].length);
      const time = parseAndNormalizeTimeRange(rest);
      if (time) {
        return { day: normDay, start: time.start, end: time.end };
      }
    }
  }
  return null;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  return result;
}

export function splitRowColumns(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((s) => s.trim()).filter(Boolean);
  }
  if (line.includes("|")) {
    const cols = line.split("|").map((s) => s.trim()).filter(Boolean);
    if (cols.length >= 3) return cols;
  }
  if (line.includes(";")) {
    const cols = line.split(";").map((s) => s.trim()).filter(Boolean);
    if (cols.length >= 3) return cols;
  }
  if (line.includes(",")) {
    const cols = splitCsvLine(line).filter(Boolean);
    if (cols.length >= 4) return cols;
  }
  const multiSpace = line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
  if (multiSpace.length >= 3) {
    return multiSpace;
  }
  return line.split(/\s+/).map((s) => s.trim()).filter(Boolean);
}

export function isHeaderRow(cols: string[]): boolean {
  if (cols.length === 0) return true;
  if (cols.every((c) => /^[-:|]+$/.test(c))) return true;

  // A row containing a time range is a DATA row, never a header row!
  for (const col of cols) {
    if (parseAndNormalizeTimeRange(col) || parseDayAndTime(col)) {
      return false;
    }
  }

  const headerKeywords = [
    "kode", "code", "matakuliah", "mata kuliah", "course", "subject",
    "sks", "credit", "credits", "kelas", "kls", "class", "section", "sec",
    "hari", "day", "waktu", "time", "jam", "jadwal", "schedule",
    "ruang", "room", "dosen", "lecturer", "pengajar", "kapasitas", "capacity",
    "no", "nomor",
  ];
  let matches = 0;
  for (const col of cols) {
    const lower = col.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    if (headerKeywords.includes(lower)) {
      matches++;
    }
  }
  return matches >= 2;
}

interface ColumnMapping {
  codeCol?: number;
  nameCol?: number;
  sksCol?: number;
  classCol?: number;
  dayCol?: number;
  timeCol?: number;
  scheduleCol?: number;
  roomCol?: number;
  lecturerCol?: number;
  capacityCol?: number;
}

function detectColumnMapping(cols: string[]): ColumnMapping | null {
  const map: ColumnMapping = {};
  let foundKeyColumns = 0;

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (/^(kode|code|kd|kodemk|kodedasar)$/.test(col)) {
      map.codeCol = i;
      foundKeyColumns++;
    } else if (/^(matakuliah|matakul|mk|course|nama|namamk|subject)$/.test(col)) {
      map.nameCol = i;
      foundKeyColumns++;
    } else if (/^(sks|credit|credits|bobot)$/.test(col)) {
      map.sksCol = i;
      foundKeyColumns++;
    } else if (/^(kelas|kls|class|section|sec|group|paralel)$/.test(col)) {
      map.classCol = i;
      foundKeyColumns++;
    } else if (/^(hari|day)$/.test(col)) {
      map.dayCol = i;
      foundKeyColumns++;
    } else if (/^(waktu|time|jam|pukul)$/.test(col)) {
      map.timeCol = i;
      foundKeyColumns++;
    } else if (/^(jadwal|schedule|haridanwaktu|hariwaktu)$/.test(col)) {
      map.scheduleCol = i;
      foundKeyColumns++;
    } else if (/^(ruang|ruangan|room|gedung)$/.test(col)) {
      map.roomCol = i;
    } else if (/^(dosen|pengajar|lecturer|instructor)$/.test(col)) {
      map.lecturerCol = i;
    } else if (/^(kapasitas|capacity|kuota|peserta)$/.test(col)) {
      map.capacityCol = i;
    }
  }

  if (
    (map.scheduleCol !== undefined || (map.dayCol !== undefined && map.timeCol !== undefined)) &&
    (map.nameCol !== undefined || map.codeCol !== undefined)
  ) {
    return map;
  }
  return null;
}

export interface BimaParseResult {
  subjects: SubjectRaw[];
  debug: {
    formatA: number;
    formatB: number;
    universalHeuristic: number;
    unknown: number;
    lecturerLines: number;
  };
}

export function parseBimaMasterText(text: string): SubjectRaw[] {
  const result = parseBimaMasterWithDebug(text);
  return result.subjects;
}

export const parseUniversalScheduleText = parseBimaMasterText;
export const parseUniversalScheduleWithDebug = parseBimaMasterWithDebug;

export function parseBimaMasterWithDebug(text: string): BimaParseResult {
  const rawLines = text.split("\n").filter((l) => l.trim().length > 0);
  const subjectsMap: Record<string, SubjectRaw> = {};
  const debug = {
    formatA: 0,
    formatB: 0,
    universalHeuristic: 0,
    unknown: 0,
    lecturerLines: 0,
  };

  let currentClass: ClassScheduleRaw | null = null;
  let activeColumnMapping: ColumnMapping | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    let columns: string[];
    const tabOrMulti = line.split(/\t|\s{2,}/).map((s) => s.trim()).filter(Boolean);
    if (line.includes("\t") || line.includes("|") || line.includes(";") || (line.includes(",") && splitCsvLine(line).length >= 4)) {
      columns = splitRowColumns(line);
    } else if (tabOrMulti.length >= 7) {
      columns = tabOrMulti;
    } else {
      // Check Strategy 2: single-space collapsed BIMA lines
      const parts = line.split(/\s+/);
      const classPattern = /^[A-Z0-9]+-[A-Z0-9]+$/;
      let classIndex = -1;
      for (let j = 2; j < parts.length; j++) {
        if (classPattern.test(parts[j])) {
          classIndex = j;
          break;
        }
      }

      if (classIndex !== -1 && parts.length >= classIndex + 3) {
        const possibleSks = parts[classIndex + 1];
        const possibleCapacity = parts[classIndex + 2];

        if (/^\d+$/.test(possibleSks) && /^\d+$/.test(possibleCapacity)) {
          columns = [
            parts.slice(0, 1).join(" "), // PRODI
            parts[1], // CODE
            parts.slice(2, classIndex).join(" "), // NAME
            parts[classIndex], // CLASS
            possibleSks, // SKS
            possibleCapacity, // CAPACITY
            parts.slice(classIndex + 3, classIndex + 5).join(" "), // DAY TIME
            parts.slice(classIndex + 5).join(" "), // ROOM
          ];
        } else {
          columns = splitRowColumns(line);
        }
      } else {
        columns = splitRowColumns(line);
      }
    }

    // Check if this row is a table header row
    if (isHeaderRow(columns)) {
      const detectedMap = detectColumnMapping(columns);
      if (detectedMap) {
        activeColumnMapping = detectedMap;
      }
      continue;
    }

    let code = "";
    let name = "";
    let sks = 0;
    let className = "";
    let capacity: number | undefined = undefined;
    let scheduleObj: { day: string; start: string; end: string } | null = null;
    let room = "";
    let lecturerFromRow: string | null = null;

    // 1. Check strict BIMA Format A & B first (100% backward compatible)
    if (columns.length >= 7) {
      const col3IsSks = /^\d+$/.test(columns[3]?.trim() || "");
      const col4IsSks = /^\d+$/.test(columns[4]?.trim() || "");
      const looksLikeClass = (str: string) => /^[A-Z0-9-]+$/i.test(str?.trim() || "");

      if (col3IsSks && looksLikeClass(columns[4])) {
        // Format A: [0]PRODI [1]CODE [2]NAME [3]SKS [4]CLASS [5]CAPACITY [6]DAY TIME [7]ROOM
        debug.formatA++;
        code = columns[1]?.trim();
        name = columns[2]?.trim();
        sks = parseInt(columns[3]) || 0;
        className = columns[4]?.trim();
        capacity = parseInt(columns[5]) || undefined;

        // Check if day & time are together in column 6, or separate in col 6 & 7
        const parsedSched = parseDayAndTime(columns[6]);
        if (parsedSched) {
          scheduleObj = parsedSched;
          room = columns[7]?.trim() || "";
        } else if (normalizeDay(columns[6]) && parseAndNormalizeTimeRange(columns[7])) {
          scheduleObj = {
            day: normalizeDay(columns[6])!,
            ...parseAndNormalizeTimeRange(columns[7])!,
          };
          room = columns[8]?.trim() || "";
        }
      } else if (col4IsSks && looksLikeClass(columns[3])) {
        // Format B: [0]PRODI [1]CODE [2]NAME [3]CLASS [4]SKS [5]CAPACITY [6]DAY TIME [7]ROOM
        debug.formatB++;
        code = columns[1]?.trim();
        name = columns[2]?.trim();
        className = columns[3]?.trim();
        sks = parseInt(columns[4]) || 0;
        capacity = parseInt(columns[5]) || undefined;

        const parsedSched = parseDayAndTime(columns[6]);
        if (parsedSched) {
          scheduleObj = parsedSched;
          room = columns[7]?.trim() || "";
        } else if (normalizeDay(columns[6]) && parseAndNormalizeTimeRange(columns[7])) {
          scheduleObj = {
            day: normalizeDay(columns[6])!,
            ...parseAndNormalizeTimeRange(columns[7])!,
          };
          room = columns[8]?.trim() || "";
        }
      }
    }

    // 2. Check Active Column Mapping (e.g. from table header row)
    if (!scheduleObj && activeColumnMapping) {
      const m = activeColumnMapping;
      if (m.codeCol !== undefined && columns[m.codeCol]) code = columns[m.codeCol].trim();
      if (m.nameCol !== undefined && columns[m.nameCol]) name = columns[m.nameCol].trim();
      if (m.sksCol !== undefined && columns[m.sksCol]) sks = parseInt(columns[m.sksCol]) || 0;
      if (m.classCol !== undefined && columns[m.classCol]) className = columns[m.classCol].trim().replace(/^kelas\s*|^kls\s*/i, "");
      if (m.roomCol !== undefined && columns[m.roomCol]) room = columns[m.roomCol].trim();
      if (m.capacityCol !== undefined && columns[m.capacityCol]) capacity = parseInt(columns[m.capacityCol]) || undefined;
      if (m.lecturerCol !== undefined && columns[m.lecturerCol]) lecturerFromRow = columns[m.lecturerCol].trim();

      if (m.scheduleCol !== undefined && columns[m.scheduleCol]) {
        scheduleObj = parseDayAndTime(columns[m.scheduleCol]);
      } else if (m.dayCol !== undefined && m.timeCol !== undefined && columns[m.dayCol] && columns[m.timeCol]) {
        const normDay = normalizeDay(columns[m.dayCol]);
        const timeRange = parseAndNormalizeTimeRange(columns[m.timeCol]);
        if (normDay && timeRange) {
          scheduleObj = { day: normDay, start: timeRange.start, end: timeRange.end };
        }
      }

      if (scheduleObj && (name || code)) {
        debug.universalHeuristic++;
      }
    }

    // 3. Universal Heuristic Parser for other university schedules (SIAKAD, SiakadCloud, SIMASTER, SIX, Excel/CSV)
    if (!scheduleObj && columns.length >= 3) {
      // Find schedule in columns first
      let schedColIdx = -1;
      let dayColIdx = -1;
      let timeColIdx = -1;

      for (let j = 0; j < columns.length; j++) {
        const parsed = parseDayAndTime(columns[j]);
        if (parsed) {
          scheduleObj = parsed;
          schedColIdx = j;
          break;
        }
      }

      if (!scheduleObj) {
        // Look for separate Day and Time columns
        for (let j = 0; j < columns.length; j++) {
          const normDay = normalizeDay(columns[j]);
          if (normDay) {
            for (let k = 0; k < columns.length; k++) {
              if (j === k) continue;
              const time = parseAndNormalizeTimeRange(columns[k]);
              if (time) {
                scheduleObj = { day: normDay, start: time.start, end: time.end };
                dayColIdx = j;
                timeColIdx = k;
                break;
              }
            }
            if (scheduleObj) break;
          }
        }
      }

      if (scheduleObj) {
        debug.universalHeuristic++;
        const usedCols = new Set<number>();
        if (schedColIdx !== -1) usedCols.add(schedColIdx);
        if (dayColIdx !== -1) usedCols.add(dayColIdx);
        if (timeColIdx !== -1) usedCols.add(timeColIdx);

        // Find SKS: a column with a single digit 1-8
        for (let j = 0; j < columns.length; j++) {
          if (usedCols.has(j)) continue;
          if (/^[1-8]$/.test(columns[j].trim())) {
            sks = parseInt(columns[j].trim());
            usedCols.add(j);
            break;
          }
        }

        // Find Class section: short token like A, B, 01, IF-A, SI-B, Kls A, RA
        for (let j = 0; j < columns.length; j++) {
          if (usedCols.has(j)) continue;
          const cleanToken = columns[j].trim().replace(/^kelas\s*|^kls\s*/i, "");
          if (/^[A-Za-z0-9_-]{1,6}$/.test(cleanToken)) {
            className = cleanToken;
            usedCols.add(j);
            break;
          }
        }

        // Find Course Code: alphanumeric with letters and digits (e.g. IF101, CS201, 124210001, TIF-201)
        for (let j = 0; j < columns.length; j++) {
          if (usedCols.has(j)) continue;
          const token = columns[j].trim();
          if (/^[A-Za-z0-9-]{4,14}$/.test(token) && (/\d/.test(token) || /^[A-Z]{3,8}$/.test(token))) {
            code = token;
            usedCols.add(j);
            break;
          }
        }

        // Find Course Name: pick the longest remaining text column
        let longestText = "";
        let longestIdx = -1;
        for (let j = 0; j < columns.length; j++) {
          if (usedCols.has(j)) continue;
          const token = columns[j].trim();
          if (token.length > longestText.length && /[a-zA-Z]/.test(token)) {
            longestText = token;
            longestIdx = j;
          }
        }
        if (longestIdx !== -1) {
          name = longestText;
          usedCols.add(longestIdx);
        }

        // Room and Lecturer from remaining columns
        const remainingCols: string[] = [];
        for (let j = 0; j < columns.length; j++) {
          if (!usedCols.has(j)) {
            remainingCols.push(columns[j].trim());
          }
        }

        for (const rem of remainingCols) {
          if (!room && /^(r\.|lab|gedung|ruang|patt|zoom|online|d-|e-)/i.test(rem)) {
            room = rem;
          } else if (!lecturerFromRow && (rem.includes(" ") || rem.includes(".") || rem.includes(","))) {
            lecturerFromRow = rem;
          } else if (!room) {
            room = rem;
          }
        }
      }
    }

    // 4. Construct Subject and Class
    if (scheduleObj) {
      if (!name && code) name = code;
      if (!code && name) {
        code = name
          .split(/\s+/)
          .map((w) => w[0]?.toUpperCase() || "")
          .join("") || "SUBJ";
      }
      if (!className) className = "A";
      if (!sks) sks = 3;

      if (name) {
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

        const meeting: MeetingRaw = {
          day: scheduleObj.day,
          start: scheduleObj.start,
          end: scheduleObj.end,
          room: room || "",
        };

        const classId = `${subjectId}-${className}`;
        let existingClass = subjectsMap[subjectId].classes.find((c) => c.classId === classId);

        if (!existingClass) {
          existingClass = {
            classId,
            className,
            meetings: [meeting],
            lecturers: lecturerFromRow ? [lecturerFromRow] : [],
            capacity,
          };
          subjectsMap[subjectId].classes.push(existingClass);
        } else {
          // Additional meeting for the same class section (e.g. multi-day lab)
          const alreadyHasMeeting = existingClass.meetings.some(
            (m) => m.day === meeting.day && m.start === meeting.start && m.end === meeting.end
          );
          if (!alreadyHasMeeting) {
            existingClass.meetings.push(meeting);
          }
        }

        currentClass = existingClass;
        continue;
      }
    }

    // 5. Handle lecturer lines or potential secondary meetings for currentClass
    if (currentClass) {
      debug.lecturerLines++;
      const lecturer = line.trim();
      if (
        lecturer &&
        !currentClass.lecturers.includes(lecturer) &&
        !lecturer.startsWith("SISTEM INFORMASI") &&
        !lecturer.startsWith("INFORMATIKA") &&
        !isHeaderRow([lecturer])
      ) {
        currentClass.lecturers.push(lecturer);
      }
    } else {
      debug.unknown++;
    }
  }

  return {
    subjects: Object.values(subjectsMap),
    debug,
  };
}

export function checkMeetingConflict(m1: MeetingRaw, m2: MeetingRaw): boolean {
  if (m1.day !== m2.day) return false;
  try {
    const [startH1, startM1] = m1.start.split(":").map(Number);
    const [endH1, endM1] = m1.end.split(":").map(Number);
    const [startH2, startM2] = m2.start.split(":").map(Number);
    const [endH2, endM2] = m2.end.split(":").map(Number);

    const start1 = startH1 * 60 + (startM1 || 0);
    const end1 = endH1 * 60 + (endM1 || 0);
    const start2 = startH2 * 60 + (startM2 || 0);
    const end2 = endH2 * 60 + (endM2 || 0);

    return Math.max(start1, start2) < Math.min(end1, end2);
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

export * from "./rules";
export * from "./generator";
