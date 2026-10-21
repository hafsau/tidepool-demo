import type { Metadata } from "next";
import Link from "next/link";
import { ClinicianStrip } from "@/components/clinician-strip";
import { PageIntro, Section } from "@/components/page";
import { GLUCOSE_RECENCY_MIN, RING_AGING_MAX_MIN, RING_FRESH_MAX_MIN, TEMP_BASAL_MAX_MIN } from "@/lib/loop";

export const metadata: Metadata = { title: "About" };

const LOOP_RULES = [
  [`${GLUCOSE_RECENCY_MIN} min`, "Newest glucose older than this: no dosing decision.", "LoopAlgorithm inputDataRecencyInterval"],
  [`${TEMP_BASAL_MAX_MIN} min`, "Longest temp basal Loop sets. If Loop stops, the last one runs out and the pump returns to scheduled basal.", "LoopAlgorithm tempBasalDuration"],
  [`${RING_FRESH_MAX_MIN} / ${RING_AGING_MAX_MIN} min`, "Status ring: fresh up to 6, aging up to 16, then stale.", "LoopKit LoopCompletionFreshness"],
  ["20 / 40 / 60 / 120 min", "\"Loop hasn't completed\" notices: time-sensitive at 20 and 40 min, Critical at 60 and 120 (when Critical Alerts are on).", "Loop AlertManager"],
  ["– – –", "Stale glucose is replaced by dashes, not dimmed.", "LoopUI CGMStatusHUDViewModel"],
];

const DEVICES = [
  ["Demo iCGM (fictional)", "15-day wear, 60-minute warmup, no calibration", "Modeled on a FreeStyle Libre 3 Plus–class sensor (about 60 min warmup)"],
  ["For comparison", "Dexcom G7: about 30 min warmup, 10 days + 12 h grace", "Eversense 365: implanted, 24 h initialization with fingersticks"],
  ["Demo ACE pump (fictional)", "Scheduled basal 0.85 U/hr all evening", "No brand. The commercial pairing UI belongs to the device partner."],
];

const ASSUMPTIONS = [
  ["Android permission names and wording", "Taken from Android 12–15 documentation; exact text varies by OEM skin.", "Check on target devices"],
  ["OEM battery paths", "Samsung One UI and Xiaomi HyperOS paths change between releases.", "Bench test per OS version"],
  ["Which permissions an AID app can hold", "Full-screen intent and exact alarms may be granted differently for medical apps.", "Confirm with engineering and Play policy"],
  ["Temp basal behavior on sensor expiry", "Modeled as data simply stopping. If a CGM flags data as unreliable, Loop cancels high temps right away.", "Confirm with the Loop team"],
  ["iOS reference screens", "Patterns from open-source Loop, simplified. Not the shipping app's pixels.", "Compare with current build"],
  ["Severity ratings and URRA rows", "Mine, from public information.", "Replace with the real risk file"],
];

