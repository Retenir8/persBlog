"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { outlineLinkClassName } from "@/components/ui/Button";

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VolumeGlyph({ volume }: { volume: number }) {
  const muted = volume < 0.02;
  if (muted) {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.5 9.5 19 6M5 10v4h3l4 3V7L8 10H5zm14 2a7 7 0 0 1-2.8 4.2M19 6l-4 4"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5 6 9H3v6h3l5 4V5zm5 3a5 5 0 0 1 0 8m2.5-11a9 9 0 0 1 0 14"
      />
    </svg>
  );
}

export function SongAudioPlayer({ neteaseId }: { neteaseId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volWrapRef = useRef<HTMLDivElement | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [volOpen, setVolOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/music/play-url?songId=${encodeURIComponent(neteaseId)}`,
          { credentials: "same-origin" }
        );
        const j = (await r.json()) as { url?: string | null };
        if (!cancelled) setSrc(j.url ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [neteaseId]);

  const syncFromAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    if (Number.isFinite(a.duration) && a.duration > 0) {
      setDuration(a.duration);
    }
    setPlaying(!a.paused);
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => syncFromAudio();
    const onLoaded = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };

    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("ended", onEnded);
    };
  }, [src, syncFromAudio]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!volOpen) return;
    function close(e: MouseEvent) {
      if (
        volWrapRef.current &&
        !volWrapRef.current.contains(e.target as Node)
      ) {
        setVolOpen(false);
      }
    }
    const t = window.setTimeout(() => {
      document.addEventListener("click", close);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("click", close);
    };
  }, [volOpen]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play().catch(() => {});
    } else {
      a.pause();
    }
  }

  if (loading) {
    return (
      <p className="mt-2 text-[11px] text-zinc-500">正在获取播放地址…</p>
    );
  }

  if (!src) {
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-[11px] leading-snug text-amber-800 dark:text-amber-200">
          无法解析音频地址。完整播放可配置环境变量{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            NETEASE_COOKIE
          </code>
          。
        </p>
        <a
          href={`https://music.163.com/song?id=${neteaseId}`}
          target="_blank"
          rel="noreferrer"
          className={`${outlineLinkClassName} !inline-flex w-full justify-center !py-1.5 !text-xs`}
        >
          在网易云打开
        </a>
      </div>
    );
  }

  const volPanelClass =
    volOpen ? "flex" : "hidden group-hover/vol:flex";

  return (
    <div className="mt-2">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <div className="overflow-visible rounded-xl bg-zinc-100/95 px-2.5 py-2 shadow-inner dark:bg-zinc-900/75">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900/10 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-white/20 dark:hover:bg-white"
            aria-label={playing ? "暂停" : "播放"}
          >
            {playing ? (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="ml-px h-3 w-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <span className="min-w-0 flex-1 text-center text-sm font-medium tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400">
              {fmtTime(current)}
            </span>
            <span className="mx-1 text-zinc-400 dark:text-zinc-600">/</span>
            <span>{fmtTime(duration)}</span>
          </span>

          {/* 音量面板绝对定位叠在按钮上方，不占文档流，避免撑高播放器 */}
          <div ref={volWrapRef} className="group/vol relative shrink-0">
            <div
              className={`absolute bottom-full left-1/2 z-30 mb-0 flex -translate-x-1/2 flex-col items-center ${volPanelClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex w-[3.25rem] flex-col rounded-xl border border-zinc-200 bg-white p-2 shadow-md dark:border-zinc-600 dark:bg-zinc-900">
                <div className="flex h-[5rem] w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-1 w-[4.25rem] cursor-pointer appearance-none rounded-full bg-zinc-300 accent-zinc-900 dark:bg-zinc-600 dark:accent-zinc-100 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 dark:[&::-webkit-slider-thumb]:bg-zinc-100"
                    style={{ transform: "rotate(-90deg)" }}
                    aria-label="音量"
                  />
                </div>
              </div>
              {/* 透明桥：衔接按钮与面板，悬停移入滑条不断档 */}
              <div className="h-2 w-10 shrink-0" aria-hidden />
            </div>
            <button
              type="button"
              className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/80 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
              aria-label="音量"
              aria-expanded={volOpen}
              onClick={(e) => {
                e.stopPropagation();
                setVolOpen((v) => !v);
              }}
            >
              <VolumeGlyph volume={volume} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
