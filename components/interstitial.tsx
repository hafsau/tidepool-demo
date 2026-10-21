"use client";

import { useEffect, useRef } from "react";

const KEY = "parity-concept-ack";

/*
 * Shown once per browser, as a real modal dialog. Skipped when the link opens
 * a specific step (a shared deep link): that view still carries the header
 * banner and the watermark inside every frame. If storage is blocked or
 * cleared, the note just shows again.
 */
export function Interstitial() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(KEY) === "1";
    } catch {
      // Storage unavailable: show the note.
    }
    const deepLink = new URLSearchParams(window.location.search).has("step");
    if (!seen && !deepLink && !dialog.current?.open) dialog.current?.showModal();
  }, []);

  const remember = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Fine: it will show again next time.
    }
    document.getElementById("main")?.focus();
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="ack-title"
      onClose={remember}
      className="m-auto w-[calc(100%-2rem)] max-w-[460px] rounded-2xl bg-surface p-6 text-ink shadow-2xl backdrop:bg-ink/55"
    >
      <h2 id="ack-title" className="text-[20px] font-semibold tracking-tight">
        A design concept, not a medical device
      </h2>
      <div className="prose-tight mt-3 text-[15px] text-muted">
        <p>
          These screens imitate an automated insulin dosing app so the design reasoning is concrete. Every number is scripted mock data. Nothing here is
          advice, and nothing here comes from or is endorsed by Tidepool.
        </p>
        <p>Don&apos;t use anything on this site to make diabetes decisions. Talk to your care team.</p>
      </div>
      <form method="dialog">
        <button autoFocus className="mt-5 w-full rounded-full bg-ink py-2.5 text-[15px] font-medium text-white hover:bg-ink/90">
          I understand
        </button>
      </form>
    </dialog>
  );
}
