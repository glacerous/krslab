import type { Datasource, Plan, Subject } from "./store";

export interface SharedPlanPayload {
    v: 1;
    t: "plan";
    name: string;
    sourceName: string;
    subjects: Subject[];
    selectedClassBySubjectId: Record<string, string>;
}

export interface SharedWorkspacePayload {
    v: 1;
    t: "workspace";
    datasources: Datasource[];
    plans: Plan[];
    activePlanId: string | null;
    activeDatasourceId: string | null;
}

export type SharePayload = SharedPlanPayload | SharedWorkspacePayload;

const DAY_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const SEP_SECTION = "\x1e";
const SEP_ITEM = "\x1f";
const SEP_FIELD = "\x1d";
const SEP_SUB = "\x1c";

type CompactMeetingTuple = [number | string, string, string, string];
type CompactCourseTuple = [string, string, number, string, string[], CompactMeetingTuple[]];
type CompactPlanTuple = [2, string, string, CompactCourseTuple[]];

function cleanField(val: string | undefined): string {
    return (val ?? "").replace(/[\x1c-\x1f]/g, " ").trim();
}

function packTime(hhmm: string): string {
    const clean = hhmm.replace(":", "");
    return /^\d{4}$/.test(clean) ? clean : hhmm;
}

function unpackTime(packed: string): string {
    if (/^\d{4}$/.test(packed)) {
        return `${packed.slice(0, 2)}:${packed.slice(2, 4)}`;
    }
    return packed;
}

function toBase64Url(bytes: Uint8Array): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function compressStream(format: CompressionFormat, input: Uint8Array): Promise<Uint8Array> {
    const cs = new CompressionStream(format);
    const readPromise = new Response(cs.readable).arrayBuffer();
    const writer = cs.writable.getWriter();
    await writer.write(new Uint8Array(input));
    await writer.close();
    return new Uint8Array(await readPromise);
}

async function decompressStream(format: CompressionFormat, input: Uint8Array): Promise<Uint8Array> {
    const ds = new DecompressionStream(format);
    const readPromise = new Response(ds.readable).arrayBuffer();
    const writer = ds.writable.getWriter();
    await writer.write(new Uint8Array(input));
    await writer.close();
    return new Uint8Array(await readPromise);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Fall through to execCommand fallback
    }
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
}

async function encodeBytes(bytes: Uint8Array): Promise<string> {
    if (typeof CompressionStream !== "undefined") {
        try {
            const raw = await compressStream("deflate-raw", bytes);
            return `d.${toBase64Url(raw)}`;
        } catch {
            try {
                const gz = await compressStream("gzip", bytes);
                return `g.${toBase64Url(gz)}`;
            } catch {
                // Fall through to uncompressed base64url
            }
        }
    }
    return `u.${toBase64Url(bytes)}`;
}

async function encodeRawData(data: unknown): Promise<string> {
    return encodeBytes(new TextEncoder().encode(JSON.stringify(data)));
}

export async function encodeSharePayload(payload: SharePayload): Promise<string> {
    return encodeRawData(payload);
}

function expandCompactPlan(tuple: CompactPlanTuple): SharedPlanPayload {
    const [, name, sourceName, courses] = tuple;
    const subjects: Subject[] = [];
    const selectedClassBySubjectId: Record<string, string> = {};

    courses.forEach(([code, subName, sks, className, lecturers, meetings], idx) => {
        const subjectId = `sh-s-${idx}`;
        const classId = `sh-c-${idx}`;
        subjects.push({
            subjectId,
            code,
            name: subName,
            sks,
            classes: [
                {
                    classId,
                    className,
                    lecturers: lecturers ?? [],
                    meetings: (meetings ?? []).map(([d, start, end, room]) => ({
                        day: typeof d === "number" ? (DAY_LIST[d] ?? "Senin") : d,
                        start,
                        end,
                        room
                    }))
                }
            ]
        });
        selectedClassBySubjectId[subjectId] = classId;
    });

    return {
        v: 1,
        t: "plan",
        name,
        sourceName,
        subjects,
        selectedClassBySubjectId
    };
}

