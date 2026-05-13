"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WidgetPreviewActions({
  widgetKey,
  userId,
  currentWidgets,
}: {
  widgetKey: string;
  userId: string | null;
  currentWidgets: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const already = userId ? currentWidgets.includes(widgetKey) : false;

  async function add() {
    if (!userId || already) return;
    setLoading(true);
    try {
      const next = [...new Set([...currentWidgets, widgetKey])];
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileWidgets: next }),
      });
      if (!res.ok) throw new Error("add failed");
      router.push("/myposts");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        登录后即可把该小组件
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/widgets/preview/${widgetKey}`)}`}
          className="mx-1 font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          添加到我的博客
        </Link>
        。
      </p>
    );
  }

  if (already) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          该小组件已在「我的博客」中。
        </span>
        <Link
          href="/myposts"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          打开我的博客
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={add}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "添加中…" : "添加到我的博客"}
      </button>
      <Link
        href="/myposts"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        先看我的博客
      </Link>
    </div>
  );
}
