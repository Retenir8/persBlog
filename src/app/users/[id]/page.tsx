import { getUserWithPosts } from "@/lib/services/userService";
import { auth } from "@/lib/auth";
import { ProfileEditorClient } from "./ProfileEditorClient";
import { GuestbookSection } from "@/components/guestbook/GuestbookSection";
import type { GuestbookEntryDTO } from "@/components/guestbook/GuestbookSection";
import { listGuestbookForHost } from "@/lib/services/guestbookService";

function firstSearchParam(
  v: string | string[] | undefined
): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const editRaw = firstSearchParam(sp.edit);
  const wantEdit = editRaw === "1" || editRaw === "true";

  const session = await auth();
  const user = await getUserWithPosts(id);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold tracking-tight">用户不存在</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          该用户不存在或已删除
        </p>
      </div>
    );
  }

  const isOwner = session?.user?.id === id;

  const gbRaw = await listGuestbookForHost(id);
  const guestbookInitial: GuestbookEntryDTO[] = (gbRaw ?? []).map((e) => ({
    id: e.id,
    content: e.content,
    guestName: e.guestName,
    authorUserId: e.authorUserId,
    author: e.author,
    createdAt:
      e.createdAt instanceof Date
        ? e.createdAt.toISOString()
        : String(e.createdAt),
  }));

  return (
    <div className="space-y-0">
      <ProfileEditorClient
        user={user}
        isOwner={isOwner}
        initialEditing={wantEdit && isOwner}
      />
      <GuestbookSection
        hostUserId={id}
        hostDisplayName={user.name}
        initialEntries={guestbookInitial}
      />
    </div>
  );
}
