import { NextResponse } from "next/server";

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "127.0.0.1" || h.startsWith("127.")) return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  if (h === "::1" || h.includes(":")) return true;
  return false;
}

function upstreamHeaders(url: URL): HeadersInit {
  const host = url.hostname.toLowerCase();
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  if (host.includes("doubanio.com") || host.includes("douban.com")) {
    return {
      Referer: "https://book.douban.com/",
      "User-Agent": ua,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    };
  }

  return {
    "User-Agent": ua,
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  };
}

/** 代理书籍封面图，绕过常见 CDN 防盗链 */
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

  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "forbidden host" }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.href, {
      headers: upstreamHeaders(parsed),
      redirect: "follow",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("Content-Type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "not an image" },
        { status: 400 },
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "proxy failed" }, { status: 502 });
  }
}
