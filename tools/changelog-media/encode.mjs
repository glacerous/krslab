import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RAW_DIR = path.resolve("tools/changelog-media/out/raw");
const SHARE_DIR = path.resolve("tools/changelog-media/out/share");
const PUBLIC_DIR = path.resolve("apps/web/public/changelog");

fs.mkdirSync(SHARE_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const CLIPS = [
    {
        raw: "intro-card.webm",
        outBase: "v0-2-0-intro",
        startSec: 2.2,
        durationSec: 8,
        posterOffsetSec: 4.5,
    },
    {
        raw: "drag-to-fix.webm",
        outBase: "v0-1-0-drag",
        startSec: 2.0,
        durationSec: 8,
        posterOffsetSec: 3.5,
    },
];

for (const clip of CLIPS) {
    const input = path.join(RAW_DIR, clip.raw);
    if (!fs.existsSync(input)) {
        console.warn(`Skipping missing raw clip: ${input}`);
        continue;
    }
    const mp4Out = path.join(PUBLIC_DIR, `${clip.outBase}.mp4`);
    const posterOut = path.join(PUBLIC_DIR, `${clip.outBase}-poster.jpg`);
    const gifOut = path.join(SHARE_DIR, `${clip.outBase}.gif`);

    execFileSync("ffmpeg", [
        "-y",
        "-ss", String(clip.startSec),
        "-t", String(clip.durationSec),
        "-i", input,
        "-vf", "scale=960:-2,fps=30",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "28",
        "-preset", "slow",
        "-an",
        "-movflags", "+faststart",
        mp4Out,
    ], { stdio: "inherit" });

    execFileSync("ffmpeg", [
        "-y",
        "-ss", String(clip.posterOffsetSec),
        "-i", mp4Out,
        "-frames:v", "1",
        "-vf", "scale=960:-2",
        "-q:v", "5",
        posterOut,
    ], { stdio: "inherit" });

    execFileSync("ffmpeg", [
        "-y",
        "-i", mp4Out,
        "-vf", "fps=12,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        gifOut,
    ], { stdio: "inherit" });

    const mp4Size = fs.statSync(mp4Out).size;
    const posterSize = fs.statSync(posterOut).size;
    console.log(`${clip.outBase}: mp4=${(mp4Size / 1024).toFixed(1)}KB, poster=${(posterSize / 1024).toFixed(1)}KB`);
}
