"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyTicket({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold">Design-review ticket</h2>
          <p className="text-[13.5px] text-muted">The rows that differ, in Jira wiki markup. Paste into a ticket description.</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-white hover:bg-ink/90"
        >
          {state === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {state === "copied" ? "Copied" : "Copy ticket"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {state === "copied" ? "Ticket copied to clipboard" : state === "failed" ? "Copy failed. Select the text below instead." : ""}
      </p>
      {state === "failed" && <p className="mt-2 text-[13px] text-danger">Copy isn&apos;t available here. Select the text below instead.</p>}
      <details className="mt-3">
        <summary className="cursor-pointer text-[13.5px] text-accent">Show the ticket text</summary>
        <pre className="mt-2 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl bg-sunken p-3 font-mono text-[12px] leading-relaxed" tabIndex={0}>
          {text}
        </pre>
      </details>
    </div>
  );
}
