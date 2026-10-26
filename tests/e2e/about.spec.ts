import { expect, test } from "@playwright/test";

test("public product page has readable calls to action and fits mobile", async ({
  page,
}, testInfo) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "Make room for what matters." }),
  ).toBeVisible();

  const buttons = [
    {
      label: "Install ArzDesk",
      href: "/install",
      color: "rgb(255, 255, 255)",
      background: "rgb(24, 24, 24)",
    },
    {
      label: "Open ArzDesk",
      href: "/offline",
      color: "rgb(24, 24, 24)",
      background: "rgb(255, 255, 255)",
    },
    {
      label: "Install on your device",
      href: "/install",
      color: "rgb(255, 255, 255)",
      background: "rgba(0, 0, 0, 0)",
    },
    {
      label: "See installation steps",
      href: "/install",
      color: "rgb(255, 255, 255)",
      background: "rgb(24, 24, 24)",
    },
    {
      label: "Explore the source",
      href: "https://github.com/a60ukarim/ArzDesk",
      color: "rgb(24, 24, 24)",
      background: "rgba(0, 0, 0, 0)",
    },
  ];

  const robots = await page
    .locator('meta[name="robots"]')
    .getAttribute("content");
  expect(robots?.includes("noindex")).toBe(false);
  await expect(
    page.getByText("Device work does not automatically sync", { exact: false }),
  ).toBeVisible();

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const width of [320, 390, 768, 1366]) {
      await page.setViewportSize({ width, height: 750 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);

      for (const button of buttons) {
        const locator = page.getByRole("link", {
          name: button.label,
          exact: true,
        });
        await expect(locator).toBeVisible();
        await expect(locator).toHaveAttribute("href", button.href);
        const actual = await locator.evaluate((element) => {
          const styles = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            color: styles.color,
            background: styles.backgroundColor,
            width: rect.width,
            height: rect.height,
          };
        });
        expect(
          actual.color,
          `Text contrast: ${button.label} at ${width}px in ${theme}`,
        ).toBe(button.color);
        expect(
          actual.background,
          `Background: ${button.label} at ${width}px in ${theme}`,
        ).toBe(button.background);
        expect(actual.width).toBeGreaterThan(35);
        expect(actual.height).toBeGreaterThan(30);
      }

      if (width === 390 && theme === "light") {
        await testInfo.attach("public-landing-mobile.png", {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      }
      if (width === 1366 && theme === "light") {
        await testInfo.attach("public-landing-desktop.png", {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      }
    }
  }
});
