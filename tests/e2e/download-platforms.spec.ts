import { expect, test } from "@playwright/test";

test("download hub shows mobile install routes and honest desktop status", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/download");
    await expect(
      page.getByRole("heading", { name: "Your workspace. Wherever you are." }),
    ).toBeVisible();
    const platforms = page.locator(".download-platform");
    await expect(platforms).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "Windows" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "MacBook & Mac" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Android" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "iPhone & iPad" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Install on Android (PWA)" }),
    ).toHaveAttribute("href", "/install#installation-steps");
    await expect(
      page.getByRole("link", { name: "Install on iPhone (PWA)" }),
    ).toHaveAttribute("href", "/install#installation-steps");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test("phone install page supplies Android and iPhone steps", async ({ page }) => {
  await page.goto("/install#installation-steps");
  await expect(page.getByRole("heading", { name: "Android" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "iPhone & iPad" }),
  ).toBeVisible();
});
