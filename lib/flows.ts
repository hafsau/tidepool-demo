import { at } from "./clock";
import { SCENARIO, WARMUP_ENDS_AT } from "./timeline";

/*
 * Both flows as data. Each step is one moment shown on both platforms. The
 * renderers in components/ios and components/m3 draw the same step; the
 * parity test checks they both surface every critical item listed here.
 *
 * Copy in alerts and system prompts is draft: it would need Clinical and
 * Regulatory review before it went anywhere near a real device.
 */

export const APP_NAME = "AID concept";

export type FlowId = "permissions" | "sensor";
export type Platform = "ios" | "android";
export type Oem = "pixel" | "samsung" | "xiaomi";

/** Illustrative two-level scale; definitions on /risk. */
export type Severity = "High" | "Moderate";
export type ControlType = "Inherent safety by design" | "Protective measure" | "Information for safety";

export type HfNote = {
  /** A user task. Only some are candidate critical tasks (FDA 2016 sense). */
  task: string;
  candidateCritical?: boolean;
  useError: string;
  harm: string;
  severity: Severity;
  controls: { type: ControlType; text: string }[];
  verify: string;
  urra?: string;
};

export type Delta = "Same" | "Extra step on Android" | "Behavior differs" | "Android only";
export type ParityNote = { delta: Delta; ios: string; android: string };

export type SystemDialog = { type: "dialog"; title: string; body: string; deny: string; allow: string };
export type SettingsPage = {
  type: "settings";
  path: string[];
  title: string;
  toggle: string;
  description: string;
};
export type SystemUi = SystemDialog | SettingsPage;

export type OemVariant = { label: string; path: string[]; steps: string[]; note: string };

export type Denied = {
  heading: string;
  body: string;
  /** Inherent-safety rule: some permissions block setup from finishing. */
  blocksSetup: boolean;
  action: string;
};

export type Screen =
  | { kind: "intro"; heading: string; body: string; bullets: string[] }
  | {
      kind: "permission";
      heading: string;
      why: string;
      ifDenied: string;
      ios: SystemUi | null;
      iosCoveredBy?: string;
      android: SystemUi;
      oem?: Record<Oem, OemVariant>;
      denied: Denied;
    }
  | { kind: "ongoing"; heading: string; why: string; ifDismissed: string }
  | { kind: "alarm"; title: string; body: string }
  | { kind: "summary"; heading: string; items: { label: string; ios: string; android: string }[] }
  | {
      kind: "status";
      now: number;
      notice?: { title: string; body: string; urgent?: boolean };
      banner?: { tone: "warning" | "danger" | "info"; text: string; action?: string };
      sheet?: "pair" | "warmup" | "meal";
    };

export type Step = {
  id: string;
  flow: FlowId;
  label: string;
  /** One line under the frames: what is happening at this moment. */
  caption: string;
  screen: Screen;
  hf: HfNote;
  parity: ParityNote;
};

export const CRITICAL = {
  "glucose-value": "Glucose value",
  "glucose-age": "Glucose age",
  "loop-status": "Automation status and reason",
  "basal-state": "Basal state and time left",
  "cgm-state": "Sensor state",
  "permission-purpose": "Why the permission is needed",
  "consequence-if-denied": "What happens if it is denied",
  "system-prompt": "System prompt or setting",
  "alert-message": "Alert message",
  "setup-blocked": "Setup cannot finish",
  "no-equivalent": "iOS covers this without a step",
} as const;
export type CriticalId = keyof typeof CRITICAL;

/**
 * The items a user must be able to perceive on a step, in the order a screen
 * reader reaches them. The parity test checks each renderer's DOM order
 * against this. Status screens differ on purpose: the iOS reference reads like
 * Loop's HUD (glucose first), while the Android proposal announces the
 * automation state and its reason before the number.
 */
export function criticalFor(step: Step, opts: { platform: Platform; deny: boolean }): CriticalId[] {
  const s = step.screen;
  switch (s.kind) {
    case "status": {
      const alert: CriticalId[] = s.notice || s.banner ? ["alert-message"] : [];
      return opts.platform === "ios"
        ? [...alert, "glucose-value", "glucose-age", "basal-state", "cgm-state", "loop-status"]
        : [...alert, "loop-status", "glucose-value", "glucose-age", "basal-state", "cgm-state"];
    }
    case "permission": {
      if (opts.platform === "ios" && !s.ios) return ["permission-purpose", "no-equivalent"];
      if (opts.deny) return s.denied.blocksSetup ? ["consequence-if-denied", "setup-blocked"] : ["consequence-if-denied"];
      return ["permission-purpose", "consequence-if-denied", "system-prompt"];
    }
    case "ongoing":
      return opts.platform === "ios" ? ["permission-purpose", "no-equivalent"] : ["permission-purpose", "consequence-if-denied"];
    case "alarm":
      return ["alert-message"];
    case "intro":
    case "summary":
      return ["permission-purpose"];
  }
}

