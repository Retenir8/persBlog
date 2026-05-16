"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { surfacePanelSubtleClass } from "@/lib/surfaceStyles";

type Cat = {
  id: string;
  name: string;
  _count: { posts: number };
};

export function CategoryBrowseManage({
  categories,
  canManage,
}: {
  categories: Cat[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const n = name.trim();
    if (!n) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/categories", {
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
      setName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, label: string) {
    if (
      !confirm(`确定删除分类「${label}」？下属文章将变为无分类。`)
    ) {
      return;
    }
    setError("");
    const res = await fetch(`/api/categories/${id}`, {
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

  function startEdit(c: Cat) {
    setEditingId(c.id);
    setEditName(c.name);
    setError("");
  }

  async function save(id: string) {
    const n = editName.trim();
    if (!n) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
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
        <div className={`space-y-4 p-4 ${surfacePanelSubtleClass}`}>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            新建分类
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                名称
              </span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group relative rounded-2xl border border-zinc-200/70 bg-white shadow-[var(--shadow-surface)] transition-[box-shadow,border-color] duration-300 hover:border-zinc-300/80 hover:shadow-[var(--shadow-surface-hover)] dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700/80"
          >
            {editingId === category.id ? (
              <div className="p-6">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => save(category.id)}
                  >
                    保存
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href={`/posts?categoryId=${category.id}`}
                  className="block p-6 pr-[4.75rem]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {category.name}
                    </h2>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {category._count.posts} 篇文章
                    </span>
                  </div>
                </Link>
                {canManage && (
                  <div className="absolute right-2 top-2 flex w-[4.25rem] flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full px-2 py-1 text-xs"
                      onClick={() => startEdit(category)}
                    >
                      编辑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => remove(category.id, category.name)}
                    >
                      删除
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
