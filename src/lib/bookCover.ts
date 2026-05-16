/** 规范化用户输入的封面图 URL */
export function normalizeCoverUrl(input: string | null | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  let url = raw;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("invalid");
    }
    return u.href;
  } catch {
    throw new Error("封面链接格式无效，请粘贴以 http:// 或 https:// 开头的图片地址");
  }
}

/** 书架卡片展示用：外链走同源代理，避免防盗链导致不显示 */
export function bookCoverDisplaySrc(storedUrl: string | null): string | null {
  if (!storedUrl) return null;
  if (storedUrl.startsWith("/")) return storedUrl;
  return `/api/bookshelf/coverProxy?src=${encodeURIComponent(storedUrl)}`;
}
