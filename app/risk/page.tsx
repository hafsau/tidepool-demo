import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Section, severityPill } from "@/components/page";
import { ALL_STEPS } from "@/lib/flows";
import { SEVERITY_DEFINITIONS, URRA } from "@/lib/risk";

export const metadata: Metadata = { title: "Risk & protocol" };

const stepLabel = (id: string) => ALL_STEPS.find((s) => s.id === id);
const candidateCritical = (ids: string[]) => ids.some((id) => stepLabel(id)?.hf.candidateCritical);

const TERMS = [
  ["Critical task", "FDA, Applying Human Factors and Usability Engineering to Medical Devices (2016)"],
  ["URRA (use-related risk analysis)", "FDA draft guidance, Content of Human Factors Information in Medical Device Marketing Submissions (Dec 2022)"],
  ["Hazard-related use scenario", "IEC 62366-1"],
  ["Hazard → hazardous situation → harm; control option order", "ISO 14971: inherent safety by design, then protective measures, then information for safety"],
];

const TASKS = [
  ["T1", "Complete alert setup from first launch on your own phone", "Alert delivery: steps 1–10"],
  ["T2", "From a state where notifications were turned off, restore alerts", "Alert delivery: step 11"],
  ["T3", "At three moments, answer \"What is your glucose?\" and \"Is the app adjusting insulin right now?\"", "Sensor: steps 3–5, 7"],
  ["T4", "Replace the sensor. Moderator interrupts once mid-pairing (back gesture or swipe-down)", "Sensor: step 6"],
  ["T5", "Log dinner during warmup, then answer \"What do you need to do for this meal?\"", "Sensor: step 8"],
];

