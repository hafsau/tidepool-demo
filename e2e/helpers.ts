import type { Page } from "@playwright/test";

/** Skip the one-time concept note, as a returning visitor would. */
export async function acknowledged(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("parity-concept-ack", "1");
    } catch {}
  });
}