function expandV3Plan(text: string): SharedPlanPayload | null {
    const sections = text.split(SEP_SECTION);
    if (sections[0] !== "3" || sections.length < 4) return null;

    const name = sections[1] || "Jadwal";
    const sourceName = sections[2] || "Shared";
    const courseRows = sections[3] ? sections[3].split(SEP_ITEM).filter(Boolean) : [];

    const subjects: Subject[] = [];
    const selectedClassBySubjectId: Record<string, string> = {};

    courseRows.forEach((row, idx) => {
        const [code = "", subName = "", sksStr = "0", className = "", meetingsStr = "", lecturersStr = ""] = row.split(SEP_FIELD);
        const subjectId = `sh-s-${idx}`;
        const classId = `sh-c-${idx}`;
        const lecturers = lecturersStr ? lecturersStr.split(SEP_SUB).filter(Boolean) : [];
        const meetings = meetingsStr
            .split(SEP_SUB)
            .filter(Boolean)
            .map((mToken) => {
                const dayChar = mToken[0];
                const dayIdx = Number(dayChar);
                const day = Number.isInteger(dayIdx) && dayIdx >= 0 && dayIdx < DAY_LIST.length
                    ? DAY_LIST[dayIdx]!
                    : "Senin";
                const start = unpackTime(mToken.slice(1, 5));
                const end = unpackTime(mToken.slice(5, 9));
                const room = mToken.slice(9);
                return { day, start, end, room };
            });

        subjects.push({
            subjectId,
            code,
            name: subName,
            sks: Number(sksStr) || 0,
            classes: [
                {
                    classId,
                    className,
                    lecturers,
                    meetings
                }
            ]
        });
        selectedClassBySubjectId[subjectId] = classId;
    });

    return {
        v: 1,
        t: "plan",
        name,
        sourceName,
        subjects,
        selectedClassBySubjectId
    };
}

export async function decodeSharePayload(encoded: string): Promise<SharePayload | null> {
    try {
        const raw = encoded.trim();
        let text = "";
        if (raw.startsWith("d.")) {
            const bytes = fromBase64Url(raw.slice(2));
            const decompressed = await decompressStream("deflate-raw", bytes);
            text = new TextDecoder().decode(decompressed);
        } else if (raw.startsWith("g.")) {
            const bytes = fromBase64Url(raw.slice(2));
            const decompressed = await decompressStream("gzip", bytes);
            text = new TextDecoder().decode(decompressed);
        } else if (raw.startsWith("u.")) {
            const bytes = fromBase64Url(raw.slice(2));
            text = new TextDecoder().decode(bytes);
        } else {
            return null;
        }

        if (text.startsWith(`3${SEP_SECTION}`)) {
            return expandV3Plan(text);
        }

        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed[0] === 2) {
            return expandCompactPlan(parsed as CompactPlanTuple);
        }
        if (!parsed || parsed.v !== 1 || (parsed.t !== "plan" && parsed.t !== "workspace")) {
            return null;
        }
        return parsed as SharePayload;
    } catch {
        return null;
    }
}

export async function buildPlanShareUrl(
    origin: string,
    plan: Plan,
    datasource: Datasource,
    mappingOverride?: Record<string, string>
): Promise<string> {
    const effectiveMap = mappingOverride ?? plan.selectedClassBySubjectId ?? {};
    const selectedIds = new Set(plan.selectedSubjectIds ?? []);

    const rows: string[] = [];
    let totalSks = 0;

    for (const sub of datasource.subjects) {
        if (!selectedIds.has(sub.subjectId)) continue;
        const chosenClassId = effectiveMap[sub.subjectId];
        const chosenClass = sub.classes.find((c) => c.classId === chosenClassId) ?? sub.classes[0];
        if (!chosenClass) continue;

        totalSks += sub.sks || 0;
        const meetingsStr = (chosenClass.meetings ?? [])
            .map((m) => {
                const dayIdx = DAY_LIST.indexOf(m.day);
                const d = dayIdx >= 0 ? String(dayIdx) : "0";
                return `${d}${packTime(m.start)}${packTime(m.end)}${cleanField(m.room)}`;
            })
            .join(SEP_SUB);

        const lecturersStr = (chosenClass.lecturers ?? []).map(cleanField).filter(Boolean).join(SEP_SUB);

        rows.push(
            [
                cleanField(sub.code),
                cleanField(sub.name),
                String(sub.sks || 0),
                cleanField(chosenClass.className),
                meetingsStr,
                lecturersStr
            ].join(SEP_FIELD)
        );
    }

    const packed = [
        "3",
        cleanField(plan.name),
        cleanField(datasource.name),
        rows.join(SEP_ITEM)
    ].join(SEP_SECTION);

    const encoded = await encodeBytes(new TextEncoder().encode(packed));
    const params = new URLSearchParams({
        n: plan.name.slice(0, 60),
        sks: String(totalSks),
        c: String(rows.length)
    });

    return `${origin}/view?${params.toString()}#s=${encoded}`;
}