export default function RiskPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
      <PageIntro eyebrow="Risk & protocol" title="An illustrative risk table and a formative plan">
        <p>
          How I&apos;d start the human-factors work for these two flows: a use-related risk analysis with the controls each design decision is
          answering, and a formative study built to find out whether Android matches iOS.
        </p>
        <p className="rounded-xl border border-warn/30 bg-warn-soft px-3 py-2 text-[14px] font-medium text-warn">
          ILLUSTRATIVE: not Tidepool&apos;s risk file. IDs, wording and severities are mine, written from public information, to show the shape of the work.
        </p>
      </PageIntro>

      <Section id="urra" title="Use-related risk analysis">
        <p className="mb-3 max-w-[72ch] text-[14.5px] text-muted">
          Severity is a deliberately simple two-level scale; a real file uses the manufacturer&apos;s own defined levels. There are no probability
          scores on purpose: those come from real data, not a concept.{" "}
          {Object.entries(SEVERITY_DEFINITIONS).map(([k, v]) => (
            <span key={k}>
              <span className="font-semibold text-ink">{k}:</span> {v}{" "}
            </span>
          ))}
        </p>
        <div className="overflow-x-auto rounded-2xl border border-line-soft bg-surface" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[1200px] border-collapse text-left text-[13.5px]">
            <caption className="sr-only">Illustrative use-related risk analysis</caption>
            <thead className="bg-sunken text-[12px] uppercase tracking-wide text-muted">
              <tr>
                {["ID", "Use scenario", "Use error", "Hazardous situation", "Potential harm", "Severity", "Risk controls", "Verification", "Steps"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {URRA.map((r) => (
                <tr key={r.id} id={r.id} className="scroll-mt-6 border-t border-line-soft align-top target:bg-accent-soft">
                  <th scope="row" className="whitespace-nowrap px-3 py-3 font-mono text-[12.5px]">
                    {r.id}
                    {candidateCritical(r.steps) && <span className="mt-1 block font-sans text-[11.5px] font-semibold">Candidate critical task</span>}
                  </th>
                  <td className="px-3 py-3 text-muted">{r.scenario}</td>
                  <td className="px-3 py-3">{r.useError}</td>
                  <td className="px-3 py-3 text-muted">{r.hazardousSituation}</td>
                  <td className="px-3 py-3 text-muted">{r.harm}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${severityPill[r.severity]}`}>{r.severity}</span>
                  </td>
                  <td className="min-w-[260px] px-3 py-3">
                    <ul className="space-y-1.5">
                      {r.controls.map((c) => (
                        <li key={c.text} className="text-muted">
                          <span className="block text-[11.5px] font-semibold text-ink">{c.type}</span>
                          {c.text}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3 text-muted">{r.verify}</td>
                  <td className="px-3 py-3">
                    {r.inFlow ? (
                      <ul className="space-y-1">
                        {r.steps.map((id) => {
                          const s = stepLabel(id)!;
                          return (
                            <li key={id}>
                              <Link className="link whitespace-nowrap" href={`/?flow=${s.flow}&step=${id}`}>
                                {s.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-muted">Row only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-2xl border border-line-soft bg-surface p-4">
          <h3 className="text-[15px] font-semibold">Where the terms come from</h3>
          <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-[14px] md:grid-cols-[260px_1fr]">
            {TERMS.map(([t, src]) => (
              <div key={t} className="contents">
                <dt className="font-medium">{t}</dt>
                <dd className="text-muted">{src}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section id="protocol" title="Formative protocol: is Android held to the iOS bar?">
        <div className="grid gap-4 lg:grid-cols-2">
          <ProtocolCard title="Research question">
            Can people complete the alert-setup and sensor-replacement tasks on Android with no use errors that don&apos;t also happen on iOS, and do they
            understand the app&apos;s state as well?
          </ProtocolCard>
          <ProtocolCard title="Participants">
            <ul className="list-disc space-y-1 pl-5">
              <li>Adults with type 1 diabetes who use automated insulin dosing, and caregivers of users aged 6 and up, as separate groups.</li>
              <li>Android group split by phone maker: Pixel, Samsung, Xiaomi or another aggressive battery manager, at least two each.</li>
              <li>An iOS comparison group on the same tasks.</li>
              <li>At least one or two people who use TalkBack or VoiceOver, or large text, in each platform group.</li>
            </ul>
          </ProtocolCard>
          <ProtocolCard title="Setup">
            Moderated, think-aloud, on the participant&apos;s own phone where possible, because the OEM settings are the point. T1 and T2 need a
            native test build: a web prototype can&apos;t exercise real system permissions. Simulated pump and sensor; no insulin. Everyone gets the same
            scripted evening.
          </ProtocolCard>
          <ProtocolCard title="What we measure">
            Task success, use errors, close calls and difficulties; answers to knowledge questions (T3, T5); root cause from a short debrief after each
            task. Time on task is secondary.
          </ProtocolCard>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line-soft bg-surface" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
            <caption className="sr-only">Formative study tasks</caption>
            <thead className="bg-sunken text-[12px] uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Task</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">What the participant does</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Covers</th>
              </tr>
            </thead>
            <tbody>
              {TASKS.map(([id, what, covers]) => (
                <tr key={id} className="border-t border-line-soft align-top">
                  <th scope="row" className="px-3 py-3 font-mono text-[12.5px]">
                    {id}
                  </th>
                  <td className="px-3 py-3">{what}</td>
                  <td className="px-3 py-3 text-muted">{covers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ProtocolCard title="How we'd read the results">
            Any use error on a critical task gets a root cause and a design change, whatever the platform. A use error that happens only on Android is the
            finding this study exists for. Comprehension answers should match the iOS group.
          </ProtocolCard>
          <ProtocolCard title="What this can't tell us">
            <ul className="list-disc space-y-1 pl-5">
              <li>Formative numbers don&apos;t support statistical claims. No percentages come out of this.</li>
              <li>A lab session doesn&apos;t reproduce overnight battery management. That needs a bench test per device.</li>
              <li>Three OEMs aren&apos;t all of Android.</li>
              <li>It isn&apos;t summative validation. That needs the production-equivalent build and at least 15 participants per distinct user group (FDA 2016).</li>
            </ul>
          </ProtocolCard>
        </div>
      </Section>
    </div>
  );
}

function ProtocolCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-4 text-[14.5px]">
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <div className="text-muted">{children}</div>
    </div>
  );
}