const CAUGHT = [
  [
    "What stale glucose does",
    "An early draft said that when CGM data stops, Loop \"falls back to open loop\" and \"suspends automation\". I checked LoopKit and LoopAlgorithm on GitHub: closed loop stays on, there are no new decisions after 15 minutes, and the last temp basal runs out to scheduled basal. \"Suspended\" means insulin has stopped, the opposite hazard, so the demo never uses that word for this state.",
  ],
  [
    "Showing the old number",
    "A draft dimmed the stale glucose value on Android. Loop's UI code replaces it with dashes. Android keeps the iOS behavior: changing an established safety behavior in the cleared app needs a reason and a trace, not a style preference.",
  ],
  [
    "Whose devices",
    "Drafts used real pump and pod names. Tidepool's own pages say Loop ships commercially as twiist Loop with a partner's devices, so pairing screens may not even be Tidepool's. Devices became fictional with cited lifecycles, and pod and bolus flows were cut.",
  ],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
      <PageIntro eyebrow="About this concept" title="Not a redesign. A translation, held to a bar.">
        <p>
          Tidepool Loop is FDA-cleared and in people&apos;s hands on iPhone. Bringing it to Android means a second submission and more usability testing to
          show critical tasks are as easy there. That work is mostly not visual. It&apos;s about whether an urgent alert actually reaches someone on a
          Samsung phone at 3 AM, and whether &ldquo;not looping&rdquo; is understood the same way on both platforms.
        </p>
        <p>
          So the iOS frame here is a reference, simplified from open-source Loop. The Android frame is the proposal. Every step says what has to stay the
          same, what differs, and how that difference would be tested.
        </p>
      </PageIntro>

      <Section title="Why these two flows">
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Alert delivery setup">
            On iOS, alert setup is three prompts, and getting through Do Not Disturb is one of them (Critical Alerts). On Android the same outcome takes up to seven steps (Bluetooth, notifications, Do Not Disturb
            override, full-screen intent, exact alarms, battery exemption, a foreground service) and some of them change by phone maker. Denying one can
            silently cost someone their urgent low alert. This is where Android parity is hardest.
          </Card>
          <Card title="Sensor replacement">
            The task every user repeats every couple of weeks, and the one where the app&apos;s state is easiest to misread: closed loop is on but nothing
            is automating, glucose is on screen but old, basal is running but not adjusting. Both platforms have to say all of that plainly.
          </Card>
        </div>
      </Section>

      <Section title="The day after, for a clinician">
        <p className="mb-3 max-w-[72ch] text-[14.5px] text-muted">
          The same scripted evening, as a daily view. The gap is labeled with its cause, so it isn&apos;t read as a low or as missing adherence. Basal shows
          what was actually delivered while Loop wasn&apos;t looping.
        </p>
        <ClinicianStrip />
      </Section>

      <Section title="Loop behavior the demo models">
        <Table head={["Value", "What it means", "Where it comes from"]} rows={LOOP_RULES} />
        <p className="mt-2 text-[13.5px] text-muted">
          From tidepool-org&apos;s open-source Loop, LoopKit and LoopAlgorithm repositories, October 2026. The invariants in{" "}
          <code className="rounded bg-sunken px-1 font-mono text-[12.5px]">tests/loop.test.ts</code> check them at every minute of the mock evening.
        </p>
      </Section>

      <Section title="Safety invariants (tested)">
        <ul className="grid gap-2 text-[14.5px] md:grid-cols-2">
          {[
            "No \"Looping\" status and no dosing decision when glucose is more than 15 minutes old.",
            "\"Insulin suspended\" never shows while scheduled basal is running.",
            "Basal state, rate and time left are always on screen.",
            "Every glucose value carries its age; stale values become dashes.",
            "Both renderers show the same critical items on every step, deny path and phone maker.",
            "No real brand names and no outcome claims in any step.",
          ].map((t) => (
            <li key={t} className="rounded-xl border border-line-soft bg-surface px-3 py-2.5">
              {t}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Devices">
        <Table head={["Device", "Lifecycle in the demo", "Source"]} rows={DEVICES} />
      </Section>

      <Section title="Assumptions register">
        <Table head={["Assumption", "Why it might be wrong", "How to close it"]} rows={ASSUMPTIONS} />
      </Section>

      <Section title="Where the AI got it wrong, and how I caught it">
        <p className="mb-3 max-w-[72ch] text-[14.5px] text-muted">
          I built this with Claude Code, which wrote most of the TypeScript. I also had a panel of AI agents review the plan and the build, each told to
          play a role (design director, regulatory lead, an engineer, a skeptic, someone who uses Loop daily). They are not people and their
          reviews aren&apos;t evidence. The checks that mattered were against primary sources. Three of them:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {CAUGHT.map(([t, body]) => (
            <Card key={t} title={t}>
              {body}
            </Card>
          ))}
        </div>
      </Section>

      <Section title="What I'd want from the team">
        <ul className="list-disc space-y-1.5 pl-5 text-[14.5px] text-muted">
          <li>The current iOS critical-task list and its URRA, so Android rows trace to real IDs.</li>
          <li>Which Android permissions engineering can actually request for this app type, by OS version.</li>
          <li>The device-partner boundary: which pairing and alert screens are Tidepool&apos;s, and which belong to the pump or CGM app.</li>
          <li>Access to a few participants on Samsung and Xiaomi phones early, before formative rounds are scheduled.</li>
        </ul>
        <p className="mt-6 text-[14.5px]">
          <Link className="link" href="/">
            Back to the prototype
          </Link>{" "}
          · Code on <a className="link" href="https://github.com/hafsau/tidepool-demo">GitHub</a> (BSD-2-Clause) · Hafsa Usmani,{" "}
          <a className="link" href="https://hafsausmani.com">hafsausmani.com</a>
        </p>
        <p className="mt-3 max-w-[72ch] text-[12.5px] text-muted">
          Tidepool, Tidepool Loop, twiist, Dexcom, FreeStyle Libre, Eversense, iPhone, Apple Watch and Android are trademarks of their owners and are used
          here only to describe the products. This concept is not affiliated with or endorsed by any of them.
        </p>
      </Section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-4 text-[14.5px]">
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <p className="text-muted">{children}</p>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line-soft bg-surface" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
        <thead className="bg-sunken text-[12px] uppercase tracking-wide text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-line-soft align-top">
              <th scope="row" className="px-3 py-3 font-semibold">
                {r[0]}
              </th>
              {r.slice(1).map((c, i) => (
                <td key={i} className="px-3 py-3 text-muted">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