export function hasDenyPath(step: Step): boolean {
  return step.screen.kind === "permission";
}

const OEM_BATTERY: Record<Oem, OemVariant> = {
  pixel: {
    label: "Pixel",
    path: ["Settings", "Apps", APP_NAME, "App battery usage"],
    steps: ["The system dialog is enough on Pixel.", "App battery usage shows Unrestricted once allowed."],
    note: "Stock Android honors the battery-optimization exemption.",
  },
  samsung: {
    label: "Samsung",
    path: ["Settings", "Battery", "Background usage limits", "Never sleeping apps"],
    steps: [`Add ${APP_NAME} to Never sleeping apps.`, "Set the app's battery use to Unrestricted."],
    note: "One UI can still put apps to sleep after the system dialog. Both settings are needed.",
  },
  xiaomi: {
    label: "Xiaomi",
    path: ["Settings", "Apps", "Manage apps", APP_NAME],
    steps: ["Turn on Autostart.", "Battery saver: choose No restrictions."],
    note: "HyperOS kills background apps aggressively unless both are set.",
  },
};

const PERMISSIONS: Step[] = [
  {
    id: "p-intro",
    flow: "permissions",
    label: "Why alerts matter",
    caption: "First run. Before pairing anything, the app explains the one job setup has to get right: alerts must always reach you.",
    screen: {
      kind: "intro",
      heading: "Alerts that can't be missed",
      body: "Your phone decides which apps may wake it, keep running, and break through silent mode. The next few steps ask for each of those, one at a time.",
      bullets: ["Connect to your pump and CGM", "Send urgent alerts, even in Do Not Disturb", "Keep running in the background", "Test that you can hear an alarm"],
    },
    hf: {
      task: "Understand why each permission matters before granting it",
      useError: "User taps through setup without reading, then denies prompts that look optional",
      harm: "Hypoglycemia not caught because alerts fail later (see the steps that follow)",
      severity: "Moderate",
      controls: [
        { type: "Information for safety", text: "One screen sets expectations: the next prompts protect alerts, not marketing." },
        { type: "Information for safety", text: "Each prompt is explained in context, one at a time, never as a batch." },
      ],
      verify: "Formative: ask participants after setup what each permission does. Count misconceptions.",
    },
    parity: {
      delta: "Behavior differs",
      ios: "Three prompts: Bluetooth, notifications, Critical Alerts.",
      android: "Up to seven, depending on Android version and OEM. The intro has to say so honestly.",
    },
  },
  {
    id: "p-nearby",
    flow: "permissions",
    label: "Nearby devices",
    caption: "Bluetooth access. Android 12+ calls it Nearby devices, which doesn't read as \"pump and CGM\" unless the app says so first.",
    screen: {
      kind: "permission",
      heading: "Connect your pump and CGM",
      why: "Your phone talks to your pump and sensor over Bluetooth. Without it, nothing can loop.",
      ifDenied: "No glucose data and no automation. You'll need to allow it in Settings.",
      ios: {
        type: "dialog",
        title: `"${APP_NAME}" Would Like to Use Bluetooth`,
        body: "Bluetooth connects your pump and CGM to this app.",
        deny: "Don't Allow",
        allow: "OK",
      },
      android: {
        type: "dialog",
        title: `Allow ${APP_NAME} to find, connect to, and determine the relative position of nearby devices?`,
        body: "",
        deny: "Don't allow",
        allow: "Allow",
      },
      denied: {
        heading: "Can't reach your devices",
        body: "Bluetooth access is off, so the app can't read your sensor or talk to your pump. Setup can't continue without it.",
        blocksSetup: true,
        action: "Open Settings",
      },
    },
    hf: {
      task: "Grant Bluetooth / Nearby devices access",
      useError: "User denies because \"relative position of nearby devices\" sounds like location tracking",
      harm: "Hypo- or hyperglycemia with no glucose data, alerts or automation",
      severity: "Moderate",
      controls: [
        { type: "Inherent safety by design", text: "Setup can't finish without it; the app never shows automation as on without a device link." },
        { type: "Information for safety", text: "Pre-prompt screen names the pump and CGM before the system wording appears." },
      ],
      verify: "Formative: record denials and hesitations at the system prompt, by OEM.",
    },
    parity: {
      delta: "Behavior differs",
      ios: "Prompt wording comes from the app's usage string, so it can say \"pump and CGM\".",
      android: "System wording is fixed and mentions position. The pre-prompt screen has to carry the meaning.",
    },
  },
  {
    id: "p-notifications",
    flow: "permissions",
    label: "Notifications",
    caption: "Android 13+ asks for notifications at runtime, same as iOS. Denying it is the single most dangerous tap in setup.",
    screen: {
      kind: "permission",
      heading: "Turn on alerts",
      why: "Low and high glucose alerts, sensor and pump problems: all of them arrive as notifications.",
      ifDenied: "You won't be warned about low glucose. Setup can't finish without alerts.",
      ios: {
        type: "dialog",
        title: `"${APP_NAME}" Would Like to Send You Notifications`,
        body: "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.",
        deny: "Don't Allow",
        allow: "Allow",
      },
      android: { type: "dialog", title: `Allow ${APP_NAME} to send you notifications?`, body: "", deny: "Don't allow", allow: "Allow" },
      denied: {
        heading: "Alerts are off",
        body: "Without notifications, the app can't warn you about low glucose. Setup can't finish until alerts are on.",
        blocksSetup: true,
        action: "Turn on in Settings",
      },
    },
    hf: {
      task: "Grant notification permission",
      candidateCritical: true,
      useError: "User taps Don't allow out of habit (notification fatigue)",
      harm: "Severe hypoglycemia",
      severity: "High",
      urra: "ILLUS-U01",
      controls: [
        { type: "Inherent safety by design", text: "Setup is blocked until notifications are allowed." },
        { type: "Information for safety", text: "If revoked later, an in-app banner that can't be dismissed (see the last step)." },
        { type: "Information for safety", text: "Pre-prompt states the consequence in one sentence." },
      ],
      verify: "Candidate summative critical task. Formative: observe denials, hesitations and recovery, Android vs iOS.",
    },
    parity: {
      delta: "Same",
      ios: "Runtime prompt, once. A second ask needs Settings.",
      android: "Runtime prompt on 13+. After two denials Android stops showing it; only Settings works.",
    },
  },
  {
    id: "p-dnd",
    flow: "permissions",
    label: "Through Do Not Disturb",
    caption: "The iOS equivalent is one Critical Alerts prompt. Android needs a notification channel that's allowed to override Do Not Disturb.",
    screen: {
      kind: "permission",
      heading: "Let urgent alerts through Do Not Disturb",
      why: "Urgent low glucose should wake you even when Do Not Disturb is on, including overnight.",
      ifDenied: "Urgent alerts will be silent whenever Do Not Disturb is on, including overnight.",
      ios: {
        type: "dialog",
        title: `"${APP_NAME}" Would Like to Send You Critical Alerts`,
        body: "Critical alerts play a sound and appear on the Lock Screen even when iPhone is muted or Do Not Disturb is on.",
        deny: "Don't Allow",
        allow: "Allow",
      },
      android: {
        type: "settings",
        path: ["Settings", "Apps", APP_NAME, "Notifications", "Urgent low glucose"],
        title: "Urgent low glucose",
        toggle: "Override Do Not Disturb",
        description: "Let these notifications continue to interrupt when Do Not Disturb is on.",
      },
      denied: {
        heading: "Urgent alerts may be silent",
        body: "When Do Not Disturb is on, urgent low alerts won't make a sound. You can finish setup, but the app will keep reminding you.",
        blocksSetup: false,
        action: "Fix in Settings",
      },
    },
    hf: {
      task: "Allow urgent alerts to bypass Do Not Disturb",
      candidateCritical: true,
      useError: "User leaves the override off, or never reaches the channel setting",
      harm: "Severe hypoglycemia overnight",
      severity: "High",
      urra: "ILLUS-U02",
      controls: [
        { type: "Inherent safety by design", text: "Urgent lows get their own high-importance channel, so the Do Not Disturb override applies to them alone." },
        { type: "Information for safety", text: "Alert-delivery check on every launch; status shows \"Alerts may be silent\" until fixed." },
        { type: "Information for safety", text: "Deep link straight to the channel page, not the app's notification root." },
      ],
      verify: "Formative: use errors and difficulties reaching and setting the toggle unaided, Android vs iOS's one prompt.",
    },
    parity: {
      delta: "Extra step on Android",
      ios: "Critical Alerts entitlement + one prompt. Bypasses mute and Focus.",
      android: "Channel-level setting in system Settings. App-wide Do Not Disturb access is an alternative route. Ringer-silent mode is a separate question (alarm audio stream), not covered here.",
    },
  },
  {
    id: "p-fullscreen",
    flow: "permissions",
    label: "Full-screen alerts",
    caption: "Android 14 turned full-screen notifications off by default for most apps. Without it, an urgent low on a locked phone is a small banner.",
    screen: {
      kind: "permission",
      heading: "Show urgent alerts full screen",
      why: "On a locked phone, an urgent low should take over the screen like an alarm clock, not hide in the notification shade.",
      ifDenied: "Urgent alerts appear as a normal notification on the lock screen.",
      ios: null,
      iosCoveredBy: "Critical Alerts (previous step) already break through on the Lock Screen. No extra step.",
      android: {
        type: "settings",
        path: ["Settings", "Apps", "Special app access", "Full screen notifications"],
        title: APP_NAME,
        toggle: "Allow full screen notifications",
        description: "Allow this app to show notifications that take up the full screen when the device is locked.",
      },
      denied: {
        heading: "Urgent alerts will be smaller",
        body: "On a locked phone, urgent alerts will show as a regular notification instead of an alarm screen.",
        blocksSetup: false,
        action: "Fix in Settings",
      },
    },
    hf: {
      task: "Allow full-screen alerts (Android 14+)",
      useError: "Permission not granted; user expects an alarm-style alert",
      harm: "Hypoglycemia treated late",
      severity: "Moderate",
      controls: [
        { type: "Protective measure", text: "Test alarm (later step) shows exactly what an alert will look like on this phone." },
        { type: "Information for safety", text: "Setup check lists this as \"reduced\", not \"off\"." },
      ],
      verify: "Formative: after the test alarm, ask participants to describe what they'd see when locked.",
    },
    parity: {
      delta: "Android only",
      ios: "No equivalent step. Covered by Critical Alerts.",
      android: "Special app access, Android 14+. Default may be off depending on install source and policy.",
    },
  },
  {
    id: "p-exact",
    flow: "permissions",
    label: "Exact alarms",
    caption: "\"No glucose for 20 minutes\" is a timer, not an event. If the timer can't fire on time, the alert about missing data goes missing too.",
    screen: {
      kind: "permission",
      heading: "Alert on time when data stops",
      why: "Some alerts fire because nothing arrived: no glucose for 20 minutes, sensor warmup done. Those need exact timers.",
      ifDenied: "Timed alerts may arrive late, sometimes by many minutes.",
      ios: null,
      iosCoveredBy: "Scheduled local notifications fire on time once notifications are allowed. No extra step.",
      android: {
        type: "settings",
        path: ["Settings", "Apps", "Special app access", "Alarms & reminders"],
        title: APP_NAME,
        toggle: "Allow setting alarms and reminders",
        description: "Allow this app to set alarms and schedule time-sensitive actions.",
      },
      denied: {
        heading: "Timed alerts may be late",
        body: "Alerts that depend on a timer, like \"no glucose for 20 minutes\", may arrive late.",
        blocksSetup: false,
        action: "Fix in Settings",
      },
    },
    hf: {
      task: "Allow exact alarms",
      useError: "User skips the special-access page",
      harm: "Hypo- or hyperglycemia noticed late",
      severity: "Moderate",
      urra: "ILLUS-U04",
      controls: [
        { type: "Protective measure", text: "Missing-data checks also run inside the connected-device service, so a late timer isn't the only path." },
        { type: "Information for safety", text: "Status always shows glucose age, so missing data is visible without an alert." },
      ],
      verify: "Bench: confirm timer drift with and without the permission under Doze, per OEM.",
    },
    parity: {
      delta: "Android only",
      ios: "No equivalent step.",
      android: "SCHEDULE_EXACT_ALARM is denied by default for new installs on Android 14+.",
    },
  },
  {
    id: "p-battery",
    flow: "permissions",
    label: "Keep running",
    caption: "The step where Android fragments most. The system dialog is enough on a Pixel; Samsung and Xiaomi need more. Switch OEM to compare.",
    screen: {
      kind: "permission",
      heading: "Keep running in the background",
      why: "Battery savers can pause apps they think are idle. This app needs to keep listening to your devices.",
      ifDenied: "Your phone may pause the app. Glucose data and alerts would stop until you open it again.",
      ios: null,
      iosCoveredBy: "Bluetooth background mode keeps the app connected. iOS has no per-app battery exemption to grant.",
      android: {
        type: "dialog",
        title: "Let app always run in background?",
        body: `Allowing ${APP_NAME} to always run in the background may reduce battery life. You can change this later from Settings > Apps.`,
        deny: "Deny",
        allow: "Allow",
      },
      oem: OEM_BATTERY,
      denied: {
        heading: "Your phone may pause this app",
        body: "If the battery saver pauses the app, glucose data and alerts stop with no warning from the phone. You can finish setup; the status screen will show when data is late.",
        blocksSetup: false,
        action: "Fix in Settings",
      },
    },
    hf: {
      task: "Exempt the app from battery optimization, including OEM settings",
      candidateCritical: true,
      useError: "User allows the system dialog but misses the OEM-specific setting",
      harm: "Severe hypoglycemia, or hyperglycemia and DKA",
      severity: "High",
      urra: "ILLUS-U03",
      controls: [
        { type: "Protective measure", text: "Connected-device foreground service keeps the app running." },
        { type: "Protective measure", text: "\"No glucose for 20 minutes\" alert." },
        { type: "Information for safety", text: "Glucose age on every screen; the phone maker is detected and only its settings guide is shown." },
      ],
      verify: "Formative split by OEM (Pixel / Samsung / Xiaomi). Bench: overnight kill test per device.",
    },
    parity: {
      delta: "Android only",
      ios: "No user step.",
      android: "Dialog on every device, plus OEM-specific settings on Samsung and Xiaomi.",
    },
  },
  {
    id: "p-ongoing",
    flow: "permissions",
    label: "Ongoing notice",
    caption: "Android requires a visible notification while the app stays connected. Since Android 14, people can swipe it away, so it shouldn't be the only status signal.",
    screen: {
      kind: "ongoing",
      heading: "You'll see an ongoing notice",
      why: "Android shows a notification while the app stays connected to your devices. It doubles as a quick status check.",
      ifDismissed: "Swiping it away doesn't stop the app. Status is always in the app and on the lock screen alert.",
    },
    hf: {
      task: "Understand the ongoing connection notice",
      useError: "User dismisses the notice and assumes the app stopped (or the reverse)",
      harm: "Hypo- or hyperglycemia from acting on a wrong idea of whether automation is running",
      severity: "Moderate",
      controls: [
        { type: "Information for safety", text: "Notice content is live status (automation state, last glucose age), not a static label." },
        { type: "Information for safety", text: "One line explains that dismissing it doesn't stop anything." },
      ],
      verify: "Formative: ask \"Is the app still working?\" after the notice is dismissed.",
    },
    parity: {
      delta: "Android only",
      ios: "No persistent notification on iOS.",
      android: "Foreground service, type connectedDevice. Dismissible on Android 14+.",
    },
  },
  {
    id: "p-test",
    flow: "permissions",
    label: "Test the alarm",
    caption: "The setup ends by proving it worked: a real test alarm, so the person hears and sees what an urgent alert is like on their phone.",
    screen: { kind: "alarm", title: "Test alarm: Urgent low", body: "This is a test. If this were real, your glucose would be below 55 mg/dL." },
    hf: {
      task: "Confirm an urgent alert is audible and visible",
      candidateCritical: true,
      useError: "Volume or OEM sound settings mute the alarm; user never finds out until a real low",
      harm: "Severe hypoglycemia",
      severity: "High",
      controls: [
        { type: "Protective measure", text: "Test alarm with \"I heard it\" / \"I didn't hear it\"; the second opens troubleshooting." },
      ],
      verify: "Formative: who hears the test, by phone maker and Do Not Disturb state; root cause for anyone who doesn't.",
    },
    parity: {
      delta: "Behavior differs",
      ios: "Critical alert on the Lock Screen with sound.",
      android: "Full-screen alarm if allowed; heads-up notification otherwise.",
    },
  },
  {
    id: "p-summary",
    flow: "permissions",
    label: "Setup check",
    caption: "The same outcome on both platforms, reached by a different number of steps. This screen is what a summative test would check against.",
    screen: {
      kind: "summary",
      heading: "Alerts are ready",
      items: [
        { label: "Pump and CGM connection", ios: "Bluetooth", android: "Nearby devices" },
        { label: "Alerts", ios: "Notifications", android: "Notifications" },
        { label: "Through Do Not Disturb", ios: "Critical Alerts", android: "Override Do Not Disturb" },
        { label: "On a locked phone", ios: "Critical Alerts", android: "Full screen notifications" },
        { label: "Timed alerts", ios: "Included", android: "Alarms & reminders" },
        { label: "Background", ios: "Included", android: "Unrestricted battery" },
      ],
    },
    hf: {
      task: "Review alert-delivery readiness",
      useError: "User leaves with a reduced item and doesn't realize it",
      harm: "Hypoglycemia caught late because of reduced alerting",
      severity: "Moderate",
      controls: [{ type: "Information for safety", text: "Any reduced item stays visible on the status screen until fixed." }],
      verify: "Formative: can participants say which items are reduced, and what that means?",
    },
    parity: {
      delta: "Same",
      ios: "Six outcomes, three prompts.",
      android: "Six outcomes, up to seven steps.",
    },
  },
  {
    id: "p-revoked",
    flow: "permissions",
    label: "Later: alerts turned off",
    caption: "Weeks later, notifications get turned off in Settings. The status screen says so plainly and won't let the banner be dismissed.",
    screen: {
      kind: "status",
      now: at(21, 40),
      banner: { tone: "danger", text: "Alerts are off. You won't be warned about low glucose.", action: "Turn on" },
    },
    hf: {
      task: "Notice and fix revoked alert permissions",
      candidateCritical: true,
      useError: "User turns off notifications system-wide and forgets",
      harm: "Severe hypoglycemia",
      severity: "High",
      urra: "ILLUS-U01",
      controls: [
        { type: "Information for safety", text: "Permission check on every launch and resume; the banner can't be dismissed." },
        { type: "Information for safety", text: "Banner names the consequence, not the setting." },
      ],
      verify: "Formative: from a revoked state, can participants restore alerts unaided? Note use errors and difficulties.",
    },
    parity: {
      delta: "Same",
      ios: "Same banner. Checks notification and Critical Alert settings.",
      android: "Same banner. Also checks the channel's DND override and battery state.",
    },
  },
];

