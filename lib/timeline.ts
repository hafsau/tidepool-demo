import { at } from "./clock";
import { mulberry32 } from "./rng";

/*
 * One mock evening for Flow 2. Every number here is scripted; nothing is
 * entered by the viewer and nothing is a dosing recommendation.
 *
 * The devices are fictional on purpose. Their lifecycles are modeled on real
 * ones and cited on /about:
 *  - iCGM: 15-day wear, 60-minute warmup, no calibration (modeled on a
 *    Libre 3 Plus–class sensor).
 *  - ACE pump: scheduled basal 0.85 U/hr all evening.
 */
export const DEVICES = {
  cgm: { name: "Demo iCGM", wearDays: 15, warmupMin: 60, intervalMin: 5 },
  pump: { name: "Demo ACE pump", scheduledRate: 0.85 },
} as const;

export const SCENARIO = {
  start: at(14),
  end: at(22),
  sensorExpiresAt: at(19, 40),
  newSensorInsertedAt: at(20, 20),
  mealAt: at(20, 35),
  mealCarbs: 45,
  fingerstickMgdl: 132,
} as const;

export const WARMUP_ENDS_AT = SCENARIO.newSensorInsertedAt + DEVICES.cgm.warmupMin;

export type Reading = { t: number; mgdl: number };

// A smooth evening curve: gentle afternoon drift, the meal during warmup
// pushes glucose up, and it comes back down once automation resumes.
function shape(t: number): number {
  const afternoon = 128 + 14 * Math.sin((t - at(14)) / 70);
  const meal = t > SCENARIO.mealAt ? 70 * Math.max(0, Math.sin(Math.min(Math.PI, (t - SCENARIO.mealAt) / 40))) : 0;
  return afternoon + meal;
}

export function cgmReadings(seed = 7): Reading[] {
  const rand = mulberry32(seed);
  const out: Reading[] = [];
  for (let t = SCENARIO.start; t <= SCENARIO.end; t += DEVICES.cgm.intervalMin) {
    const noise = (rand() - 0.5) * 8;
    // The gap: the old sensor's last value is at expiry; the new one reports
    // nothing until warmup ends.
    if (t > SCENARIO.sensorExpiresAt && t < WARMUP_ENDS_AT) continue;
    out.push({ t, mgdl: Math.round(shape(t) + noise) });
  }
  return out;
}

export function lastReadingAtOrBefore(readings: Reading[], now: number): Reading | null {
  let last: Reading | null = null;
  for (const r of readings) {
    if (r.t > now) break;
    last = r;
  }
  return last;
}

// The scripted temp basal Loop "enacted" at each completed loop. Rounded to
// the pump's 0.05 U/hr step. Illustrative only: not the Loop algorithm.
export function scriptedTempRate(mgdl: number): number {
  const raw = DEVICES.pump.scheduledRate + (mgdl - 120) * 0.012;
  return Math.round(Math.min(2.5, Math.max(0, raw)) * 20) / 20;
}

export type CgmState =
  | { kind: "ok" }
  | { kind: "expiring"; minutesLeft: number }
  | { kind: "expired" }
  | { kind: "pairing" }
  | { kind: "warmup"; minutesLeft: number };

export function cgmStateAt(now: number, pairing = false): CgmState {
  if (now < SCENARIO.sensorExpiresAt) {
    const left = SCENARIO.sensorExpiresAt - now;
    return left <= 60 * 6 ? { kind: "expiring", minutesLeft: left } : { kind: "ok" };
  }
  if (now < SCENARIO.newSensorInsertedAt) return pairing ? { kind: "pairing" } : { kind: "expired" };
  if (now < WARMUP_ENDS_AT) return { kind: "warmup", minutesLeft: WARMUP_ENDS_AT - now };
  return { kind: "ok" };
}
