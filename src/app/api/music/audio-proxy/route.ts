import { NextResponse } from "next/server";

function isAllowedAudioHost(hostname: string): boolean {
  return (
    hostname.endsWith(".126.net") ||
    hostname.endsWith("music.126.net") ||
    hostname.endsWith("163.com")
  );
}

/**
 * 仅允许网易云 CDN 域名，将 HTTP 音频流代理为同源请求（解决 HTTPS 博客播放 HTTP 链接问题）。
 */
export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "missing src" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "bad protocol" }, { status: 400 });
  }

  if (!isAllowedAudioHost(parsed.hostname)) {
    return NextResponse.json({ error: "forbidden host" }, { status: 403 });
  }

  try {
    const upstream = await fetch(src, {
      headers: {
        Referer: "https://music.163.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream failed" }, { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "proxy failed" }, { status: 502 });
  }
}
