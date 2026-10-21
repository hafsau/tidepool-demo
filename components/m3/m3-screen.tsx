import {
  AlertTriangle,
  ArrowLeft,
  BatteryCharging,
  Bell,
  BellRing,
  Bluetooth,
  Check,
  CheckCircle2,
  Clock,
  History,
  Home,
  Info,
  MoonStar,
  Plus,
  Settings,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { Critical } from "@/components/shared/critical";
import { GlucoseChart } from "@/components/shared/glucose-chart";
import { formatClock } from "@/lib/clock";
import { APP_NAME, type Oem, type Screen, type SettingsPage, type Step, type SystemDialog } from "@/lib/flows";
import { statusModel, type StatusModel, type Tone } from "@/lib/screen-model";
import { SCENARIO, WARMUP_ENDS_AT } from "@/lib/timeline";

/*
 * Proposed Android frame, Material 3. Roles come from Tidepool's open-source
 * AndroidCarePartner theme (accent #5D79FF, warning #DC7400, critical #FF3B30,
 * glucose #775DCB, insulin #5569F2, status green #00AA39), darkened where text
 * needs 4.5:1. Same facts as the iOS frame; different native patterns.
 */
const C = {
  primary: "#3F57D8",
  primaryContainer: "#E1E5FF",
  onPrimaryContainer: "#122172",
  surface: "#FFFFFF",
  surfaceContainer: "#ECEDF6",
  outline: "#75777F",
  outlineVariant: "#C5C6D0",
  onSurface: "#1B1B1F",
  onSurfaceVariant: "#45464F",
  glucose: "#775DCB",
  insulin: "#5569F2",
  status: "#00AA39",
};

const TONE: Record<Tone, { bg: string; fg: string; Icon: typeof CheckCircle2 }> = {
  normal: { bg: "#DDF5E3", fg: "#00511C", Icon: CheckCircle2 },
  info: { bg: "#E1E5FF", fg: "#122172", Icon: Clock },
  warning: { bg: "#FFEBD1", fg: "#6E3900", Icon: AlertTriangle },
  critical: { bg: "#FFE2DF", fg: "#8C1D18", Icon: XCircle },
};

export function M3Screen({ step, deny, oem }: { step: Step; deny: boolean; oem: Oem }) {
  const s = step.screen;
  switch (s.kind) {
    case "intro":
      return <Intro s={s} />;
    case "permission":
      return deny ? <Denied s={s} /> : <Permission s={s} oem={oem} />;
    case "ongoing":
      return <Ongoing s={s} />;
    case "alarm":
      return <Alarm s={s} />;
    case "summary":
      return <Summary s={s} />;
    case "status":
      return <Status s={s} m={statusModel(s.now, { pairing: s.sheet === "pair" })} />;
  }
}

/* ---------- primitives ---------- */

function Filled({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[3.1em] items-center justify-center rounded-full text-[1.02em] font-medium tracking-[0.01em] text-white" style={{ background: C.primary }}>
      {children}
    </div>
  );
}

function TextBtn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[3em] items-center justify-center rounded-full text-[1.02em] font-medium" style={{ color: C.primary }}>
      {children}
    </div>
  );
}

function TopBar({ title, nav = "back", trailing }: { title: string; nav?: "back" | "close" | "none"; trailing?: React.ReactNode }) {
  return (
    <div className="flex h-[3.8em] shrink-0 items-center gap-[0.6em] px-[0.6em]">
      {nav !== "none" && (
        <span className="flex h-[2.6em] w-[2.6em] items-center justify-center" aria-hidden="true">
          {nav === "back" ? <ArrowLeft size={20} /> : <X size={20} />}
        </span>
      )}
      <p className={`flex-1 text-[1.3em] ${nav === "none" ? "pl-[0.5em]" : ""}`}>{title}</p>
      {trailing}
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className="relative inline-flex h-[2em] w-[3.3em] shrink-0 items-center rounded-full border-2"
      style={{ background: on ? C.primary : C.surfaceContainer, borderColor: on ? C.primary : C.outline }}
      aria-hidden="true"
    >
      <span
        className="absolute flex items-center justify-center rounded-full"
        style={
          on
            ? { right: "0.2em", width: "1.5em", height: "1.5em", background: "#fff" }
            : { left: "0.35em", width: "1em", height: "1em", background: C.outline }
        }
      >
        {on && <Check size={10} color={C.primary} strokeWidth={3} />}
      </span>
    </span>
  );
}

