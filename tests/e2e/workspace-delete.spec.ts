import { expect, test } from "@playwright/test";

test("deleting one same-name offline workspace leaves the other untouched", async ({
  page,
}) => {
  await page.goto("/offline");
  await expect(
    page.getByText("Ready for offline use", { exact: false }),
  ).toBeVisible({ timeout: 60000 });

  await page.getByLabel("Workspace name", { exact: true }).fill("Studio");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page.goto("/offline");

  await page.locator(".local-add-workspace summary").click();
  await page.getByLabel("Workspace name", { exact: true }).fill("Studio");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page.goto("/offline");

  const cards = page.locator(".local-workspaces .org-card");
  await expect(cards).toHaveCount(2);
  const first = await cards.nth(0).getAttribute("href");
  const second = await cards.nth(1).getAttribute("href");
  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  expect(first).not.toBe(second);

  await page.goto(`/offline${first?.replace("/overview", "/settings")}`);
  await page.getByRole("button", { name: "Delete workspace…" }).click();
  const confirm = page.getByLabel("Confirm workspace name");
  await confirm.fill("Wrong");
  await expect(
    page.getByRole("button", { name: "Delete permanently" }),
  ).toBeDisabled();
  await confirm.fill("Studio");
  await page.getByRole("button", { name: "Delete permanently" }).click();

  await expect(
    page.getByRole("heading", { name: "Your workspaces." }),
  ).toBeVisible();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute("href", second!);
});
