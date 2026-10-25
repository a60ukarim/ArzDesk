import { expect, test } from "@playwright/test";

test("public product page explains offline limitations and works on mobile", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "Make room for what matters." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Start free" })).toHaveAttribute(
    "href",
    "/offline",
  );
  await expect(
    page.getByRole("link", { name: "Install ArzDesk" }),
  ).toHaveAttribute("href", "/install");

  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots?.includes("noindex")).toBe(false);
  await expect(
    page.getByText("Device work does not automatically sync", { exact: false }),
  ).toBeVisible();

  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 750 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
