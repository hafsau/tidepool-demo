import { describe, expect, it } from "vitest";
import { at } from "@/lib/clock";
import { deriveLoop, freshnessFor, GLUCOSE_RECENCY_MIN, TEMP_BASAL_MAX_MIN } from "@/lib/loop";
import { statusModel, trendOf } from "@/lib/screen-model";
import { cgmReadings, cgmStateAt, DEVICES, SCENARIO, WARMUP_ENDS_AT } from "@/lib/timeline";

const readings = cgmReadings();
const everyMinute = Array.from({ length: SCENARIO.end - SCENARIO.start + 1 }, (_, i) => SCENARIO.start + i);

describe("timeline", () => {
  it("is deterministic for a seed", () => {
    expect(cgmReadings(7)).toEqual(cgmReadings(7));
    expect(cgmReadings(7)).not.toEqual(cgmReadings(8));
  });

  it("has no readings between sensor expiry and the end of warmup", () => {
    const inGap = readings.filter((r) => r.t > SCENARIO.sensorExpiresAt && r.t < WARMUP_ENDS_AT);
    expect(inGap).toEqual([]);
    expect(readings.some((r) => r.t === SCENARIO.sensorExpiresAt)).toBe(true);
    expect(readings.some((r) => r.t === WARMUP_ENDS_AT)).toBe(true);
  });

  it("keeps warmup at the modeled device's 60 minutes", () => {
    expect(WARMUP_ENDS_AT - SCENARIO.newSensorInsertedAt).toBe(DEVICES.cgm.warmupMin);
  });
});

describe("ring freshness uses Loop's 6 / 16 minute limits", () => {
  it.each([
    [0, "fresh"],
    [6, "fresh"],
    [7, "aging"],
    [16, "aging"],
    [17, "stale"],
    [null, "stale"],
  ] as const)("%s min → %s", (age, expected) => {
    expect(freshnessFor(age)).toBe(expected);
  });
});

describe("safety invariants, checked at every minute of the evening", () => {
  it.each(everyMinute)("t=%i", (now) => {
    const v = deriveLoop({ now, readings });
    const m = statusModel(now);

    // (a) No "Automation on" and no dosing decision on glucose older than 15 min,
    // and never while a new sensor is warming up.
    if (!v.glucose || v.glucose.ageMin > GLUCOSE_RECENCY_MIN) {
      expect(v.canDose).toBe(false);
      expect(m.status.label).not.toBe("Automation on");
      expect(m.glucose.display).toBe("– – –");
    }
    if (m.status.label === "Automation on") expect(cgmStateAt(now).kind).not.toBe("warmup");

    // (b) "Suspended" never appears while the pump is delivering basal. The
    // parity test also scans every rendered step for the word.
    expect(`${m.basal.title} ${m.basal.detail} ${m.status.label} ${m.status.reason} ${m.cgm.label} ${m.cgm.detail}`).not.toMatch(/suspend/i);

    // (c) Basal state and time left are always present.
    expect(m.basal.rate).toMatch(/U\/hr$/);
    if (v.basal.kind === "temp") {
      expect(v.basal.minutesLeft).toBeGreaterThan(0);
      expect(v.basal.minutesLeft).toBeLessThanOrEqual(TEMP_BASAL_MAX_MIN);
      expect(m.basal.detail).toMatch(/min left/);
    }

    // (d) Every glucose value carries its age.
    expect(m.glucose.ageLabel.length).toBeGreaterThan(0);
    if (!m.glucose.stale) expect(m.glucose.ageLabel).toMatch(/ago|just now/);
  });

  it("only temp basals count down; the last one runs out 30 min after the last loop", () => {
    expect(deriveLoop({ now: at(20, 9), readings }).basal.kind).toBe("temp");
    expect(deriveLoop({ now: at(20, 10), readings }).basal.kind).toBe("scheduled");
  });

  it("shows suspended only when the pump really is suspended", () => {
    expect(deriveLoop({ now: at(18), readings, pumpSuspended: true }).basal.kind).toBe("suspended");
  });

  it("resumes on the first reading after warmup with no user action", () => {
    expect(deriveLoop({ now: WARMUP_ENDS_AT - 1, readings }).canDose).toBe(false);
    const back = deriveLoop({ now: WARMUP_ENDS_AT, readings });
    expect(back.canDose).toBe(true);
    expect(back.statusLabel).toBe("Automation on");
  });

  it("shows no trend across the sensor gap or on a new sensor's first readings", () => {
    expect(statusModel(WARMUP_ENDS_AT).glucose.trend).toBeNull();
    expect(statusModel(WARMUP_ENDS_AT + 5).glucose.trend).toBeNull();
    expect(statusModel(WARMUP_ENDS_AT + 10).glucose.trend).not.toBeNull();
    expect(trendOf(readings, at(18))).not.toBeNull();
  });

  it("explains why automation is unavailable", () => {
    expect(statusModel(at(20, 0)).status.reason).toMatch(/Sensor expired/);
    expect(statusModel(at(20, 15), { pairing: true }).status.reason).toMatch(/No sensor connected/);
    expect(statusModel(at(20, 40)).status.reason).toMatch(/warming up/);
  });
});
