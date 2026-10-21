import { formatShortClock } from "@/lib/clock";
import type { StatusModel } from "@/lib/screen-model";

/*
 * Last three hours of glucose. The sensor gap is drawn as an empty, labeled
 * band: no line, never a zero.
 */
export function GlucoseChart({
  chart,
  color,
  rangeColor,
  gridColor,
  textColor,
  gapColor,
  height = 120,
}: {
  chart: StatusModel["chart"];
  color: string;
  rangeColor: string;
  gridColor: string;
  textColor: string;
  gapColor: string;
  height?: number;
}) {
  const W = 260;
  const H = height;
  const pad = { l: 4, r: 26, t: 8, b: 16 };
  const lo = 40;
  const hi = 300;
  const x = (t: number) => pad.l + ((t - chart.from) / (chart.to - chart.from)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);

  // Split into segments wherever readings are more than 5 minutes apart.
  const segments: string[] = [];
  let current: string[] = [];
  chart.readings.forEach((r, i) => {
    const prev = chart.readings[i - 1];
    if (prev && r.t - prev.t > 5) {
      segments.push(current.join(" "));
      current = [];
    }
    current.push(`${current.length ? "L" : "M"}${x(r.t).toFixed(1)},${y(r.mgdl).toFixed(1)}`);
  });
  if (current.length) segments.push(current.join(" "));

  const ticks = [chart.from + 60, chart.from + 120];
  const gap = chart.gap && chart.gap.to > chart.from ? { from: Math.max(chart.gap.from, chart.from), to: chart.gap.to, label: chart.gap.label } : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Glucose, last 3 hours">
      <rect x={pad.l} y={y(180)} width={W - pad.l - pad.r} height={y(70) - y(180)} fill={rangeColor} />
      {[70, 180, 250].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={gridColor} strokeWidth={0.6} />
          <text x={W - pad.r + 4} y={y(v) + 3} fontSize={8} fill={textColor}>
            {v}
          </text>
        </g>
      ))}
      {gap && (
        <g>
          <rect x={x(gap.from)} y={pad.t} width={Math.max(1, x(gap.to) - x(gap.from))} height={H - pad.t - pad.b} fill={gapColor} />
          {x(gap.to) - x(gap.from) > 44 && (
            <text x={(x(gap.from) + x(gap.to)) / 2} y={pad.t + 10} fontSize={7.5} textAnchor="middle" fill={textColor}>
              {gap.label}
            </text>
          )}
        </g>
      )}
      {segments.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={H - 4} fontSize={8} textAnchor="middle" fill={textColor}>
          {formatShortClock(t)}
        </text>
      ))}
    </svg>
  );
}
