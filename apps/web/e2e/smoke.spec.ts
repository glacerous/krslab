import { test, expect } from "@playwright/test";

test.describe("KRSlab Smoke Test", () => {
    test("import sample, shuffle, accept, export PNG", async ({ page }) => {
        await page.goto("/");

        // 1. Dismiss Welcome Screen if open
        const continueBtn = page.getByText("Continue in Browser");
        if (await continueBtn.isVisible()) {
            await continueBtn.click();
        }

        // 2. Dismiss Tour if open
        const closeTourBtn = page.getByRole("button", { name: "Close interactive tour" });
        if (await closeTourBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeTourBtn.click();
        }

        // 3. Load Sample Data if empty state is present
        const trySampleBtn = page.getByText("Try Sample Data");
        if (await trySampleBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await trySampleBtn.click();
        }

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
        const exportBtn = page.locator('button[title*="Export Timetable as PNG"]');
        await expect(exportBtn).toBeVisible();
        await exportBtn.click();

        // Verify toast confirmation appears
        await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10000 });
    });
});
