import Link from "next/link";
import { PostIndex } from "@/components/blog/PostIndex";
import { PageIntro } from "@/components/layout/PageIntro";
import { pagePrimaryCtaClassName } from "@/lib/surfaceStyles";

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
      <PageIntro
        title="最新文章"
        description="查看大家发布的动态；登录后可管理自己的分类、标签、音乐与摄影。"
        action={
          <Link href="/posts/new" className={pagePrimaryCtaClassName}>
            发布文章
          </Link>
        }
      />

      <PostIndex searchParams={sp} path="/" />
    </div>
  );
}
