export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="pt-8 pb-6">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-1.5 text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-[34px]">{title}</h1>
      <div className="prose-tight mt-3 max-w-[72ch] text-[15.5px] text-muted">{children}</div>
    </section>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-6">
      <h2 className="text-[21px] font-semibold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const severityPill = { High: "bg-danger-soft text-danger", Moderate: "bg-warn-soft text-warn" } as const;

export const deltaPill = {
  Same: "bg-ok-soft text-ok",
  "Extra step on Android": "bg-warn-soft text-warn",
  "Behavior differs": "bg-accent-soft text-accent",
  "Android only": "bg-sunken text-ink",
} as const;