/* ---------- onboarding ---------- */

function Page({ icon, children, footer }: { icon: React.ReactNode; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-white px-[1.5em] pb-[1.1em]">
      <div className="mt-[2em] flex h-[3.6em] w-[3.6em] items-center justify-center rounded-[1em]" style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
        {icon}
      </div>
      <div className="mt-[1.1em] flex-1">{children}</div>
      {footer}
    </div>
  );
}

function Intro({ s }: { s: Extract<Screen, { kind: "intro" }> }) {
  const icons = [Bluetooth, BellRing, BatteryCharging, Bell];
  return (
    <Page icon={<ShieldCheck size={26} />} footer={<Filled>Get started</Filled>}>
      <p className="text-[1.75em] leading-[1.18]">{s.heading}</p>
      <Critical id="permission-purpose" as="p" className="mt-[0.6em] text-[1em]">
        <span style={{ color: C.onSurfaceVariant }}>{s.body}</span>
      </Critical>
      <ul className="mt-[1em] space-y-[0.55em]">
        {s.bullets.map((b, i) => {
          const Icon = icons[i % icons.length];
          return (
            <li key={b} className="flex items-center gap-[0.75em] rounded-[0.9em] px-[0.8em] py-[0.6em] text-[0.98em]" style={{ background: C.surfaceContainer }}>
              <Icon size={18} color={C.primary} aria-hidden="true" />
              {b}
            </li>
          );
        })}
      </ul>
      <p className="mt-[0.9em] text-[0.85em]" style={{ color: C.onSurfaceVariant }}>
        Up to 7 steps on this phone. About 2 minutes.
      </p>
    </Page>
  );
}

function iconFor(heading: string) {
  if (/pump|connect/i.test(heading)) return <Bluetooth size={26} />;
  if (/silent|disturb/i.test(heading)) return <MoonStar size={26} />;
  if (/background|running/i.test(heading)) return <BatteryCharging size={26} />;
  if (/time|timer|data stops/i.test(heading)) return <Clock size={26} />;
  return <Bell size={26} />;
}

