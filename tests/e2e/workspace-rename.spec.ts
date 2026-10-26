import { expect, test } from "@playwright/test";

test("quick rename changes only one offline workspace and keeps its ID", async ({
  page,
}) => {
  await page.goto("/offline");
  await expect(
    page.getByText("Ready for offline use", { exact: false }),
  ).toBeVisible({ timeout: 60000 });
  for (let i = 0; i < 2; i++) {
    if (i) await page.locator(".local-add-workspace summary").click();
    await page.getByLabel("Workspace name", { exact: true }).fill("Studio");
    await page.getByRole("button", { name: "Create workspace", exact: true }).click();
    await page.goto("/offline");
  }

  const cards = page.locator(".local-workspaces .org-card");
  await expect(cards).toHaveCount(2);
  const first = await cards.nth(0).getAttribute("href");
  const second = await cards.nth(1).getAttribute("href");
  expect(first).not.toBe(second);

  await page
    .getByRole("button", { name: "Edit name for Studio" })
    .first()
    .click();
  const editor = page.locator(".workspace-rename-form").first();
  await editor.getByRole("textbox", { name: "New name for Studio" }).fill("Studio Alpha");
  await editor.getByRole("button", { name: "Save name" }).click();

  await expect(page.locator(".local-workspaces .org-card").first())
    .toContainText("Studio Alpha");
  await expect(page.locator(".local-workspaces .org-card").nth(1))
    .toContainText("Studio");
  await expect(cards.nth(0)).toHaveAttribute("href", first!);
  await expect(cards.nth(1)).toHaveAttribute("href", second!);

  await page.reload();
  await expect(page.locator(".local-workspaces .org-card").first())
    .toContainText("Studio Alpha");
  await expect(page.locator(".local-workspaces .org-card").nth(1))
    .toContainText("Studio");
  await page.goto(`/offline${first}`);
  await expect(page.getByRole("heading", { name: "Your work at a glance" }))
    .toBeVisible();
});

test("owner can quickly rename online workspace without changing its URL", async ({
  page,
}) => {
  await page.goto("/sign-up");
  const email = `rename-${Date.now()}@example.com`;
  await page.getByLabel("Your name").fill("Rename Test");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("a-strong-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/workspaces$/);
  await page.getByLabel("Workspace name").fill("Mistkae Studio");
  await page.getByRole("button", { name: "Create workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/w\//);
  const workspaceId = new URL(page.url()).pathname.split("/")[2];

  await page.goto("/workspaces");
  await page.getByRole("button", { name: "Edit name for Mistkae Studio" }).click();
  const editor = page.locator(".workspace-rename-form");
  await editor.getByRole("textbox", { name: "New name for Mistkae Studio" })
    .fill("Studio");
  await editor.getByRole("button", { name: "Save name" }).click();
  await expect(page.locator(".org-card")).toContainText("Studio");
  await expect(page.locator(".org-card")).not.toContainText("Mistkae");

  await page.reload();
  await expect(page.locator(".org-card")).toContainText("Studio");
  await page.locator(".org-card").click();
  await expect(page).toHaveURL(new RegExp("/w/" + workspaceId + "(?:/overview)?$"));
});
