"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { surfacePanelClass } from "@/lib/surfaceStyles";

type TagRow = {
  id: string;
  name: string;
  _count: { posts: number };
};

export function TagBrowseManage({
  tags,
  canManage,
}: {
  tags: TagRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const maxCount = Math.max(...tags.map((t) => t._count.posts), 1);

  function getTagSize(count: number) {
    if (count === 0) return "text-sm";
    const ratio = count / maxCount;
    if (ratio >= 0.7) return "text-xl";
    if (ratio >= 0.4) return "text-base";
    return "text-sm";
  }

  async function add() {
    const n = newName.trim();
    if (!n) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "添加失败");
        return;
      }
      setNewName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`确定删除标签「${label}」？将从所有文章中移除。`)) return;
    setError("");
    const res = await fetch(`/api/tags/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "删除失败");
      return;
    }
    if (editingId === id) setEditingId(null);
    router.refresh();
  }

  function startEdit(t: TagRow) {
    setEditingId(t.id);
    setEditName(t.name);
    setError("");
  }

  async function save(id: string) {
    const n = editName.trim();
    if (!n) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "更新失败");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {canManage && (
        <div className={`space-y-4 p-4 ${surfacePanelClass}`}>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            新建标签
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                名称
              </span>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入名称后添加"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={add}
              className="shrink-0"
            >
              添加
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={`inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-zinc-200/80 bg-white py-1 pl-3 pr-1 shadow-[var(--shadow-surface)] dark:border-zinc-700/80 dark:bg-zinc-950 ${getTagSize(tag._count.posts)}`}
          >
            {editingId === tag.id ? (
              <span className="flex flex-wrap items-center gap-1 py-0.5">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 min-w-[8rem] text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 px-2 text-xs"
                  disabled={busy}
                  onClick={() => save(tag.id)}
                >
                  保存
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => setEditingId(null)}
                >
                  取消
                </Button>
              </span>
            ) : (
              <>
                <Link
                  href={`/posts?tagId=${tag.id}`}
                  className="font-medium hover:underline"
                >
                  {tag.name}
                </Link>
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
                  {tag._count.posts}
                </span>
                {canManage && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => startEdit(tag)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => remove(tag.id, tag.name)}
                    >
                      删除
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
