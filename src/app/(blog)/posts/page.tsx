import { PostIndex } from "@/components/blog/PostIndex";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">全部文章</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          浏览站内全部文章，可按分类与标签筛选。
        </p>
      </div>
      <PostIndex searchParams={sp} path="/posts" />
    </div>
  );
}
