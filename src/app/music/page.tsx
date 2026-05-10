import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { MusicBrowseManage } from "@/components/music/MusicBrowseManage";
import { listMusicItemsEnsuringMeta } from "@/lib/services/musicService";

export const metadata: Metadata = {
  title: "音乐",
  description: "网易云音乐播放列表",
};

export default async function MusicPage() {
  const [items, session] = await Promise.all([
    listMusicItemsEnsuringMeta(),
    auth(),
  ]);

  const rows = items.map((m) => ({
    id: m.id,
    neteaseId: m.neteaseId,
    kind: m.kind,
    note: m.note,
    coverUrl: m.coverUrl,
    trackTitle: m.trackTitle,
    artistName: m.artistName,
    sortOrder: m.sortOrder,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">音乐</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          单曲通过接口解析播放：匿名会话对部分歌曲可能仍为试听。
        </p>
      </div>

      <MusicBrowseManage items={rows} canManage={!!session?.user} />
    </div>
  );
}
