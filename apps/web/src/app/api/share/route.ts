import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { setShareRecord } from "@/lib/redis";

const MAX_PAYLOAD_BYTES = 256 * 1024;

export async function POST(req: Request) {
    try {
        const raw = await req.text();
        if (!raw || raw.length > MAX_PAYLOAD_BYTES) {
            return NextResponse.json({ error: "Payload too large or empty" }, { status: 400 });
        }

        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== 1 || (parsed.t !== "plan" && parsed.t !== "workspace")) {
            return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
        }

        const id = randomBytes(6).toString("base64url");
        const ok = await setShareRecord(id, raw);
        if (!ok) {
            return NextResponse.json({ error: "Share storage unavailable" }, { status: 503 });
        }

        return NextResponse.json({ id }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
}
