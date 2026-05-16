"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Post, Tag } from "@/generated/prisma";
import Editor from "@/components/blog/Editor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { surfacePanelClass } from "@/lib/surfaceStyles";

type PostTagRow = { tagId: string; tag: Tag };

type FriendGroup = {
  id: string;
  name: string;
  isDefault: boolean;
};

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
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "GROUP">(
    (post?.visibility as any) || "PUBLIC"
  );
  const [selectedVisibleGroups, setSelectedVisibleGroups] = useState<Record<string, boolean>>(() => {
    try {
      const ids = JSON.parse(post?.visibleGroupIds || "[]");
      const initial: Record<string, boolean> = {};
      ids.forEach((id: string) => {
        initial[id] = true;
      });
      return initial;
    } catch {
      return {};
    }
  });
  const [selectedInvisibleGroups, setSelectedInvisibleGroups] = useState<Record<string, boolean>>(() => {
    try {
      const ids = JSON.parse(post?.invisibleGroupIds || "[]");
      const initial: Record<string, boolean> = {};
      ids.forEach((id: string) => {
        initial[id] = true;
      });
      return initial;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    fetchFriendGroups();
  }, []);

  const fetchFriendGroups = async () => {
    try {
      const response = await fetch("/api/friend-groups");
      const data = await response.json();
      if (data.success) {
        setFriendGroups(data.groups || []);
      }
    } catch (error) {
      console.error("获取好友分组失败:", error);
    }
  };

  const tagIds = useMemo(
    () => Object.entries(selectedTags).filter(([, v]) => v).map(([id]) => id),
    [selectedTags]
  );

  const visibleGroupIds = useMemo(() => {
    return Object.entries(selectedVisibleGroups)
      .filter(([, v]) => v)
      .map(([id]) => id);
  }, [selectedVisibleGroups]);

  const invisibleGroupIds = useMemo(() => {
    return Object.entries(selectedInvisibleGroups)
      .filter(([, v]) => v)
      .map(([id]) => id);
  }, [selectedInvisibleGroups]);

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

  async function save(published: boolean) {
    setBusy(true);
    try {
      const payload: any = {
        title,
        content,
        categoryId: categoryId || null,
        tagIds,
        published,
        visibility,
      };

      if (visibility === "GROUP") {
        payload.visibleGroupIds = JSON.stringify(visibleGroupIds);
        payload.invisibleGroupIds = JSON.stringify(invisibleGroupIds);
      }

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
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className={`space-y-6 p-6 ${surfacePanelClass}`}>
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
            className="mt-1 box-border h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
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
        <label className="block text-sm font-medium">
          新建分类
          <div className="mt-1 flex gap-2">
            <Input
              className="h-10 min-w-0 flex-1"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="名称"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10 shrink-0 px-4"
              onClick={addCategory}
            >
              添加
            </Button>
          </div>
        </label>
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
        <label className="mt-3 block text-sm font-medium">
          新标签
          <div className="mt-1 flex gap-2">
            <Input
              className="h-10 min-w-0 flex-1"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="名称"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10 shrink-0 px-4"
              onClick={addTag}
            >
              添加
            </Button>
          </div>
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">可见性设置</p>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibility === "PUBLIC"}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="accent-blue-600"
              />
              <span>🌍 公开</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">
              <input
                type="radio"
                name="visibility"
                value="FRIENDS"
                checked={visibility === "FRIENDS"}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="accent-blue-600"
              />
              <span>👥 仅好友可见</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">
              <input
                type="radio"
                name="visibility"
                value="GROUP"
                checked={visibility === "GROUP"}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="accent-blue-600"
              />
              <span>📁 按分组设置</span>
            </label>
          </div>

          {visibility === "GROUP" && (
            <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div>
                <p className="mb-2 text-sm font-medium text-green-600">
                  ✓ 允许查看的分组
                </p>
                <p className="mb-2 text-xs text-gray-500">
                  选择哪些分组可以看到这篇文章（留空则只自己可见）
                </p>
                <div className="flex flex-wrap gap-2">
                  {friendGroups.length === 0 ? (
                    <span className="text-sm text-gray-500">暂无比好分组</span>
                  ) : (
                    friendGroups.map((group) => (
                      <label
                        key={group.id}
                        className="flex cursor-pointer items-center gap-1 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-sm dark:border-green-700 dark:bg-green-900/20"
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedVisibleGroups[group.id]}
                          onChange={(e) =>
                            setSelectedVisibleGroups((s) => ({
                              ...s,
                              [group.id]: e.target.checked,
                            }))
                          }
                          className="accent-green-600"
                        />
                        {group.name}
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-red-600">
                  ✗ 禁止查看的分组
                </p>
                <p className="mb-2 text-xs text-gray-500">
                  选择哪些分组不可以看这篇文章
                </p>
                <div className="flex flex-wrap gap-2">
                  {friendGroups.length === 0 ? (
                    <span className="text-sm text-gray-500">暂无比好分组</span>
                  ) : (
                    friendGroups.map((group) => (
                      <label
                        key={group.id}
                        className="flex cursor-pointer items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-sm dark:border-red-700 dark:bg-red-900/20"
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedInvisibleGroups[group.id]}
                          onChange={(e) =>
                            setSelectedInvisibleGroups((s) => ({
                              ...s,
                              [group.id]: e.target.checked,
                            }))
                          }
                          className="accent-red-600"
                        />
                        {group.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={() => void save(true)}
        >
          {busy ? "保存中…" : "发布"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => router.back()}
        >
          取消
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => void save(false)}
        >
          {busy ? "保存中…" : "保存为草稿"}
        </Button>
      </div>
      </div>
    </form>
  );
}
