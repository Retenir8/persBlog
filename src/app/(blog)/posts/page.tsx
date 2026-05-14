import { PostIndex } from "@/components/blog/PostIndex";
import { PageIntro } from "@/components/layout/PageIntro";

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
      <PageIntro
        title="全部文章"
        description="浏览大家发布的文章；分类与标签仅在个人后台使用，不在此筛选。"
      />

      <PostIndex searchParams={sp} path="/posts" />
    </div>
  );
}
