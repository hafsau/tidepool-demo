import type { Metadata } from "next";
import Link from "next/link";
import { CopyTicket } from "@/components/copy-ticket";
import { deltaPill, PageIntro } from "@/components/page";
import { ALL_STEPS, FLOWS, type FlowId } from "@/lib/flows";
import { reviewTicket } from "@/lib/ticket";

export const metadata: Metadata = { title: "Parity matrix" };

export default function MatrixPage() {
  const counts = ALL_STEPS.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.parity.delta]: (acc[s.parity.delta] ?? 0) + 1 }), {});
  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
      <PageIntro eyebrow="Parity matrix" title="Where Android and iOS differ, step by step">
        <p>
          Every step in both flows, with how each platform gets there. Visual differences (fonts, chrome) are left out on purpose. These rows are about
          behavior a person would notice and a usability study would have to test.
        </p>
        <p className="flex flex-wrap gap-2 pt-1">
          {Object.entries(counts).map(([delta, n]) => (
            <span key={delta} className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${deltaPill[delta as keyof typeof deltaPill]}`}>
              {n} · {delta}
            </span>
          ))}
        </p>
      </PageIntro>

      <CopyTicket text={reviewTicket()} />

      {(Object.keys(FLOWS) as FlowId[]).map((flow) => (
        <section key={flow} className="mt-8">
          <h2 className="text-[20px] font-semibold tracking-tight">{FLOWS[flow].title}</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line-soft bg-surface" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="w-full min-w-[860px] border-collapse text-left text-[14px]">
              <caption className="sr-only">{FLOWS[flow].title} parity by step</caption>
              <thead className="bg-sunken text-[12.5px] uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Step</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">User task</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Delta</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">iOS (reference)</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Android (proposed)</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody>
                {FLOWS[flow].steps.map((s, i) => (
                  <tr key={s.id} className="border-t border-line-soft align-top">
                    <th scope="row" className="px-3 py-3 font-semibold">
                      <Link className="link" href={`/?flow=${flow}&step=${s.id}`}>
                        {i + 1}. {s.label}
                      </Link>
                    </th>
                    <td className="px-3 py-3 text-muted">
                      {s.hf.task}
                      {s.hf.candidateCritical && <span className="mt-1 block text-[12px] font-semibold text-ink">Candidate critical task</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold ${deltaPill[s.parity.delta]}`}>{s.parity.delta}</span>
                    </td>
                    <td className="px-3 py-3 text-muted">{s.parity.ios}</td>
                    <td className="px-3 py-3 text-muted">{s.parity.android}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-[12.5px]">
                      {s.hf.urra ? (
                        <Link className="link" href={`/risk#${s.hf.urra}`}>
                          {s.hf.urra}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
