import { expect, test } from "@playwright/test";
import { acknowledged } from "./helpers";

for (const path of ["/", "/matrix", "/risk", "/about"]) {
  test(`no sideways page scroll on ${path}`, async ({ page }) => {
    await acknowledged(page);
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("one frame at a time on a phone, both on desktop", async ({ page }, info) => {
  await acknowledged(page);
  await page.goto("/?flow=sensor&step=s-stale");
  const ios = page.getByRole("figure", { name: /^iOS reference/ });
  const android = page.getByRole("figure", { name: /^Android proposed/ });
  await expect(android).toBeVisible();
  if (info.project.name === "mobile") {
    await expect(ios).toBeHidden();
    await page.getByRole("radio", { name: "iOS reference" }).click();
    await expect(ios).toBeVisible();
    await expect(android).toBeHidden();
  } else {
    await expect(ios).toBeVisible();
  }
});
