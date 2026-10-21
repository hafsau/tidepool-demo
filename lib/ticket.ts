import { ALL_STEPS, FLOWS, type Step } from "./flows";

/** Steps whose behavior differs between platforms: the ones a review must look at. */
export function deltaSteps(steps: Step[] = ALL_STEPS): Step[] {
  return steps.filter((s) => s.parity.delta !== "Same");
}

const cell = (s: string) => s.replace(/\|/g, "/").replace(/\n/g, " ");

/**
 * The parity matrix as a Jira design-review ticket, in Jira wiki markup so it
 * pastes into a description field as a table.
 */
export function reviewTicket(steps: Step[] = deltaSteps()): string {
  const lines = [
    "*Summary:* Design review: Android parity for alert-delivery setup and sensor replacement",
    "*Type:* Design review   *Labels:* android-parity, human-factors, illustrative",
    "",
    "h3. Context",
    "Concept work, not from Tidepool's design history file. Each row is a step whose behavior differs between iOS (reference) and Android (proposed). \"Candidate critical\" marks tasks that look like summative critical tasks; that call belongs to the real risk file. Risk refs point to an illustrative URRA.",
    "",
    "||Flow||Step||User task||Candidate critical?||Delta||iOS||Android||Risk ref||",
    ...steps.map((s) =>
      `|${cell(FLOWS[s.flow].short)}|${cell(s.label)}|${cell(s.hf.task)}|${s.hf.candidateCritical ? "Yes" : "-"}|${cell(s.parity.delta)}|${cell(s.parity.ios)}|${cell(s.parity.android)}|${s.hf.urra ?? "-"}|`,
    ),
    "",
    "h3. Asks",
    "* Engineering: confirm feasibility of each Android control per OEM and OS version.",
    "* Regulatory/Quality: confirm which rows are new hazard-related use scenarios for the Android submission.",
    "* Research: add Android-only rows to the formative protocol task list.",
  ];
  return lines.join("\n");
}
