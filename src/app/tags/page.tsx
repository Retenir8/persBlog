import { auth } from "@/lib/auth";
import { TagBrowseManage } from "@/components/blog/TagBrowseManage";
import { getTagsWithPostCount } from "@/lib/services/categoryTagService";

export default async function TagsPage() {
  const [tags, session] = await Promise.all([
    getTagsWithPostCount(),
    auth(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">所有标签</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          浏览文章标签；登录后可添加、编辑或删除标签。
        </p>
      </div>

      <TagBrowseManage tags={tags} canManage={!!session?.user} />
    </div>
  );
}
