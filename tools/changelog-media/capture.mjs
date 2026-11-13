import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.resolve("apps/web/package.json"));
const { chromium } = require("@playwright/test");

const BASE_URL = process.argv[2] || "http://127.0.0.1:3099";
const OUT_DIR = path.resolve("tools/changelog-media/out/raw");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function injectCursor(page) {
    await page.addInitScript(() => {
        const install = () => {
            if (document.getElementById("__fake-cursor")) return;
            const style = document.createElement("style");
            style.textContent = `
                #__fake-cursor {
                    position: fixed;
                    left: 0; top: 0;
                    width: 24px; height: 24px;
                    pointer-events: none;
                    z-index: 2147483647;
                    transform: translate(-4px, -3px);
                    transition: transform 60ms ease-out;
                }
                .__fake-ripple {
                    position: fixed;
                    width: 28px; height: 28px;
                    margin-left: -14px; margin-top: -14px;
                    border-radius: 9999px;
                    border: 2px solid #f59e0b;
                    pointer-events: none;
                    z-index: 2147483646;
                    animation: __ripple 420ms ease-out forwards;
                }
                @keyframes __ripple {
                    0% { transform: scale(0.3); opacity: 0.9; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            const cur = document.createElement("div");
            cur.id = "__fake-cursor";
            cur.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M4 3L11.2 20.5L13.8 13.6L20.8 11L4 3Z" fill="#141413" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
            document.body.appendChild(cur);
            window.__moveCursor = (x, y) => {
                cur.style.left = x + "px";
                cur.style.top = y + "px";
            };
            window.__clickRipple = (x, y) => {
                const r = document.createElement("div");
                r.className = "__fake-ripple";
                r.style.left = x + "px";
                r.style.top = y + "px";
                document.body.appendChild(r);
                setTimeout(() => r.remove(), 450);
            };
        };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", install);
        } else {
            install();
        }
    });
}

async function moveAndClick(page, locator, steps = 18) {
    const box = await locator.boundingBox();
    if (!box) throw new Error("Target not visible for click");
    const tx = box.x + box.width / 2;
    const ty = box.y + box.height / 2;
    await page.mouse.move(tx, ty, { steps });
    await page.evaluate(([x, y]) => {
        window.__moveCursor?.(x, y);
        window.__clickRipple?.(x, y);
    }, [tx, ty]);
    await page.waitForTimeout(120);
    await page.mouse.click(tx, ty);
}

async function moveCursorHook(page) {
    await page.evaluate(() => {
        document.addEventListener("mousemove", (e) => {
            window.__moveCursor?.(e.clientX, e.clientY);
        }, { passive: true });
    });
}

async function captureIntroCard(browser) {
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    await injectCursor(page);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await moveCursorHook(page);
    await page.locator("#welcome-continue-btn").click();
    await page.mouse.move(640, 400);

    const introCard = page.locator("aside[aria-label*='KRSlab']");
    await introCard.waitFor({ state: "visible", timeout: 6000 });
    await page.waitForTimeout(900);

    const watchBtn = introCard.getByRole("button", { name: /Watch video/i });
    await moveAndClick(page, watchBtn, 22);

    const dialog = page.locator("div[role='dialog'][aria-modal='true']");
    await dialog.waitFor({ state: "visible" });
    await page.waitForTimeout(1200);

    const chapterBtn = dialog.locator("button").filter({ hasText: "0:30" }).first();
    await moveAndClick(page, chapterBtn, 20);
    await page.waitForTimeout(2200);

    const videoPath = await page.video().path();
    await context.close();
    fs.renameSync(videoPath, path.join(OUT_DIR, "intro-card.webm"));
    console.log("Captured intro-card.webm");
}

async function captureDragToFix(browser) {
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
        localStorage.setItem("krs_intro_seen", "1");
        localStorage.setItem("krs_tip_advanced_seen", "1");
        localStorage.setItem("krs_seen_version", "0.2.0");
    });
    await injectCursor(page);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await moveCursorHook(page);
    await page.locator("#welcome-continue-btn").click();

    // Seed sample data strictly via UI
    await page.locator("#tour-datasource-btn").click();
    await page.getByRole("button", { name: /Load sample Informatics data/i }).click();
    await page.waitForTimeout(500);

    // Ensure courses are selected to create a clash on the grid
    const catalogTab = page.getByRole("button", { name: /add courses|catalog/i }).first();
    if (await catalogTab.count()) {
        await catalogTab.click();
        await page.waitForTimeout(300);
        const courseRows = page.locator("#tour-course-panel button, #tour-course-panel [role='checkbox']");
        const count = Math.min(5, await courseRows.count());
        for (let i = 0; i < count; i++) {
            await courseRows.nth(i).click().catch(() => {});
        }
    }
    await page.waitForTimeout(600);

    // Move cursor to first clashing/grid card and drag toward a dashed slot if present
    const card = page.locator("#krs-grid-capture [draggable='true'], #krs-grid-capture [data-subject-id]").first();
    if (await card.count()) {
        const box = await card.boundingBox();
        if (box) {
            const sx = box.x + box.width / 2;
            const sy = box.y + box.height / 2;
            await page.mouse.move(sx, sy, { steps: 16 });
            await page.mouse.down();
            await page.waitForTimeout(350);
            const ghost = page.locator("#krs-grid-capture [class*='dashed']").first();
            if (await ghost.count()) {
                const gb = await ghost.boundingBox();
                if (gb) {
                    await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2, { steps: 24 });
                    await page.waitForTimeout(250);
                }
            } else {
                await page.mouse.move(sx + 180, sy + 40, { steps: 24 });
            }
            await page.mouse.up();
        }
    }
    await page.waitForTimeout(1800);

    const videoPath = await page.video().path();
    await context.close();
    fs.renameSync(videoPath, path.join(OUT_DIR, "drag-to-fix.webm"));
    console.log("Captured drag-to-fix.webm");
}

const browser = await chromium.launch({ headless: true });
try {
    await captureIntroCard(browser);
    await captureDragToFix(browser);
} finally {
    await browser.close();
}
