"use client";

import { useEffect, useId, useState } from "react";

export function PetAskPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuestion("");
    setAnswer("");
    setError("");
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await fetch("/api/pet/mimo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        answer?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "请求失败");
        return;
      }
      if (typeof data.answer === "string") {
        setAnswer(data.answer);
      } else {
        setError("返回格式异常");
      }
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(90vh,32rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          向猫咪提问
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          由小米 MiMo 模型生成回答；请勿输入隐私或敏感信息。
        </p>

        <label className="mt-4 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          问题
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            disabled={loading}
            placeholder="例如：今天适合写什么博客？"
            className="mt-1.5 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || !question.trim()}
            onClick={submit}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "猫咪思考中…" : "发送"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            关闭
          </button>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        {answer ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              猫咪说
            </p>
            <p className="mt-2 whitespace-pre-wrap">{answer}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
