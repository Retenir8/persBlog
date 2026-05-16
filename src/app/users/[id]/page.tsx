import { getUserWithPosts } from "@/lib/services/userService";
import { getRelationStatus } from "@/lib/services/followService";
import type { RelationStatus } from "@/lib/services/followService";
import { auth } from "@/lib/auth";
import { ProfileEditorClient } from "./ProfileEditorClient";
import { ProfileVisitorActions } from "@/components/social/ProfileVisitorActions";
import { GuestbookSection } from "@/components/guestbook/GuestbookSection";
import type { GuestbookEntryDTO } from "@/components/guestbook/GuestbookSection";
import { listGuestbookForHost } from "@/lib/services/guestbookService";
import { PageIntro } from "@/components/layout/PageIntro";

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
      <div className="mx-auto max-w-lg py-12">
        <PageIntro
          title="用户不存在"
          description="该用户不存在或已删除"
        />
      </div>
    );
  }

  const isOwner = session?.user?.id === id;

  let visitorRelation: RelationStatus | null = null;
  if (session?.user?.id && !isOwner) {
    const relation = await getRelationStatus(session.user.id, id);
    visitorRelation = relation.status;
  }

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
      {visitorRelation !== null && (
        <div className="flex justify-center pb-2">
          <ProfileVisitorActions targetUserId={id} initialStatus={visitorRelation} />
        </div>
      )}
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
