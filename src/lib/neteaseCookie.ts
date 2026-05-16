/**
 * NetEase request cookie: prefer NETEASE_COOKIE env (browser session after login),
 * else anonymous register session (may still be preview-only for some tracks).
 */
let anonCache: { cookie: string; until: number } | null = null;

const ANON_TTL_MS = 40 * 60 * 1000;

export async function getNeteaseRequestCookie(): Promise<string | undefined> {
  const fromEnv = process.env.NETEASE_COOKIE?.trim();
  if (fromEnv) return fromEnv;

  const now = Date.now();
  if (anonCache && anonCache.until > now) {
    return anonCache.cookie;
  }

  type AnonReg = () => Promise<{ body?: { code?: number; cookie?: string } }>;
  const ncm = (await import("NeteaseCloudMusicApi")) as unknown as {
    register_anonimous: AnonReg;
  };
  const reg = await ncm.register_anonimous();
  const code = (reg.body as { code?: number })?.code;
  const cookie = (reg.body as { cookie?: string })?.cookie;
  if (code !== 200 || !cookie) {
    return undefined;
  }

  anonCache = { cookie, until: now + ANON_TTL_MS };
  return cookie;
}
