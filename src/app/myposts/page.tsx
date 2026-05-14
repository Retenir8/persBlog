import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyPosts } from "@/lib/services/postService";
import { getUserWidgetFields } from "@/lib/services/userWidgetSql";
import { ProfileWidgetsSection } from "@/components/widgets/ProfileWidgetsSection";
import { MyPostsActions } from "./PostsActions";
import { PageIntro } from "@/components/layout/PageIntro";
import { PaginationNav } from "@/components/layout/PaginationNav";
import { pagePrimaryCtaClassName, surfacePanelClass } from "@/lib/surfaceStyles";

function first(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/myposts"));
  }

  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(first(sp.page) || "1"), 10));
  const [{ posts, total, pageSize }, meRow] = await Promise.all([
    getMyPosts(session.user.id, page, 10),
    getUserWidgetFields(session.user.id),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const widgetKeys = meRow?.profileWidgets ?? [];

  return (
    <div className="space-y-8">
      <PageIntro
        title="我的博客"
        description="管理你已发布的文章与草稿。"
        action={
          <Link href="/posts/new" className={pagePrimaryCtaClassName}>
            新建文章
          </Link>
        }
      />

      <ProfileWidgetsSection
        widgetKeys={widgetKeys}
        userId={session.user.id}
        isOwner
        zenQuoteText={meRow?.zenQuoteText ?? null}
        moodCalendarData={meRow?.moodCalendarData}
      />

      {posts.length === 0 ? (
        <div
          className={`px-6 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400 ${surfacePanelClass}`}
        >
          还没有文章，去写一篇吧。
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${surfacePanelClass}`}
            >
              <div>
                <Link
                  href={`/posts/${post.id}`}
                  className="text-lg font-medium hover:underline"
                >
                  {post.title}
                </Link>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span>
                    {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
                      post.createdAt
                    )}
                  </span>
                  {!post.published && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      草稿
                    </span>
                  )}
                  {post.category && <span>{post.category.name}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
                >
                  编辑
                </Link>
                <MyPostsActions postId={post.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <PaginationNav
        page={page}
        totalPages={totalPages}
        hrefBuilder={(p) => `/myposts?page=${p}`}
      />
    </div>
  );
}
