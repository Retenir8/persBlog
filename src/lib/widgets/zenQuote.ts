const DEFAULT_QUOTES = [
  "慢慢来，比较快。",
  "今天的一小步，是明天的一大步。",
  "保持好奇，保持善良。",
  "代码会写，咖啡要喝。",
] as const;

export const ZEN_QUOTE_MAX_LEN = 500;

export function getDefaultZenQuote(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return DEFAULT_QUOTES[h % DEFAULT_QUOTES.length];
}

export function resolveZenQuoteDisplay(
  saved: string | null | undefined,
  seed: string
): string {
  const t = saved?.trim();
  if (t) return t;
  return getDefaultZenQuote(seed);
}
