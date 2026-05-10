import type { NeteaseKind } from "@prisma/client";

export type NeteaseDisplayMeta = {
  coverUrl: string | null;
  trackTitle: string | null;
  artistName: string | null;
};

/**
 * 使用 NeteaseCloudMusicApi 拉取单曲 / 歌单的封面与标题（仅在服务端调用）。
 */
export async function fetchNeteaseDisplayMeta(
  kind: NeteaseKind,
  neteaseId: string
): Promise<NeteaseDisplayMeta> {
  const api = await import("NeteaseCloudMusicApi");

  if (kind === "SONG") {
    const res = await api.song_detail({ ids: neteaseId });
    const song = res.body?.songs?.[0];
    if (!song) {
      return { coverUrl: null, trackTitle: null, artistName: null };
    }
    const artists = Array.isArray(song.ar)
      ? song.ar.map((a: { name?: string }) => a?.name).filter(Boolean)
      : [];
    return {
      coverUrl: song.al?.picUrl ?? null,
      trackTitle: song.name ?? null,
      artistName: artists.length ? artists.join(" / ") : null,
    };
  }

  const res = await api.playlist_detail({ id: neteaseId });
  const pl = res.body?.playlist as
    | {
        name?: string;
        coverImgUrl?: string;
        trackCount?: number;
        trackIds?: unknown[];
      }
    | undefined;
  if (!pl) {
    return { coverUrl: null, trackTitle: null, artistName: null };
  }
  const count =
    typeof pl.trackCount === "number"
      ? pl.trackCount
      : Array.isArray(pl.trackIds)
        ? pl.trackIds.length
        : 0;
  return {
    coverUrl: pl.coverImgUrl ?? null,
    trackTitle: pl.name ?? null,
    artistName: count ? `${count} 首歌曲` : "歌单",
  };
}
