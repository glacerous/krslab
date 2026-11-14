import { test, expect } from "@playwright/test";

test.describe("KRSlab Smoke Test", () => {
    test("import sample, shuffle, accept, export PNG", async ({ page }) => {
        await page.goto("/");

        // 1. Wait for hydration and dismiss Welcome Screen if open
        const welcomeBtn = page.locator("#welcome-continue-btn");
        const sourceBtn = page.locator("#tour-datasource-btn");

        await Promise.race([
            welcomeBtn.waitFor({ state: "visible", timeout: 8000 }).catch(() => null),
            sourceBtn.waitFor({ state: "visible", timeout: 8000 }).catch(() => null)
        ]);

        if (await welcomeBtn.isVisible()) {
            await welcomeBtn.click();
            await expect(welcomeBtn).not.toBeVisible({ timeout: 5000 });
        }

        // 2. Dismiss Tour if open
        const closeTourBtn = page.getByRole("button", { name: "Close interactive tour" });
        if (await closeTourBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeTourBtn.click();
        }

        // 3. Load Sample Data via source menu
        await expect(sourceBtn).toBeVisible({ timeout: 10000 });
        await sourceBtn.click();

        const loadSampleBtn = page.getByRole("button", { name: /load sample|muat data contoh/i });
        await expect(loadSampleBtn).toBeVisible({ timeout: 5000 });
        await loadSampleBtn.click();

        // Verify schedule card nodes appear on the grid
        const firstCard = page.locator("[data-subject-id]").first();
        await expect(firstCard).toBeVisible({ timeout: 10000 });

        // 4. Shuffle schedule (auto-schedule solver)
        const autoScheduleBtn = page.locator("#tour-auto-schedule-btn");
        await expect(autoScheduleBtn).toBeVisible();
        await autoScheduleBtn.click();

        // 5. Verify floating preview bar and accept candidate
        const acceptBtn = page.getByRole("button", { name: /accept|terapkan/i });
        await expect(acceptBtn).toBeVisible({ timeout: 5000 });
        await acceptBtn.click();

        // Verify preview accepted (bar disappears)
        await expect(acceptBtn).not.toBeVisible({ timeout: 5000 });

        // 6. Export Timetable as PNG
        const shareMenuBtn = page.getByRole("button", { name: /^(share|bagikan)$/i }); await expect(shareMenuBtn).toBeVisible(); await shareMenuBtn.click(); const exportBtn = page.getByRole("menuitem", { name: /download png|unduh png/i });
        await expect(exportBtn).toBeVisible();
        await exportBtn.click();

        // Verify toast confirmation appears
        await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10000 });
    });
});
