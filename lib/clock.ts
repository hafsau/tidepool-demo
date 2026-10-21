// Scenario time is minutes since midnight on one mock evening.
export const at = (h: number, m = 0) => h * 60 + m;

export function formatClock(t: number): string {
  const h24 = Math.floor(t / 60) % 24;
  const m = Math.round(t % 60);
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

export function formatShortClock(t: number): string {
  return formatClock(t).replace(/ (AM|PM)$/, "");
}

export function formatAge(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${Math.floor(min)} min ago`;
  const h = Math.floor(min / 60);
  return `${h} h ${Math.floor(min % 60)} min ago`;
}
