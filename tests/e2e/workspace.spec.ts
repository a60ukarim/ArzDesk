import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
test("a team can register, organize real work, invite a viewer and revoke access", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const stamp = Date.now();
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const email = `owner-${stamp}@example.com`;
  const invitee = `viewer-${stamp}@example.com`;
  async function signup(p: typeof page, mail: string) {
    await p.getByLabel("Your name").fill("Test User");
    await p.getByLabel("Email address").fill(mail);
    await p
      .getByLabel("Password", { exact: true })
      .fill("a-strong-test-password");
    await p
      .getByRole("button", { name: "Create account", exact: true })
      .click();
  }
  async function save() {
    await page
      .getByRole("dialog")
      .getByRole("button", {
        name: /^(Save changes|Add client|Create project|Add task)$/,
      })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.goto("/sign-up");
  await expect(page.getByPlaceholder("Your full name")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => ({
    heading: getComputedStyle(document.querySelector("h1")!).fontFamily,
    text: getComputedStyle(document.body).fontFamily,
  }));
  expect(fonts.heading.toLowerCase()).toContain("inter");
  expect(fonts.text.toLowerCase()).toContain("inter");
  expect(fonts.text.toLowerCase()).toContain("cairo");
  await expect(
    page.locator('link[rel="icon"][type="image/png"]'),
  ).toHaveAttribute("href", "/arzdesk-logo-v1.png");
  // Read the actual icon bytes in a canvas: CSS clipping cannot fix tab icons.
  const iconPixels = await page.evaluate(async () => {
    const icon = new Image();
    icon.src = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"][type="image/png"]',
    )!.href;
    await icon.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(icon, 0, 0, 64, 64);
    return {
      corners: [
        [0, 0],
        [63, 0],
        [0, 63],
        [63, 63],
      ].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3]),
      center: [...ctx.getImageData(32, 20, 1, 1).data],
    };
  });
  expect(iconPixels.corners).toEqual([0, 0, 0, 0]);
  expect(iconPixels.center[3]).toBeGreaterThan(240);
  expect(iconPixels.center[2]).toBeGreaterThan(iconPixels.center[0]);
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/auth-sign-up.png`,
      fullPage: true,
    });
  await signup(page, email);
  await expect(page).toHaveURL(/workspaces$/);
  await page.getByLabel("Workspace name").fill("ArzCore Test");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/w\//);
  const workspaceUrl = page.url();
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page.getByLabel("Workspace name").fill("ArzCore Studio");
  await page
    .getByRole("button", { name: "Save workspace name", exact: true })
    .click();
  await expect(
    page.getByText("Workspace name updated.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Switch workspace").locator("option:checked"),
  ).toHaveText("ArzCore Studio");
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/settings-desktop.png`,
      fullPage: true,
    });
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Overview", exact: true })
    .click();
  await page.getByRole("button", { name: "Open quick guide" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "How ArzDesk works" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Let’s set up your workspace" }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "ArzDesk logo" })).toBeVisible();
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/setup-desktop.png`,
      fullPage: true,
    });
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Clients", exact: true })
    .click();
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  await page.getByLabel("Client name", { exact: true }).fill("محل تجاري");
  await page
    .getByRole("dialog")
    .getByLabel("Email address")
    .fill("client@example.com");
  await save();
  await expect(
    page.getByRole("cell", { name: "client@example.com" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit محل تجاري", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Company", { exact: true })
    .fill("Example business");
  await save();
  await page
    .getByRole("button", {
      name: "New project for محل تجاري",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Client", { exact: true }),
  ).toHaveValue(
    (await page
      .getByRole("dialog")
      .getByLabel("Client", { exact: true })
      .locator("option")
      .last()
      .getAttribute("value"))!,
  );
  await page
    .getByRole("dialog")
    .getByLabel("Project name", { exact: true })
    .fill("Website redesign");
  await page
    .getByRole("dialog")
    .getByLabel("Client", { exact: true })
    .selectOption({ label: "محل تجاري" });
  await page
    .getByRole("dialog")
    .getByText("More details", { exact: false })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Status", { exact: true })
    .selectOption("planned");
  await save();
  await page.getByRole("link", { name: "محل تجاري", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "محل تجاري — projects",
      exact: true,
    }),
  ).toBeVisible();
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/projects-desktop.png`,
      fullPage: true,
    });
  await page
    .getByLabel("Change status for Website redesign")
    .selectOption("active");
  await expect(
    page.getByLabel("Change status for Website redesign"),
  ).toHaveValue("active");
  await page
    .getByRole("link", { name: "Website redesign", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Website redesign — tasks",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  const taskDialog = page.getByRole("dialog");
  await expect(
    taskDialog.getByLabel("Status", { exact: true }),
  ).not.toBeVisible();
  await expect(
    taskDialog.getByLabel("Priority", { exact: true }),
  ).not.toBeVisible();
  const bounds = await taskDialog.boundingBox();
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
  }));
  expect(
    Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2),
  ).toBeLessThan(10);
  expect(
    Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2),
  ).toBeLessThan(3);
  await expect(taskDialog.getByLabel("Project", { exact: true })).toHaveValue(
    (await taskDialog
      .getByLabel("Project", { exact: true })
      .locator("option")
      .last()
      .getAttribute("value")) ?? "",
  );
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/task-form-desktop.png`,
    });

  await page
    .getByLabel("Task title", { exact: true })
    .fill("Build the contact page");
  await page
    .getByRole("dialog")
    .getByLabel("Project", { exact: true })
    .selectOption({ label: "Website redesign" });
  await save();
  const status = page.getByLabel("Change status for Build the contact page");
  await status.selectOption("done");
  await expect(status).toHaveValue("done");
  await expect(
    page.getByText("Task completed. Great work!", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Website redesign — tasks",
      exact: true,
    }),
  ).toBeVisible();
  await expect(status).toBeVisible();
  await expect(status).toHaveValue("done");
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/tasks-desktop.png`,
      fullPage: true,
    });
  // Exercise real content and controls at phone, tablet, laptop and wide-screen sizes.
  for (const width of [
    320, 360, 390, 600, 768, 820, 1000, 1024, 1280, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of [
      "Overview",
      "Clients",
      "Projects",
      "Tasks",
      "Team",
      "Settings",
    ]) {
      if (width <= 1100)
        await page
          .getByRole("button", { name: "Open workspace menu", exact: true })
          .click();
      await page
        .getByRole("navigation", {
          name:
            width <= 1100
              ? "Mobile workspace navigation"
              : "Workspace navigation",
          exact: true,
        })
        .getByRole("link", { name, exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name:
            name === "Team"
              ? "Your team"
              : name === "Overview"
                ? "Your work at a glance"
                : name === "Settings"
                  ? "Workspace settings"
                  : name,
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${name} overflows at ${width}px`,
      ).toBe(true);
      if (width > 1100) {
        expect(
          await page.evaluate(() => document.documentElement.scrollHeight),
        ).toBeLessThanOrEqual(900);
        expect(
          await page.evaluate(() => getComputedStyle(document.body).overflowY),
        ).toBe("hidden");
      }
      for (const filter of await page.locator(".toolbar select").all()) {
        const bounds = await filter.boundingBox();
        expect(bounds!.height).toBeLessThanOrEqual(50);
      }
      for (const control of await page
        .locator("input:visible, select:visible, button:visible")
        .all()) {
        const box = await control.boundingBox();
        expect(
          box!.x,
          `${name} control clipped at ${width}px`,
        ).toBeGreaterThanOrEqual(-1);
        expect(
          box!.x + box!.width,
          `${name} control clipped at ${width}px`,
        ).toBeLessThanOrEqual(width + 1);
      }
      if (
        process.env.ARZDESK_QA_DIR &&
        name === "Overview" &&
        [320, 768, 1440].includes(width)
      )
        await page.screenshot({
          animations: "disabled",
          path: `${process.env.ARZDESK_QA_DIR}/overview-${width}.png`,
          fullPage: true,
        });
      await page
        .getByRole("button", { name: "Switch to dark mode", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${name} dark mode overflows at ${width}px`,
      ).toBe(true);
      if (
        process.env.ARZDESK_QA_DIR &&
        ["Overview", "Tasks", "Settings"].includes(name) &&
        [320, 768, 1440].includes(width)
      )
        await page.screenshot({
          animations: "disabled",
          path: `${process.env.ARZDESK_QA_DIR}/${name.toLowerCase()}-dark-${width}.png`,
          fullPage: true,
        });
      await page
        .getByRole("button", { name: "Switch to light mode", exact: true })
        .click();
      if (width <= 1100)
        for (const cell of await page.locator("tbody td").all()) {
          const box = await cell.boundingBox();
          expect(
            box!.x,
            `${name} card outside ${width}px`,
          ).toBeGreaterThanOrEqual(0);
          expect(
            box!.x + box!.width,
            `${name} card clipped at ${width}px`,
          ).toBeLessThanOrEqual(width);
        }
      if (
        process.env.ARZDESK_QA_DIR &&
        name === "Tasks" &&
        [320, 768, 1440].includes(width)
      )
        await page.screenshot({
          animations: "disabled",
          path: `${process.env.ARZDESK_QA_DIR}/tasks-${width}.png`,
          fullPage: true,
        });
    }
  }
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Tasks", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open quick guide" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const mobileBounds = await page.getByRole("dialog").boundingBox();
  expect(mobileBounds!.x).toBeGreaterThanOrEqual(0);
  expect(mobileBounds!.x + mobileBounds!.width).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByText("More details", { exact: false })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Priority", { exact: true })
    .selectOption("high");
  const landscapeDialog = await page.getByRole("dialog").boundingBox();
  expect(landscapeDialog!.y).toBeGreaterThanOrEqual(0);
  expect(landscapeDialog!.height).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  const metric = page
    .getByRole("region", { name: "Workspace statistics" })
    .getByRole("article")
    .filter({ hasText: "Completed tasks" });
  await expect(metric.locator(".metric-value")).toHaveText("01");
  await page.reload();
  await expect(metric.locator(".metric-value")).toHaveText("01");
  if (process.env.ARZDESK_QA_DIR)
    await page.locator(".app-shell:visible").screenshot({
      path: `${process.env.ARZDESK_QA_DIR}/dashboard-desktop.png`,
    });
  for (const [width, height] of [
    [1366, 640],
    [1280, 600],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    const dimensions = await page.evaluate(() => {
      const pane = document.querySelector(".page-content")!;
      const sidebar = document.querySelector(".sidebar")!;
      return {
        pageHeight: document.documentElement.scrollHeight,
        paneHeight: pane.clientHeight,
        paneScroll: pane.scrollHeight,
        sidebarHeight: sidebar.clientHeight,
        sidebarScroll: sidebar.scrollHeight,
      };
    });
    // Desktop keeps the document fixed, but lets its ONE content pane scroll.
    // Avoid crushing the overview cards just to fit a short laptop screen.
    expect(dimensions.pageHeight).toBeLessThanOrEqual(height);
    expect(dimensions.paneScroll).toBeGreaterThanOrEqual(
      dimensions.paneHeight,
    );
    expect(dimensions.sidebarScroll).toBeLessThanOrEqual(
      dimensions.sidebarHeight + 1,
    );
    const scroll = await page.locator(".page-content").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      return {
        scrollTop: el.scrollTop,
        overflow: getComputedStyle(el).overflowY,
      };
    });
    expect(scroll.overflow).toBe("auto");
    await expect(page.locator(".page-content > .footer")).toBeInViewport();
    if (process.env.ARZDESK_QA_DIR)
      await page.screenshot({
        path: `${process.env.ARZDESK_QA_DIR}/desktop-fit-${width}-${height}.png`,
        animations: "disabled",
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Your work at a glance" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/dashboard-mobile.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: "Team", exact: true }).click();

  await page
    .getByRole("button", { name: "Invite member", exact: true })
    .click();
  await page.getByRole("dialog").getByLabel("Email address").fill(invitee);
  await page
    .getByRole("dialog")
    .getByLabel("Workspace role", { exact: true })
    .selectOption("viewer");
  await page
    .getByRole("button", { name: "Create invitation", exact: true })
    .click();
  const inviteUrl = await page.locator(".invite-result").innerText();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const context = await browser.newContext();
  const viewer = await context.newPage();
  await viewer.goto(inviteUrl);
  await expect(viewer).toHaveURL(/sign-in/);
  await viewer.getByRole("link", { name: "Create an account" }).click();
  await signup(viewer, invitee);
  await expect(
    viewer.getByRole("button", { name: "Accept invitation" }),
  ).toBeVisible();
  await viewer.getByRole("button", { name: "Accept invitation" }).click();
  const invitedSession = await viewer.request.get("/api/auth/get-session");
  expect(invitedSession.status()).toBe(200);
  expect((await invitedSession.json()).user.email).toBe(invitee);
  await expect(
    viewer.getByText("You have viewer access.", { exact: false }),
  ).toBeVisible();
  await viewer
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Clients", exact: true })
    .click();
  await expect(
    viewer.getByRole("cell", { name: "client@example.com" }),
  ).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "Add client", exact: true }),
  ).toHaveCount(0);
  await viewer
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Tasks", exact: true })
    .click();
  await expect(
    viewer.getByLabel("Change status for Build the contact page"),
  ).toHaveCount(0);
  await viewer.goto(
    `${workspaceUrl}/tasks?project=11111111-1111-4111-8111-111111111111`,
  );
  await expect(
    viewer.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Remove Test User", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove member", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await viewer.goto(workspaceUrl);
  await expect(
    viewer.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await context.close();
  expect(browserErrors).toEqual([]);
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete Website redesign", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .getByRole("link", { name: "Tasks", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No tasks yet" }),
  ).toBeVisible();
});

