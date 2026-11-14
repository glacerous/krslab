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

async function compressGzip(input: Uint8Array): Promise<Uint8Array> {
    const cs = new CompressionStream("gzip");
    const readPromise = new Response(cs.readable).arrayBuffer();
    const writer = cs.writable.getWriter();
    await writer.write(new Uint8Array(input));
    await writer.close();
    return new Uint8Array(await readPromise);
}

async function decompressGzip(input: Uint8Array): Promise<Uint8Array> {
    const ds = new DecompressionStream("gzip");
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
        // Fall through to execCommand fallback (e.g. Safari async gesture expiry or HTTP)
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

export async function encodeSharePayload(payload: SharePayload): Promise<string> {
    const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));
    if (typeof CompressionStream !== "undefined") {
        try {
            const gz = await compressGzip(jsonBytes);
            return `g.${toBase64Url(gz)}`;
        } catch {
            // Fall through to uncompressed base64url
        }
    }
    return `u.${toBase64Url(jsonBytes)}`;
}

export async function decodeSharePayload(encoded: string): Promise<SharePayload | null> {
    try {
        const raw = encoded.trim();
        let jsonStr = "";
        if (raw.startsWith("g.")) {
            const bytes = fromBase64Url(raw.slice(2));
            const decompressed = await decompressGzip(bytes);
            jsonStr = new TextDecoder().decode(decompressed);
        } else if (raw.startsWith("u.")) {
            const bytes = fromBase64Url(raw.slice(2));
            jsonStr = new TextDecoder().decode(bytes);
        } else {
            return null;
        }
        const parsed = JSON.parse(jsonStr);
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

    const compactSubjects: Subject[] = [];
    const compactMapping: Record<string, string> = {};

    for (const sub of datasource.subjects) {
        if (!selectedIds.has(sub.subjectId)) continue;
        const chosenClassId = effectiveMap[sub.subjectId];
        const chosenClass = sub.classes.find((c) => c.classId === chosenClassId) ?? sub.classes[0];
        if (!chosenClass) continue;

        compactSubjects.push({
            ...sub,
            classes: [chosenClass]
        });
        compactMapping[sub.subjectId] = chosenClass.classId;
    }

    const totalSks = compactSubjects.reduce((sum, s) => sum + (s.sks || 0), 0);
    const payload: SharedPlanPayload = {
        v: 1,
        t: "plan",
        name: plan.name,
        sourceName: datasource.name,
        subjects: compactSubjects,
        selectedClassBySubjectId: compactMapping
    };

    const encoded = await encodeSharePayload(payload);
    const params = new URLSearchParams({
        n: plan.name.slice(0, 60),
        sks: String(totalSks),
        c: String(compactSubjects.length)
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
    const encoded = await encodeSharePayload(payload);
    const params = new URLSearchParams({
        mode: "workspace",
        p: String(plans.length),
        ds: String(datasources.length)
    });
    const url = `${origin}/view?${params.toString()}#s=${encoded}`;
    return { url, tooLarge: url.length > 12000 };
}