function Permission({ s, oem }: { s: Extract<Screen, { kind: "permission" }>; oem: Oem }) {
  const variant = s.oem?.[oem];
  const extraOem = variant && oem !== "pixel" ? variant : null;
  const settings = s.android.type === "settings" ? s.android : null;
  const dialog = s.android.type === "dialog" && !extraOem ? s.android : null;
  return (
    <div className="relative flex flex-1 flex-col">
      <Page icon={iconFor(s.heading)} footer={<Filled>{settings ? "Open settings" : extraOem ? "Open battery settings" : "Continue"}</Filled>}>
        <p className="text-[1.55em] leading-[1.18]">{s.heading}</p>
        <Critical id="permission-purpose" as="p" className="mt-[0.55em] text-[1em]">
          <span style={{ color: C.onSurfaceVariant }}>{s.why}</span>
        </Critical>
        <Critical id="consequence-if-denied" className="mt-[0.9em] flex items-start gap-[0.5em] rounded-[0.9em] bg-[#FFF1E0] p-[0.8em] text-[0.93em] text-[#4A2700]">
          <span className="contents">
            <AlertTriangle size={16} className="mt-[0.1em] shrink-0" color="#9A5200" aria-hidden="true" />
            <span>
              <span className="font-medium">If you don&apos;t allow: </span>
              {s.ifDenied}
            </span>
          </span>
        </Critical>
        {settings && <SettingsPreview page={settings} />}
        {extraOem && (
          <Critical id="system-prompt" className="mt-[0.9em] rounded-[0.9em] border border-[#C5C6D0] p-[0.8em] text-[0.93em]">
            <p className="font-medium">After you allow the system dialog, {extraOem.label} also needs</p>
            <p className="mt-[0.2em] text-[0.88em]" style={{ color: C.onSurfaceVariant }}>
              {extraOem.path.join(" › ")}
            </p>
            <ol className="mt-[0.45em] list-decimal space-y-[0.2em] pl-[1.2em]">
              {extraOem.steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </Critical>
        )}
      </Page>
      {dialog && <PermissionDialog d={dialog} icon={iconFor(s.heading)} />}
    </div>
  );
}

// Both answers get the same weight: on the most consequential prompt in setup,
// the test stimulus shouldn't nudge.
function PermissionDialog({ d, icon }: { d: SystemDialog; icon: React.ReactNode }) {
  const button = "rounded-full py-[0.7em] text-[0.98em] font-medium";
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/35 px-[1.2em]">
      <Critical id="system-prompt" className="rise w-full rounded-[1.8em] bg-[#F1F2FB] px-[1.4em] pb-[1em] pt-[1.4em] text-center shadow-xl">
        <span className="mx-auto flex h-[2em] w-[2em] items-center justify-center" style={{ color: C.primary }} aria-hidden="true">
          {icon}
        </span>
        <p className="mt-[0.6em] text-[1.15em] leading-snug">{d.title}</p>
        {d.body && (
          <p className="mt-[0.5em] text-[0.9em] leading-snug" style={{ color: C.onSurfaceVariant }}>
            {d.body}
          </p>
        )}
        <div className="mt-[1em] space-y-[0.4em]">
          <div className={button} style={{ color: C.onPrimaryContainer, background: C.primaryContainer }}>
            {d.allow}
          </div>
          <div className={button} style={{ color: C.onPrimaryContainer, background: C.primaryContainer }}>
            {d.deny}
          </div>
        </div>
      </Critical>
    </div>
  );
}

/*
 * The app can't put its own words inside system Settings, so the explanation
 * lives on the app's pre-screen and the Settings page is previewed as-is:
 * plain, with the toggle still off and highlighted.
 */
function SettingsPreview({ page }: { page: SettingsPage }) {
  return (
    <Critical id="system-prompt" className="mt-[0.9em] rounded-[1em] bg-[#F8F9FF] p-[0.8em] text-[0.93em] ring-1 ring-[#C5C6D0]">
      <p className="text-[0.82em]" style={{ color: C.onSurfaceVariant }}>
        In Settings you&apos;ll see: {page.path.join(" › ")}
      </p>
      <div className="mt-[0.5em] flex items-center gap-[0.8em] rounded-[0.8em] bg-white px-[0.8em] py-[0.7em] ring-2 ring-[#5D79FF]">
        <span className="min-w-0 flex-1">
          <span className="block">{page.toggle}</span>
          <span className="mt-[0.15em] block text-[0.85em] leading-snug" style={{ color: C.onSurfaceVariant }}>
            {page.description}
          </span>
        </span>
        <Switch on={false} />
      </div>
      <p className="mt-[0.4em] text-[0.82em] font-medium" style={{ color: C.primary }}>
        Turn this on, then come back
      </p>
    </Critical>
  );
}

