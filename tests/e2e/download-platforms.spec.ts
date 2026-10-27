import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const releases = JSON.parse(
  readFileSync(
    new URL("../../releases/approved-installers.json", import.meta.url),
    "utf8",
  ),
).releases as {
  platform: string;
  version: string;
  sha256: string;
  fileName: string;
}[];

test("download hub shows mobile install routes and honest desktop status", async ({
  page,
  request,
}) => {
  for (const platform of ["windows", "mac-intel", "mac-arm64", "android"]) {
    const response = await request.get(`/download/${platform}`, {
      maxRedirects: 0,
    });
    const release = releases.find((item) => item.platform === platform);
    expect(response.status()).toBe(release ? 307 : 503);
    expect(response.headers().location).toBe(
      release
        ? `${process.env.ARZDESK_RELEASES_BASE_URL || "https://pub-53bc8476c2234ed0be7e02fb5c528d42.r2.dev"}/${release.fileName}`
        : undefined,
    );
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
    ).toHaveAttribute("href", "/download/windows");
    await expect(
      page.getByRole("link", { name: "Apple Silicon .dmg", exact: true }),
    ).toHaveAttribute("href", "/download/mac-arm64");
    await expect(
      page.getByRole("link", { name: "Intel .dmg", exact: true }),
    ).toHaveAttribute("href", "/download/mac-intel");
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
      page.getByRole("button", { name: "Install on Android", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Install on iPhone & iPad",
        exact: true,
      }),
    ).toBeVisible();
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
          page.getByRole("link", { name: "Download .exe", exact: true }),
        ).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });
}

for (const outcome of ["accepted", "dismissed"] as const) {
  test(`Android installs from download hub: ${outcome}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36",
    });
    try {
      const page = await context.newPage();
      await page.goto("/download");
      await expect(
        page.getByRole("button", { name: "Install on Android", exact: true }),
      ).toBeVisible();
      await page.evaluate((outcome) => {
        window.dispatchEvent(
          Object.assign(new Event("beforeinstallprompt"), {
            prompt: async () => {
              document.documentElement.dataset.promptCalled = "yes";
            },
            userChoice: Promise.resolve({ outcome }),
          }),
        );
      }, outcome);
      await page
        .getByRole("button", { name: "Install on Android", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-prompt-called",
        "yes",
      );
      await expect(
        page.locator("#install-android-steps").getByRole("status"),
      ).toContainText(
        outcome === "accepted"
          ? "Installation accepted"
          : "Installation was cancelled",
      );
      if (outcome === "accepted") {
        await expect(
          page.getByRole("button", {
            name: "Installation requested",
            exact: true,
          }),
        ).toBeDisabled();
        await expect(page.locator("#install-android-steps")).not.toContainText(
          "choose Install app",
        );
        await page.evaluate(() =>
          window.dispatchEvent(new Event("appinstalled")),
        );
        await expect(
          page.getByText(
            "ArzDesk is installed. Open it from your home screen.",
            { exact: true },
          ),
        ).toBeVisible();
        await expect(
          page.getByRole("button", {
            name: "Installation requested",
            exact: true,
          }),
        ).toHaveCount(0);
      } else {
        await expect(page.locator("#install-android-steps")).toContainText(
          "choose Install app",
        );
      }
      await expect(page).toHaveURL(/\/download$/);
      await page
        .getByRole("button", { name: "Install on iPhone & iPad", exact: true })
        .click();
      await expect(page.locator("#install-ios-steps")).toContainText("Safari");
      await expect(page).toHaveURL(/\/download$/);
    } finally {
      await context.close();
    }
  });
}
