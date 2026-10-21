# Held to the iOS bar

**▶ Live: _(link after deploy)_** · deep link to try: `/?flow=sensor&step=s-stale&hf=1`

**An Android parity concept for an automated insulin dosing app.** An unofficial concept by [Hafsa Usmani](https://hafsausmani.com) for Tidepool's **Product Designer (Temporary Full-Time)** role.

> **Not affiliated with Tidepool. Not a medical device.** Every number is scripted mock data and nothing here is advice. Devices are fictional. The iOS frame is simplified from open-source Loop patterns; the Android frame is a proposal. The site is noindexed and shows a one-time concept note.

## The idea

Tidepool [wrote in 2023](https://www.tidepool.org/blog/what-tidepool-loop-on-android-means) that Android must show critical tasks are "just as easy to perform on an Android phone as they are on their iOS counterpart". This repo works through two of those tasks: the iOS reference next to a proposed Android version, step by step, with the human-factors reasoning behind each decision.

- **`/`: the prototype.** Two flows, both platforms side by side, one scripted evening:
  - **Alert delivery setup** (11 steps): Bluetooth, notifications, Do Not Disturb override vs iOS Critical Alerts, full-screen intent, exact alarms, battery exemption with Pixel / Samsung / Xiaomi variants, the foreground-service notice, a test alarm, and what happens when alerts are later turned off. Every permission has a deny path.
  - **Sensor replacement** (10 steps): expiry, glucose going stale, "Automation unavailable" with its reason, the last temp basal running out to scheduled basal, pairing (with predictive back on Android), warmup, a meal during warmup, and automatic resume.
  - Toggles: **Deny path**, **HF overlay** (outlines every critical item), **Low vision** (larger text and screen-reader order).
  - Everything lives in the URL: `/?flow=sensor&step=s-stale&hf=1`.
- **`/matrix`**: per-step parity, and a one-click design-review ticket in Jira markup.
- **`/risk`**: an illustrative use-related risk analysis (`ILLUS-` IDs, qualitative severity, ISO 14971 control order) and a formative protocol for the Android-vs-iOS question.
- **`/about`**: framing, the Loop rules modeled and where they come from, safety invariants, devices, an assumptions register, a clinician daily view of the same evening, and where AI was used and overridden.

## How it works

- `lib/timeline.ts`: a seeded (mulberry32) mock evening of CGM readings, with the gap from sensor expiry to the end of warmup.
- `lib/loop.ts`: derives what the status screen may say from device state and the clock. It follows rules read from Loop's open-source code: 15-minute glucose recency, 30-minute temp basals, the 6 / 16-minute status ring, and stale glucose shown as dashes.
- `lib/screen-model.ts`: one platform-neutral status model. `components/ios/` and `components/m3/` render it; they choose layout, never facts.
- `lib/flows.ts`: both flows as data, with HF and parity notes and the critical items each step must surface, in screen-reader order per platform.

## Stack and quality gates

- **Stack:** Next.js 16, React 19, Tailwind 4, lucide-react, Vercel Analytics.
- **Unit tests:** `npm test` (Vitest).
  - Safety invariants at every minute of the mock evening: no "Automation on" or dosing decision on glucose more than 15 minutes old or during warmup, basal state and time left always present, every glucose value carries its age, and no trend arrow across the sensor gap.
  - A **parity test** renders every step, deny path and phone maker on both platforms. It fails if either one drops a critical item, reads them in a different order than stated, or puts "suspended" or the product name "Loop" in a frame.
  - A content guardrail: no real pump, CGM or Tidepool names in any step, and no outcome claims.
- **End-to-end:** `npm run e2e` (Playwright). axe reports zero violations against the WCAG 2.2 AA rule set on every step, deny path and page, at 1440px and 375px. Also: no horizontal scroll, no clipping in low-vision mode, keyboard behavior around the concept note and the radio groups.
- **Lighthouse:** `npx @lhci/cli autorun`. Accessibility 100 on all five URLs, and layout shift is within budget. SEO is low on purpose, because the site is noindexed.

```bash
npm ci && npm run dev
```

## License

BSD-2-Clause.

Tidepool, Tidepool Loop, twiist, Dexcom, FreeStyle Libre, Eversense, iPhone, Apple Watch and Android are trademarks of their owners, used here only to describe the products. Not affiliated with or endorsed by any of them.
