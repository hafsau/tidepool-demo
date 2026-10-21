import Link from "next/link";

const NAV = [
  { href: "/", label: "Prototype" },
  { href: "/matrix", label: "Parity matrix" },
  { href: "/risk", label: "Risk & protocol" },
  { href: "/about", label: "About" },
];

function Mark() {
  // Two bars, one held level with the other. Not a Tidepool mark.
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="3" y="5" width="8" height="14" rx="2.5" fill="#271B46" />
      <rect x="13" y="5" width="8" height="14" rx="2.5" fill="#627CFF" />
      <rect x="2" y="11.25" width="20" height="1.5" rx="0.75" fill="#F6F7FB" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line-soft bg-surface">
      <p className="bg-ink px-4 py-1.5 text-center text-[12.5px] text-white">
        Unofficial concept by Hafsa Usmani. Not affiliated with Tidepool. Not a medical device. Mock data only.
      </p>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Mark />
          Held to the iOS bar
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-1 text-[14px]">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-muted hover:bg-sunken hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line-soft bg-surface">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-6 text-[13px] text-muted sm:px-6 md:flex-row md:justify-between">
        <p>
          Concept and build by <a className="link" href="https://hafsausmani.com">Hafsa Usmani</a>. Not for diabetes decisions. Talk to your care team.
        </p>
        <p>
          Code: <a className="link" href="https://github.com/hafsau/tidepool-demo">BSD-2-Clause on GitHub</a>
        </p>
      </div>
    </footer>
  );
}
