import { formatAge, formatClock } from "./clock";
import { deriveLoop, type Freshness, type LoopView } from "./loop";
import { cgmReadings, cgmStateAt, SCENARIO, WARMUP_ENDS_AT, type CgmState, type Reading } from "./timeline";

/*
 * The platform-neutral status screen. Both renderers draw exactly this; they
 * choose layout and chrome, never the facts.
 */
export type Tone = "normal" | "info" | "warning" | "critical";

export type StatusModel = {
  now: number;
  clock: string;
  glucose: { display: string; unit: string; trend: "up" | "flat" | "down" | null; ageLabel: string; stale: boolean };
  ring: { freshness: Freshness; caption: string };
  status: { label: string; reason: string; tone: Tone };
  basal: { kind: "temp" | "scheduled" | "suspended"; title: string; rate: string; detail: string };
  cgm: { label: string; detail: string; tone: Tone };
  chart: { readings: Reading[]; from: number; to: number; gap: { from: number; to: number; label: string } | null };
  loop: LoopView;
};

const READINGS = cgmReadings();

/**
 * Trend from the last three readings, only when they are consecutive (5 min
 * apart) and the newest is recent. Across a sensor gap, or on a new sensor's
 * first reading, there is no trend to show.
 */
export function trendOf(readings: Reading[], now: number): "up" | "flat" | "down" | null {
  const recent = readings.filter((r) => r.t <= now).slice(-3);
  if (recent.length < 3) return null;
  const contiguous = recent[1].t - recent[0].t <= 5 && recent[2].t - recent[1].t <= 5;
  if (!contiguous || now - recent[2].t > 15) return null;
  const slope = (recent[2].mgdl - recent[0].mgdl) / (recent[2].t - recent[0].t);
  return slope > 1 ? "up" : slope < -1 ? "down" : "flat";
}

function cgmLine(state: CgmState): { label: string; detail: string; tone: Tone } {
  switch (state.kind) {
    case "ok":
      return { label: "Sensor active", detail: "Readings every 5 min", tone: "normal" };
    case "expiring":
      return {
        label: "Sensor expiring",
        detail: `Expires ${formatClock(SCENARIO.sensorExpiresAt)}`,
        tone: state.minutesLeft <= 60 ? "warning" : "normal",
      };
    case "expired":
      return { label: "Sensor expired", detail: "Replace sensor", tone: "critical" };
    case "pairing":
      return { label: "No sensor connected", detail: "Pairing new sensor", tone: "warning" };
    case "warmup":
      return { label: "Sensor warmup", detail: `${state.minutesLeft} min left · ready ${formatClock(WARMUP_ENDS_AT)}`, tone: "info" };
  }
}

export function statusModel(now: number, opts: { pairing?: boolean } = {}): StatusModel {
  const loop = deriveLoop({ now, readings: READINGS });
  const cgmState = cgmStateAt(now, opts.pairing);
  const g = loop.glucose;

  const showValue = !!g && !g.stale;
  const glucose = {
    display: showValue ? String(g!.mgdl) : "– – –",
    unit: "mg/dL",
    trend: showValue ? trendOf(READINGS, now) : null,
    ageLabel: !g
      ? "No readings yet"
      : g.stale
        ? `Last reading ${formatAge(g.ageMin)} (${formatClock(g.at)})`
        : formatAge(g.ageMin),
    stale: !showValue,
  };

  let reason = loop.statusDetail;
  if (!loop.canDose) {
    if (cgmState.kind === "warmup") reason = `Sensor warming up · resumes about ${formatClock(WARMUP_ENDS_AT)}`;
    else if (cgmState.kind === "expired") reason = "Sensor expired · no recent glucose";
    else if (cgmState.kind === "pairing") reason = "No sensor connected";
  }
  const tone: Tone = loop.freshness === "fresh" ? "normal" : loop.freshness === "aging" ? "warning" : "critical";

  const b = loop.basal;
  const basal =
    b.kind === "temp"
      ? { kind: b.kind, title: "Temp basal", rate: `${b.rate.toFixed(2)} U/hr`, detail: `Ends ${formatClock(b.endsAt)} · ${b.minutesLeft} min left` }
      : b.kind === "scheduled"
        ? { kind: b.kind, title: "Scheduled basal", rate: `${b.rate.toFixed(2)} U/hr`, detail: "From your basal schedule" }
        : { kind: b.kind, title: "Insulin suspended", rate: "0 U/hr", detail: "No insulin is being delivered" };

  const gapStart = SCENARIO.sensorExpiresAt;
  const gap = now > gapStart ? { from: gapStart, to: Math.min(now, WARMUP_ENDS_AT), label: "Sensor change" } : null;

  return {
    now,
    clock: formatClock(now),
    glucose,
    ring: {
      freshness: loop.freshness,
      caption: loop.loopAgeMin === null ? "—" : loop.loopAgeMin < 1 ? "now" : `${loop.loopAgeMin} min`,
    },
    status: { label: loop.statusLabel, reason, tone },
    basal,
    cgm: cgmLine(cgmState),
    chart: { readings: READINGS.filter((r) => r.t <= now && r.t >= now - 180), from: now - 180, to: now, gap },
    loop,
  };
}
