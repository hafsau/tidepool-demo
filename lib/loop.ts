import { DEVICES, lastReadingAtOrBefore, scriptedTempRate, type Reading } from "./timeline";

/*
 * What the status screen is allowed to say, derived from device state and the
 * clock. This mirrors the published Loop rules the demo depends on; the
 * thresholds are named so /about can cite them.
 *
 *  - Loop makes no dosing decision when the newest glucose is older than
 *    GLUCOSE_RECENCY_MIN.
 *  - Every temp basal Loop sets lasts at most TEMP_BASAL_MAX_MIN. If Loop stops
 *    completing, the last one runs out and the pump goes back to scheduled
 *    basal on its own. Closed loop stays on; nothing "switches modes".
 *  - The status ring ages with time since the last completed loop.
 */
export const GLUCOSE_RECENCY_MIN = 15;
export const TEMP_BASAL_MAX_MIN = 30;
export const RING_FRESH_MAX_MIN = 6;
export const RING_AGING_MAX_MIN = 16;

export type Freshness = "fresh" | "aging" | "stale";

export type TempBasal = { rate: number; startedAt: number; endsAt: number };

export type Basal =
  | { kind: "temp"; rate: number; endsAt: number; minutesLeft: number }
  | { kind: "scheduled"; rate: number }
  | { kind: "suspended" };

export type LoopView = {
  now: number;
  glucose: { mgdl: number; at: number; ageMin: number; stale: boolean } | null;
  lastLoopAt: number | null;
  loopAgeMin: number | null;
  freshness: Freshness;
  /** True only when Loop could make a dosing decision right now. */
  canDose: boolean;
  basal: Basal;
  statusLabel: string;
  statusDetail: string;
};

export type LoopInputs = {
  now: number;
  readings: Reading[];
  pumpSuspended?: boolean;
};

export function freshnessFor(loopAgeMin: number | null): Freshness {
  if (loopAgeMin === null) return "stale";
  if (loopAgeMin <= RING_FRESH_MAX_MIN) return "fresh";
  if (loopAgeMin <= RING_AGING_MAX_MIN) return "aging";
  return "stale";
}

/**
 * Loop completes when a new reading arrives and that reading is recent. With
 * scripted 5-minute readings, the last completed loop is the last reading,
 * and the temp basal in force is the one set at that loop.
 */
export function deriveLoop({ now, readings, pumpSuspended = false }: LoopInputs): LoopView {
  const last = lastReadingAtOrBefore(readings, now);
  const glucose = last
    ? { mgdl: last.mgdl, at: last.t, ageMin: now - last.t, stale: now - last.t > GLUCOSE_RECENCY_MIN }
    : null;

  const lastLoopAt = last ? last.t : null;
  const loopAgeMin = lastLoopAt === null ? null : now - lastLoopAt;
  const freshness = freshnessFor(loopAgeMin);
  const canDose = !!glucose && !glucose.stale && !pumpSuspended;

  let basal: Basal;
  if (pumpSuspended) {
    basal = { kind: "suspended" };
  } else {
    const temp: TempBasal | null = last
      ? { rate: scriptedTempRate(last.mgdl), startedAt: last.t, endsAt: last.t + TEMP_BASAL_MAX_MIN }
      : null;
    basal =
      temp && now < temp.endsAt
        ? { kind: "temp", rate: temp.rate, endsAt: temp.endsAt, minutesLeft: temp.endsAt - now }
        : { kind: "scheduled", rate: DEVICES.pump.scheduledRate };
  }

  // Loop's own words for the three states (its warmup and status copy says
  // "Automation is on / unavailable"). Used on both frames.
  const statusLabel = canDose && freshness === "fresh" ? "Automation on" : canDose ? "Automation delayed" : "Automation unavailable";
  const statusDetail = !glucose
    ? "No glucose data"
    : glucose.stale
      ? `No recent glucose · last ${glucose.ageMin} min ago`
      : loopAgeMin === 0
        ? "Last run just now"
        : `Last run ${loopAgeMin} min ago`;

  return { now, glucose, lastLoopAt, loopAgeMin, freshness, canDose, basal, statusLabel, statusDetail };
}
