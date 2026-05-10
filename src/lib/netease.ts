import type { NeteaseKind } from "@prisma/client";

export type ParsedNetease = {
  kind: NeteaseKind;
  id: string;
};

/**
 * 从网易云音乐 PC / 移动端分享链接中解析单曲或歌单 ID。
 */
export function parseNeteaseUrl(input: string): ParsedNetease | null {
  const raw = input.trim();
  if (!raw) return null;

  let urlStr = raw;
  if (!/^https?:\/\//i.test(raw)) {
    urlStr = `https://${raw}`;
  }

  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return null;
  }

  if (!u.hostname.includes("163.com")) {
    return null;
  }

  const path = u.pathname;
  const songPath = path.match(/\/song\/(\d+)/);
  if (songPath) {
    return { kind: "SONG", id: songPath[1] };
  }
  const playlistPath = path.match(/\/playlist\/(\d+)/);
  if (playlistPath) {
    return { kind: "PLAYLIST", id: playlistPath[1] };
  }

  let id = u.searchParams.get("id");
  if (!id && u.hash.includes("?")) {
    const q = u.hash.slice(u.hash.indexOf("?") + 1);
    id = new URLSearchParams(q).get("id");
  }
  if (!id || !/^\d+$/.test(id)) {
    return null;
  }

  const haystack = `${path}${u.hash}`;
  if (haystack.includes("song")) {
    return { kind: "SONG", id };
  }
  if (haystack.includes("playlist")) {
    return { kind: "PLAYLIST", id };
  }

  return null;
}

/** 网易云外链播放器 iframe src（官方 outchain player） */
export function neteasePlayerEmbedSrc(kind: NeteaseKind, neteaseId: string): string {
  const type = kind === "PLAYLIST" ? 0 : 2;
  const height = kind === "PLAYLIST" ? 330 : 86;
  return `https://music.163.com/outchain/player?type=${type}&id=${encodeURIComponent(
    neteaseId
  )}&auto=0&height=${height}`;
}
