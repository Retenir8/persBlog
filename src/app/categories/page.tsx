import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CategoryBrowseManage } from "@/components/blog/CategoryBrowseManage";
import { getCategoriesWithPostCount } from "@/lib/services/categoryTagService";
import { PageIntro } from "@/components/layout/PageIntro";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/categories");
  }

  const categories = await getCategoriesWithPostCount(session.user.id);

  return (
    <div className="space-y-8">
      <PageIntro
        title="我的分类"
        description="仅自己可见与管理；用于给自己的文章归类。"
      />

      <CategoryBrowseManage categories={categories} canManage />
    </div>
  );
}
