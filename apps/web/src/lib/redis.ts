const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 180; // 180 days

function getRedisConfig(): { url: string; token: string } | null {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    return { url: url.replace(/\/+$/, ""), token };
}

export async function setShareRecord(
    id: string,
    value: string,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<boolean> {
    const cfg = getRedisConfig();
    if (!cfg) return false;

    const res = await fetch(`${cfg.url}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${cfg.token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify([["SET", `krs:share:${id}`, value, "EX", ttlSeconds]]),
        cache: "no-store"
    });
    return res.ok;
}

export async function getShareRecord(id: string): Promise<string | null> {
    const cfg = getRedisConfig();
    if (!cfg) return null;

    const res = await fetch(`${cfg.url}/get/${encodeURIComponent(`krs:share:${id}`)}`, {
        headers: {
            Authorization: `Bearer ${cfg.token}`
        },
        cache: "no-store"
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { result?: string | null };
    return typeof data.result === "string" ? data.result : null;
}
