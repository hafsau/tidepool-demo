import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IosScreen } from "@/components/ios/ios-screen";
import { M3Screen } from "@/components/m3/m3-screen";
import { FrameContext } from "@/components/shared/critical";
import { ALL_STEPS, criticalFor, hasDenyPath, type Oem, type Platform, type Step } from "@/lib/flows";

/*
 * The parity contract: for every step, deny path and OEM variant, each
 * renderer shows exactly the critical items the step declares. A renderer can
 * lay things out however its platform wants; it can't drop a fact.
 */
function rendered(step: Step, platform: Platform, deny: boolean, oem: Oem): string {
  const order = criticalFor(step, { platform, deny });
  const html = renderToStaticMarkup(
    <FrameContext.Provider value={{ order, hf: false, lv: false }}>
      {platform === "ios" ? <IosScreen step={step} deny={deny} /> : <M3Screen step={step} deny={deny} oem={oem} />}
    </FrameContext.Provider>,
  );
  return html;
}

/** Critical ids in DOM (reading) order, first occurrence only. */
function order(html: string): string[] {
  return [...new Set([...html.matchAll(/data-critical="([^"]+)"/g)].map((m) => m[1]))];
}

/** Visible text only, for copy checks. */
function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'");
}

const cases = ALL_STEPS.flatMap((step) => {
  const denies = hasDenyPath(step) ? [false, true] : [false];
  const oems: Oem[] = step.screen.kind === "permission" && step.screen.oem ? ["pixel", "samsung", "xiaomi"] : ["pixel"];
  return denies.flatMap((deny) => oems.map((oem) => ({ name: `${step.id}${deny ? " (denied)" : ""} [${oem}]`, step, deny, oem })));
});

describe("both renderers surface every critical item, in the stated screen-reader order", () => {
  it.each(cases)("$name", ({ step, deny, oem }) => {
    for (const platform of ["ios", "android"] as const) {
      expect(order(rendered(step, platform, deny, oem)), platform).toEqual(criticalFor(step, { platform, deny }));
    }
  });

  it.each(cases)("in-frame copy of $name never says suspended or names Loop", ({ step, deny, oem }) => {
    for (const platform of ["ios", "android"] as const) {
      const t = text(rendered(step, platform, deny, oem));
      expect(t, platform).not.toMatch(/suspend/i);
      expect(t, platform).not.toMatch(/\bLoop\b/);
    }
  });

  it("covers both flows", () => {
    expect(new Set(ALL_STEPS.map((s) => s.flow))).toEqual(new Set(["permissions", "sensor"]));
    expect(cases.length).toBeGreaterThan(ALL_STEPS.length);
  });
});

describe("content guardrails", () => {
  it("every step has an HF note and a parity note", () => {
    for (const s of ALL_STEPS) {
      expect(s.hf.controls.length, s.id).toBeGreaterThan(0);
      expect(s.parity.ios && s.parity.android, s.id).toBeTruthy();
    }
  });

  it("never names a real pump, CGM or Tidepool, and claims no outcomes", () => {
    const all = JSON.stringify(ALL_STEPS);
    expect(all).not.toMatch(/Tidepool|twiist|Omnipod|Dexcom|Libre|Eversense/i);
    expect(all).not.toMatch(/\bvalidated\b|\bsafe\b|% fewer/i);
  });

  it("blocks setup without notifications or Bluetooth", () => {
    for (const id of ["p-nearby", "p-notifications"]) {
      const s = ALL_STEPS.find((x) => x.id === id)!.screen;
      expect(s.kind === "permission" && s.denied.blocksSetup, id).toBe(true);
    }
  });
});
