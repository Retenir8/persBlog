"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { surfacePanelNestedClass, surfacePanelSubtleClass } from "@/lib/surfaceStyles";

export type PhotoCategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
};

export type PhotoRow = {
  id: string;
  title: string | null;
  imageUrl: string;
  categoryId: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
};

function tabClass(active: boolean) {
  return active
    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600";
}

export function PhotoGalleryManage({
  categories: initialCategories,
  photos: initialPhotos,
  canManage,
  selectedCategoryId,
}: {
  categories: PhotoCategoryRow[];
  photos: PhotoRow[];
  canManage: boolean;
  selectedCategoryId: string | null;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [photos, setPhotos] = useState(initialPhotos);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategoryId, setUploadCategoryId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [lightbox, setLightbox] = useState<PhotoRow | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  function hrefForCategory(catId: string | null) {
    if (!catId) return "/photos";
    return `/photos?category=${encodeURIComponent(catId)}`;
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/photo-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "创建分类失败");
        return;
      }
      setNewCategoryName("");
      setCategories((prev) =>
        [...prev, data].sort((a, b) =>
          a.sortOrder !== b.sortOrder
            ? a.sortOrder - b.sortOrder
            : a.name.localeCompare(b.name)
        )
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(id: string, label: string) {
    if (!confirm(`删除分类「${label}」？该分类下照片将变为未分类。`)) return;
    setError("");
    const res = await fetch(`/api/photo-categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "删除失败");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setPhotos((prev) =>
      prev.map((p) =>
        p.categoryId === id
          ? { ...p, categoryId: null, category: null }
          : p
      )
    );
    if (selectedCategoryId === id) router.push("/photos");
    router.refresh();
  }

  async function saveRename(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/photo-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "重命名失败");
        return;
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: data.name } : c))
      );
      setPhotos((prev) =>
        prev.map((p) =>
          p.categoryId === id && p.category
            ? { ...p, category: { ...p.category, name: data.name } }
            : p
        )
      );
      setEditingId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function upload() {
    if (!file) {
      setError("请选择图片");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (uploadTitle.trim()) form.append("title", uploadTitle.trim());
      form.append("categoryId", uploadCategoryId);

      const res = await fetch("/api/photos", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "上传失败");
        return;
      }
      const row: PhotoRow = {
        id: data.id,
        title: data.title,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        createdAt:
          typeof data.createdAt === "string"
            ? data.createdAt
            : new Date(data.createdAt).toISOString(),
        category: data.category,
      };
      const visible =
        selectedCategoryId === null
          ? true
          : row.categoryId === selectedCategoryId;
      if (visible) setPhotos((prev) => [row, ...prev]);
      setFile(null);
      setUploadTitle("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(id: string) {
    if (!confirm("确定删除这张照片？")) return;
    setError("");
    const res = await fetch(`/api/photos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "删除失败");
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setLightbox((cur) => (cur?.id === id ? null : cur));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className={`flex flex-wrap gap-2 p-3 ${surfacePanelSubtleClass}`}>
        <Link
          href="/photos"
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${tabClass(
            selectedCategoryId === null
          )}`}
        >
          全部
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={hrefForCategory(c.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${tabClass(
              selectedCategoryId === c.id
            )}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {canManage && (
        <>
          <div className={`space-y-4 p-4 ${surfacePanelNestedClass}`}>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              管理分类
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  新分类名称
                </span>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="例如：风光、街拍"
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void addCategory()}
                className="shrink-0 sm:self-end"
              >
                添加分类
              </Button>
            </div>
            {categories.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    {editingId === c.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="max-w-xs"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy}
                          className="!py-1 !text-xs"
                          onClick={() => void saveRename(c.id)}
                        >
                          保存
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="!py-1 !text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-zinc-800 dark:text-zinc-100">
                          {c.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="!py-1 !text-xs"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditingName(c.name);
                          }}
                        >
                          重命名
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="!py-1 !text-xs"
                          onClick={() => void removeCategory(c.id, c.name)}
                        >
                          删除
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={`space-y-4 p-4 ${surfacePanelNestedClass}`}>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              上传照片
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  选择文件
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
                  onChange={(e) =>
                    setFile(e.target.files?.[0] ?? null)
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  标题（可选）
                </span>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="简短说明"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  归类
                </span>
                <select
                  value={uploadCategoryId}
                  onChange={(e) => setUploadCategoryId(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="">未分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={busy || !file}
              className="mt-4"
              onClick={() => void upload()}
            >
              {busy ? "上传中…" : "上传"}
            </Button>
          </div>
        </>
      )}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="查看大图"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-3 top-3 z-10 rounded-lg bg-zinc-800/95 px-3 py-1.5 text-sm font-medium text-white shadow-lg hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
          >
            关闭
          </button>
          <div
            className="flex max-h-full max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.imageUrl}
              alt={lightbox.title || "照片"}
              className="max-h-[min(85vh,calc(100dvh-8rem))] max-w-full cursor-default select-none object-contain"
            />
            <div className="mt-3 max-w-[min(90vw,48rem)] text-center text-sm text-zinc-200">
              <p className="font-medium">
                {lightbox.title?.trim() || "无标题"}
              </p>
              {lightbox.category ? (
                <p className="mt-1 text-zinc-400">{lightbox.category.name}</p>
              ) : (
                <p className="mt-1 text-zinc-500">未分类</p>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              按 Esc 或点击空白处关闭
            </p>
          </div>
        </div>
      ) : null}

      {photos.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          {canManage
            ? "暂无照片，上传后即可在此展示。"
            : "暂无照片，登录后可上传并管理分类。"}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <li
              key={p.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
                <button
                  type="button"
                  className="absolute inset-0 block h-full w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 text-left"
                  onClick={() => setLightbox(p)}
                  aria-label={`放大查看：${p.title?.trim() || "照片"}`}
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="pointer-events-none h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
                {canManage && (
                  <Button
                    type="button"
                    variant="danger"
                    className="pointer-events-auto absolute right-2 top-2 z-[1] !py-1.5 !text-xs opacity-0 shadow-md transition group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      void removePhoto(p.id);
                    }}
                  >
                    删除
                  </Button>
                )}
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-xs font-medium text-zinc-900 dark:text-zinc-50">
                  {p.title?.trim() || "无标题"}
                </p>
                {p.category ? (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {p.category.name}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-zinc-400">未分类</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