test("forgot password delivers a reset link, changes credentials and invalidates old sessions", async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env.ARZDESK_TEST_MAILBOX,
    "Set ARZDESK_TEST_MAILBOX when a local SMTP capture is configured.",
  );
  const email = `recovery-${Date.now()}@example.com`;
  const oldPassword = "old-password-for-test-123";
  const newPassword = "new-password-for-test-456";
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill("Example User");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/workspaces$/);
  await page.getByLabel("Workspace name").fill("Recovery workspace");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/w\//);
  const recovery = await browser.newContext();
  const p = await recovery.newPage();
  await p.goto("/sign-in");
  if (process.env.ARZDESK_QA_DIR)
    await p.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/auth-sign-in.png`,
      fullPage: true,
    });
  await p.getByRole("link", { name: "Forgot password?", exact: true }).click();
  await p.getByLabel("Email address").fill(email);
  await p.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(
    p.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
  await expect
    .poll(() => {
      const inbox = JSON.parse(
        readFileSync(process.env.ARZDESK_TEST_MAILBOX!, "utf8"),
      ) as { to: string[] }[];
      return inbox.some((message) => message.to.includes(email));
    })
    .toBe(true);
  const messages = JSON.parse(
    readFileSync(process.env.ARZDESK_TEST_MAILBOX!, "utf8"),
  ) as { to: string[]; text: string }[];
  const mail = messages.find((m) => m.to.includes(email));
  expect(mail).toBeDefined();
  const resetLink = mail!.text.match(/http[^\s]+/)![0];
  await p.goto(resetLink);
  await p.getByLabel("New password", { exact: true }).fill(newPassword);
  await p.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
  await p.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(
    p.getByRole("heading", { name: "Password updated" }),
  ).toBeVisible();
  const oldSession = await page.request.get("/api/auth/get-session");
  expect(await oldSession.json()).toBeNull();
  const oldSignIn = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: oldPassword },
    headers: { Origin: "http://localhost:3000" },
  });
  expect(oldSignIn.status()).toBe(401);
  await p.getByRole("link", { name: "Back to sign in", exact: true }).click();
  await p.getByLabel("Email address").fill(email);
  await p.getByLabel("Password", { exact: true }).fill(newPassword);
  await p.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(p).toHaveURL(/\/w\/[^/]+\/overview$/);
  await p.goto(resetLink);
  await expect(
    p.getByText("This reset link is invalid or has expired.", { exact: false }),
  ).toBeVisible();
  await recovery.close();
});

test("only the hanging cedar toggles saved light and dark appearances", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/sign-in");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(page.getByLabel("Choose theme")).toHaveCount(0);
  await expect(page.locator(".auth-example")).toHaveCount(0);
  await expect(page.locator(".auth-art")).toBeVisible();
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(root).toHaveAttribute("data-theme", "dark");
  // Every click replays a visible pull, even with reduced-motion preferences.
  await expect
    .poll(
      async () =>
        page.locator(".cedar-pendant").evaluate((el) => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          return matrix.m42;
        }),
      { intervals: [20, 50, 100] },
    )
    .toBeGreaterThan(8);
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .evaluate((el: HTMLButtonElement) => el.click());
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect
    .poll(async () =>
      page
        .locator(".cedar-pendant")
        .evaluate((el) =>
          el.getAnimations().some((a) => a.playState === "running"),
        ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .evaluate((el: HTMLButtonElement) => el.click());
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect
    .poll(async () =>
      page
        .locator(".cedar-pendant")
        .evaluate((el) =>
          el.getAnimations().every((a) => a.playState === "finished"),
        ),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .evaluate((el: HTMLButtonElement) => el.click());
  await expect
    .poll(
      async () =>
        page
          .locator(".cedar-pendant")
          .evaluate(
            (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42,
          ),
      { intervals: [10, 20, 40] },
    )
    .toBeGreaterThan(1);
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .evaluate((el: HTMLButtonElement) => el.click());
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("arzdesk-theme"))).toBe(
    "dark",
  );
  if (process.env.ARZDESK_QA_DIR)
    await page.screenshot({
      animations: "disabled",
      path: `${process.env.ARZDESK_QA_DIR}/auth-dark.png`,
      fullPage: true,
    });
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".brand")).toBeVisible();
    await expect(page.locator(".auth-art")).toBeVisible();
    await page
      .getByRole("button", { name: "Switch to dark mode", exact: true })
      .click();
    await expect(root).toHaveAttribute("data-theme", "dark");
    if (process.env.ARZDESK_QA_DIR && width === 320)
      await page.screenshot({
        animations: "disabled",
        path: `${process.env.ARZDESK_QA_DIR}/auth-dark-mobile.png`,
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Switch to light mode", exact: true })
      .click();
  }
});

test("profile saves name, confirms email, changes password and logs out", async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env.ARZDESK_TEST_MAILBOX,
    "Requires a local SMTP capture.",
  );
  const stamp = Date.now(),
    email = `profile-${stamp}@example.com`,
    updatedEmail = `changed-${stamp}@example.com`;
  const oldPassword = "profile-test-password-123",
    newPassword = "profile-new-password-456";
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill("Example Person");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(oldPassword);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Workspace name").fill("Example team");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/w\//);
  const base = page
    .url()
    .replace(/\/overview$/, "")
    .replace(/\/$/, "");
  // The navigation DOM remains mounted through a route transition.
  const nav = await page
    .getByRole("navigation", { name: "Workspace navigation" })
    .elementHandle();
  await page.getByRole("link", { name: "Clients", exact: true }).click();
  expect(await nav!.evaluate((n) => n.isConnected)).toBe(true);
  await expect(
    page.getByText("Loading your workspace…", { exact: true }),
  ).toHaveCount(0);
  // Scroll the real page and verify navigation remains visible on desktop and phone.
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 400 });
    await page.evaluate(() => {
      const pane = document.querySelector(".page-content")!;
      if (innerWidth > 1100) pane.scrollTop = pane.scrollHeight;
      else window.scrollTo(0, document.body.scrollHeight);
    });
    if (width > 1100) expect(await page.evaluate(() => window.scrollY)).toBe(0);
    else expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const box = await (
      width > 1100
        ? page.getByRole("navigation", {
            name: "Workspace navigation",
            exact: true,
          })
        : page.getByRole("button", { name: "Open workspace menu", exact: true })
    ).boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThan(400);
  }
  await page.goto(`${base}/clients?view=recent`);
  const accountOrigin = page.url();
  const accountTrigger = page.getByRole("button", {
    name: "Open account menu",
    exact: true,
  });
  await expect(accountTrigger).toHaveCount(1);
  await expect(page.locator(".sidebar .profile")).toHaveCount(0);
  await accountTrigger.click();
  const drawer = page.getByRole("dialog", {
    name: "Your account",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Logout", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(accountTrigger).toBeFocused();
  await accountTrigger.click();
  await page.mouse.click(5, 300);
  await expect(drawer).not.toBeVisible();
  await accountTrigger.click();
  await drawer.getByRole("link", { name: /Settings/ }).click();
  await expect(
    page.getByRole("heading", { name: "Account settings", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(accountOrigin);
  await page
    .getByRole("button", { name: "Open account menu", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Your account", exact: true })
    .getByRole("link", { name: /Settings/ })
    .click();
  expect(
    await page
      .locator(".account-content")
      .evaluate((el) => getComputedStyle(el).overflowY),
  ).toBe("visible");
  await page.getByLabel("Full name", { exact: true }).fill("اسم تجريبي");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Profile name updated.");
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "اسم تجريبي",
  );
  // Keep another authenticated browser session to check password revocation.
  const other = await browser.newContext();
  const second = await other.newPage();
  await second.goto("/sign-in");
  await second.getByLabel("Email address").fill(email);
  await second.getByLabel("Password", { exact: true }).fill(oldPassword);
  await second.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(second).toHaveURL(/\/w\//);
  await page.getByRole("tab", { name: "Email address", exact: true }).click();
  await page
    .getByLabel("New email address", { exact: true })
    .fill(updatedEmail);
  await page
    .getByRole("button", { name: "Confirm email change", exact: true })
    .click();
  await expect
    .poll(() =>
      JSON.parse(readFileSync(process.env.ARZDESK_TEST_MAILBOX!, "utf8")).some(
        (m: { to: string[] }) => m.to.includes(updatedEmail),
      ),
    )
    .toBe(true);
  const sessionBefore = await page.request.get("/api/auth/get-session");
  expect((await sessionBefore.json()).user.email).toBe(email);
  const messages = JSON.parse(
    readFileSync(process.env.ARZDESK_TEST_MAILBOX!, "utf8"),
  ) as { to: string[]; text: string }[];
  const link = messages
    .find((m) => m.to.includes(updatedEmail))!
    .text.match(/http[^\s]+/)![0];
  await page.goto(link);
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole("tab", { name: "Email address", exact: true }).click();
  await expect(page.locator(".current-email strong")).toHaveText(updatedEmail);
  await page.getByRole("tab", { name: "Password", exact: true }).click();
  await page
    .getByLabel("Current password", { exact: true })
    .fill("wrong-password-123");
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill(newPassword);
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Current password", { exact: true }).fill(oldPassword);
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Password updated.");
  expect(
    await (await second.request.get("/api/auth/get-session")).json(),
  ).toBeNull();
  await page.addStyleTag({
    content: "::-webkit-scrollbar { width: 15px; height: 15px; }",
  });
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (process.env.ARZDESK_QA_DIR)
      await page.screenshot({
        animations: "disabled",
        path: `${process.env.ARZDESK_QA_DIR}/profile-${width}.png`,
        fullPage: true,
      });
    await page
      .getByRole("button", { name: "Open account menu", exact: true })
      .click();
    const panel = page.getByRole("dialog", {
      name: "Your account",
      exact: true,
    });
    // Measure after the entry animation has reached its resting position.
    await expect
      .poll(async () => {
        const b = await panel.boundingBox();
        return b!.x + b!.width;
      })
      .toBeLessThanOrEqual(width + 0.5);
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 0.5);
    if (process.env.ARZDESK_QA_DIR)
      await page.screenshot({
        path: `${process.env.ARZDESK_QA_DIR}/drawer-${width}.png`,
        animations: "disabled",
      });
    await panel
      .getByRole("button", { name: "Close account menu", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Open account menu", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Your account", exact: true })
    .getByRole("button", { name: "Logout", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(
    await (await page.request.get("/api/auth/get-session")).json(),
  ).toBeNull();
  await page.getByLabel("Email address").fill(updatedEmail);
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  await other.close();
});

test("each authentication screen explains its purpose with its own illustration", async ({
  page,
}) => {
  const scenes = [
    ["sign-in", "Right where you left off."],
    ["sign-up", "Build your next chapter."],
    ["forgot-password", "A way back to your work."],
    ["reset-password", "New password. Peace of mind."],
  ];
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [route, title] of scenes) {
    await page.goto(`/${route}`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("A little clarity.", { exact: false }),
    ).toHaveCount(0);
    await page.setViewportSize({ width: 1366, height: 640 });
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(640);
    if (process.env.ARZDESK_QA_DIR)
      await page.screenshot({
        path: `${process.env.ARZDESK_QA_DIR}/${route}-laptop-640.png`,
        animations: "disabled",
      });
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"]) {
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
          await page
            .getByRole("button", {
              name: `Switch to ${theme} mode`,
              exact: true,
            })
            .click();
        await expect(
          page.locator(`[data-illustration="${route}"]`),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (process.env.ARZDESK_QA_DIR)
          await page.screenshot({
            path: `${process.env.ARZDESK_QA_DIR}/${route}-${theme}-${width}.png`,
            fullPage: true,
            animations: "disabled",
          });
      }
    }
  }
});

test("a touch browser can load dev assets, create an account and sign in on the configured network host", async ({
  browser,
}) => {
  test.skip(
    !process.env.ARZDESK_LAN_TEST_URL,
    "Requires the configured network-host development server.",
  );
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await phone.newPage();
  const blocked: string[] = [];
  page.on("response", (r) => {
    if (r.status() === 403 && /\/_next\/|\/__nextjs_/.test(r.url()))
      blocked.push(r.url());
  });
  const origin = process.env.ARZDESK_LAN_TEST_URL!;
  const email = `phone-${Date.now()}@example.com`,
    password = "phone-test-password-123";
  await page.goto(`${origin}/sign-up`);
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .tap();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Your name").fill("Example Person");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).tap();
  await expect(page).toHaveURL(`${origin}/workspaces`);
  await page.getByLabel("Workspace name").fill("Phone test workspace");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .tap();
  await expect(page).toHaveURL(/\/w\/[^/]+(?:\/overview)?$/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open workspace menu", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open account menu", exact: true })
    .tap();
  await page
    .getByRole("dialog", { name: "Your account", exact: true })
    .getByRole("button", { name: "Logout", exact: true })
    .tap();
  await expect(page).toHaveURL(`${origin}/sign-in`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).tap();
  await expect(page).toHaveURL(/\/w\/[^/]+(?:\/overview)?$/);
  expect(blocked).toEqual([]);
  await phone.close();
});

test("unhydrated credential forms use POST and never put passwords in the URL", async ({
  browser,
}) => {
  const plain = await browser.newContext({ javaScriptEnabled: false });
  const page = await plain.newPage();
  for (const route of ["sign-in", "sign-up"]) {
    await page.goto(`/${route}`);
    // Isolate the actual SSR form from Next's JavaScript-only streaming reveal.
    // The browser still submits that form to the real server without hydration.
    const html = await page.locator(".auth-card").innerHTML();
    await page.setContent(html);
    if (route === "sign-up")
      await page.getByLabel("Your name").fill("Example Person");
    await page.getByLabel("Email address").fill("no-js-test@example.com");
    await page
      .getByLabel("Password", { exact: true })
      .fill("dummy-test-password-123");
    const submit = page.locator('button[type="submit"]');
    await expect(submit).toBeDisabled();
    // Even a browser that bypasses disabled controls uses the safe POST fallback.
    await submit.evaluate((el: HTMLButtonElement) => {
      el.disabled = false;
    });
    const sent = page.waitForRequest((r) =>
      r.url().includes("/auth/page-not-ready"),
    );
    await page
      .getByRole("button", {
        name: "Loading…",
        exact: true,
      })
      .click();
    expect((await sent).method()).toBe("POST");
    await expect(page).toHaveURL(/\/sign-in\?error=page-not-ready$/);
    expect(page.url()).not.toContain("password");
    expect(await page.locator(".auth-card .error").textContent()).toContain(
      "page did not finish loading",
    );
  }
  await plain.close();
});
