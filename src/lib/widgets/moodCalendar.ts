const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_KEYS = 200;

/** 存储键：空 → 愤怒 → 悲伤 → 平静 → 开心 → 空 */
export const MOOD_CYCLE = ["", "angry", "sad", "calm", "happy"] as const;
export type MoodKey = (typeof MOOD_CYCLE)[number];

const ALLOWED = new Set<string>(MOOD_CYCLE);

/** 心情键 → 日历格子背景（Tailwind 完整类名，勿拼接动态片段） */
export const MOOD_CELL_BG: Record<Exclude<MoodKey, "">, string> = {
  angry: "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500",
  sad: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500",
  calm: "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500",
  happy:
    "bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-300 dark:hover:bg-yellow-200",
};

export function nextMoodKey(current: string): MoodKey {
  const idx = MOOD_CYCLE.indexOf(current as MoodKey);
  const i = idx < 0 ? 0 : idx;
  return MOOD_CYCLE[(i + 1) % MOOD_CYCLE.length];
}

/** 心情日历存储：日期 YYYY-MM-DD → 心情键 angry|sad|calm|happy */
export function parseMoodCalendarData(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!DATE_KEY.test(k)) continue;
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!ALLOWED.has(t) || t === "") continue;
    out[k] = t;
  }
  return out;
}

export function sanitizeMoodCalendarPayload(
  value: unknown
): Record<string, string> | null {
  if (value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  let n = 0;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (n >= MAX_KEYS) break;
    if (!DATE_KEY.test(k)) continue;
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t === "") continue;
    if (!ALLOWED.has(t)) return null;
    out[k] = t;
    n++;
  }
  return out;
}
