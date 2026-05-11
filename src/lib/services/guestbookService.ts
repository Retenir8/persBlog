import { prisma } from "../db";

const MAX_LEN = 2000;

export async function listGuestbookForHost(hostUserId: string) {
  const host = await prisma.user.findUnique({ where: { id: hostUserId } });
  if (!host) return null;

  const entries = await prisma.guestbookEntry.findMany({
    where: { hostUserId },
    include: {
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return entries;
}

export async function listRecentGuestbookWall(take = 80) {
  return prisma.guestbookEntry.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: {
      host: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
    },
  });
}

export async function createGuestbookEntry(params: {
  hostUserId: string;
  content: string;
  authorUserId?: string | null;
  guestName?: string | null;
}) {
  const trimmed = params.content.trim();
  if (!trimmed) throw new Error("留言内容不能为空");
  if (trimmed.length > MAX_LEN) throw new Error(`留言过长（最多 ${MAX_LEN} 字）`);

  const host = await prisma.user.findUnique({ where: { id: params.hostUserId } });
  if (!host) throw new Error("用户不存在");

  const uid = params.authorUserId ?? null;
  if (uid && uid === params.hostUserId) {
    throw new Error("不能在自己的主页留言");
  }

  const guestNeedsName = !uid && !params.guestName?.trim();
  if (guestNeedsName) throw new Error("请填写昵称");

  return prisma.guestbookEntry.create({
    data: {
      content: trimmed,
      hostUserId: params.hostUserId,
      authorUserId: uid,
      guestName: uid ? null : params.guestName?.trim() ?? null,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });
}

export async function deleteGuestbookEntry(
  entryId: string,
  currentUserId: string,
  currentUserRole: string
) {
  const entry = await prisma.guestbookEntry.findUnique({
    where: { id: entryId },
    select: {
      hostUserId: true,
      authorUserId: true,
    },
  });
  if (!entry) throw new Error("Not found");

  const isHost = entry.hostUserId === currentUserId;
  const isAuthor =
    entry.authorUserId != null && entry.authorUserId === currentUserId;
  if (!isHost && !isAuthor && currentUserRole !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await prisma.guestbookEntry.delete({ where: { id: entryId } });
}
