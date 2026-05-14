"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { outlineLinkClassName } from "@/components/ui/Button";

export function PetReadArticleButton({
  postId,
  isLoggedIn,
}: {
  postId: string;
  isLoggedIn: boolean;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");

  const callbackPath = `/posts/${postId}`;

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function startRead() {
    setAnswer("");
    setError("");
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/pet/mimo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
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

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(callbackPath)}`}
        className={`${outlineLinkClassName} text-zinc-500 dark:text-zinc-400`}
      >
        登录后让猫咪读一读
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className={outlineLinkClassName}
        onClick={() => void startRead()}
      >
        让猫咪读一读
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
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
              猫咪读文
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              由小米 MiMo 基于当前文章内容生成读后感；请勿用于隐私或敏感信息场景。
            </p>

            {loading ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
                猫咪正在读文章…
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : null}

            {answer && !loading ? (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  猫咪说
                </p>
                <p className="mt-2 whitespace-pre-wrap">{answer}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                关闭
              </button>
              {!loading && (error || answer) ? (
                <button
                  type="button"
                  onClick={() => void startRead()}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  再读一次
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
