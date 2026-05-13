import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyPosts } from "@/lib/services/postService";
import { getUserWidgetFields } from "@/lib/services/userWidgetSql";
import { ProfileWidgetsSection } from "@/components/widgets/ProfileWidgetsSection";
import { MyPostsActions } from "./PostsActions";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的博客</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            管理你已发布的文章与草稿。
          </p>
        </div>
        <Link
          href="/posts/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          新建文章
        </Link>
      </div>

      <ProfileWidgetsSection
        widgetKeys={widgetKeys}
        userId={session.user.id}
        isOwner
        zenQuoteText={meRow?.zenQuoteText ?? null}
        moodCalendarData={meRow?.moodCalendarData}
      />

      {posts.length === 0 ? (
        <p className="text-zinc-500">还没有文章，去写一篇吧。</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950"
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

      {totalPages > 1 && (
        <nav className="flex justify-center gap-4 text-sm">
          {page > 1 && (
            <Link
              href={`/myposts?page=${page - 1}`}
              className="rounded-lg border border-zinc-300 px-3 py-1 dark:border-zinc-600"
            >
              上一页
            </Link>
          )}
          <span className="text-zinc-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/myposts?page=${page + 1}`}
              className="rounded-lg border border-zinc-300 px-3 py-1 dark:border-zinc-600"
            >
              下一页
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
