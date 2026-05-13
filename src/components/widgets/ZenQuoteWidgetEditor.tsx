"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDefaultZenQuote,
  resolveZenQuoteDisplay,
  ZEN_QUOTE_MAX_LEN,
} from "@/lib/widgets/zenQuote";
import { ZenQuoteWidget } from "./ZenQuoteWidget";

export function ZenQuoteWidgetEditor({
  userId,
  initialZenQuoteText,
  seed,
}: {
  userId: string;
  initialZenQuoteText: string | null;
  seed: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(initialZenQuoteText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaved(initialZenQuoteText);
  }, [initialZenQuoteText]);

  const displayText = resolveZenQuoteDisplay(saved, seed);

  function openEdit() {
    setDraft(saved?.trim() ?? "");
    setEditing(true);
  }

  async function save() {
    const trimmed = draft.trim();
    const next: string | null = trimmed.length === 0 ? null : trimmed.slice(0, ZEN_QUOTE_MAX_LEN);
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zenQuoteText: next }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(next);
      setEditing(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
  }

  return (
    <div className="space-y-3">
      {editing ? (
        <div className="rounded-xl border border-zinc-900 bg-white p-4 dark:border-zinc-100 dark:bg-zinc-950">
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            自定义一言
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, ZEN_QUOTE_MAX_LEN))}
              rows={4}
              maxLength={ZEN_QUOTE_MAX_LEN}
              placeholder={`留空则使用默认句子（当前默认：「${getDefaultZenQuote(seed)}」）`}
              className="mt-2 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            />
          </label>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {draft.length} / {ZEN_QUOTE_MAX_LEN} 字
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saving ? "保存中…" : "保存"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={cancel}
              className="rounded-lg border border-zinc-900 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <ZenQuoteWidget text={displayText} />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openEdit}
              className="text-sm font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-600 dark:text-zinc-100 dark:decoration-zinc-500 dark:hover:text-zinc-300"
            >
              编辑一言
            </button>
          </div>
        </>
      )}    </div>
  );
}
