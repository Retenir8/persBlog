import Link from "next/link";
import { PostIndex } from "@/components/blog/PostIndex";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">最新文章</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            阅读、写作与留言。
          </p>
        </div>
        <Link
          href="/posts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          发布文章
        </Link>
      </div>

      <PostIndex searchParams={sp} path="/" />
    </div>
  );
}
