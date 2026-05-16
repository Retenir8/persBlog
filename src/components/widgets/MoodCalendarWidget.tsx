"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MOOD_CELL_BG,
  nextMoodKey,
} from "@/lib/widgets/moodCalendar";
import { TRIO_WIDGET_MIN_HEIGHT_CLASS } from "@/lib/widgets/trioWidgetLayout";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function dayNumberClass(mood: string): string {
  if (mood === "happy") return "text-zinc-900";
  if (mood === "angry" || mood === "sad" || mood === "calm")
    return "text-white drop-shadow-sm";
  return "text-zinc-400";
}

export function MoodCalendarWidget({
  userId,
  initialData,
  compact,
}: {
  userId?: string | null;
  initialData: Record<string, string>;
  compact?: boolean;
}) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => new Date());
  const [data, setData] = useState<Record<string, string>>(initialData);
  const [busy, setBusy] = useState(false);

  const editable = Boolean(userId);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const mondayOffset = (firstDow + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells = useMemo(() => {
    const list: { key: string; day: number | null }[] = [];
    for (let i = 0; i < mondayOffset; i++) list.push({ key: `p-${i}`, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ key: dateKey(y, m, d), day: d });
    }
    while (list.length % 7 !== 0) list.push({ key: `t-${list.length}`, day: null });
    return list;
  }, [y, m, mondayOffset, daysInMonth]);

  async function persist(next: Record<string, string>) {
    if (!userId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodCalendarData: next }),
      });
      if (!res.ok) throw new Error("save mood");
      setData(next);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function onPickDay(day: number) {
    if (!editable || !userId) return;
    const key = dateKey(y, m, day);
    const cur = data[key] ?? "";
    const n = nextMoodKey(cur);
    const next = { ...data };
    if (n === "") delete next[key];
    else next[key] = n;
    void persist(next);
  }

  const head = compact ? "text-[10px]" : "text-xs";
  const cell = compact ? "min-h-[1.5rem] text-[10px]" : "min-h-8 text-xs";

  const rootH = compact ? `flex flex-col ${TRIO_WIDGET_MIN_HEIGHT_CLASS}` : "";

  function cellBg(mood: string): string {
    if (mood === "angry" || mood === "sad" || mood === "calm" || mood === "happy") {
      return MOOD_CELL_BG[mood as keyof typeof MOOD_CELL_BG];
    }
    return "bg-zinc-50 dark:bg-zinc-900";
  }

  return (
    <div
      className={`w-full min-w-0 rounded-xl border border-zinc-900 bg-white p-2 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50 sm:p-3 ${rootH}`}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-1">
        <button
          type="button"
          aria-label="上月"
          disabled={busy}
          onClick={() => setCursor(new Date(y, m - 1, 1))}
          className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
        >
          ‹
        </button>
        <span className={`shrink-0 font-medium ${compact ? "text-[11px]" : "text-sm"}`}>
          {y}年{m + 1}月
        </span>
        <button
          type="button"
          aria-label="下月"
          disabled={busy}
          onClick={() => setCursor(new Date(y, m + 1, 1))}
          className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
        >
          ›
        </button>
      </div>
      <div
        className={`grid shrink-0 grid-cols-7 gap-0.5 text-center ${head} text-zinc-500 dark:text-zinc-400`}
      >
        {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
          <div key={w} className="font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className={`mt-1 grid min-h-0 flex-1 grid-cols-7 gap-0.5 content-start`}>
        {cells.map(({ key, day }) =>
          day === null ? (
            <div key={key} className={cell} />
          ) : editable ? (
            <button
              key={key}
              type="button"
              disabled={busy}
              title="点击切换格子背景色表示心情"
              onClick={() => onPickDay(day)}
              className={`${cell} flex flex-col items-center justify-center rounded border border-zinc-200 leading-tight transition-colors disabled:opacity-50 dark:border-zinc-700 ${cellBg(
                data[dateKey(y, m, day)] ?? ""
              )} ${
                (data[dateKey(y, m, day)] ?? "") === ""
                  ? "hover:border-zinc-900 hover:bg-zinc-100 dark:hover:border-zinc-100 dark:hover:bg-zinc-800"
                  : "border-transparent"
              }`}
            >
              <span className={`font-medium ${dayNumberClass(data[dateKey(y, m, day)] ?? "")}`}>
                {day}
              </span>
            </button>
          ) : (
            <div
              key={key}
              className={`${cell} flex flex-col items-center justify-center rounded border border-zinc-200 leading-tight dark:border-zinc-700 ${cellBg(
                data[dateKey(y, m, day)] ?? ""
              )}`}
            >
              <span className={`font-medium ${dayNumberClass(data[dateKey(y, m, day)] ?? "")}`}>
                {day}
              </span>
            </div>
          )
        )}
      </div>

      <div
        className={`mt-2 shrink-0 space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-700 ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        <p className="font-medium text-zinc-700 dark:text-zinc-300">颜色含义</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-red-500 dark:bg-red-600" />
            愤怒 · 红
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-blue-500 dark:bg-blue-600" />
            悲伤 · 蓝
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-green-500 dark:bg-green-600" />
            平静 · 绿
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-yellow-400 dark:bg-yellow-300" />
            开心 · 黄
          </span>
        </div>
      </div>

      <p
        className={`mt-2 shrink-0 text-zinc-500 dark:text-zinc-400 ${
          compact ? "text-[9px] leading-tight" : "text-[10px]"
        }`}
      >
        {editable
          ? "点击日期：无色 → 愤怒(红) → 悲伤(蓝) → 平静(绿) → 开心(黄) → 无色"
          : "登录并添加到「我的博客」后，可在此记录心情。"}
      </p>
    </div>
  );
}
