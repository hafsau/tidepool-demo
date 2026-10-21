"use client";

import { ArrowLeft, ArrowRight, Copy, Eye, ShieldAlert, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { IosScreen } from "@/components/ios/ios-screen";
import { M3Screen } from "@/components/m3/m3-screen";
import { FrameContext } from "@/components/shared/critical";
import { deltaPill, severityPill } from "@/components/page";
import { PhoneFrame } from "@/components/shared/phone-frame";
import { formatClock } from "@/lib/clock";
import { CRITICAL, criticalFor, FLOWS, hasDenyPath, type FlowId, type Oem, type Platform, type Step } from "@/lib/flows";
import { parseView, serializeView, type ViewState } from "@/lib/url-state";

export function Prototype() {
  const params = useSearchParams();
  const view = useMemo(() => parseView(new URLSearchParams(params.toString())), [params]);

  // Native history keeps the URL shareable without a server round trip per
  // click; Next syncs useSearchParams with it.
  const set = useCallback((patch: Partial<ViewState>) => window.history.replaceState(null, "", `/${serializeView({ ...view, ...patch })}`), [view]);

  const flow = FLOWS[view.flow];
  const index = flow.steps.findIndex((s) => s.id === view.step);
  const step = flow.steps[index];
  const denyAvailable = hasDenyPath(step);
  const deny = view.deny && denyAvailable;
  const hasOem = step.screen.kind === "permission" && !!step.screen.oem;

  const go = useCallback(
    (delta: number) => {
      const next = flow.steps[index + delta];
      if (next) set({ step: next.id, deny: false });
    },
    [flow.steps, index, set],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (document.querySelector("dialog[open]")) return;
      const el = e.target as HTMLElement | null;
      if (el && (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.isContentEditable || el.closest('[role="radiogroup"]'))) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const clock = step.screen.kind === "status" ? formatClock(step.screen.now) : "9:41 AM";
  const dark = step.screen.kind === "alarm";

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
      <section className="grid gap-x-10 gap-y-2 pt-6 pb-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
        <div>
          <p className="eyebrow">Concept · automated insulin dosing · Android</p>
          <h1 className="mt-1.5 text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-[34px]">Critical tasks, held to the iOS bar</h1>
        </div>
        <p className="max-w-[68ch] text-[15px] text-muted">
          Tidepool{" "}
          <a className="link" href="https://www.tidepool.org/blog/what-tidepool-loop-on-android-means">
            wrote in 2023
          </a>{" "}
          that Android must show critical tasks are{" "}
          <q className="text-ink">just as easy to perform on an Android phone as they are on their iOS counterpart</q>. Here are two, designed for
          Android and checked step by step against an iOS reference, with the human-factors reasoning a usability study would test.
        </p>
      </section>

      {/* Controls */}
      <div className="sticky top-0 z-30 -mx-4 border-y border-line-soft bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Segmented
            label="Flow"
            value={view.flow}
            options={(Object.keys(FLOWS) as FlowId[]).map((id, i) => ({ value: id, label: `${i + 1} · ${FLOWS[id].title}` }))}
            onChange={(v) => set({ flow: v as FlowId, step: FLOWS[v as FlowId].steps[0].id, deny: false })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Toggle label="Deny path" on={deny} disabled={!denyAvailable} onChange={(on) => set({ deny: on })} icon={<ShieldAlert size={15} />} />
            <Toggle label="HF overlay" on={view.hf} onChange={(on) => set({ hf: on })} icon={<Eye size={15} />} />
            <Toggle label="Low vision" on={view.lv} onChange={(on) => set({ lv: on })} icon={<span className="text-[13px] font-bold">Aa</span>} />
            {hasOem && (
              <label className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-3 pr-1 text-[13.5px]">
                <Smartphone size={15} aria-hidden="true" />
                Phone
                <select
                  className="rounded-full bg-sunken px-2 py-1 text-[13.5px]"
                  value={view.oem}
                  onChange={(e) => set({ oem: e.target.value as Oem })}
                >
                  <option value="pixel">Pixel</option>
                  <option value="samsung">Samsung</option>
                  <option value="xiaomi">Xiaomi</option>
                </select>
              </label>
            )}
          </div>
        </div>
        <ol className="mt-3 flex gap-1.5 overflow-x-auto pb-1" aria-label={`${flow.title} steps`}>
          {flow.steps.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => set({ step: s.id, deny: false })}
                aria-current={s.id === step.id ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                  s.id === step.id ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink"
                }`}
              >
                <span className="tabular-nums">{i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Prototype frames">
          <div className="mb-4 flex justify-center min-[900px]:hidden">
            <Segmented
              label="Platform"
              value={view.platform}
              options={[
                { value: "ios", label: "iOS reference" },
                { value: "android", label: "Android proposed" },
              ]}
              onChange={(v) => set({ platform: v as Platform })}
            />
          </div>
          <div className="flex justify-center gap-6 xl:gap-10">
            {(["ios", "android"] as const).map((platform) => (
              <div key={platform} className={`${view.platform === platform ? "flex" : "hidden"} min-w-0 flex-col items-center min-[900px]:flex`}>
                <p className="mb-3 text-center text-[13px]">
                  <span className="font-semibold">{platform === "ios" ? "iOS · reference" : "Android · proposed"}</span>
                  <span className="block text-muted">{platform === "ios" ? "Based on open-source Loop patterns" : "Material 3"}</span>
                </p>
                <FrameContext.Provider value={{ order: criticalFor(step, { platform, deny }), hf: view.hf, lv: view.lv }}>
                  <PhoneFrame
                    platform={platform}
                    clock={clock}
                    dark={dark}
                    hf={view.hf}
                    lv={view.lv}
                    label={`${platform === "ios" ? "iOS reference" : "Android proposed"}: ${step.label}${deny ? ", denied" : ""}`}
                  >
                    <div key={`${step.id}-${deny}-${view.oem}`} className="flex flex-1 flex-col">
                      {platform === "ios" ? <IosScreen step={step} deny={deny} /> : <M3Screen step={step} deny={deny} oem={view.oem} />}
                    </div>
                  </PhoneFrame>
                </FrameContext.Provider>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-[640px]">
            <p className="text-[15px]" aria-live="polite">
              <span className="font-semibold">
                Step {index + 1} of {flow.steps.length}
                {deny ? " · deny path" : ""}.{" "}
              </span>
              {step.caption}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <NavButton onClick={() => go(-1)} disabled={index === 0} dir="prev" />
              <p className="hidden text-[12.5px] text-muted sm:block">← → keys step through</p>
              <NavButton onClick={() => go(1)} disabled={index === flow.steps.length - 1} dir="next" />
            </div>
          </div>
        </section>

        <aside className="space-y-4" aria-label="Step notes">
          <ParityCard step={step} />
          <HfCard step={step} />
          <CriticalCard step={step} deny={deny} />
        </aside>
      </div>
    </div>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  // Radio-group keyboard pattern: one tab stop, arrows move and select.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + delta + options.length) % options.length];
    onChange(next.value);
    const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[options.indexOf(next)]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="inline-flex rounded-full border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-[13.5px] transition-colors ${o.value === value ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  on,
  disabled,
  onChange,
  icon,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      title={disabled ? "No deny path on this step" : undefined}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        on ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-ink hover:border-ink/40"
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
      <span className={`ml-0.5 text-[11.5px] font-semibold ${on ? "text-accent" : "text-muted"}`} aria-hidden="true">
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

function NavButton({ onClick, disabled, dir }: { onClick: () => void; disabled: boolean; dir: "prev" | "next" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-colors disabled:opacity-40 ${
        dir === "next" ? "bg-ink text-white hover:bg-ink/90" : "border border-line bg-surface hover:border-ink/40"
      }`}
    >
      {dir === "prev" && <ArrowLeft size={16} aria-hidden="true" />}
      {dir === "prev" ? "Previous" : "Next step"}
      {dir === "next" && <ArrowRight size={16} aria-hidden="true" />}
    </button>
  );
}

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line-soft bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="eyebrow">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function HfCard({ step }: { step: Step }) {
  const hf = step.hf;
  return (
    <Card
      title="Human factors · illustrative"
      aside={
        hf.urra ? (
          <Link href={`/risk#${hf.urra}`} className="font-mono text-[12px] text-accent underline underline-offset-2">
            {hf.urra}
          </Link>
        ) : null
      }
    >
      <dl className="space-y-2.5 text-[14px]">
        <div>
          <dt className="flex flex-wrap items-center gap-2 font-semibold">
            User task
            {hf.candidateCritical && <span className="rounded-full bg-ink px-2 py-0.5 text-[11.5px] font-semibold text-white">Candidate critical task</span>}
          </dt>
          <dd className="text-muted">{hf.task}</dd>
        </div>
        <div>
          <dt className="font-semibold">Use error</dt>
          <dd className="text-muted">{hf.useError}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 font-semibold">
            Potential harm
            <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${severityPill[hf.severity]}`}>{hf.severity}</span>
          </dt>
          <dd className="text-muted">{hf.harm}</dd>
        </div>
        <div>
          <dt className="font-semibold">Risk controls</dt>
          <dd>
            <ul className="mt-1 space-y-1.5">
              {hf.controls.map((c) => (
                <li key={c.text} className="text-muted">
                  <span className="mr-1.5 inline-block rounded bg-sunken px-1.5 py-px text-[11.5px] font-medium text-ink">{c.type}</span>
                  {c.text}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-semibold">How it would be checked</dt>
          <dd className="text-muted">{hf.verify}</dd>
        </div>
      </dl>
    </Card>
  );
}

function ParityCard({ step }: { step: Step }) {
  const p = step.parity;
  return (
    <Card
      title="Parity"
      aside={<span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${deltaPill[p.delta]}`}>{p.delta}</span>}
    >
      <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-[14px]">
        <dt className="font-semibold">iOS</dt>
        <dd className="text-muted">{p.ios}</dd>
        <dt className="font-semibold">Android</dt>
        <dd className="text-muted">{p.android}</dd>
      </dl>
      <Link href="/matrix" className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-accent underline underline-offset-2">
        <Copy size={13} aria-hidden="true" /> Full matrix, copyable as a review ticket
      </Link>
    </Card>
  );
}

function CriticalCard({ step, deny }: { step: Step; deny: boolean }) {
  const ios = criticalFor(step, { platform: "ios", deny });
  const android = criticalFor(step, { platform: "android", deny });
  const same = ios.join() === android.join();
  return (
    <Card title="Must be perceivable">
      <p className="text-[13px] text-muted">
        In screen-reader order. Turn on Low vision to see the numbers in the frames. The parity test fails if either renderer drops one or reads them in a different order.
      </p>
      {!same && <p className="mt-2 text-[13px] font-semibold">Android (proposed)</p>}
      <ol className="mt-2 space-y-1 text-[14px]">
        {android.map((id, i) => (
          <li key={id} className="flex items-center gap-2">
            <span className="order-badge !text-[11px]">{i + 1}</span>
            {CRITICAL[id]}
          </li>
        ))}
      </ol>
      {!same && (
        <p className="mt-2 text-[13px] text-muted">
          <span className="font-semibold text-ink">iOS (reference):</span> {ios.map((id) => CRITICAL[id]).join(", ")}.
        </p>
      )}
    </Card>
  );
}
