import type { ControlType, Severity } from "./flows";

/*
 * An illustrative use-related risk analysis for the two flows. It shows the
 * shape of the work, not Tidepool's risk file: IDs are ILLUS-, severity is
 * qualitative, and there are no probability scores.
 */
export type UrraRow = {
  id: string;
  scenario: string;
  useError: string;
  hazardousSituation: string;
  harm: string;
  severity: Severity;
  controls: { type: ControlType; text: string }[];
  verify: string;
  steps: string[];
  inFlow: boolean;
};

// A deliberately simple two-level scale for a concept. A real risk file uses
// the manufacturer's own defined severity levels.
export const SEVERITY_DEFINITIONS: Record<Severity, string> = {
  High: "Could lead to severe hypoglycemia or DKA needing help from someone else.",
  Moderate: "Could lead to hypo- or hyperglycemia the person has to notice and treat themselves.",
};

export const URRA: UrraRow[] = [
  {
    id: "ILLUS-U01",
    scenario: "First-run setup, or weeks later in system Settings",
    useError: "Denies or revokes notification permission",
    hazardousSituation: "Urgent low occurs with no alert shown",
    harm: "Severe hypoglycemia",
    severity: "High",
    controls: [
      { type: "Inherent safety by design", text: "Setup cannot finish without notifications." },
      { type: "Information for safety", text: "Permission check on launch and resume; a banner that can't be dismissed." },
      { type: "Information for safety", text: "Pre-prompt names the consequence in one sentence." },
    ],
    verify: "Formative T1/T2; candidate summative critical task.",
    steps: ["p-notifications", "p-revoked"],
    inFlow: true,
  },
  {
    id: "ILLUS-U02",
    scenario: "Overnight with Do Not Disturb on",
    useError: "Leaves the urgent channel's Do Not Disturb override off",
    hazardousSituation: "Urgent low alert is silent",
    harm: "Severe hypoglycemia overnight",
    severity: "High",
    controls: [
      { type: "Inherent safety by design", text: "Separate high-importance channel for urgent lows." },
      { type: "Information for safety", text: "Alert-delivery check shows \"Alerts may be silent\" until fixed." },
      { type: "Information for safety", text: "Deep link to the channel page itself." },
    ],
    verify: "Formative T1: use errors and difficulties, Android vs iOS.",
    steps: ["p-dnd"],
    inFlow: true,
  },
  {
    id: "ILLUS-U03",
    scenario: "Overnight on a Samsung or Xiaomi phone",
    useError: "Allows the system battery dialog but misses the OEM setting",
    hazardousSituation: "App paused; no data and no alerts while the user believes it is running",
    harm: "Severe hypoglycemia, or hyperglycemia and DKA",
    severity: "High",
    controls: [
      { type: "Protective measure", text: "Connected-device foreground service; missing-data alert." },
      { type: "Information for safety", text: "Glucose age on every screen; illustrated OEM settings path, checked per OS version." },
    ],
    verify: "Formative split by OEM; bench overnight kill test per device model.",
    steps: ["p-battery"],
    inFlow: true,
  },
  {
    id: "ILLUS-U04",
    scenario: "CGM data stops arriving",
    useError: "Skips the exact-alarm permission",
    hazardousSituation: "\"No glucose for 20 minutes\" alert fires late",
    harm: "Hypo- or hyperglycemia noticed late",
    severity: "Moderate",
    controls: [
      { type: "Protective measure", text: "Missing-data check also runs in the device service." },
      { type: "Information for safety", text: "Glucose age always visible." },
    ],
    verify: "Bench timer-drift test under Doze, per OEM.",
    steps: ["p-exact"],
    inFlow: true,
  },
  {
    id: "ILLUS-U05",
    scenario: "Sensor expired; last value still on record",
    useError: "Reads the last glucose value as current",
    hazardousSituation: "Treatment or dosing decision based on an old value",
    harm: "Severe hypoglycemia from dosing on an old value",
    severity: "High",
    controls: [
      { type: "Inherent safety by design", text: "Past 15 minutes the value is replaced with dashes (matches iOS)." },
      { type: "Information for safety", text: "Age under every value; ring and label change with age." },
    ],
    verify: "Formative T3: \"What is your glucose right now?\"",
    steps: ["s-aging", "s-stale"],
    inFlow: true,
  },
  {
    id: "ILLUS-U06",
    scenario: "No recent glucose, or sensor warmup, with Closed Loop still on",
    useError: "Believes automation is still adjusting insulin",
    hazardousSituation: "Meal or rise not covered while the user waits for Loop",
    harm: "Hyperglycemia",
    severity: "Moderate",
    controls: [
      { type: "Information for safety", text: "Automation status always shows its reason, and a resume time when one is known." },
      { type: "Information for safety", text: "Meal entry says adjustments are paused and to bolus for the meal now." },
    ],
    verify: "Formative T3/T5 comprehension questions.",
    steps: ["s-stale", "s-warmup", "s-meal"],
    inFlow: true,
  },
  {
    id: "ILLUS-U07",
    scenario: "Pairing a new sensor on Android",
    useError: "System back gesture exits pairing; user assumes it worked",
    hazardousSituation: "No glucose data for hours",
    harm: "Severe hypoglycemia, or hyperglycemia and DKA",
    severity: "High",
    controls: [
      { type: "Protective measure", text: "Predictive back previews and confirms leaving." },
      { type: "Information for safety", text: "Status shows \"No sensor connected\" until paired." },
    ],
    verify: "Formative T4: count unintended exits by gesture.",
    steps: ["s-pair"],
    inFlow: true,
  },
  {
    id: "ILLUS-U08",
    scenario: "Pump communication lost or occlusion",
    useError: "Misses or dismisses the alert",
    hazardousSituation: "Insulin delivery state unknown or stopped",
    harm: "Hyperglycemia, DKA",
    severity: "High",
    controls: [
      { type: "Protective measure", text: "Urgent alert on the channel with the Do Not Disturb override (same delivery path as U01–U03)." },
      { type: "Information for safety", text: "Pump status names the problem and the next step." },
    ],
    verify: "Out of scope for this concept: listed so the alert-delivery work is traced to it.",
    steps: [],
    inFlow: false,
  },
];
