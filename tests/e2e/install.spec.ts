import { test, expect } from "@playwright/test";

test("installation page uses the product logo and fits phones and computers", async ({
  page,
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/start");
  expect(manifest.icons[0].src).toBe("/arzdesk-logo-v1.png");
  expect((await request.get(manifest.icons[0].src)).ok()).toBeTruthy();
  await page.goto("/install");
  await expect(
    page.getByRole("heading", { name: "ArzDesk, on your device." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "ArzDesk logo" }).first(),
  ).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const width of [320, 390, 768, 1366]) {
      await page.setViewportSize({ width, height: 740 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
    if (process.env.ARZDESK_QA_DIR)
      await page.screenshot({
        path: `${process.env.ARZDESK_QA_DIR}/install-${theme}.png`,
        fullPage: true,
      });
  }
});

test("install invitation survives navigation from sign in", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("link", { name: "Install ArzDesk", exact: true })
    .click();
  await expect(page).toHaveURL(/\/install$/);
  await page
    .getByRole("button", { name: "Install ArzDesk", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "finish installing" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "How to install" }),
  ).toBeVisible();
});

test("installed shell offers an offline message without caching private data", async ({
  page,
  context,
  request,
}) => {
  test.skip(
    !!process.env.ARZDESK_TEST_DEV,
    "Service worker is production only",
  );
  const script = await request.get("/sw.js");
  expect(script.headers()["cache-control"]).toContain("no-store");
  await page.goto("/install");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBeTruthy();
  await context.setOffline(true);
  await page.goto("/start");
  await expect(
    page.getByRole("heading", { name: "You're offline", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
  await context.setOffline(false);
  await page.getByRole("link", { name: "Try again" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});
