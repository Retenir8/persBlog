"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Post, Tag } from "@prisma/client";
import Editor from "@/components/blog/Editor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type PostTagRow = { tagId: string; tag: Tag };

export default function PostEditorForm({
  categories,
  tags,
  post,
}: {
  categories: Category[];
  tags: Tag[];
  post?: Post & { tags?: PostTagRow[] };
}) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>(
    () => {
          const initial: Record<string, boolean> = {};
          post?.tags?.forEach((pt) => {
            initial[pt.tagId] = true;
          });
          return initial;
        }
  );
  const [published, setPublished] = useState(post?.published ?? true);
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  const tagIds = useMemo(
    () => Object.entries(selectedTags).filter(([, v]) => v).map(([id]) => id),
    [selectedTags]
  );

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      alert((await res.json()).error || "创建分类失败");
      return;
    }
    setNewCategory("");
    router.refresh();
  }

  async function addTag() {
    const name = newTag.trim();
    if (!name) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      alert((await res.json()).error || "创建标签失败");
      return;
    }
    setNewTag("");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        title,
        content,
        categoryId: categoryId || null,
        tagIds,
        published,
      };
      const url = isEdit ? `/api/posts/${post!.id}` : "/api/posts";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "保存失败");
        return;
      }
      router.push(`/posts/${isEdit ? post!.id : data.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <label className="block text-sm font-medium">
        标题
        <Input
          className="mt-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium">正文</p>
        <Editor content={content} onChange={setContent} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          分类
          <select
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">无</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">新建分类</span>
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="名称"
            />
            <Button type="button" variant="secondary" onClick={addCategory}>
              添加
            </Button>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">标签</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-700"
            >
              <input
                type="checkbox"
                checked={!!selectedTags[t.id]}
                onChange={(e) =>
                  setSelectedTags((s) => ({ ...s, [t.id]: e.target.checked }))
                }
              />
              {t.name}
            </label>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="新标签"
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            添加标签
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        立即发布（关闭则保存为草稿）
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "保存中…" : "保存"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
