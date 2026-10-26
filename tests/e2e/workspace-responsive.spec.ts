import { expect, test } from "@playwright/test";

test("mobile and laptop workspace screens remain readable without sideways scrolling", async ({
  page,
}, testInfo) => {
  await page.goto("/offline");
  await expect(
    page.getByText("Ready for offline use", { exact: false }),
  ).toBeVisible({ timeout: 60000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel("Workspace name", { exact: true })
    .fill("Studio workspace");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Let’s set up your workspace" }),
  ).toBeVisible();

  const id = (await page.evaluate(() => location.hash)).split("/")[0].slice(1);
  const navigate = async (section: string) => {
    await page.evaluate((hash) => {
      location.hash = hash;
    }, `${id}/${section}`);
    await expect(
      page.locator(`.page-content.section-${section}`),
    ).toBeVisible();
  };

  await navigate("clients");
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  const client = page.getByRole("dialog", { name: "Add client" });
  await client.getByLabel("Client name", { exact: true }).fill("Studio client");
  await client.getByRole("button", { name: "Add client" }).click();
  await expect(client).not.toBeVisible();

  await navigate("projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const project = page.getByRole("dialog", { name: "New project" });
  await project
    .getByLabel("Project name", { exact: true })
    .fill("Website update");
  await project.getByRole("button", { name: "Create project" }).click();
  await expect(project).not.toBeVisible();

  await navigate("tasks");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  const task = page.getByRole("dialog", { name: "Add task" });
  await task
    .getByLabel("Task title", { exact: true })
    .fill("Update landing page");
  await task.getByRole("button", { name: "Add task" }).click();
  await expect(task).not.toBeVisible();

  const toastDismiss = page.getByRole("button", {
    name: "Dismiss notification",
  });
  if (await toastDismiss.isVisible()) {
    await toastDismiss.click();
  }

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);

    for (const width of [320, 390, 768, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });

      for (const section of [
        "overview",
        "clients",
        "projects",
        "tasks",
        "settings",
      ]) {
        await navigate(section);
        const metrics = await page.evaluate(() => {
          const rect = (selector: string) =>
            document.querySelector(selector)?.getBoundingClientRect();
          const content = rect(".app-main > .page-content");
          const header = rect(".app-main > .topbar");
          const sidebar = rect(".app-shell > .sidebar");
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            contentLeft: content?.left ?? -1,
            contentRight: content?.right ?? -1,
            headerHeight: header?.height ?? 0,
            sidebarWidth: sidebar?.width ?? 0,
            cols: getComputedStyle(
              document.querySelector(".dashboard-grid") ?? document.body,
            ).gridTemplateColumns,
          };
        });

        expect(
          metrics.overflow,
          `Page overflow: ${section} / ${width}px / ${theme}`,
        ).toBe(false);
        expect(metrics.contentLeft).toBeGreaterThanOrEqual(-1);
        expect(metrics.contentRight).toBeLessThanOrEqual(width + 1);
        expect(metrics.headerHeight).toBeLessThan(width <= 1100 ? 170 : 100);

        if (width > 1100) {
          expect(metrics.sidebarWidth).toBeGreaterThan(150);
        }

        if (section === "overview" && width > 1100) {
          const layout = await page
            .locator(".dashboard-grid")
            .evaluate((el) => {
              const children = el.querySelectorAll(":scope > .panel");
              const left = children[0].getBoundingClientRect();
              const right = children[1].getBoundingClientRect();
              return {
                left: left.left,
                right: right.left,
                overflowY: getComputedStyle(
                  children[0].querySelector(".project-summaries")!,
                ).overflowY,
              };
            });
          expect(layout.left).not.toBe(layout.right);
          expect(layout.overflowY).toBe("visible");
        }

        if (width === 390 && section === "tasks" && theme === "light") {
          await testInfo.attach("tasks-mobile.png", {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          if (process.env.ARZDESK_CAPTURE_WORKSPACE === "1") {
            const encoded = (
              await page.screenshot({
                type: "jpeg",
                quality: 65,
                fullPage: true,
              })
            ).toString("base64");
            console.log("ARZDESK_MOBILE_VISUAL_BEGIN");
            for (let i = 0; i < encoded.length; i += 3500) {
              console.log("ARZDESK_MOBILE_PART=" + encoded.slice(i, i + 3500));
            }
            console.log("ARZDESK_MOBILE_VISUAL_END");
          }
        }

        if (width === 1366 && section === "overview" && theme === "light") {
          await testInfo.attach("overview-laptop.png", {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          if (process.env.ARZDESK_CAPTURE_WORKSPACE === "1") {
            const encoded = (
              await page.screenshot({
                type: "jpeg",
                quality: 65,
                fullPage: true,
              })
            ).toString("base64");
            console.log("ARZDESK_LAPTOP_VISUAL_BEGIN");
            for (let i = 0; i < encoded.length; i += 3500) {
              console.log("ARZDESK_LAPTOP_PART=" + encoded.slice(i, i + 3500));
            }
            console.log("ARZDESK_LAPTOP_VISUAL_END");
          }
        }
      }
    }
  }
});
