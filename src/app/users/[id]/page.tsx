import Link from "next/link";
import { getUserWithPosts } from "@/lib/services/userService";
import { auth } from "@/lib/auth";
import { ProfileEditorClient } from "./ProfileEditorClient";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = await getUserWithPosts(id);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">用户不存在</h1>
        <p className="mt-2 text-zinc-500">该用户不存在或已删除</p>
      </div>
    );
  }

  const isOwner = session?.user?.id === id;

  return (
    <ProfileEditorClient 
      user={user} 
      isOwner={isOwner} 
    />
  );
}