function Denied({ s }: { s: Extract<Screen, { kind: "permission" }> }) {
  const d = s.denied;
  return (
    <Page
      icon={<AlertTriangle size={26} color={d.blocksSetup ? "#8C1D18" : "#6E3900"} />}
      footer={
        <div className="space-y-[0.3em]">
          <Filled>{d.action}</Filled>
          {!d.blocksSetup && <TextBtn>Continue with reduced alerts</TextBtn>}
        </div>
      }
    >
      <p className="text-[1.55em] leading-[1.18]">{d.heading}</p>
      <Critical id="consequence-if-denied" as="p" className="mt-[0.55em] text-[1em]">
        <span style={{ color: C.onSurfaceVariant }}>{d.body}</span>
      </Critical>
      {d.blocksSetup && (
        <Critical id="setup-blocked" className="mt-[0.9em] flex items-start gap-[0.5em] rounded-[0.9em] bg-[#FFE2DF] p-[0.8em] text-[0.93em]">
          <span className="contents" style={{ color: "#8C1D18" }}>
            <XCircle size={16} className="mt-[0.1em] shrink-0" aria-hidden="true" />
            Setup can&apos;t finish until this is allowed.
          </span>
        </Critical>
      )}
    </Page>
  );
}

function Ongoing({ s }: { s: Extract<Screen, { kind: "ongoing" }> }) {
  return (
    <Page icon={<Bell size={26} />} footer={<Filled>Got it</Filled>}>
      <p className="text-[1.55em] leading-[1.18]">{s.heading}</p>
      <Critical id="permission-purpose" as="p" className="mt-[0.55em] text-[1em]">
        <span style={{ color: C.onSurfaceVariant }}>{s.why}</span>
      </Critical>
      <div className="mt-[1em] rounded-[1.4em] bg-[#E9EAF3] p-[0.9em]" aria-label="Example ongoing notification">
        <div className="flex items-center gap-[0.4em] text-[0.8em]" style={{ color: C.onSurfaceVariant }}>
          <span className="flex h-[1.4em] w-[1.4em] items-center justify-center rounded-full text-white" style={{ background: C.primary }}>
            <ShieldCheck size={10} aria-hidden="true" />
          </span>
          {APP_NAME} · Ongoing
        </div>
        <p className="mt-[0.4em] text-[1em] font-medium">Automation on · last run 2 min ago</p>
        <p className="text-[0.9em]" style={{ color: C.onSurfaceVariant }}>
          124 mg/dL → · 2 min ago · Temp basal 0.90 U/hr
        </p>
      </div>
      <Critical id="consequence-if-denied" className="mt-[0.9em] flex items-start gap-[0.5em] text-[0.93em]">
        <span className="contents">
          <Info size={16} className="mt-[0.1em] shrink-0" color={C.primary} aria-hidden="true" />
          {s.ifDismissed}
        </span>
      </Critical>
    </Page>
  );
}

function Alarm({ s }: { s: Extract<Screen, { kind: "alarm" }> }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#410E0B] px-[1.4em] pb-[1.2em] text-white">
      <p className="mt-[1.4em] text-[0.9em] opacity-90">Full-screen alert · lock screen</p>
      <span className="alarm-pulse mt-[1.8em] flex h-[6.5em] w-[6.5em] items-center justify-center rounded-full bg-[#FFB4AB]/20 ring-8 ring-[#FFB4AB]/15">
        <AlertTriangle size={44} color="#FFDAD6" aria-hidden="true" />
      </span>
      <Critical id="alert-message" className="mt-[1.4em] text-center">
        <p className="text-[1.6em] leading-tight">{s.title}</p>
        <p className="mt-[0.5em] text-[1em] leading-snug opacity-90">{s.body}</p>
      </Critical>
      <p className="mt-[0.8em] text-[0.85em] opacity-85">Sounds through Do Not Disturb</p>
      <div className="mt-auto w-full space-y-[0.5em]">
        <div className="rounded-full bg-[#FFDAD6] py-[0.8em] text-center text-[1em] font-medium text-[#410E0B]">I heard it</div>
        <div className="rounded-full border border-[#FFDAD6]/60 py-[0.8em] text-center text-[1em] font-medium">I didn&apos;t hear it</div>
      </div>
    </div>
  );
}

