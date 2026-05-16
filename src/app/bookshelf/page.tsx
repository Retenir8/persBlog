import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BookshelfManage } from "@/components/bookshelf/BookshelfManage";
import { listBookshelfItems } from "@/lib/services/bookshelfService";
import { PageIntro } from "@/components/layout/PageIntro";

export const metadata: Metadata = {
  title: "书架",
  description: "我的阅读书单与藏书",
};

const STATUSES: string[] = ["WANT_TO_READ", "READING", "FINISHED"];

function parseFilter(
  sp: Record<string, string | string[] | undefined>,
): "all" | string {
  const raw = typeof sp.status === "string" ? sp.status : "";
  if (raw && STATUSES.includes(raw)) {
    return raw;
  }
  return "all";
}

async function BookshelfContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/bookshelf");
  }

  const sp = await searchParams;
  const filter = parseFilter(sp);
  const items = await listBookshelfItems(session.user.id);

  const rows = items.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    coverUrl: b.coverUrl,
    note: b.note,
    status: b.status,
    rating: b.rating,
    linkUrl: b.linkUrl,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return (
    <BookshelfManage
      items={rows}
      canManage
      initialFilter={filter}
    />
  );
}

export default async function BookshelfPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="space-y-8">
      <PageIntro
        title="我的书架"
        description="收藏你喜欢的书：想读、在读与已读，配上封面与短评，像家里的书架一样慢慢填满。"
      />
      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500">加载书架…</p>
        }
      >
        <BookshelfContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}