import type { BookStatus } from "@/generated/prisma";

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  WANT_TO_READ: "想读",
  READING: "在读",
  FINISHED: "已读",
};

export const BOOK_STATUS_ORDER: BookStatus[] = [
  "READING",
  "WANT_TO_READ",
  "FINISHED",
];

export function bookStatusBadgeClass(status: BookStatus): string {
  switch (status) {
    case "READING":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200";
    case "FINISHED":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

/** 无封面时按书名生成稳定配色 */
export function bookCoverFallbackStyle(title: string): { background: string } {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return {
    background: `linear-gradient(145deg, hsl(${hue} 42% 38%) 0%, hsl(${(hue + 40) % 360} 35% 28%) 100%)`,
  };
}
