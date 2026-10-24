import { test, expect } from "@playwright/test";
test.use({ hasTouch: true });

test("device work survives offline CRUD, cold reopen and backup restoration", async ({
  page,
  context,
  request,
}) => {
  test.skip(
    !!process.env.ARZDESK_TEST_DEV,
    "Offline shell requires production build",
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/offline");
  await expect(
    page.getByText("Ready for offline use", { exact: false }),
  ).toBeVisible({ timeout: 60000 });
  expect((await request.get("/api/offline-export")).status()).toBe(401);
  await context.setOffline(true);
  await page
    .getByLabel("Workspace name", { exact: true })
    .fill("Offline studio");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  const client = page.getByRole("dialog", { name: "Add client", exact: true });
  await client
    .getByLabel("Client name", { exact: true })
    .fill("Offline client");
  await client.getByRole("button", { name: "Add client", exact: true }).click();
  await expect(client).not.toBeVisible();
  const id = (await page.evaluate(() => location.hash)).split("/")[0].slice(1);
  async function navigate(section: string) {
    await page.evaluate((hash) => {
      location.hash = hash;
    }, `${id}/${section}`);
  }
  await navigate("projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const project = page.getByRole("dialog", {
    name: "New project",
    exact: true,
  });
  await project
    .getByLabel("Project name", { exact: true })
    .fill("Offline project");
  await project
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(project).not.toBeVisible();
  await navigate("tasks");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  const task = page.getByRole("dialog", { name: "Add task", exact: true });
  await task
    .getByLabel("Task title", { exact: true })
    .fill("Finish without internet");
  await task.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(task).not.toBeVisible();
  await page
    .getByLabel("Change status for Finish without internet")
    .selectOption("done");
  await expect(
    page.getByLabel("Change status for Finish without internet"),
  ).toHaveValue("done");
  await page.setViewportSize({ width: 320, height: 740 });
  const toast = page.locator(".feedback-toast");
  await expect(toast).toBeVisible();
  const bounds = await toast.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(15);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(305);
  const close = await page
    .getByRole("button", { name: "Dismiss notification" })
    .boundingBox();
  expect(close!.x).toBeGreaterThan(bounds!.x + bounds!.width / 2);
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await page.reload();
  await expect(
    page.getByLabel("Change status for Finish without internet"),
  ).toHaveValue("done");
  await page.getByRole("button", { name: "Open workspace menu" }).tap();
  await expect(
    page.getByRole("dialog", { name: "Workspace menu" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile workspace navigation" })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page
    .getByLabel("Workspace name", { exact: true })
    .fill("Renamed offline");
  await page.getByRole("button", { name: "Save workspace name" }).click();
  await expect(page.locator("#workspace-switcher")).toContainText(
    "Renamed offline",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const file = await download;
  const backup = await file.path();
  expect(backup).toBeTruthy();
  // A second tab saves independently; switching tabs must not lose its work.
  const second = await context.newPage();
  await second.goto("/offline");
  await second
    .getByLabel("Workspace name", { exact: true })
    .fill("Second workspace");
  await second
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page.goto("/offline");
  await expect(
    page.getByRole("heading", { name: "Second workspace", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Import backup", { exact: true })
    .setInputFiles(backup!);
  await expect(
    page.getByText("Backup imported as additional workspaces.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Renamed offline", exact: true }),
  ).toHaveCount(2);
  await page.getByLabel("Import backup", { exact: true }).setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.locator(".local-message[role=alert]")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Second workspace", exact: true }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  const keys = await page.evaluate(async () => {
    const all = await caches.keys();
    return (
      await Promise.all(
        all.map(async (k) =>
          (await (await caches.open(k)).keys()).map(
            (r) => new URL(r.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  expect(keys).toContain("/offline");
  expect(
    keys.some(
      (p) => p.startsWith("/api/") || p.startsWith("/w/") || p === "/profile",
    ),
  ).toBe(false);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(`/offline#${id}/tasks`);
  await expect(
    reopened.getByLabel("Change status for Finish without internet"),
  ).toHaveValue("done");
  await reopened.screenshot({
    path: "/tmp/arzdesk-offline-tasks.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("concurrent tabs preserve both saves and failed storage never reports success", async ({
  page,
  context,
}) => {
  test.skip(!!process.env.ARZDESK_TEST_DEV, "Production only");
  await page.goto("/offline");
  await expect(
    page.getByText("Ready for offline use", { exact: false }),
  ).toBeVisible({ timeout: 60000 });
  const other = await context.newPage();
  await other.goto("/offline");
  await context.setOffline(true);
  await page
    .getByLabel("Workspace name", { exact: true })
    .fill("First concurrent workspace");
  await other
    .getByLabel("Workspace name", { exact: true })
    .fill("Second concurrent workspace");
  await Promise.all([
    page.getByRole("button", { name: "Create workspace", exact: true }).click(),
    other
      .getByRole("button", { name: "Create workspace", exact: true })
      .click(),
  ]);
  await page.goto("/offline");
  await expect(
    page.getByRole("heading", {
      name: "First concurrent workspace",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Second concurrent workspace",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "First concurrent workspace",
        exact: true,
      }),
    })
    .click();
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException("Storage full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add client", exact: true });
  await dialog
    .getByLabel("Client name", { exact: true })
    .fill("Unsaved client");
  await dialog.getByRole("button", { name: "Add client", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(page.locator(".feedback-toast")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Let’s set up your workspace" }),
  ).toBeVisible();
  await expect(page.getByText("Unsaved client", { exact: true })).toHaveCount(
    0,
  );
});

test("device data and shell survive a complete browser restart offline", async ({
  playwright,
}, testInfo) => {
  test.skip(!!process.env.ARZDESK_TEST_DEV, "Production only");
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const profile = await mkdtemp(join(tmpdir(), "arzdesk-persistent-"));
  const options = {
    ...testInfo.project.use.launchOptions,
    headless: true,
    baseURL: "http://localhost:3000",
  };
  let persistent = await playwright.chromium.launchPersistentContext(
    profile,
    options,
  );
  try {
    const page = await persistent.newPage();
    await page.goto("/offline");
    await expect(
      page.getByText("Ready for offline use", { exact: false }),
    ).toBeVisible({ timeout: 60000 });
    await page
      .getByLabel("Workspace name", { exact: true })
      .fill("Survives browser restart");
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Let’s set up your workspace" }),
    ).toBeVisible();
    await persistent.close();
    persistent = await playwright.chromium.launchPersistentContext(
      profile,
      options,
    );
    await persistent.setOffline(true);
    const reopened = await persistent.newPage();
    await reopened.goto("/offline");
    await expect(
      reopened.getByRole("heading", {
        name: "Survives browser restart",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await persistent.close();
    await rm(profile, { recursive: true, force: true });
  }
});
