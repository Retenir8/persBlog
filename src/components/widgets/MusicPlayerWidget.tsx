"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { TRIO_WIDGET_MIN_HEIGHT_CLASS } from "@/lib/widgets/trioWidgetLayout";

type MusicRow = {
  id: string;
  kind: "SONG" | "PLAYLIST";
  neteaseId: string;
  trackTitle?: string | null;
  artistName?: string | null;
  note?: string | null;
};

export function MusicPlayerWidget({ compact }: { compact?: boolean }) {
  const [items, setItems] = useState<MusicRow[] | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/music");
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled) setItems([]);
            return;
          }
          throw new Error("load");
        }
        const data = (await res.json()) as MusicRow[];
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setItems([]);
          setLoadErr("加载失败");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstSong = items?.find((i) => i.kind === "SONG");

  useEffect(() => {
    if (!firstSong) {
      setPlayUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/music/play-url?songId=${encodeURIComponent(firstSong.neteaseId)}`
        );
        const body = (await res.json()) as { url?: string | null };
        const u = typeof body.url === "string" && body.url.length > 0 ? body.url : null;
        if (!cancelled) setPlayUrl(u);
      } catch {
        if (!cancelled) setPlayUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firstSong?.neteaseId, firstSong]);

  const shell = (children: ReactNode) => {
    const base =
      "rounded-xl border border-zinc-900 bg-white text-zinc-900 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-50";
    if (compact) {
      return (
        <div
          className={`${base} flex w-full min-w-0 flex-col justify-between p-2 sm:p-3 ${TRIO_WIDGET_MIN_HEIGHT_CLASS}`}
        >
          {children}
        </div>
      );
    }
    return <div className={`${base} p-3`}>{children}</div>;
  };

  if (items === null) {
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center text-center text-xs text-zinc-500 dark:text-zinc-400">
        加载中…
      </div>
    );
  }

  if (items.length === 0) {
    return shell(
      <>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p
            className={`text-zinc-600 dark:text-zinc-400 ${compact ? "text-[10px] leading-snug" : "text-xs"}`}
          >
            还没有收藏单曲，去音乐页添加网易云链接吧。
          </p>
        </div>
        <Link
          href="/music"
          className="block shrink-0 text-center text-xs font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          打开音乐
        </Link>
      </>
    );
  }

  if (!firstSong) {
    return shell(
      <>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className={`text-zinc-600 dark:text-zinc-400 ${compact ? "text-[10px]" : "text-xs"}`}>
            列表中暂无单曲（仅有歌单时无法在此播放）。请先在音乐页添加单曲。
          </p>
        </div>
        <Link
          href="/music"
          className="block shrink-0 text-center text-xs font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          管理音乐
        </Link>
      </>
    );
  }

  const title = firstSong.trackTitle || firstSong.note || "未命名";
  const sub = firstSong.artistName || "";

  return shell(
    <>
      <div className="shrink-0">
        <p className={`font-medium leading-tight ${compact ? "text-[11px]" : "text-sm"}`}>{title}</p>
        {sub ? (
          <p className={`mt-0.5 text-zinc-500 dark:text-zinc-400 ${compact ? "text-[10px]" : "text-xs"}`}>
            {sub}
          </p>
        ) : null}
        {loadErr ? <p className="mt-1 text-[10px] text-red-600">{loadErr}</p> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {playUrl ? (
          <audio className="h-7 w-full" controls preload="none" src={playUrl}>
            你的浏览器不支持音频播放。
          </audio>
        ) : (
          <p className="text-[10px] text-zinc-500">暂无法获取播放地址（版权或网络原因）。</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <Link href="/music" className="text-[10px] font-medium text-zinc-900 underline dark:text-zinc-100">
          更多音乐
        </Link>
      </div>
    </>
  );
}
