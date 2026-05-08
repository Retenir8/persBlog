import Link from "next/link";
import { getCategoriesWithPostCount } from "@/lib/services/categoryTagService";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithPostCount();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">所有分类</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          浏览文章分类
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/posts?categoryId=${category.id}`}
            className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {category.name}
              </h2>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {category._count.posts} 篇文章
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
