import { formatClock, formatShortClock } from "@/lib/clock";
import { deriveLoop } from "@/lib/loop";
import { cgmReadings, DEVICES, SCENARIO, WARMUP_ENDS_AT } from "@/lib/timeline";

/*
 * What a clinician would see the next day, drawn from the same scripted
 * evening as the phones: the gap is labeled with its cause, and basal shows
 * temp versus scheduled so "not looping" reads as delivery, not as zero.
 * Colors follow Tidepool's open-source viz palette (target #8DD0A9 etc.).
 */
export function ClinicianStrip() {
  const readings = cgmReadings();
  const W = 960;
  const H = 260;
  const pad = { l: 44, r: 16, t: 18, b: 28 };
  const from = SCENARIO.start;
  const to = SCENARIO.end;
  const x = (t: number) => pad.l + ((t - from) / (to - from)) * (W - pad.l - pad.r);
  const bgTop = pad.t;
  const bgBottom = 170;
  const y = (v: number) => bgTop + (1 - (v - 40) / (300 - 40)) * (bgBottom - bgTop);
  const basalTop = 196;
  const basalBottom = H - pad.b;
  const basalY = (rate: number) => basalBottom - (rate / 2) * (basalBottom - basalTop);

  const dotColor = (v: number) => (v < 70 ? "#F19181" : v > 180 ? "#B69CE2" : "#4B9E74");

  const basal: { t: number; rate: number; kind: string }[] = [];
  for (let t = from; t < to; t += 5) {
    const b = deriveLoop({ now: t, readings }).basal;
    basal.push({ t, rate: b.kind === "suspended" ? 0 : b.rate, kind: b.kind });
  }
  const hours = Array.from({ length: (to - from) / 60 + 1 }, (_, i) => from + i * 60);

  return (
    <figure className="m-0 rounded-2xl border border-line-soft bg-surface p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-labelledby="strip-title strip-desc">
        <title id="strip-title">Daily view, 2 PM to 10 PM</title>
        <desc id="strip-desc">
          Glucose readings every five minutes, with a gap from {formatClock(SCENARIO.sensorExpiresAt)} to {formatClock(WARMUP_ENDS_AT)} labeled sensor change.
          Basal shows temp basal while looping and scheduled basal during the gap.
        </desc>
        <rect x={pad.l} y={y(180)} width={W - pad.l - pad.r} height={y(70) - y(180)} fill="#EDF7F1" />
        {[70, 180, 250].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#D9D9D9" strokeDasharray="3 3" />
            <text x={pad.l - 8} y={y(v) + 4} fontSize={11} textAnchor="end" fill="#5F6B82">
              {v}
            </text>
          </g>
        ))}
        <rect x={x(SCENARIO.sensorExpiresAt)} y={bgTop} width={x(WARMUP_ENDS_AT) - x(SCENARIO.sensorExpiresAt)} height={basalBottom - bgTop} fill="#F0F5FF" />
        <text x={(x(SCENARIO.sensorExpiresAt) + x(WARMUP_ENDS_AT)) / 2} y={bgTop + 16} fontSize={12} textAnchor="middle" fill="#271B46" fontWeight={600}>
          Sensor change
        </text>
        <text x={(x(SCENARIO.sensorExpiresAt) + x(WARMUP_ENDS_AT)) / 2} y={bgTop + 31} fontSize={10.5} textAnchor="middle" fill="#5F6B82">
          expired {formatShortClock(SCENARIO.sensorExpiresAt)} · warmup until {formatShortClock(WARMUP_ENDS_AT)}
        </text>
        {readings.map((r) => (
          <circle key={r.t} cx={x(r.t)} cy={y(r.mgdl)} r={3} fill={dotColor(r.mgdl)} />
        ))}
        <g>
          <circle cx={x(SCENARIO.mealAt)} cy={y(SCENARIO.fingerstickMgdl)} r={5} fill="none" stroke="#271B46" strokeWidth={1.5} />
          <text x={x(SCENARIO.mealAt) + 8} y={y(SCENARIO.fingerstickMgdl) + 4} fontSize={10.5} fill="#271B46">
            fingerstick {SCENARIO.fingerstickMgdl}
          </text>
          <rect x={x(SCENARIO.mealAt) - 15} y={bgBottom + 2} width={30} height={16} rx={8} fill="#FCCE9F" />
          <text x={x(SCENARIO.mealAt)} y={bgBottom + 14} fontSize={10.5} textAnchor="middle" fill="#271B46">
            {SCENARIO.mealCarbs}g
          </text>
        </g>
        <text x={pad.l - 8} y={basalTop + 8} fontSize={10.5} textAnchor="end" fill="#5F6B82">
          basal
        </text>
        <path
          d={`M${x(from)},${basalY(DEVICES.pump.scheduledRate)} H${x(to)}`}
          stroke="#708FC2"
          strokeDasharray="4 3"
          strokeWidth={1.2}
          fill="none"
        />
        {basal.map((b) => (
          <rect
            key={b.t}
            x={x(b.t)}
            y={basalY(b.rate)}
            width={x(b.t + 5) - x(b.t)}
            height={basalBottom - basalY(b.rate)}
            fill={b.kind === "temp" ? "#9AB0F0" : "#D1D6E1"}
          />
        ))}
        {hours.map((t) => (
          <text key={t} x={x(t)} y={H - 8} fontSize={11} textAnchor="middle" fill="#5F6B82">
            {formatClock(t).replace(":00", "")}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
        <span>
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#9AB0F0] align-middle" />
          Temp basal (set by automation)
        </span>
        <span>
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#D1D6E1] align-middle" />
          Scheduled basal
        </span>
        <span>Dashed line: scheduled rate {DEVICES.pump.scheduledRate} U/hr</span>
      </figcaption>
    </figure>
  );
}
