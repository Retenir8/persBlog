import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CategoryBrowseManage } from "@/components/blog/CategoryBrowseManage";
import { getCategoriesWithPostCount } from "@/lib/services/categoryTagService";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/categories");
  }

  const categories = await getCategoriesWithPostCount(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">我的分类</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          仅自己可见与管理；用于给自己的文章归类。
        </p>
      </div>

      <CategoryBrowseManage categories={categories} canManage />
    </div>
  );
}
