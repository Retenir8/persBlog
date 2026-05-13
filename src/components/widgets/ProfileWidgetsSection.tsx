"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WIDGET_TRIO_KEYS } from "@/lib/widgets/registry";
import { WidgetRenderer } from "./WidgetRenderer";
import { ZenQuoteWidgetEditor } from "./ZenQuoteWidgetEditor";

export function ProfileWidgetsSection({
  widgetKeys,
  userId,
  isOwner,
  zenQuoteText,
  moodCalendarData,
}: {
  widgetKeys: string[];
  userId: string;
  isOwner: boolean;
  zenQuoteText?: string | null;
  moodCalendarData?: unknown;
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (widgetKeys.length === 0) return null;

  async function removeOne(key: string) {
    setBusyKey(key);
    try {
      const next = widgetKeys.filter((k) => k !== key);
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileWidgets: next }),
      });
      if (!res.ok) throw new Error("remove failed");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyKey(null);
    }
  }

  const trioSet = new Set<string>(WIDGET_TRIO_KEYS);
  const otherKeys = widgetKeys.filter((k) => !trioSet.has(k));
  const hasTrioSlot = WIDGET_TRIO_KEYS.some((k) => widgetKeys.includes(k));

  function renderWidgetBlock(key: string, compact: boolean) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {isOwner ? (
          <div className="flex justify-end">
            <button
              type="button"
              title="从「我的博客」移除"
              disabled={busyKey === key}
              onClick={() => removeOne(key)}
              className="rounded-md border border-zinc-900 bg-white px-2 py-0.5 text-xs text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              {busyKey === key ? "…" : "移除"}
            </button>
          </div>
        ) : null}
        {key === "zen-quote" && isOwner ? (
          <ZenQuoteWidgetEditor
            userId={userId}
            initialZenQuoteText={zenQuoteText ?? null}
            seed={userId}
          />
        ) : compact ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <WidgetRenderer
              widgetKey={key}
              quoteSeed={userId}
              zenQuoteText={zenQuoteText}
              moodCalendarData={moodCalendarData}
              widgetUserId={userId}
              compact={compact}
            />
          </div>
        ) : (
          <WidgetRenderer
            widgetKey={key}
            quoteSeed={userId}
            zenQuoteText={zenQuoteText}
            moodCalendarData={moodCalendarData}
            widgetUserId={userId}
            compact={compact}
          />
        )}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight">我的博客 · 小组件</h2>

      {hasTrioSlot ? (
        <div className="grid grid-cols-3 items-stretch gap-2 sm:gap-3">
          {WIDGET_TRIO_KEYS.map((key) => (
            <div key={key} className="flex min-h-0 min-w-0 flex-col">
              {widgetKeys.includes(key) ? renderWidgetBlock(key, true) : null}
            </div>
          ))}
        </div>
      ) : null}

      {otherKeys.length > 0 ? (
        <div className={`flex flex-col gap-6 ${hasTrioSlot ? "mt-6" : ""}`}>
          {otherKeys.map((key) => (
            <div key={key}>{renderWidgetBlock(key, false)}</div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