export async function buildWorkspaceShareUrl(
    origin: string,
    datasources: Datasource[],
    plans: Plan[],
    activePlanId: string | null,
    activeDatasourceId: string | null
): Promise<{ url: string; tooLarge: boolean }> {
    const payload: SharedWorkspacePayload = {
        v: 1,
        t: "workspace",
        datasources,
        plans,
        activePlanId,
        activeDatasourceId
    };
    const encoded = await encodeRawData(payload);
    const params = new URLSearchParams({
        mode: "workspace",
        p: String(plans.length),
        ds: String(datasources.length)
    });
    const url = `${origin}/view?${params.toString()}#s=${encoded}`;
    return { url, tooLarge: url.length > 12000 };
}

export async function createShortPlanShareUrl(
    origin: string,
    plan: Plan,
    datasource: Datasource,
    mappingOverride?: Record<string, string>
): Promise<{ url: string; isShort: boolean }> {
    const effectiveMap = mappingOverride ?? plan.selectedClassBySubjectId ?? {};
    const selectedIds = new Set(plan.selectedSubjectIds ?? []);

    const fullSelectedSubjects: Subject[] = [];
    const selectedMapping: Record<string, string> = {};

    for (const sub of datasource.subjects) {
        if (!selectedIds.has(sub.subjectId)) continue;
        const chosenClassId = effectiveMap[sub.subjectId];
        const chosenClass = sub.classes.find((c) => c.classId === chosenClassId) ?? sub.classes[0];
        if (!chosenClass) continue;
        // Include ALL parallel classes so recipients can drag, swap, and shuffle after copying
        fullSelectedSubjects.push(sub);
        selectedMapping[sub.subjectId] = chosenClass.classId;
    }

    const payload: SharedPlanPayload = {
        v: 1,
        t: "plan",
        name: plan.name,
        sourceName: datasource.name,
        subjects: fullSelectedSubjects,
        selectedClassBySubjectId: selectedMapping
    };

    try {
        const res = await fetch("/api/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = (await res.json()) as { id?: string };
            if (data.id) {
                return { url: `${origin}/v/${data.id}`, isShort: true };
            }
        }
    } catch {
        // Fall through to hash-based fallback URL
    }

    const fallbackUrl = await buildPlanShareUrl(origin, plan, datasource, mappingOverride);
    return { url: fallbackUrl, isShort: false };
}

export async function createShortWorkspaceShareUrl(
    origin: string,
    datasources: Datasource[],
    plans: Plan[],
    activePlanId: string | null,
    activeDatasourceId: string | null
): Promise<{ url: string; isShort: boolean; tooLarge: boolean }> {
    const payload: SharedWorkspacePayload = {
        v: 1,
        t: "workspace",
        datasources,
        plans,
        activePlanId,
        activeDatasourceId
    };

    try {
        const res = await fetch("/api/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = (await res.json()) as { id?: string };
            if (data.id) {
                return { url: `${origin}/v/${data.id}`, isShort: true, tooLarge: false };
            }
        }
    } catch {
        // Fall through to hash-based fallback URL
    }

    const fallback = await buildWorkspaceShareUrl(origin, datasources, plans, activePlanId, activeDatasourceId);
    return { url: fallback.url, isShort: false, tooLarge: fallback.tooLarge };
}
