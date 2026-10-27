import { expect, test } from "@playwright/test";

test("download hub shows mobile install routes and honest desktop status", async ({
  page,
  request,
}) => {
  for (const platform of ["windows", "mac-intel", "mac-arm64", "android"]) {
    const response = await request.get(`/download/${platform}`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(503);
    expect(response.headers().location).toBeUndefined();
  }
  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/download");
    await expect(
      page.getByRole("heading", { name: "Your workspace. Wherever you are." }),
    ).toBeVisible();
    await expect(page.locator('a[href*="github"]')).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Download .exe", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Apple Silicon .dmg", exact: true }),
    ).toHaveCount(0);
    const platforms = page.locator(".download-platform");
    await expect(platforms).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "Windows" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "MacBook & Mac" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Android" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "iPhone & iPad" }),
    ).toBeVisible();
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

test("phone install page supplies Android and iPhone steps", async ({
  page,
}) => {
  await page.goto("/install#installation-steps");
  await expect(page.getByRole("heading", { name: "Android" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "iPhone & iPad" }),
  ).toBeVisible();
});

for (const mobile of [false, true]) {
  test(`install invitation uses ${mobile ? "phone PWA" : "desktop downloads"}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      userAgent: mobile
        ? "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36",
    });
    try {
      const page = await context.newPage();
      await page.goto("/install");
      if (mobile)
        await expect(
          page.getByRole("link", { name: "How to install" }),
        ).toBeVisible();
      else
        await expect(
          page.getByRole("link", { name: "Get the desktop app" }),
        ).toHaveAttribute("href", "/download");
      await page.evaluate(() => {
        window.dispatchEvent(
          Object.assign(new Event("beforeinstallprompt"), {
            prompt: async () => {
              document.documentElement.dataset.promptCalled = "yes";
            },
            userChoice: Promise.resolve({ outcome: "accepted" }),
          }),
        );
      });
      const install = page.getByRole("button", {
        name: "Install ArzDesk",
        exact: true,
      });
      if (mobile) {
        await install.click();
        await expect(page.locator("html")).toHaveAttribute(
          "data-prompt-called",
          "yes",
        );
      } else {
        await expect(install).toHaveCount(0);
        await page.getByRole("link", { name: "Get the desktop app" }).click();
        await expect(page).toHaveURL(/\/download$/);
        await expect(
          page.getByText("Windows installer in testing"),
        ).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });
}