const SENSOR: Step[] = [
  {
    id: "s-expiring",
    flow: "sensor",
    label: "Sensor expiring",
    caption: "6:40 PM. Automation is running normally. The sensor has an hour left, and the app says so early enough to plan around dinner.",
    screen: {
      kind: "status",
      now: at(18, 40),
      notice: {
        title: "Sensor expires in 1 hour",
        body: "Have a new sensor ready. Automation pauses from when this sensor stops until the new one finishes warming up (about 1 hour).",
      },
    },
    hf: {
      task: "Plan a sensor change",
      useError: "User ignores the warning and the sensor expires at a bad time (meal, bedtime)",
      harm: "Hyperglycemia during an unplanned gap in automation",
      severity: "Moderate",
      controls: [{ type: "Information for safety", text: "Expiry warning says what will happen to automation, not just the time." }],
      verify: "Formative: ask what the user expects automation to do during the change.",
    },
    parity: { delta: "Same", ios: "Notification banner.", android: "Heads-up notification." },
  },
  {
    id: "s-expired",
    flow: "sensor",
    label: "Sensor expired",
    caption: "7:40 PM. The last reading arrived at 7:40. Closed loop is still on; Loop just has nothing new to work with.",
    screen: {
      kind: "status",
      now: SCENARIO.sensorExpiresAt,
      notice: { title: "Sensor expired", body: "Replace your sensor. No new glucose readings until the new one warms up.", urgent: true },
    },
    hf: {
      task: "Recognize that the sensor has stopped",
      useError: "User dismisses the alert and doesn't replace the sensor",
      harm: "Hypo- or hyperglycemia during a long gap with no glucose alerts",
      severity: "Moderate",
      controls: [{ type: "Information for safety", text: "Status shows sensor expired until a new one is paired." }],
      verify: "Formative: comprehension of \"expired\" versus \"signal loss\".",
    },
    parity: { delta: "Same", ios: "Time Sensitive notification.", android: "High-importance channel." },
  },
  {
    id: "s-aging",
    flow: "sensor",
    label: "12 minutes later",
    caption: "7:52 PM. Glucose is 12 minutes old. Still under the 15-minute limit, but the ring has aged and the value shows its age.",
    screen: { kind: "status", now: at(19, 52) },
    hf: {
      task: "Read glucose and know how old it is",
      candidateCritical: true,
      useError: "User reads the number without its age",
      harm: "Hypo- or hyperglycemia from treating or dosing on an old value",
      severity: "Moderate",
      urra: "ILLUS-U05",
      controls: [
        { type: "Inherent safety by design", text: "Past 15 minutes the value is replaced by dashes, as Loop does on iOS." },
        { type: "Information for safety", text: "Age sits directly under the glucose value, never behind a tap; ring and label change with age, not color alone." },
      ],
      verify: "Formative: ask \"What is your glucose right now?\" Score whether the answer includes age.",
    },
    parity: { delta: "Same", ios: "Ring + age label.", android: "Status chip + age label." },
  },
  {
    id: "s-stale",
    flow: "sensor",
    label: "Automation stops",
    caption: "8:00 PM. Glucose is 20 minutes old, so Loop makes no new dosing decisions. The last temp basal keeps running until 8:10.",
    screen: {
      kind: "status",
      now: at(20, 0),
      notice: {
        title: "Automation hasn't run in 20 minutes",
        body: "No recent glucose, so insulin isn't being adjusted. Your pump finishes its last temp basal, then returns to scheduled basal.",
        urgent: true,
      },
    },
    hf: {
      task: "Understand that automation has stopped, and why",
      candidateCritical: true,
      useError: "User thinks Loop is still adjusting insulin because Closed Loop is still on",
      harm: "Hyperglycemia",
      severity: "Moderate",
      urra: "ILLUS-U06",
      controls: [
        { type: "Inherent safety by design", text: "Stale glucose is replaced by dashes; the last value only appears with its time." },
        { type: "Protective measure", text: "Time-sensitive notification at 20 minutes without a completed loop, as Loop does on iOS." },
        { type: "Information for safety", text: "\"Automation unavailable\" always comes with its reason: no recent glucose." },
      ],
      verify: "Formative: ask \"Is the app adjusting your insulin right now?\"",
    },
    parity: {
      delta: "Same",
      ios: "Ring stale, glucose \"– – –\", \"Automation unavailable\" row, Time Sensitive notification.",
      android: "\"Automation unavailable\" + reason announced first, glucose \"– – –\", high-importance notification.",
    },
  },
  {
    id: "s-scheduled",
    flow: "sensor",
    label: "Scheduled basal",
    caption: "8:12 PM. The last 30-minute temp basal ran out at 8:10. The pump is back on scheduled basal, which the screen says plainly. Insulin isn't suspended.",
    screen: { kind: "status", now: at(20, 12) },
    hf: {
      task: "Know what insulin is being delivered",
      useError: "User reads \"automation unavailable\" as \"no insulin\"",
      harm: "Hypo- or hyperglycemia from an unneeded correction or carbs",
      severity: "Moderate",
      controls: [{ type: "Information for safety", text: "Basal state and rate are always visible. \"Suspended\" only appears when delivery is actually suspended." }],
      verify: "Formative: ask \"How much insulin is your pump giving right now?\"",
    },
    parity: { delta: "Same", ios: "Pump HUD rate.", android: "Basal card rate + kind." },
  },
  {
    id: "s-pair",
    flow: "sensor",
    label: "Pair new sensor",
    caption: "8:15 PM. Pairing the new sensor. On Android, a back gesture mid-pairing previews leaving, and the app asks before abandoning it.",
    screen: { kind: "status", now: at(20, 15), sheet: "pair" },
    hf: {
      task: "Pair a new sensor",
      useError: "Android back gesture exits pairing; user assumes the sensor is paired",
      harm: "Hypo- or hyperglycemia during hours without glucose data",
      severity: "Moderate",
      urra: "ILLUS-U07",
      controls: [
        { type: "Protective measure", text: "Predictive back shows \"Leave pairing?\" before exiting." },
        { type: "Information for safety", text: "Status keeps showing \"No sensor connected\" until pairing completes." },
      ],
      verify: "Formative: count unintended exits, Android back gesture vs iOS swipe-down.",
    },
    parity: {
      delta: "Behavior differs",
      ios: "Sheet; swipe-down to dismiss is guarded.",
      android: "Full screen; system back gesture is guarded with predictive back.",
    },
  },
  {
    id: "s-warmup",
    flow: "sensor",
    label: "Warmup",
    caption: "8:22 PM. The new sensor is warming up for 60 minutes. Closed loop is on, but nothing is automating until readings arrive. On iOS, Loop escalates its not-running notice to a Critical alert at 60 minutes, which lands mid-warmup at 8:40.",
    screen: { kind: "status", now: at(20, 22), sheet: "warmup" },
    hf: {
      task: "Know when automation will return",
      useError: "User assumes automation resumed as soon as the sensor paired",
      harm: "Hyperglycemia",
      severity: "Moderate",
      controls: [{ type: "Information for safety", text: "Warmup countdown sits next to \"Automation unavailable\", with the end time." }],
      verify: "Formative: ask \"When will the app start adjusting again?\"",
    },
    parity: {
      delta: "Behavior differs",
      ios: "Countdown in the status rows. Loop's 60-minute not-running notice escalates to a Critical alert during a planned warmup.",
      android: "Countdown in the status card. Open question for Clinical: keep the escalation as is, or word it for a known warmup.",
    },
  },
  {
    id: "s-meal",
    flow: "sensor",
    label: "Dinner during warmup",
    caption: "8:35 PM. Dinner during warmup. The user logs a fingerstick and carbs, and the screen says to bolus now because automation is paused. The dose itself is left out of this concept.",
    screen: { kind: "status", now: SCENARIO.mealAt, sheet: "meal" },
    hf: {
      task: "Log a meal while the sensor warms up",
      useError: "User waits for automation to cover the meal instead of bolusing",
      harm: "Hyperglycemia",
      severity: "Moderate",
      urra: "ILLUS-U06",
      controls: [
        { type: "Information for safety", text: "Meal screen says automatic adjustments are paused until 9:20 PM and to bolus for the meal now." },
        { type: "Information for safety", text: "Fingerstick value is labeled as manual and timestamped." },
      ],
      verify: "Formative: ask \"What do you need to do for this meal?\"",
    },
    parity: { delta: "Same", ios: "Carb entry sheet.", android: "Carb entry full-screen dialog." },
  },
  {
    id: "s-first",
    flow: "sensor",
    label: "First reading",
    caption: "9:20 PM. Warmup is done and the first reading arrives. Loop completes on it right away. No button press needed, and no trend arrow yet: one reading isn't a trend.",
    screen: {
      kind: "status",
      now: WARMUP_ENDS_AT,
      notice: { title: "Sensor ready", body: "Glucose readings are back. Automation has resumed." },
    },
    hf: {
      task: "Know that automation has resumed",
      useError: "User thinks they need to turn something back on",
      harm: "Hypo- or hyperglycemia from unneeded manual changes",
      severity: "Moderate",
      controls: [{ type: "Information for safety", text: "Notification says automation resumed on its own." }],
      verify: "Formative: ask what, if anything, the user needs to do now.",
    },
    parity: { delta: "Same", ios: "Notification banner.", android: "Heads-up notification." },
  },
  {
    id: "s-looping",
    flow: "sensor",
    label: "Automation back",
    caption: "9:25 PM. Fresh readings every five minutes, temp basals working on the dinner rise. The gap stays visible on the chart.",
    screen: { kind: "status", now: WARMUP_ENDS_AT + 5 },
    hf: {
      task: "Review what happened during the gap",
      useError: "User misreads the gap as low or zero glucose",
      harm: "Hypoglycemia from unneeded treatment",
      severity: "Moderate",
      controls: [{ type: "Information for safety", text: "The chart shows no line in the gap, labeled with its cause." }],
      verify: "Formative: ask participants to explain the chart gap.",
    },
    parity: { delta: "Same", ios: "Chart gap.", android: "Chart gap + label." },
  },
];

export const FLOWS: Record<FlowId, { title: string; short: string; steps: Step[] }> = {
  permissions: { title: "Alert delivery setup", short: "Alerts", steps: PERMISSIONS },
  sensor: { title: "Sensor replacement", short: "Sensor", steps: SENSOR },
};

export const ALL_STEPS: Step[] = [...PERMISSIONS, ...SENSOR];
