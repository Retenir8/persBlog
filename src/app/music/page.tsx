import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MusicBrowseManage } from "@/components/music/MusicBrowseManage";
import { listMusicItemsEnsuringMeta } from "@/lib/services/musicService";
import { PageIntro } from "@/components/layout/PageIntro";

export const metadata: Metadata = {
  title: "音乐",
  description: "我的网易云音乐列表",
};

export default async function MusicPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/music");
  }

  const items = await listMusicItemsEnsuringMeta(session.user.id);

  const rows = items.map((m) => ({
    id: m.id,
    neteaseId: m.neteaseId,
    kind: m.kind.toLowerCase() as "song" | "playlist",
    note: m.note,
    coverUrl: m.coverUrl,
    trackTitle: m.trackTitle,
    artistName: m.artistName,
    sortOrder: m.sortOrder,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <PageIntro
        title="我的音乐"
        description="仅自己可见与管理；单曲通过接口解析播放。"
      />

      <MusicBrowseManage items={rows} canManage />
    </div>
  );
}
