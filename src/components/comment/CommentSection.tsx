"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type CommentNode = {
  id: string;
  content: string;
  guestName: string | null;
  userId: string | null;
  user: { id: string; name: string | null } | null;
  createdAt: string;
  replies: CommentNode[];
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function canDeleteComment(
  c: { userId: string | null },
  postAuthorId: string,
  userId?: string,
  role?: string
) {
  if (role === "ADMIN") return true;
  if (userId && c.userId && c.userId === userId) return true;
  if (userId && postAuthorId === userId) return true;
  return false;
}

function CommentItem({
  node,
  postId,
  postAuthorId,
  depth,
  onDeleted,
}: {
  node: CommentNode;
  postId: string;
  postAuthorId: string;
  depth: number;
  onDeleted: () => void;
}) {
  const { data: session } = useSession();
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const displayName =
    node.user?.name || node.guestName || "访客";

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: reply.trim(),
          parentId: node.id,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || "回复失败");
        return;
      }
      setReply("");
      setReplyOpen(false);
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("确认删除该评论及其回复？")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${node.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || "删除失败");
        return;
      }
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  const showDelete = canDeleteComment(
    node,
    postAuthorId,
    session?.user?.id,
    session?.user?.role
  );

  return (
    <li
      className={`rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 ${depth ? "mt-2 ml-4 md:ml-8" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {displayName}{" "}
          <span className="font-normal text-zinc-400">
            {formatTime(node.createdAt)}
          </span>
        </div>
        <div className="flex gap-2">
          {depth < 2 && (
            <Button
              type="button"
              variant="ghost"
              className="!p-1 !text-xs"
              onClick={() => setReplyOpen((v) => !v)}
            >
              回复
            </Button>
          )}
          {showDelete && (
            <Button
              type="button"
              variant="ghost"
              className="!p-1 !text-xs text-red-600"
              onClick={remove}
              disabled={busy}
            >
              删除
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {node.content}
      </p>
      {replyOpen && (
        <form onSubmit={submitReply} className="mt-3 space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            placeholder="写下回复..."
          />
          <Button type="submit" disabled={busy}>
            {busy ? "发送中…" : "发送回复"}
          </Button>
        </form>
      )}
      {node.replies?.length ? (
        <ul className="mt-3 space-y-2 border-l-2 border-zinc-100 pl-3 dark:border-zinc-800">
          {node.replies.map((r) => (
            <CommentItem
              key={r.id}
              node={r}
              postId={postId}
              postAuthorId={postAuthorId}
              depth={depth + 1}
              onDeleted={onDeleted}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function CommentSection({
  postId,
  postAuthorId,
  initialComments,
  allowGuest,
}: {
  postId: string;
  postAuthorId: string;
  initialComments: CommentNode[];
  allowGuest: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/posts/${postId}/comments`);
    if (res.ok) {
      const data = (await res.json()) as CommentNode[];
      setComments(data);
    }
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (!session?.user && allowGuest && !guestName.trim()) {
      alert("请填写昵称");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          guestName: session?.user ? undefined : guestName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || "评论失败");
        return;
      }
      setContent("");
      setGuestName("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const canWrite = allowGuest || !!session?.user;
  const writingDisabled = status === "loading";

  return (
    <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">评论</h2>

      {canWrite && !writingDisabled && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          {!session?.user && allowGuest && (
            <label className="block text-sm">
              昵称（访客必填）
              <Input
                className="mt-1 max-w-xs"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </label>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            placeholder={
              session?.user
                ? "发表看法…"
                : "登录后可免填昵称发表评论"
            }
            disabled={!canWrite}
          />
          <Button type="submit" disabled={busy || !canWrite}>
            {busy ? "发送中…" : "发表评论"}
          </Button>
        </form>
      )}

      {!allowGuest && !session?.user && (
        <p className="mt-4 text-sm text-zinc-500">
          本文章为草稿或未发布，暂不开放评论。
        </p>
      )}

      <ul className="mt-8 space-y-4">
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            node={c}
            postId={postId}
            postAuthorId={postAuthorId}
            depth={0}
            onDeleted={refresh}
          />
        ))}
      </ul>

      {comments.length === 0 && (
        <p className="mt-6 text-center text-sm text-zinc-500">
          还没有评论。
        </p>
      )}
    </section>
  );
}
