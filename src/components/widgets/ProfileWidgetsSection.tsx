"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { WIDGET_TRIO_KEYS } from "@/lib/widgets/registry";
import { WidgetRenderer } from "./WidgetRenderer";
import { ZenQuoteWidgetEditor } from "./ZenQuoteWidgetEditor";

const TRIO_KEY_SET = new Set<string>(WIDGET_TRIO_KEYS);

const trioOrderIndex = new Map<string, number>(
  WIDGET_TRIO_KEYS.map((k, i) => [k, i]),
);

function sortTrioKeys(keys: string[]): string[] {
  return [...new Set(keys)].sort(
    (a, b) => (trioOrderIndex.get(a) ?? 99) - (trioOrderIndex.get(b) ?? 99),
  );
}

/** 一言占整行；时钟/心情/音乐始终同一行。一言相对于「第一个三件套」在列表中的位置决定在上还是下。 */
function resolveWidgetLayout(widgetKeys: string[]) {
  const trioEnabled = sortTrioKeys(
    widgetKeys.filter((k) => TRIO_KEY_SET.has(k)),
  );
  const hasZen = widgetKeys.includes("zen-quote");
  const firstTrioI = widgetKeys.findIndex((k) => TRIO_KEY_SET.has(k));
  const firstZenI = widgetKeys.findIndex((k) => k === "zen-quote");
  const zenAbove =
    hasZen && (firstTrioI === -1 || firstZenI < firstTrioI);
  const zenBelow =
    hasZen && firstTrioI !== -1 && firstZenI >= firstTrioI;
  return { trioEnabled, zenAbove, zenBelow };
}

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

  const { trioEnabled, zenAbove, zenBelow } = useMemo(
    () => resolveWidgetLayout(widgetKeys),
    [widgetKeys],
  );

  function renderWidgetBlock(key: string, compact: boolean) {
    return (
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2">
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
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
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

  function renderTrioRow(keys: string[]) {
    const n = keys.length;
    if (n === 0) return null;
    if (n === 1) {
      const key = keys[0]!;
      return (
        <div className="flex w-full flex-col items-stretch">
          <div className="flex w-full max-w-xl min-w-0 flex-col">
            {renderWidgetBlock(key, true)}
          </div>
        </div>
      );
    }
    const gridClass =
      n >= 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
    return (
      <div
        className={`grid w-full items-stretch gap-2 sm:gap-3 ${gridClass}`}
      >
        {keys.map((key) => (
          <div key={key} className="flex min-h-0 min-w-0 flex-col">
            {renderWidgetBlock(key, true)}
          </div>
        ))}
      </div>
    );
  }

  if (widgetKeys.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">我的博客 · 小组件</h2>

      <div className="flex flex-col gap-6">
        {zenAbove ? (
          <div className="w-full">
            {renderWidgetBlock("zen-quote", false)}
          </div>
        ) : null}
        {trioEnabled.length > 0 ? renderTrioRow(trioEnabled) : null}
        {zenBelow ? (
          <div className="w-full">
            {renderWidgetBlock("zen-quote", false)}
          </div>
        ) : null}
      </div>
    </section>
  );
}
