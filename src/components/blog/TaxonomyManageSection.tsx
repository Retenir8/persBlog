"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Item = { id: string; name: string };

export function TaxonomyManageSection({
  categories,
  tags,
  canManage,
}: {
  categories: Item[];
  tags: Item[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "添加分类失败");
        return;
      }
      setNewCategory("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addTag() {
    const name = newTag.trim();
    if (!name) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "添加标签失败");
        return;
      }
      setNewTag("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(id: string) {
    if (
      !confirm("确定删除该分类？使用此分类的文章将变为「无分类」。")
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
    if (editingCategoryId === id) setEditingCategoryId(null);
    router.refresh();
  }

  async function removeTag(id: string) {
    if (!confirm("确定删除该标签？将从所有文章中移除该标签关联。")) return;
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
    if (editingTagId === id) setEditingTagId(null);
    router.refresh();
  }

  function startEditCategory(c: Item) {
    setEditingCategoryId(c.id);
    setEditingTagId(null);
    setEditName(c.name);
    setError("");
  }

  function startEditTag(t: Item) {
    setEditingTagId(t.id);
    setEditingCategoryId(null);
    setEditName(t.name);
    setError("");
  }

  async function saveCategory(id: string) {
    const name = editName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "更新失败");
        return;
      }
      setEditingCategoryId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveTag(id: string) {
    const name = editName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "更新失败");
        return;
      }
      setEditingTagId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        分类与标签
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {canManage
          ? "登录状态下可添加、编辑、删除分类与标签。"
          : (
              <>
                请先
                <Link href="/login" className="mx-1 underline">
                  登录
                </Link>
                后再管理分类与标签。
              </>
            )}
      </p>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {canManage && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              新分类
            </span>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="分类名称"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={addCategory}
              >
                添加
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              新标签
            </span>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="标签名称"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={addTag}
              >
                添加
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            分类列表
          </h3>
          <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
            {categories.length === 0 ? (
              <li className="text-zinc-500">暂无分类</li>
            ) : (
              categories.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editingCategoryId === c.id ? (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="min-w-0 flex-1"
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          disabled={busy}
                          onClick={() => saveCategory(c.id)}
                        >
                          保存
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => setEditingCategoryId(null)}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/posts?categoryId=${c.id}`}
                        className="min-w-0 truncate text-zinc-800 hover:underline dark:text-zinc-200"
                      >
                        {c.name}
                      </Link>
                      {canManage && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            onClick={() => startEditCategory(c)}
                          >
                            编辑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            onClick={() => removeCategory(c.id)}
                          >
                            删除
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            标签列表
          </h3>
          <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
            {tags.length === 0 ? (
              <li className="text-zinc-500">暂无标签</li>
            ) : (
              tags.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editingTagId === t.id ? (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="min-w-0 flex-1"
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          disabled={busy}
                          onClick={() => saveTag(t.id)}
                        >
                          保存
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => setEditingTagId(null)}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/posts?tagId=${t.id}`}
                        className="min-w-0 truncate text-zinc-800 hover:underline dark:text-zinc-200"
                      >
                        {t.name}
                      </Link>
                      {canManage && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            onClick={() => startEditTag(t)}
                          >
                            编辑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            onClick={() => removeTag(t.id)}
                          >
                            删除
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        也可在{" "}
        <Link href="/categories" className="underline">
          分类页
        </Link>
        、
        <Link href="/tags" className="underline">
          标签页
        </Link>{" "}
        使用相同能力。
      </p>
    </section>
  );
}
