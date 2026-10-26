import { expect, test } from "@playwright/test";

test("offline landing stays compact, readable and usable on phones", async ({
  page,
}, testInfo) => {
  await page.goto("/offline");

  const title = page.getByRole("heading", {
    name: "Your work. Even offline.",
  });
  const field = page.getByLabel("Workspace name", { exact: true });
  const create = page.getByRole("button", {
    name: "Create workspace",
    exact: true,
  });
  const exportBackup = page.getByRole("button", {
    name: "Export backup",
    exact: true,
  });

  await expect(title).toBeVisible();
  await expect(create).toBeVisible();
  await expect(
    page.getByText("Ready for offline use", { exact: false }),
  ).toBeVisible({ timeout: 60000 });

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);

    for (const width of [320, 390, 768, 1366]) {
      await page.setViewportSize({ width, height: 844 });

      const layout = await page.evaluate(() => {
        const bounds = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect();
        const heading = bounds(".local-home .workspace-welcome");
        const form = bounds(".local-home .local-create");
        const backup = bounds(".local-home > .local-backup");
        const status = bounds(".local-home > .local-status");
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          headingBottom: heading.bottom,
          headingRight: heading.right,
          formTop: form.top,
          formLeft: form.left,
          formBottom: form.bottom,
          backupTop: backup.top,
          statusHeight: status.height,
        };
      });

      expect(layout.overflow, `Horizontal overflow at ${width}px / ${theme}`).toBe(false);
      expect(layout.statusHeight).toBeLessThan(90);
      expect(layout.backupTop).toBeGreaterThanOrEqual(layout.formBottom);

      if (width <= 768) {
        expect(layout.formTop - layout.headingBottom).toBeLessThan(105);
      } else {
        expect(layout.formLeft).toBeGreaterThan(layout.headingRight);
      }

      await expect(field).toBeVisible();
      await expect(create).toBeVisible();
      await expect(exportBackup).toBeVisible();
      await expect(exportBackup).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Import backup", exact: true }),
      ).toHaveCount(0);
      await expect(page.getByLabel("Import backup", { exact: true })).toHaveCount(1);

      if (width === 390 && theme === "light") {
        await testInfo.attach("offline-home-mobile.png", {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
        if (process.env.ARZDESK_CAPTURE_OFFLINE === "1") {
          const jpeg = await page.screenshot({
            fullPage: true,
            type: "jpeg",
            quality: 66,
          });
          const encoded = jpeg.toString("base64");
          console.log("ARZDESK_OFFLINE_VISUAL_BEGIN");
          for (let i = 0; i < encoded.length; i += 3500) {
            console.log("ARZDESK_OFFLINE_VISUAL_PART=" + encoded.slice(i, i + 3500));
          }
          console.log("ARZDESK_OFFLINE_VISUAL_END");
        }
      }
    }
  }

  await page.getByText("More storage options").click();
  await expect(
    page.getByRole("button", { name: "Protect device storage" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy online workspaces" }),
  ).toBeVisible();
});
