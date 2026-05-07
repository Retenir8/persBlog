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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">全部文章</h1>
      <PostIndex searchParams={sp} path="/posts" />
    </div>
  );
}
