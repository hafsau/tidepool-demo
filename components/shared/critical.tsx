"use client";

import { createContext, useContext } from "react";
import { CRITICAL, type CriticalId } from "@/lib/flows";

export type FrameSettings = {
  /** Critical items for this step, in screen-reader announcement order. */
  order: CriticalId[];
  hf: boolean;
  lv: boolean;
};

export const FrameContext = createContext<FrameSettings>({ order: [], hf: false, lv: false });

/**
 * Wraps one thing the user must perceive. The parity test renders both
 * platforms and checks every critical id for the step appears in each.
 */
export function Critical({
  id,
  as: Tag = "div",
  className,
  children,
}: {
  id: CriticalId;
  as?: "div" | "span" | "p";
  className?: string;
  children: React.ReactNode;
}) {
  const { order, lv } = useContext(FrameContext);
  const n = order.indexOf(id) + 1;
  return (
    <Tag data-critical={id} title={CRITICAL[id]} className={className}>
      {lv && n > 0 && (
        <span className="order-badge mr-[0.35em]" aria-hidden="true">
          {n}
        </span>
      )}
      {children}
    </Tag>
  );
}
