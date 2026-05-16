"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { surfacePanelClass, surfacePanelNestedClass } from "@/lib/surfaceStyles";

export type GuestbookEntryDTO = {
  id: string;
  content: string;
  guestName: string | null;
  authorUserId: string | null;
  author: { id: string; name: string | null } | null;
  createdAt: string;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function canDelete(
  entry: GuestbookEntryDTO,
  hostUserId: string,
  viewerId?: string | null,
  role?: string
) {
  if (role === "ADMIN") return true;
  if (viewerId && entry.authorUserId && entry.authorUserId === viewerId)
    return true;
  if (viewerId && hostUserId === viewerId) return true;
  return false;
}

export function GuestbookSection({
  hostUserId,
  hostDisplayName,
  initialEntries,
}: {
  hostUserId: string;
  hostDisplayName: string | null;
  initialEntries: GuestbookEntryDTO[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [entries, setEntries] = useState(initialEntries);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerId = session?.user?.id ?? null;
  const isOwnWall = viewerId === hostUserId;

  async function refresh() {
    const res = await fetch(`/api/users/${hostUserId}/guestbook`);
    if (!res.ok) return;
    const data = (await res.json()) as GuestbookEntryDTO[];
    setEntries(
      data.map((e) => ({
        ...e,
        createdAt:
          typeof e.createdAt === "string"
            ? e.createdAt
            : new Date(e.createdAt as unknown as Date).toISOString(),
      }))
    );
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError("请输入留言内容");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${hostUserId}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          guestName: session?.user ? undefined : guestName.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "留言失败");
        return;
      }
      setContent("");
      setGuestName("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: string) {
    if (!confirm("确认删除这条留言？")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/guestbook/${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || "删除失败");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const titleName = hostDisplayName?.trim() || "TA";

  return (
    <section className={`mt-12 space-y-6 p-5 sm:p-6 ${surfacePanelClass}`}>
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          留言板
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          给 {titleName} 留下一段话；全站
          <Link href="/guestbook" className="mx-1 text-blue-600 hover:underline dark:text-blue-400">
            留言广场
          </Link>
          可浏览大家的留言。
        </p>
      </div>

      {!isOwnWall ? (
        <form
          onSubmit={submit}
          className={`space-y-3 p-4 ${surfacePanelNestedClass}`}
        >
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的留言…"
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          {!session?.user ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                昵称（未登录必填）
              </label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="怎么称呼你"
                autoComplete="nickname"
              />
            </div>
          ) : null}
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "发送中…" : "发表留言"}
          </Button>
        </form>
      ) : (
        <p
          className={`px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 ${surfacePanelNestedClass}`}
        >
          这是你的主页，访客可以在这里给你留言；请切换到其他用户主页体验留言，或在留言广场查看全站动态。
        </p>
      )}

      <ul className="space-y-3">
        {entries.length === 0 ? (
          <li className="text-sm text-zinc-500">暂无留言，来做第一个吧。</li>
        ) : (
          entries.map((entry) => {
            const displayName =
              entry.author?.name || entry.guestName || "访客";
            const authorLinkId = entry.authorUserId ?? entry.author?.id ?? null;

            return (
          <li
            key={entry.id}
            className={`p-4 ${surfacePanelNestedClass}`}
          >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {authorLinkId ? (
                      <Link
                        href={`/users/${authorLinkId}`}
                        className="hover:underline"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <span>{displayName}</span>
                    )}
                    <span className="ml-2 font-normal text-zinc-500">
                      {formatTime(entry.createdAt)}
                    </span>
                  </div>
                  {canDelete(
                    entry,
                    hostUserId,
                    viewerId,
                    session?.user?.role
                  ) ? (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      disabled={busy}
                      className="text-xs text-zinc-500 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                    >
                      删除
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {entry.content}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
