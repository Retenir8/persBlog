import { auth } from "@/lib/auth";
import { CategoryBrowseManage } from "@/components/blog/CategoryBrowseManage";
import { getCategoriesWithPostCount } from "@/lib/services/categoryTagService";

export default async function CategoriesPage() {
  const [categories, session] = await Promise.all([
    getCategoriesWithPostCount(),
    auth(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">所有分类</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          浏览文章分类；登录后可添加、编辑或删除分类。
        </p>
      </div>

      <CategoryBrowseManage
        categories={categories}
        canManage={!!session?.user}
      />
    </div>
  );
}
