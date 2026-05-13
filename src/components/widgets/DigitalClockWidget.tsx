"use client";

import { useEffect, useState } from "react";
import { TRIO_WIDGET_MIN_HEIGHT_CLASS } from "@/lib/widgets/trioWidgetLayout";

export function DigitalClockWidget({ compact }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const date = compact
    ? now.toLocaleDateString("zh-CN", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      })
    : now.toLocaleDateString("zh-CN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const time = compact
    ? now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

  return (
    <div
      className={`rounded-xl border border-zinc-900 bg-white text-center dark:border-zinc-100 dark:bg-zinc-950 ${
        compact
          ? `flex flex-col justify-center ${TRIO_WIDGET_MIN_HEIGHT_CLASS} px-2 py-3`
          : "p-6"
      }`}
    >
      <p
        className={`font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        当前时间
      </p>
      <p
        className={`mt-1 font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 ${
          compact ? "text-2xl sm:text-3xl" : "text-3xl"
        }`}
      >
        {time}
      </p>
      <p
        className={`mt-1 text-zinc-600 dark:text-zinc-400 ${
          compact ? "text-xs leading-snug" : "text-sm"
        }`}
      >
        {date}
      </p>
    </div>
  );
}
