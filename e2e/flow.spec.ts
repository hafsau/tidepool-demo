import { expect, test } from "@playwright/test";
import { FLOWS } from "../lib/flows";
import { acknowledged } from "./helpers";

test("first visit shows the concept note once", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "A design concept, not a medical device" });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "I understand" }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Critical tasks, held to the iOS bar" })).toBeVisible();
  await expect(dialog).toBeHidden();
});

for (const [flowId, flow] of Object.entries(FLOWS)) {
  test(`walks every step of ${flow.title} on both platforms`, async ({ page }) => {
    await acknowledged(page);
    await page.goto(`/?flow=${flowId}`);
    for (const [i, step] of flow.steps.entries()) {
      await expect(page.getByRole("button", { name: `${i + 1} ${step.label}` })).toHaveAttribute("aria-current", "step");
      await expect(page.getByRole("figure", { name: new RegExp(`^iOS reference: ${step.label}`) })).toBeVisible();
      await expect(page.getByRole("figure", { name: new RegExp(`^Android proposed: ${step.label}`) })).toBeVisible();
      if (i > 0) await expect(page).toHaveURL(new RegExp(`step=${step.id}`));
      if (i < flow.steps.length - 1) await page.getByRole("button", { name: "Next step" }).click();
    }
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
  });
}

test("arrow keys don't change the step behind the open concept note", async ({ page }) => {
  await page.goto("/?flow=sensor");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page).not.toHaveURL(/step=s-expired/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("deep link opens the exact moment, without the concept note", async ({ page }) => {
  await page.goto("/?flow=sensor&step=s-stale&hf=1");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Step 4 of 10.")).toBeVisible();
  const android = page.getByRole("figure", { name: /^Android proposed: Automation stops/ });
  await expect(android.getByText("Automation unavailable", { exact: true })).toBeVisible();
  await expect(android.getByText("– – –")).toBeVisible();
  await expect(page.getByRole("switch", { name: "HF overlay" })).toHaveAttribute("aria-checked", "true");
});

test("deny path blocks setup without notifications", async ({ page }) => {
  await acknowledged(page);
  await page.goto("/?flow=permissions&step=p-notifications");
  await page.getByRole("switch", { name: "Deny path" }).click();
  await expect(page).toHaveURL(/deny=1/);
  for (const name of [/^iOS reference/, /^Android proposed/]) {
    await expect(page.getByRole("figure", { name }).getByText("Setup can't finish until this is allowed.")).toBeVisible();
  }
});

test("phone maker switch changes the battery guidance", async ({ page }) => {
  await acknowledged(page);
  await page.goto("/?flow=permissions&step=p-battery");
  const android = page.getByRole("figure", { name: /^Android proposed/ });
  await expect(android.getByText("Let app always run in background?")).toBeVisible();
  await page.getByLabel("Phone").selectOption("samsung");
  await expect(android.getByText("After you allow the system dialog, Samsung also needs")).toBeVisible();
  await expect(page).toHaveURL(/oem=samsung/);
});

test("arrow keys on the flow switch move between flows, not steps", async ({ page }) => {
  await acknowledged(page);
  await page.goto("/?flow=permissions&step=p-dnd");
  await page.getByRole("radio", { name: /Alert delivery setup/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Sensor replacement/ })).toBeFocused();
  await expect(page).toHaveURL(/flow=sensor&step=s-expiring/);
});

test("low vision text never clips sideways inside a frame", async ({ page }) => {
  await acknowledged(page);
  for (const step of ["s-stale", "s-scheduled", "p-dnd", "p-battery"]) {
    const flow = step.startsWith("s-") ? "sensor" : "permissions";
    await page.goto(`/?flow=${flow}&step=${step}&lv=1`);
    const overflow = await page.locator('[aria-label="Screen content"]').evaluateAll((els) => els.map((e) => e.scrollWidth - e.clientWidth));
    expect(overflow.every((o) => o <= 0), `${step}: ${overflow}`).toBe(true);
  }
});

test("arrow keys step through", async ({ page }) => {
  await acknowledged(page);
  await page.goto("/?flow=sensor");
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/step=s-expired/);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/step=s-expiring/);
});

test("matrix copies a review ticket", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/matrix");
  await page.getByRole("button", { name: "Copy ticket" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain("||Flow||Step||User task||Candidate critical?||Delta||iOS||Android||Risk ref||");
});