function Summary({ s }: { s: Extract<Screen, { kind: "summary" }> }) {
  return (
    <div className="flex flex-1 flex-col bg-white px-[1.1em] pb-[1.1em]">
      <p className="mt-[1.4em] text-[1.7em] leading-tight">{s.heading}</p>
      <Critical id="permission-purpose" as="p" className="mt-[0.2em] text-[0.95em]">
        <span style={{ color: C.onSurfaceVariant }}>Everything needed for urgent alerts to reach you.</span>
      </Critical>
      <ul className="mt-[0.9em] space-y-[0.35em]">
        {s.items.map((it) => (
          <li key={it.label} className="flex items-center gap-[0.7em] rounded-[0.9em] px-[0.8em] py-[0.55em]" style={{ background: C.surfaceContainer }}>
            <CheckCircle2 size={18} color="#00702A" aria-hidden="true" />
            <span className="flex-1">
              <span className="block text-[0.95em]">{it.label}</span>
              <span className="block text-[0.8em]" style={{ color: C.onSurfaceVariant }}>
                {it.android}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-[0.8em]">
        <Filled>Done</Filled>
      </div>
    </div>
  );
}

/* ---------- status ---------- */

function HeadsUp({ title, body, urgent }: { title: string; body: string; urgent?: boolean }) {
  return (
    <Critical id="alert-message" className="rise relative z-10 mx-[0.5em] mb-[0.2em] mt-[0.1em] rounded-[1.4em] bg-[#E9EAF3] p-[0.85em] shadow-[0_6px_24px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-[0.4em] text-[0.8em]" style={{ color: C.onSurfaceVariant }}>
        <span className="flex h-[1.4em] w-[1.4em] items-center justify-center rounded-full text-white" style={{ background: urgent ? "#B3261E" : C.primary }}>
          <Bell size={10} aria-hidden="true" />
        </span>
        {APP_NAME} · now
        {urgent && <span className="font-medium text-[#8C1D18]">· Urgent</span>}
      </div>
      <p className="mt-[0.35em] text-[1em] font-medium leading-tight">{title}</p>
      <p className="text-[0.9em] leading-snug" style={{ color: C.onSurfaceVariant }}>
        {body}
      </p>
    </Critical>
  );
}

function Status({ s, m }: { s: Extract<Screen, { kind: "status" }>; m: StatusModel }) {
  const t = TONE[m.status.tone];
  const cgmTone = TONE[m.cgm.tone];
  return (
    <div className="relative flex flex-1 flex-col">
      {s.notice && <HeadsUp {...s.notice} />}
      <TopBar title="Status" nav="none" trailing={<Settings size={20} className="mr-[0.4em]" aria-hidden="true" />} />

      <div className="space-y-[0.45em] px-[0.7em]">
        {s.banner && (
          <Critical id="alert-message" className="flex items-start gap-[0.5em] rounded-[1em] bg-[#FFE2DF] px-[0.8em] py-[0.6em] text-[0.9em] text-[#5C0E0A]">
            <XCircle size={16} className="mt-[0.1em] shrink-0" aria-hidden="true" />
            <span className="flex-1">{s.banner.text}</span>
            <span className="font-medium underline">{s.banner.action}</span>
          </Critical>
        )}

        <Critical id="loop-status" className="flex items-start gap-[0.55em] rounded-[1em] bg-white px-[0.8em] py-[0.65em]">
          <span className="contents" style={{ color: t.fg }}>
            <span className="flex h-[2em] w-[2em] shrink-0 items-center justify-center rounded-full" style={{ background: t.bg }}>
              <t.Icon size={16} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[1.05em] font-medium">{m.status.label}</span>
              <span className="block text-[0.88em]" style={{ color: C.onSurfaceVariant }}>
                {m.status.reason}
              </span>
            </span>
          </span>
        </Critical>

        <div className="lv-stack grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-[0.45em]">
          <div className="rounded-[1em] bg-white px-[0.8em] py-[0.6em]">
            <p className="text-[0.78em]" style={{ color: C.onSurfaceVariant }}>
              Glucose
            </p>
            <Critical id="glucose-value" className="flex items-baseline gap-[0.2em]">
              <span className="text-[2em] leading-none tracking-tight" style={{ color: m.glucose.stale ? C.onSurfaceVariant : C.onSurface }}>
                {m.glucose.display}
              </span>
              {m.glucose.trend && (
                <span className="text-[1.05em]" style={{ color: C.glucose }} role="img" aria-label={`trend ${m.glucose.trend}`}>
                  {m.glucose.trend === "up" ? "↗" : m.glucose.trend === "down" ? "↘" : "→"}
                </span>
              )}
              <span className="text-[0.75em]" style={{ color: C.onSurfaceVariant }}>
                {m.glucose.unit}
              </span>
            </Critical>
            <Critical id="glucose-age" as="p" className="mt-[0.2em] text-[0.78em] leading-tight">
              <span className="inline-flex items-center gap-[0.25em]">
                <Clock size={11} aria-hidden="true" />
                {m.glucose.ageLabel}
              </span>
            </Critical>
          </div>
          <Critical id="basal-state" className="rounded-[1em] bg-white px-[0.8em] py-[0.6em]">
            <p className="text-[0.78em]" style={{ color: C.onSurfaceVariant }}>
              {m.basal.title}
            </p>
            <p className="text-[1.3em] leading-tight">{m.basal.rate}</p>
            <p className="mt-[0.15em] text-[0.75em] leading-tight" style={{ color: C.onSurfaceVariant }}>
              {m.basal.detail}
            </p>
          </Critical>
        </div>

        <Critical id="cgm-state" className="flex items-center gap-[0.5em] rounded-[1em] bg-white px-[0.8em] py-[0.5em] text-[0.88em]">
          <span className="flex h-[1.6em] w-[1.6em] shrink-0 items-center justify-center rounded-full" style={{ background: cgmTone.bg, color: cgmTone.fg }}>
            <cgmTone.Icon size={12} aria-hidden="true" />
          </span>
          <span className="font-medium">{m.cgm.label}</span>
          <span className="ml-auto text-right text-[0.9em]" style={{ color: C.onSurfaceVariant }}>
            {m.cgm.detail}
          </span>
        </Critical>

        <div className="rounded-[1em] bg-white px-[0.7em] pb-[0.3em] pt-[0.5em]">
          <p className="text-[0.78em]" style={{ color: C.onSurfaceVariant }}>
            Last 3 hours
          </p>
          <GlucoseChart chart={m.chart} color={C.glucose} rangeColor="#EFEAFB" gridColor="#E3E3EC" textColor={C.onSurfaceVariant} gapColor="#F1F1F6" height={100} />
        </div>

        {s.sheet === "warmup" && (
          <div className="flex items-start gap-[0.5em] rounded-[1em] px-[0.8em] py-[0.6em] text-[0.86em]" style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
            <Info size={15} className="mt-[0.1em] shrink-0" aria-hidden="true" />
            Closed loop is on, but nothing is automated during warmup. Scheduled basal continues. Readings and automation return about {formatClock(WARMUP_ENDS_AT)}.
          </div>
        )}
      </div>

      <nav className="mt-auto flex justify-around bg-[#ECEDF6] pb-[0.4em] pt-[0.6em] text-[0.75em]" aria-hidden="true">
        {[
          { Icon: Home, label: "Status", active: true },
          { Icon: Plus, label: "Carbs" },
          { Icon: History, label: "History" },
          { Icon: Settings, label: "Settings" },
        ].map(({ Icon, label, active }) => (
          <span key={label} className="flex flex-col items-center gap-[0.2em]">
            <span className="flex h-[2.2em] w-[3.6em] items-center justify-center rounded-full" style={{ background: active ? C.primaryContainer : "transparent" }}>
              <Icon size={18} />
            </span>
            <span className={active ? "font-medium" : ""}>{label}</span>
          </span>
        ))}
      </nav>

      {s.sheet === "pair" && <PairScreen />}
      {s.sheet === "meal" && <MealScreen />}
    </div>
  );
}

function PairScreen() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#2A2A2E]">
      {/* Predictive back: the page shrinks toward the edge while the gesture is held. */}
      <div className="mx-[0.9em] mt-[1em] flex flex-1 origin-right scale-[0.93] flex-col overflow-hidden rounded-[1.6em] bg-white">
        <TopBar title="Pair new sensor" />
        <ol className="mx-[1em] space-y-[0.5em] text-[0.95em]">
          <li className="flex items-center gap-[0.6em] rounded-[0.9em] px-[0.8em] py-[0.6em]" style={{ background: C.surfaceContainer }}>
            <CheckCircle2 size={16} color="#00702A" aria-hidden="true" /> Sensor applied
          </li>
          <li className="flex items-center gap-[0.6em] rounded-[0.9em] px-[0.8em] py-[0.6em]" style={{ background: C.surfaceContainer }}>
            <Bluetooth size={16} color={C.primary} aria-hidden="true" /> Found Demo iCGM · SN 8F3K
          </li>
        </ol>
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-[1.3em]">
        <div className="rise w-full rounded-[1.8em] bg-[#F1F2FB] p-[1.3em] shadow-2xl">
          <p className="text-[1.25em] leading-snug">Leave pairing?</p>
          <p className="mt-[0.5em] text-[0.92em] leading-snug" style={{ color: C.onSurfaceVariant }}>
            Your new sensor isn&apos;t connected yet. Glucose readings and automation stay off until it is.
          </p>
          <div className="mt-[1em] flex justify-end gap-[0.4em] text-[0.98em] font-medium" style={{ color: C.primary }}>
            <span className="rounded-full px-[0.9em] py-[0.5em]">Leave</span>
            <span className="rounded-full px-[0.9em] py-[0.5em] text-white" style={{ background: C.primary }}>
              Keep pairing
            </span>
          </div>
        </div>
      </div>
      <p className="absolute bottom-[0.6em] left-0 right-0 text-center text-[0.8em] text-white/85">Back gesture in progress</p>
    </div>
  );
}

function MealScreen() {
  const field = "rounded-[0.5em] border px-[0.8em] pb-[0.5em] pt-[0.35em]";
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      <TopBar title="Log carbs" nav="close" trailing={<span className="mr-[0.6em] text-[1em] font-medium" style={{ color: C.primary }}>Save</span>} />
      <div className="space-y-[0.7em] px-[1em]">
        {[
          ["Carbs", `${SCENARIO.mealCarbs} g`],
          ["Time", formatClock(SCENARIO.mealAt)],
          ["Fingerstick (manual)", `${SCENARIO.fingerstickMgdl} mg/dL`],
        ].map(([label, value]) => (
          <div key={label} className={field} style={{ borderColor: C.outline }}>
            <span className="block text-[0.75em]" style={{ color: C.onSurfaceVariant }}>
              {label}
            </span>
            <span className="text-[1.05em]">{value}</span>
          </div>
        ))}
        <div className="flex items-start gap-[0.5em] rounded-[1em] px-[0.8em] py-[0.6em] text-[0.88em]" style={{ background: C.primaryContainer, color: C.onPrimaryContainer }}>
          <Info size={15} className="mt-[0.1em] shrink-0" aria-hidden="true" />
          Automatic adjustments are paused until {formatClock(WARMUP_ENDS_AT)}, so cover this meal with a bolus now. Your fingerstick can be used for the recommendation.
        </div>
        <div className="flex items-center justify-between rounded-[0.5em] border border-dashed px-[0.8em] py-[0.6em]" style={{ borderColor: C.outline }}>
          <span className="text-[1.05em]">Bolus</span>
          <span className="text-[0.85em]" style={{ color: C.onSurfaceVariant }}>
            dose omitted in this concept
          </span>
        </div>
      </div>
    </div>
  );
}
