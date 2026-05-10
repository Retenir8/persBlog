import type { MusicItem } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fetchNeteaseDisplayMeta } from "@/lib/neteaseMeta";
import { parseNeteaseUrl } from "@/lib/netease";

export async function listMusicItems(): Promise<MusicItem[]> {
  return prisma.musicItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

/** 为缺少封面或标题的旧数据补全元数据（仅服务端调用） */
export async function listMusicItemsEnsuringMeta(): Promise<MusicItem[]> {
  const items = await listMusicItems();
  for (const item of items) {
    if (item.coverUrl && item.trackTitle) continue;
    const meta = await fetchNeteaseDisplayMeta(item.kind, item.neteaseId);
    await prisma.musicItem.update({
      where: { id: item.id },
      data: {
        coverUrl: item.coverUrl ?? meta.coverUrl,
        trackTitle: item.trackTitle ?? meta.trackTitle,
        artistName: item.artistName ?? meta.artistName,
      },
    });
  }
  return listMusicItems();
}

export async function createMusicItemFromUrl(
  url: string,
  note: string
): Promise<MusicItem> {
  const parsed = parseNeteaseUrl(url);
  if (!parsed) {
    throw new Error("无法识别网易云链接，请粘贴单曲或歌单页面链接");
  }

  const trimmedNote = note.trim();
  if (!trimmedNote) {
    throw new Error("请填写歌名");
  }

  const meta = await fetchNeteaseDisplayMeta(parsed.kind, parsed.id);

  return prisma.musicItem.create({
    data: {
      neteaseId: parsed.id,
      kind: parsed.kind,
      note: trimmedNote,
      coverUrl: meta.coverUrl,
      trackTitle: meta.trackTitle,
      artistName: meta.artistName,
    },
  });
}

export async function deleteMusicItem(id: string): Promise<void> {
  await prisma.musicItem.delete({
    where: { id },
  });
}
