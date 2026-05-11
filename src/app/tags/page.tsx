import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TagBrowseManage } from "@/components/blog/TagBrowseManage";
import { getTagsWithPostCount } from "@/lib/services/categoryTagService";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/tags");
  }

  const tags = await getTagsWithPostCount(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">我的标签</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          仅自己可见与管理；用于给自己的文章打标签。
        </p>
      </div>

      <TagBrowseManage tags={tags} canManage />
    </div>
  );
}
