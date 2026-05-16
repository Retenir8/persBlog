import type { BookStatus, BookshelfItem } from "@/generated/prisma";
import { normalizeCoverUrl } from "@/lib/bookCover";
import { prisma } from "@/lib/db";

export async function listBookshelfItems(
  userId: string,
  status?: BookStatus,
): Promise<BookshelfItem[]> {
  return prisma.bookshelfItem.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
}

export async function createBookshelfItem(
  userId: string,
  data: {
    title: string;
    author?: string | null;
    coverUrl?: string | null;
    note?: string | null;
    status?: BookStatus;
    rating?: number | null;
    linkUrl?: string | null;
  },
): Promise<BookshelfItem> {
  const title = data.title.trim();
  if (!title) throw new Error("请填写书名");

  if (data.rating != null) {
    const r = data.rating;
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      throw new Error("评分需在 1～5 之间");
    }
  }

  const linkUrl = data.linkUrl?.trim() || null;
  if (linkUrl) {
    try {
      const u = new URL(linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`);
      if (!["http:", "https:"].includes(u.protocol)) {
        throw new Error("无效链接");
      }
    } catch {
      throw new Error("外链格式无效");
    }
  }

  let coverUrl: string | null = null;
  if (data.coverUrl != null && data.coverUrl.trim()) {
    coverUrl = normalizeCoverUrl(data.coverUrl);
  }

  return prisma.bookshelfItem.create({
    data: {
      userId,
      title,
      author: data.author?.trim() || null,
      coverUrl,
      note: data.note?.trim() || null,
      status: data.status ?? "WANT_TO_READ",
      rating: data.rating ?? null,
      linkUrl: linkUrl
        ? linkUrl.startsWith("http")
          ? linkUrl
          : `https://${linkUrl}`
        : null,
    },
  });
}

export async function updateBookshelfItem(
  id: string,
  userId: string,
  data: Partial<{
    title: string;
    author: string | null;
    coverUrl: string | null;
    note: string | null;
    status: BookStatus;
    rating: number | null;
    linkUrl: string | null;
  }>,
): Promise<BookshelfItem> {
  const row = await prisma.bookshelfItem.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");

  const patch: Parameters<typeof prisma.bookshelfItem.update>[0]["data"] = {};

  if (data.title !== undefined) {
    const title = data.title.trim();
    if (!title) throw new Error("请填写书名");
    patch.title = title;
  }
  if (data.author !== undefined) patch.author = data.author?.trim() || null;
  if (data.coverUrl !== undefined) {
    patch.coverUrl =
      data.coverUrl == null || !data.coverUrl.trim()
        ? null
        : normalizeCoverUrl(data.coverUrl);
  }
  if (data.note !== undefined) patch.note = data.note?.trim() || null;
  if (data.status !== undefined) patch.status = data.status;
  if (data.rating !== undefined) {
    if (data.rating === null) {
      patch.rating = null;
    } else if (
      Number.isInteger(data.rating) &&
      data.rating >= 1 &&
      data.rating <= 5
    ) {
      patch.rating = data.rating;
    } else {
      throw new Error("评分需在 1～5 之间");
    }
  }
  if (data.linkUrl !== undefined) {
    const linkUrl = data.linkUrl?.trim() || null;
    if (linkUrl) {
      try {
        const u = new URL(
          linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`,
        );
        if (!["http:", "https:"].includes(u.protocol)) {
          throw new Error("无效链接");
        }
        patch.linkUrl = u.href;
      } catch {
        throw new Error("外链格式无效");
      }
    } else {
      patch.linkUrl = null;
    }
  }

  return prisma.bookshelfItem.update({ where: { id }, data: patch });
}

export async function deleteBookshelfItem(
  id: string,
  userId: string,
): Promise<void> {
  const row = await prisma.bookshelfItem.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");
  await prisma.bookshelfItem.delete({ where: { id } });
}
