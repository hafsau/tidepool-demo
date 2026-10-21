import {
  AlertTriangle,
  Bell,
  BellRing,
  Bluetooth,
  Check,
  ChevronLeft,
  Clock,
  Droplet,
  Info,
  MoonStar,
  Settings,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { Critical } from "@/components/shared/critical";
import { GlucoseChart } from "@/components/shared/glucose-chart";
import { formatClock } from "@/lib/clock";
import { APP_NAME, type Screen, type Step, type SystemDialog } from "@/lib/flows";
import { statusModel, type StatusModel, type Tone } from "@/lib/screen-model";
import { SCENARIO, WARMUP_ENDS_AT } from "@/lib/timeline";

/*
 * iOS reference frame. Patterns follow open-source Loop (tidepool-org/Loop):
 * the three-part HUD (loop ring, glucose, basal), dashes for stale glucose,
 * the CGM highlight under the value, and the bottom toolbar. Colors come from
 * Loop's DerivedAssetsBase catalog: glucose #00B0FF, carbs #63DA38, insulin
 * systemOrange, fresh #4CD964, warning #EAC345, critical systemRed.
 */
const C = {
  glucose: "#00B0FF",
  carbs: "#63DA38",
  insulin: "#FF9500",
  fresh: "#4CD964",
  warning: "#EAC345",
  critical: "#FF3B30",
  blue: "#007AFF",
  blueText: "#0062CC",
  label2: "#636366",
  sep: "#C6C6C8",
};

const toneColor = (t: Tone) => (t === "normal" ? C.fresh : t === "info" ? C.blue : t === "warning" ? C.warning : C.critical);

export function IosScreen({ step, deny }: { step: Step; deny: boolean }) {
  const s = step.screen;
  switch (s.kind) {
    case "intro":
      return <Intro s={s} />;
    case "permission":
      if (!s.ios) return <NoEquivalent heading={s.heading} why={s.why} coveredBy={s.iosCoveredBy ?? ""} />;
      return deny ? <Denied s={s} /> : <Permission s={s} dialog={s.ios as SystemDialog} />;
    case "ongoing":
      return <NoEquivalent heading={s.heading} why={s.why} coveredBy="iOS has no persistent notification. The app stays connected through Bluetooth background mode." />;
    case "alarm":
      return <Alarm s={s} />;
    case "summary":
      return <Summary s={s} />;
    case "status":
      return <Status s={s} m={statusModel(s.now, { pairing: s.sheet === "pair" })} />;
  }
}

/* ---------- onboarding ---------- */

function Page({ icon, children, footer }: { icon: React.ReactNode; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-white px-[1.6em] pb-[1.2em]">
      <div className="mt-[2.2em] flex h-[4.2em] w-[4.2em] items-center justify-center rounded-[1.1em] bg-[#e8f1ff] text-[#007AFF]">
        {icon}
      </div>
      <div className="mt-[1.2em] flex-1">{children}</div>
      {footer}
    </div>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[3.6em] items-center justify-center rounded-[1em] bg-[#0066CC] text-[1.08em] font-semibold text-white">
      {children}
    </div>
  );
}

function Intro({ s }: { s: Extract<Screen, { kind: "intro" }> }) {
  const icons = [Bluetooth, BellRing, ShieldCheck, Bell];
  return (
    <Page icon={<ShieldCheck size={30} />} footer={<PrimaryButton>Continue</PrimaryButton>}>
      <p className="text-[1.75em] font-bold leading-[1.15] tracking-tight">{s.heading}</p>
      <Critical id="permission-purpose" as="p" className="mt-[0.6em] text-[1.05em] text-[#3a3a3c]">
        {s.body}
      </Critical>
      <ul className="mt-[1.1em] space-y-[0.7em]">
        {s.bullets.map((b, i) => {
          const Icon = icons[i % icons.length];
          return (
            <li key={b} className="flex items-center gap-[0.7em] text-[1em]">
              <Icon size={18} color={C.blue} aria-hidden="true" />
              {b}
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

function iconFor(heading: string) {
  if (/pump|connect/i.test(heading)) return <Bluetooth size={30} />;
  if (/silent|disturb/i.test(heading)) return <MoonStar size={30} />;
  return <Bell size={30} />;
}

function Permission({ s, dialog }: { s: Extract<Screen, { kind: "permission" }>; dialog: SystemDialog }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <Page icon={iconFor(s.heading)} footer={<PrimaryButton>Continue</PrimaryButton>}>
        <p className="text-[1.6em] font-bold leading-[1.15] tracking-tight">{s.heading}</p>
        <Critical id="permission-purpose" as="p" className="mt-[0.6em] text-[1.05em] text-[#3a3a3c]">
          {s.why}
        </Critical>
        <Critical id="consequence-if-denied" className="mt-[1em] rounded-[0.9em] bg-[#f2f2f7] p-[0.85em] text-[0.95em]">
          <span className="font-semibold">If you don&apos;t allow: </span>
          {s.ifDenied}
        </Critical>
      </Page>
      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
        <Critical
          id="system-prompt"
          className="rise w-[78%] overflow-hidden rounded-[1.1em] bg-[#f2f2f2] text-center shadow-xl"
        >
          <div className="px-[1.1em] pb-[1em] pt-[1.2em]">
            <p className="text-[1.05em] font-semibold leading-snug">{dialog.title}</p>
            {dialog.body && <p className="mt-[0.4em] text-[0.9em] leading-snug">{dialog.body}</p>}
          </div>
          <div className="grid grid-cols-2 border-t" style={{ borderColor: C.sep }}>
            <span className="border-r py-[0.75em] text-[1.05em]" style={{ borderColor: C.sep, color: C.blueText }}>
              {dialog.deny}
            </span>
            <span className="py-[0.75em] text-[1.05em] font-semibold" style={{ color: C.blueText }}>
              {dialog.allow}
            </span>
          </div>
        </Critical>
      </div>
    </div>
  );
}

function Denied({ s }: { s: Extract<Screen, { kind: "permission" }> }) {
  const d = s.denied;
  return (
    <Page
      icon={<AlertTriangle size={30} color={d.blocksSetup ? C.critical : "#B07D00"} />}
      footer={
        <div className="space-y-[0.6em]">
          <PrimaryButton>{d.action}</PrimaryButton>
          {!d.blocksSetup && <p className="py-[0.4em] text-center text-[1.02em] font-medium text-[#0062CC]">Continue with reduced alerts</p>}
        </div>
      }
    >
      <p className="text-[1.6em] font-bold leading-[1.15] tracking-tight">{d.heading}</p>
      <Critical id="consequence-if-denied" as="p" className="mt-[0.6em] text-[1.05em] text-[#3a3a3c]">
        {d.body}
      </Critical>
      {d.blocksSetup && (
        <Critical id="setup-blocked" className="mt-[1em] flex items-start gap-[0.5em] rounded-[0.9em] bg-[#fff1f0] p-[0.85em] text-[0.95em] text-[#a1150d]">
          <AlertTriangle size={16} className="mt-[0.15em] shrink-0" aria-hidden="true" />
          Setup can&apos;t finish until this is allowed.
        </Critical>
      )}
    </Page>
  );
}

function NoEquivalent({ heading, why, coveredBy }: { heading: string; why: string; coveredBy: string }) {
  return (
    <div className="flex flex-1 flex-col items-stretch justify-center bg-white px-[1.6em]">
      <p className="text-[0.85em] font-semibold uppercase tracking-wide text-[#636366]">iOS reference</p>
      <p className="mt-[0.3em] text-[1.45em] font-bold leading-[1.15] tracking-tight">{heading}</p>
      <Critical id="permission-purpose" as="p" className="mt-[0.6em] text-[1em] text-[#3a3a3c]">
        {why}
      </Critical>
      <Critical id="no-equivalent" className="mt-[1.1em] flex items-start gap-[0.6em] rounded-[0.9em] bg-[#eaf8ee] p-[0.9em] text-[0.95em] text-[#14532d]">
        <Check size={18} className="mt-[0.1em] shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">No step on iPhone. </span>
          {coveredBy}
        </span>
      </Critical>
    </div>
  );
}

function Alarm({ s }: { s: Extract<Screen, { kind: "alarm" }> }) {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-[#1e2a4a] to-[#0b1022] px-[0.9em] text-white">
      <p className="mt-[1.2em] text-center text-[0.95em] font-medium opacity-90">Wednesday, October 21</p>
      <p className="text-center text-[4.4em] font-semibold leading-none tracking-tight">9:41</p>
      <Critical id="alert-message" className="rise alarm-pulse mt-[1.6em] rounded-[1.2em] bg-white/90 p-[0.85em] text-black shadow-lg">
        <div className="flex items-center gap-[0.5em] text-[0.8em] font-semibold uppercase tracking-wide text-[#a1150d]">
          <AlertTriangle size={14} aria-hidden="true" />
          Critical Alert · {APP_NAME}
          <span className="ml-auto font-normal normal-case text-[#3a3a3c]">now</span>
        </div>
        <p className="mt-[0.3em] text-[1.05em] font-semibold">{s.title}</p>
        <p className="text-[0.95em] leading-snug">{s.body}</p>
      </Critical>
      <p className="mt-[0.7em] text-center text-[0.85em] opacity-85">Plays at full volume, even when muted</p>
      <div className="mt-auto mb-[1em] rounded-[1.1em] bg-white/12 p-[0.9em] text-center">
        <p className="text-[0.95em] font-medium">After unlock: did you hear it?</p>
        <div className="mt-[0.6em] grid grid-cols-2 gap-[0.5em] text-[0.95em] font-semibold">
          <span className="rounded-[0.8em] bg-white py-[0.55em] text-[#0062CC]">I heard it</span>
          <span className="rounded-[0.8em] bg-white/20 py-[0.55em]">I didn&apos;t</span>
        </div>
      </div>
    </div>
  );
}

function Summary({ s }: { s: Extract<Screen, { kind: "summary" }> }) {
  return (
    <div className="flex flex-1 flex-col px-[1em] pb-[1em]">
      <p className="mt-[1.4em] px-[0.4em] text-[1.75em] font-bold tracking-tight">{s.heading}</p>
      <Critical id="permission-purpose" as="p" className="px-[0.4em] text-[0.95em] text-[#3a3a3c]">
        Everything needed for urgent alerts to reach you.
      </Critical>
      <ul className="mt-[1em] divide-y divide-[#e5e5ea] overflow-hidden rounded-[0.9em] bg-white">
        {s.items.map((it) => (
          <li key={it.label} className="flex items-center gap-[0.6em] px-[0.9em] py-[0.7em]">
            <span className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded-full bg-[#34C759] text-white">
              <Check size={12} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="flex-1 text-[0.98em]">{it.label}</span>
            <span className="text-[0.85em] text-[#636366]">{it.ios}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <PrimaryButton>Done</PrimaryButton>
      </div>
    </div>
  );
}

/* ---------- status ---------- */

function Ring({ m }: { m: StatusModel }) {
  const color = m.ring.freshness === "fresh" ? C.fresh : m.ring.freshness === "aging" ? C.warning : C.critical;
  return (
    <span className="relative inline-flex h-[2.6em] w-[2.6em] items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 36 36" className="absolute inset-0">
        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth={m.ring.freshness === "stale" ? 2 : 5} strokeDasharray={m.ring.freshness === "stale" ? "4 3" : undefined} />
      </svg>
    </span>
  );
}

function Notice({ title, body, urgent }: { title: string; body: string; urgent?: boolean }) {
  return (
    <Critical id="alert-message" className="rise relative z-10 mx-[0.5em] mb-[0.4em] mt-[0.1em] rounded-[1.2em] bg-white/95 p-[0.8em] shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="flex items-center gap-[0.45em] text-[0.78em] uppercase tracking-wide text-[#3a3a3c]">
        <span className="flex h-[1.5em] w-[1.5em] items-center justify-center rounded-[0.35em] bg-[#007AFF] text-white">
          <Droplet size={10} aria-hidden="true" />
        </span>
        {APP_NAME}
        {urgent && <span className="font-semibold text-[#a1150d]">· Time Sensitive</span>}
        <span className="ml-auto normal-case">now</span>
      </div>
      <p className="mt-[0.35em] text-[1em] font-semibold leading-tight">{title}</p>
      <p className="text-[0.92em] leading-snug text-[#1c1c1e]">{body}</p>
    </Critical>
  );
}

function Status({ s, m }: { s: Extract<Screen, { kind: "status" }>; m: StatusModel }) {
  return (
    <div className="relative flex flex-1 flex-col">
      {s.notice && <Notice {...s.notice} />}
      {s.banner && (
        <Critical id="alert-message" className="mx-[0.5em] mb-[0.4em] flex items-start gap-[0.45em] rounded-[0.7em] bg-[#fff1f0] px-[0.7em] py-[0.55em] text-[0.9em] text-[#8a1009]">
          <AlertTriangle size={14} className="mt-[0.15em] shrink-0" aria-hidden="true" />
          <span>
            {s.banner.text} <span className="font-semibold underline">{s.banner.action}</span>
          </span>
        </Critical>
      )}

      {/* HUD */}
      <div className="grid grid-cols-3 items-start gap-[0.3em] border-b border-[#d8d8dc] bg-white px-[0.6em] pb-[0.7em] pt-[0.6em]">
        <div className="flex flex-col items-center text-center">
          <Ring m={m} />
          <span className="mt-[0.2em] text-[0.82em] text-[#3a3a3c]">{m.ring.caption === "now" ? "now" : `${m.ring.caption} ago`}</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <Critical id="glucose-value" className="flex items-baseline gap-[0.15em]">
            <span className="text-[1.9em] font-semibold leading-none tracking-tight" style={{ color: m.glucose.stale ? "#3a3a3c" : "#000" }}>
              {m.glucose.display}
            </span>
            {m.glucose.trend && <span className="text-[1.1em]" style={{ color: "#0077B3" }} role="img" aria-label={`trend ${m.glucose.trend}`}>{m.glucose.trend === "up" ? "↗" : m.glucose.trend === "down" ? "↘" : "→"}</span>}
          </Critical>
          <span className="text-[0.75em] text-[#636366]">{m.glucose.unit}</span>
          <Critical id="glucose-age" as="span" className="text-[0.75em] leading-tight text-[#3a3a3c]">
            {m.glucose.ageLabel}
          </Critical>
        </div>
        <Critical id="basal-state" className="flex flex-col items-center text-center">
          <span className="text-[1.15em] font-semibold leading-tight" style={{ color: "#B35F00" }}>
            {m.basal.rate.replace(" U/hr", "")}
            <span className="text-[0.7em] font-normal text-[#3a3a3c]"> U/hr</span>
          </span>
          <span className="text-[0.78em] leading-tight text-[#3a3a3c]">{m.basal.title}</span>
          <span className="text-[0.7em] leading-tight text-[#636366]">{m.basal.kind === "temp" ? m.basal.detail.split(" · ")[1] : "scheduled"}</span>
        </Critical>
      </div>

      {/* CGM highlight + status row */}
      <div className="space-y-[0.45em] px-[0.7em] pt-[0.6em]">
        <Critical id="cgm-state" className="flex items-center gap-[0.45em] rounded-[0.7em] bg-white px-[0.7em] py-[0.5em] text-[0.9em]">
          {m.cgm.tone === "critical" ? (
            <AlertTriangle size={14} color={C.critical} aria-hidden="true" />
          ) : (
            <Clock size={14} color={m.cgm.tone === "warning" ? "#B07D00" : m.cgm.tone === "info" ? C.blueText : C.label2} aria-hidden="true" />
          )}
          <span className="font-semibold">{m.cgm.label}</span>
          <span className="ml-auto text-[0.9em] text-[#636366]">{m.cgm.detail}</span>
        </Critical>
        <Critical id="loop-status" className="flex items-start gap-[0.45em] rounded-[0.7em] bg-white px-[0.7em] py-[0.5em] text-[0.9em]">
          <span className="mt-[0.35em] h-[0.6em] w-[0.6em] shrink-0 rounded-full" style={{ background: toneColor(m.status.tone) }} aria-hidden="true" />
          <span>
            <span className="font-semibold">{m.status.label}</span>
            <span className="block text-[0.9em] text-[#3a3a3c]">{m.status.reason}</span>
          </span>
        </Critical>
      </div>

      {/* chart */}
      <div className="mx-[0.7em] mt-[0.5em] rounded-[0.7em] bg-white px-[0.6em] pb-[0.3em] pt-[0.5em]">
        <p className="text-[0.82em] font-semibold text-[#3a3a3c]">Glucose</p>
        <GlucoseChart chart={m.chart} color={C.glucose} rangeColor="#e6f6ff" gridColor="#e5e5ea" textColor="#636366" gapColor="#f2f2f7" height={110} />
      </div>

      {s.sheet === "warmup" && (
        <div className="mx-[0.7em] mt-[0.5em] flex items-start gap-[0.45em] rounded-[0.7em] bg-[#eef5ff] px-[0.7em] py-[0.55em] text-[0.88em]">
          <Info size={14} className="mt-[0.15em] shrink-0 text-[#0062CC]" aria-hidden="true" />
          Automation is unavailable while your CGM sensor is warming up. Your pump keeps delivering scheduled basal. Automation resumes when readings arrive, about {formatClock(WARMUP_ENDS_AT)}.
        </div>
      )}

      <div className="mt-auto flex justify-around border-t border-[#d8d8dc] bg-[#f9f9f9] py-[0.6em]" aria-hidden="true">
        <Utensils size={20} color={C.carbs} />
        <Clock size={20} color={C.blue} />
        <Droplet size={20} color={C.insulin} />
        <Settings size={20} color={C.label2} />
      </div>

      {s.sheet === "pair" && <PairSheet />}
      {s.sheet === "meal" && <MealSheet />}
    </div>
  );
}

function Sheet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/30">
      <div className="rise rounded-t-[1.2em] bg-[#f2f2f7] pb-[1em]">
        <div className="mx-auto mt-[0.45em] h-[0.35em] w-[2.8em] rounded-full bg-[#c7c7cc]" aria-hidden="true" />
        <div className="flex items-center px-[1em] pt-[0.5em]">
          <span className="flex items-center text-[1em] text-[#0062CC]">
            <ChevronLeft size={16} aria-hidden="true" />
            Cancel
          </span>
          <p className="flex-1 pr-[3.5em] text-center text-[1.05em] font-semibold">{title}</p>
        </div>
        <div className="px-[1em] pt-[0.8em]">{children}</div>
      </div>
    </div>
  );
}

function PairSheet() {
  return (
    <Sheet title="New Sensor">
      <ol className="space-y-[0.4em] rounded-[0.8em] bg-white p-[0.8em] text-[0.95em]">
        <li className="flex items-center gap-[0.5em]">
          <Check size={14} color="#248A3D" aria-hidden="true" /> Sensor applied
        </li>
        <li className="flex items-center gap-[0.5em]">
          <Bluetooth size={14} color={C.blue} aria-hidden="true" /> Found Demo iCGM · SN 8F3K
        </li>
      </ol>
      <p className="mt-[0.7em] text-[0.88em] text-[#3a3a3c]">Swipe down asks before canceling. No glucose readings until pairing and warmup finish.</p>
      <div className="mt-[0.8em]">
        <PrimaryButton>Pair Sensor</PrimaryButton>
      </div>
    </Sheet>
  );
}

function MealSheet() {
  const row = "flex items-center justify-between px-[0.9em] py-[0.65em] text-[0.98em]";
  return (
    <Sheet title="Add Carb Entry">
      <div className="divide-y divide-[#e5e5ea] overflow-hidden rounded-[0.8em] bg-white">
        <div className={row}>
          <span>Amount</span>
          <span className="font-semibold">{SCENARIO.mealCarbs} g</span>
        </div>
        <div className={row}>
          <span>Time</span>
          <span>{formatClock(SCENARIO.mealAt)}</span>
        </div>
        <div className={row}>
          <span>Fingerstick</span>
          <span>
            {SCENARIO.fingerstickMgdl} mg/dL <span className="text-[0.85em] text-[#636366]">manual</span>
          </span>
        </div>
      </div>
      <p className="mt-[0.7em] flex items-start gap-[0.4em] text-[0.88em] text-[#3a3a3c]">
        <Info size={14} className="mt-[0.15em] shrink-0 text-[#0062CC]" aria-hidden="true" />
        Automatic adjustments are paused until {formatClock(WARMUP_ENDS_AT)}, so cover this meal with a bolus now. Your fingerstick can be used for the recommendation.
      </p>
      <div className="mt-[0.7em] flex items-center justify-between rounded-[0.8em] border border-dashed border-[#aeaeb2] px-[0.9em] py-[0.65em] text-[0.95em]">
        <span>Bolus</span>
        <span className="text-[0.85em] text-[#3a3a3c]">dose omitted in this concept</span>
      </div>
    </Sheet>
  );
}
