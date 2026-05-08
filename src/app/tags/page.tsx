import Link from "next/link";
import { getTagsWithPostCount } from "@/lib/services/categoryTagService";

export default async function TagsPage() {
  const tags = await getTagsWithPostCount();

  const maxCount = Math.max(...tags.map(t => t._count.posts), 1);
  
  const getTagSize = (count: number) => {
    if (count === 0) return "text-sm";
    const ratio = count / maxCount;
    if (ratio >= 0.7) return "text-xl";
    if (ratio >= 0.4) return "text-base";
    return "text-sm";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">所有标签</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          浏览文章标签
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/posts?tagId=${tag.id}`}
            className={`inline-flex items-center rounded-full border border-zinc-200 px-3 py-1.5 font-medium transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 ${getTagSize(tag._count.posts)}`}
          >
            {tag.name}
            <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
              {tag._count.posts}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
