import { expect, test } from "@playwright/test";

test("three local workspaces share one responsive grid and do not crowd desktop", async ({
  page,
}, testInfo) => {
  await page.goto("/offline");
  await expect(
    page.getByText("Ready for offline use", { exact: false }),
  ).toBeVisible({ timeout: 60000 });

  for (let index = 0; index < 3; index++) {
    if (index > 0) {
      await page.locator(".local-add-workspace summary").click();
    }
    await page
      .getByLabel("Workspace name", { exact: true })
      .fill("ArzCore Technologies");
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await expect(page).toHaveURL(/#.+\/overview/);
    await page.goto("/offline");
  }

  await expect(
    page.getByRole("heading", { name: "Your workspaces." }),
  ).toBeVisible();
  await expect(page.locator(".local-workspaces .org-card")).toHaveCount(3);
  await expect(
    page.getByText("3 on this device", { exact: true }),
  ).toBeVisible();

  const createExtra = page.locator(".local-add-workspace");
  await expect(createExtra).not.toHaveAttribute("open", "");
  await expect(
    page.getByLabel("Workspace name", { exact: true }),
  ).not.toBeVisible();

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);

    for (const width of [320, 390, 768, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });

      const positions = await page.evaluate(() => {
        const boxes = [
          ...document.querySelectorAll(".local-workspaces .org-card"),
        ].map((el) => el.getBoundingClientRect());
        const backup = document
          .querySelector(".local-home > .local-backup")!
          .getBoundingClientRect();
        const add = document
          .querySelector(".local-add-workspace")!
          .getBoundingClientRect();
        const grid = document.querySelector(".local-workspaces .org-grid")!;
        return {
          scrollWidth: document.documentElement.scrollWidth,
          viewport: innerWidth,
          cardTops: boxes.map((r) => r.top),
          cardRights: boxes.map((r) => r.right),
          lastCardBottom: Math.max(...boxes.map((r) => r.bottom)),
          backupTop: backup.top,
          extraTop: add.top,
          gridColumns: getComputedStyle(grid).gridTemplateColumns,
        };
      });

      expect(
        positions.scrollWidth,
        `No overflow at ${width}px/${theme}`,
      ).toBeLessThanOrEqual(width);
      for (const right of positions.cardRights) {
        expect(right).toBeLessThanOrEqual(width + 1);
      }

      if (width >= 1366) {
        expect(
          Math.max(...positions.cardTops) - Math.min(...positions.cardTops),
        ).toBeLessThan(2);
        expect(positions.gridColumns.split(" ").length).toBe(3);
      } else if (width <= 390) {
        expect(positions.cardTops[1]).toBeGreaterThan(positions.cardTops[0]);
        expect(positions.cardTops[2]).toBeGreaterThan(positions.cardTops[1]);
      }
      expect(positions.extraTop).toBeGreaterThanOrEqual(
        positions.lastCardBottom,
      );
      expect(positions.backupTop).toBeGreaterThan(positions.extraTop);

      if (theme === "light" && width === 1366) {
        await testInfo.attach("populated-desktop.png", {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
        if (process.env.ARZDESK_CAPTURE_HOME === "1") {
          const b64 = (
            await page.screenshot({
              type: "jpeg",
              quality: 66,
              fullPage: true,
            })
          ).toString("base64");
          console.log("ARZDESK_DESKTOP_HOME_BEGIN");
          for (let i = 0; i < b64.length; i += 3500) {
            console.log("ARZDESK_DESKTOP_HOME_PART=" + b64.slice(i, i + 3500));
          }
          console.log("ARZDESK_DESKTOP_HOME_END");
        }
      }
    }
  }

  await page.locator(".local-add-workspace summary").click();
  await expect(
    page.getByLabel("Workspace name", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export backup" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Import backup" }),
  ).toBeVisible();

  // Workspaces are separate records even if users give them the same name.
  // Never silently deduplicate, rename or delete existing local data.
  expect(
    await page
      .locator(".local-workspaces .org-card")
      .evaluateAll(
        (cards) => new Set(cards.map((card) => card.getAttribute("href"))).size,
      ),
  ).toBe(3);
});
