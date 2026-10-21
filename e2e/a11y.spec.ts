import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ALL_STEPS, hasDenyPath } from "../lib/flows";
import { acknowledged } from "./helpers";

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test("concept note", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await axe(page);
});

for (const path of ["/matrix", "/risk", "/about"]) {
  test(`page ${path}`, async ({ page }) => {
    await page.goto(path);
    await axe(page);
  });
}

for (const step of ALL_STEPS) {
  test(`step ${step.id}`, async ({ page }) => {
    await acknowledged(page);
    await page.goto(`/?flow=${step.flow}&step=${step.id}&hf=1&lv=1`);
    await expect(page.getByRole("figure").first()).toBeVisible();
    await axe(page);
    if (hasDenyPath(step)) {
      await page.goto(`/?flow=${step.flow}&step=${step.id}&deny=1`);
      await axe(page);
    }
  });
}
