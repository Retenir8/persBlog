"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { bookCoverDisplaySrc } from "@/lib/bookCover";
import {
  BOOK_STATUS_LABELS,
  BOOK_STATUS_ORDER,
  bookCoverFallbackStyle,
  bookStatusBadgeClass,
} from "@/lib/bookshelf";
import { Button, outlineLinkClassName } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { surfacePanelClass } from "@/lib/surfaceStyles";

export type BookshelfItemRow = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  note: string | null;
  status: string;
  rating: number | null;
  linkUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type FilterKey = "all" | string;

function tabClass(active: boolean) {
  return active
    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600";
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number | null;
  onChange?: (n: number | null) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="评分">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          className={`text-sm leading-none transition ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } ${value != null && n <= value ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"}`}
          onClick={() => onChange?.(value === n ? null : n)}
          aria-label={`${n} 星`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function BookCover({
  title,
  coverUrl,
}: {
  title: string;
  coverUrl: string | null;
}) {
  const [broken, setBroken] = useState(false);
  const displaySrc = bookCoverDisplaySrc(coverUrl);
  const show = displaySrc && !broken;

  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-lg">
      {show ? (
        <img
          key={displaySrc}
          src={displaySrc}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center px-3 py-4 text-center"
          style={bookCoverFallbackStyle(title)}
        >
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/70">
            BOOK
          </span>
          <span className="mt-2 line-clamp-4 text-sm font-semibold leading-snug text-white drop-shadow-sm">
            {title}
          </span>
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/35 to-transparent"
        aria-hidden
      />
    </div>
  );
}

function BookCard({
  item,
  canManage,
  onStatusChange,
  onRemove,
}: {
  item: BookshelfItemRow;
  canManage: boolean;
  onStatusChange: (id: string, status: string) => void;
  onRemove: (id: string, title: string) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[var(--shadow-surface)] transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950">
      <BookCover title={item.title} coverUrl={item.coverUrl} />

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${bookStatusBadgeClass(item.status)}`}
          >
            {BOOK_STATUS_LABELS[item.status]}
          </span>
          {canManage ? (
            <button
              type="button"
              className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] text-red-600 opacity-0 transition hover:bg-red-50 group-hover:opacity-100 dark:text-red-400 dark:hover:bg-red-950/50"
              onClick={() => onRemove(item.id, item.title)}
            >
              移除
            </button>
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {item.title}
        </h3>
        {item.author ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
            {item.author}
          </p>
        ) : null}

        {item.rating != null ? (
          <div className="mt-2">
            <StarRating value={item.rating} readonly />
          </div>
        ) : null}

        {item.note ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {item.note}
          </p>
        ) : null}

        {canManage ? (
          <label className="mt-3 block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            阅读状态
            <select
              value={item.status}
              onChange={(e) =>
                onStatusChange(item.id, e.target.value)
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {BOOK_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {BOOK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {item.linkUrl ? (
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noreferrer"
            className={`${outlineLinkClassName} mt-3 !inline-flex w-full justify-center !py-1.5 text-xs`}
          >
            查看详情
          </a>
        ) : null}
      </div>
    </article>
  );
}

function ShelfRow({ children }: { children: ReactNode }) {
  return (
    <div className="relative pb-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3 rounded-sm bg-gradient-to-b from-amber-900/20 via-amber-950/35 to-amber-950/50 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] dark:from-amber-950/40 dark:via-zinc-900 dark:to-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-px inset-x-2 h-px bg-amber-800/30 dark:bg-amber-700/20"
        aria-hidden
      />
    </div>
  );
}

export function BookshelfManage({
  items,
  canManage,
  initialFilter,
}: {
  items: BookshelfItemRow[];
  canManage: boolean;
  initialFilter: FilterKey;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get("status") as FilterKey) || initialFilter;

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [status, setStatus] = useState<string>("WANT_TO_READ");
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const shelfChunks = useMemo(() => {
    const size = 4;
    const chunks: BookshelfItemRow[][] = [];
    for (let i = 0; i < filtered.length; i += size) {
      chunks.push(filtered.slice(i, i + size));
    }
    return chunks;
  }, [filtered]);

  async function add() {
    const t = title.trim();
    if (!t) {
      setError("请填写书名");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/bookshelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          author: author.trim() || undefined,
          coverUrl: coverUrl.trim() || undefined,
          note: note.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          status,
          rating,
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "添加失败");
        return;
      }
      setTitle("");
      setAuthor("");
      setCoverUrl("");
      setNote("");
      setLinkUrl("");
      setStatus("WANT_TO_READ");
      setRating(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: string, next: string) {
    const res = await fetch(`/api/bookshelf/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "更新失败");
      return;
    }
    router.refresh();
  }

  async function remove(id: string, label: string) {
    if (!confirm(`确定从书架移除「${label}」？`)) return;
    setError("");
    const res = await fetch(`/api/bookshelf/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "删除失败");
      return;
    }
    router.refresh();
  }

  const tabs: { key: FilterKey; label: string }[] = [
    { key: "all", label: "全部" },
    ...BOOK_STATUS_ORDER.map((s) => ({
      key: s as FilterKey,
      label: BOOK_STATUS_LABELS[s],
    })),
  ];

  return (
    <div className="space-y-8">
      {canManage ? (
        <div className={`space-y-4 p-4 sm:p-5 ${surfacePanelClass}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              📚
            </span>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              放上新书
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                书名 <span className="text-red-500">*</span>
              </span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：三体"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                作者
              </span>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="可选"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                封面图片链接
              </span>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://img…/cover.jpg（图片直链，非书籍网页）"
              />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                豆瓣等站点需使用封面图片地址；若仍不显示，请右键封面图「复制图片地址」后粘贴。
              </span>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                短评 / 读书笔记
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="一两句感想，可选"
                className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                阅读状态
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {BOOK_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {BOOK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                评分
              </span>
              <StarRating value={rating} onChange={setRating} />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                外链（豆瓣 / 购书页等）
              </span>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://book.douban.com/… 可选"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void add()}
            >
              {busy ? "添加中…" : "放进书架"}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={
              t.key === "all" ? "/bookshelf" : `/bookshelf?status=${t.key}`
            }
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${tabClass(filter === t.key)}`}
          >
            {t.label}
            {t.key === "all" ? (
              <span className="ml-1 opacity-70">({items.length})</span>
            ) : (
              <span className="ml-1 opacity-70">
                ({items.filter((i) => i.status === t.key).length})
              </span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className={`px-6 py-16 text-center ${surfacePanelClass}`}
        >
          <p className="text-4xl" aria-hidden>
            📖
          </p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {items.length === 0
              ? canManage
                ? "书架还空着，在上方添加第一本喜欢的书吧。"
                : "暂无藏书。"
              : "当前筛选下没有书籍，试试其他标签。"}
          </p>
        </div>
      ) : (
        <div
          className={`space-y-10 rounded-2xl border border-amber-900/10 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 p-4 sm:p-6 dark:border-amber-900/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-amber-950/20`}
        >
          {shelfChunks.map((chunk, rowIndex) => (
            <ShelfRow key={rowIndex}>
              {chunk.map((item) => (
                <BookCard
                  key={item.id}
                  item={item}
                  canManage={canManage}
                  onStatusChange={(id, s) => void changeStatus(id, s)}
                  onRemove={(id, label) => void remove(id, label)}
                />
              ))}
            </ShelfRow>
          ))}
        </div>
      )}
    </div>
  );
}