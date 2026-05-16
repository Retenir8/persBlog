"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NeteaseKind } from "@/generated/prisma";
import { SongAudioPlayer } from "@/components/music/SongAudioPlayer";
import { Button, outlineLinkClassName } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { neteasePlayerEmbedSrc, neteaseWebUrl } from "@/lib/netease";
import { surfacePanelClass } from "@/lib/surfaceStyles";

export type MusicItemRow = {
  id: string;
  neteaseId: string;
  kind: NeteaseKind;
  note: string | null;
  coverUrl: string | null;
  trackTitle: string | null;
  artistName: string | null;
  sortOrder: number;
  createdAt: string;
};

function CoverBlock({
  coverUrl,
  alt,
}: {
  coverUrl: string | null;
  alt: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImg = coverUrl && !broken;

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      {showImg ? (
        <img
          src={coverUrl}
          alt={alt}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex h-full min-h-[140px] w-full items-center justify-center bg-gradient-to-br from-violet-200/80 via-zinc-100 to-cyan-200/60 text-5xl text-zinc-400 dark:from-violet-950/50 dark:via-zinc-900 dark:to-cyan-950/40 dark:text-zinc-600">
          ♪
        </div>
      )}
    </div>
  );
}

export function MusicBrowseManage({
  items,
  canManage,
}: {
  items: MusicItemRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [songName, setSongName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const u = url.trim();
    const name = songName.trim();
    if (!u) return;
    if (!name) {
      setError("请填写歌名");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: u,
          note: name,
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "添加失败");
        return;
      }
      setUrl("");
      setSongName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`确定从列表移除「${label}」？`)) return;
    setError("");
    const res = await fetch(`/api/music/${id}`, {
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

  return (
    <div className="space-y-8">
      {canManage && (
        <div className={`space-y-4 p-4 ${surfacePanelClass}`}>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            添加网易云音乐
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                链接
              </span>
              <div className="relative min-w-0">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://music.163.com/song?id=…"
                  className="pr-[9.5rem]"
                  aria-describedby="netease-url-hint"
                />
                <span
                  id="netease-url-hint"
                  className="pointer-events-none absolute inset-y-0 right-2 flex items-center whitespace-nowrap text-xs text-zinc-400 select-none dark:text-zinc-500"
                >
                  仅网页版链接可用
                </span>
              </div>
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                歌名
              </span>
              <Input
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                placeholder="列表与卡片上显示的名称"
                required
                aria-required
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void add()}
              className="shrink-0 sm:self-end"
            >
              {busy ? "添加中…" : "添加"}
            </Button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      )}

      {items.length === 0 ? (
        <div
          className={`px-6 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400 ${surfacePanelClass}`}
        >
          {canManage
            ? "还没有添加音乐，在上方粘贴网易云链接即可。"
            : "暂无音乐，登录后可添加。"}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => {
            const displayTitle =
              item.note?.trim() ||
              item.trackTitle?.trim() ||
              (item.kind === "PLAYLIST" ? "歌单" : "单曲") +
                ` · ${item.neteaseId}`;
            const subtitle =
              item.artistName?.trim() ||
              (item.kind === "PLAYLIST" ? "网易云歌单" : "网易云音乐");

            const embedSrc = neteasePlayerEmbedSrc(item.kind, item.neteaseId);
            const neteaseHref = neteaseWebUrl(item.kind, item.neteaseId);
            const playlistIframeHeight = 200;

            return (
              <li
                key={item.id}
                className="flex flex-col overflow-visible rounded-2xl border border-zinc-200/70 bg-white shadow-[var(--shadow-surface)] dark:border-zinc-800/70 dark:bg-zinc-950"
              >
                <div className="relative">
                  <CoverBlock
                    coverUrl={item.coverUrl}
                    alt={displayTitle}
                  />
                  {canManage && (
                    <Button
                      type="button"
                      variant="danger"
                      className="absolute right-2 top-2 !py-1.5 !text-xs opacity-95 shadow-md"
                      onClick={() =>
                        void remove(item.id, displayTitle)
                      }
                    >
                      移除
                    </Button>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                    {displayTitle}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {subtitle}
                  </p>

                  {item.kind === "SONG" ? (
                    <SongAudioPlayer neteaseId={item.neteaseId} />
                  ) : (
                    <div className="mt-2 max-h-[200px] overflow-hidden rounded-lg bg-zinc-50 dark:bg-zinc-900/80">
                      <iframe
                        title={displayTitle}
                        src={embedSrc}
                        width="100%"
                        height={playlistIframeHeight}
                        className="h-[200px] w-full border-0"
                        allow="encrypted-media; autoplay"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}

                  <a
                    href={neteaseHref}
                    target="_blank"
                    rel="noreferrer"
                    className={`${outlineLinkClassName} mt-2 !inline-flex w-full justify-center text-xs`}
                  >
                    用网易云打开
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
