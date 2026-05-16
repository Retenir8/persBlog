import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TagBrowseManage } from "@/components/blog/TagBrowseManage";
import { getTagsWithPostCount } from "@/lib/services/categoryTagService";
import { PageIntro } from "@/components/layout/PageIntro";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/tags");
  }

  const tags = await getTagsWithPostCount(session.user.id);

  return (
    <div className="space-y-8">
      <PageIntro
        title="我的标签"
        description="仅自己可见与管理；用于给自己的文章打标签。"
      />

      <TagBrowseManage tags={tags} canManage />
    </div>
  );
}
