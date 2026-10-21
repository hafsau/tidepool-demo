import { BatteryFull, Signal, Wifi } from "lucide-react";
import type { Platform } from "@/lib/flows";

/*
 * A plain CSS device outline, not an Apple or Google bezel image. The
 * watermark sits inside the screen so a cropped screenshot still carries it.
 */
export function PhoneFrame({
  platform,
  clock,
  dark = false,
  hf,
  lv,
  label,
  children,
}: {
  platform: Platform;
  clock: string;
  dark?: boolean;
  hf: boolean;
  lv: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const ios = platform === "ios";
  return (
    <figure className="m-0 flex flex-col items-center" aria-label={label}>
      <div
        className={`relative w-[300px] max-w-full rounded-[46px] p-[10px] shadow-[0_24px_60px_-28px_rgba(39,27,70,0.55)] ${
          ios ? "bg-[#1c1c1e]" : "bg-[#202124] rounded-[40px]"
        }`}
      >
        <div
          data-hf={hf}
          data-lv={lv}
          data-platform={platform}
          className={`screen relative flex h-[620px] flex-col overflow-hidden ${ios ? "rounded-[37px] font-ios" : "rounded-[31px] font-roboto"} ${
            dark ? "bg-black text-white" : ios ? "bg-[#f2f2f7] text-black" : "bg-[#f4f4f9] text-[#1b1b1f]"
          }`}
        >
          <StatusBar platform={platform} clock={clock} dark={dark} />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto" tabIndex={0} role="group" aria-label="Screen content">
            {children}
          </div>
          <p
            className={`pointer-events-none z-30 shrink-0 px-3 pb-1.5 pt-1 text-center text-[9px] leading-tight tracking-wide ${
              dark ? "text-white/70" : "text-black/55"
            }`}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Concept by Hafsa Usmani · Not Tidepool · Not a medical device · Mock data
          </p>
          <div className={`mx-auto mb-1.5 h-[4px] w-[34%] shrink-0 rounded-full ${dark ? "bg-white/80" : "bg-black/80"}`} aria-hidden="true" />
        </div>
      </div>
    </figure>
  );
}

function StatusBar({ platform, clock, dark }: { platform: Platform; clock: string; dark: boolean }) {
  const ios = platform === "ios";
  const color = dark ? "text-white" : "text-black";
  const time = clock.replace(/ (AM|PM)$/, "");
  return (
    <div className={`relative z-20 flex h-[38px] shrink-0 items-center justify-between px-6 ${color}`} aria-hidden="true">
      <span className={ios ? "text-[13px] font-semibold" : "text-[12px] font-medium"}>{time}</span>
      {ios ? (
        <span className="absolute left-1/2 top-[9px] h-[22px] w-[82px] -translate-x-1/2 rounded-full bg-black" />
      ) : (
        <span className="absolute left-1/2 top-[11px] h-[12px] w-[12px] -translate-x-1/2 rounded-full bg-black" />
      )}
      <span className="flex items-center gap-1">
        <Signal size={12} strokeWidth={2.4} />
        <Wifi size={12} strokeWidth={2.4} />
        <BatteryFull size={16} strokeWidth={2} />
      </span>
    </div>
  );
}
