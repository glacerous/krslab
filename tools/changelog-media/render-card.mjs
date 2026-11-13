import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.resolve("apps/web/package.json"));
const { chromium } = require("@playwright/test");

const changelogSrc = fs.readFileSync(path.resolve("apps/web/src/lib/changelog.ts"), "utf8");
const dateMatch = changelogSrc.match(/version:\s*"milestone-632"[\s\S]*?date:\s*"([^"]+)"/);
const titleMatch = changelogSrc.match(/version:\s*"milestone-632"[\s\S]*?en:\s*"([^"]+)"/);
const summaryMatch = changelogSrc.match(/version:\s*"milestone-632"[\s\S]*?summary:\s*\{\s*en:\s*"([^"]+)"/);

const date = dateMatch?.[1] || "2026-01-21";
const title = titleMatch?.[1] || "632 visitors in the first week";
const numeral = title.match(/\d+/)?.[0] || "632";
const summary = summaryMatch?.[1] || "5,623 page views in 7 days, 99% Indonesia";
const subLine = summary.split(", with a peak")[0] || summary;

const PUBLIC_DIR = path.resolve("apps/web/public/changelog");
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
const pngTmp = path.resolve("tools/changelog-media/out/milestone-632.png");
fs.mkdirSync(path.dirname(pngTmp), { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.goto("file:///" + path.resolve("tools/changelog-media/card.html").replace(/\\/g, "/"), { waitUntil: "networkidle" });
    await page.evaluate(([d, n, s]) => {
        document.getElementById("date").textContent = d;
        document.getElementById("numeral").textContent = n;
        document.getElementById("sub").textContent = s;
    }, [date, numeral, subLine]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: pngTmp, type: "png" });
} finally {
    await browser.close();
}

const webpOut = path.join(PUBLIC_DIR, "milestone-632.webp");
const jpgOut = path.join(PUBLIC_DIR, "milestone-632.jpg");

execFileSync("ffmpeg", ["-y", "-i", pngTmp, "-c:v", "libwebp", "-quality", "82", webpOut], { stdio: "inherit" });
execFileSync("ffmpeg", ["-y", "-i", pngTmp, "-q:v", "4", jpgOut], { stdio: "inherit" });

console.log(`milestone-632.webp=${(fs.statSync(webpOut).size / 1024).toFixed(1)}KB, milestone-632.jpg=${(fs.statSync(jpgOut).size / 1024).toFixed(1)}KB`);
