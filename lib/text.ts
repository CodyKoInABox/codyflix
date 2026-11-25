const PROMO_LINE = /^(use code|merch|podcast|instagram|twitter|business|edited by|follow |subscribe |ad free|chapters|listen on|visit )\b/i;

export function synopsis(text: string, fallback: string): string {
  const kept = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || PROMO_LINE.test(line)) return false;
      const words = line.replace(/https?:\/\/\S+/gi, "").replace(/www\.\S+/gi, "").trim();
      return words.length >= 28;
    });
  if (kept.length === 0) return fallback;
  return truncate(kept.join(" "), 180);
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (max <= 0) return "";
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const cut = slice.lastIndexOf(" ");
  const base = cut > Math.floor(max * 0.6) ? slice.slice(0, cut) : slice;
  return `${base.trimEnd()}…`;
}

export function formatPublished(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function yearOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return String(date.getUTCFullYear());
}

export const ROLE_LABEL: Record<string, string> = {
  main: "Main channel",
  second: "Second channel",
  collab: "Collab",
  wife: "Family",
  dj: "DJ",
  podcast: "Podcast",
  related: "Related",
};
