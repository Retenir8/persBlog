import { NextResponse } from "next/server";
import { getNeteaseRequestCookie } from "@/lib/neteaseCookie";

/** Rewrite HTTP CDN URLs to same-origin proxy for HTTPS pages (mixed content). */
function clientPlayableSrc(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("https:")) return raw;
  if (raw.startsWith("http:")) {
    return `/api/music/audioProxy?src=${encodeURIComponent(raw)}`;
  }
  return raw;
}

function pickUrlFromSongUrlBody(body: unknown): string | null {
  const row = (body as { data?: Array<{ url?: string | null }> })?.data?.[0];
  const url = row?.url;
  return typeof url === "string" && url.length > 0 ? url : null;
}

export async function GET(req: Request) {
  const songId = new URL(req.url).searchParams.get("songId");
  if (!songId || !/^\d+$/.test(songId)) {
    return NextResponse.json({ error: "无效的歌曲 ID" }, { status: 400 });
  }

  try {
    type Ncm = {
      song_url_v1: (p: {
        id: string;
        level: string;
        cookie?: string;
      }) => Promise<{ body: unknown }>;
      song_url: (p: {
        id: string;
        br: number;
        cookie?: string;
      }) => Promise<{ body: unknown }>;
    };
    const ncm = (await import(
      "NeteaseCloudMusicApi"
    )) as unknown as Ncm;
    const cookie = await getNeteaseRequestCookie();

    const opts = cookie ? { cookie } : {};

    const v1 = await ncm.song_url_v1({
      id: songId,
      level: "standard",
      ...opts,
    });
    let rawUrl = pickUrlFromSongUrlBody(v1.body);
    if (!rawUrl) {
      const legacy = await ncm.song_url({
        id: songId,
        br: 320000,
        ...opts,
      });
      rawUrl = pickUrlFromSongUrlBody(legacy.body);
    }

    const url = clientPlayableSrc(rawUrl);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null }, { status: 200 });
  }
}
