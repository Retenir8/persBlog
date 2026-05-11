import Link from "next/link";
import { getUserWithPosts } from "@/lib/services/userService";
import { auth } from "@/lib/auth";
import { ProfileEditorClient } from "./ProfileEditorClient";

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

  return (
    <ProfileEditorClient
      user={user}
      isOwner={isOwner}
      initialEditing={wantEdit && isOwner}
    />
  );
}
