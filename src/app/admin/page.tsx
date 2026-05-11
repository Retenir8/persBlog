import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAllPostsForAdmin } from "@/lib/services/postService";
import { AdminPostDelete } from "./AdminPostDelete";

function first(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(first(sp.page) || "1"), 10));
  const { posts, total, pageSize } = await listAllPostsForAdmin(page, 15);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">管理后台 · 全部文章</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          共 {total} 篇 · 可对任意文章删除。普通用户需在「我的博客」管理自己的稿件。
        </p>
      </div>

      {posts.length === 0 ? (
        <p>暂无文章</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="p-3 font-medium">标题</th>
                <th className="p-3 font-medium">作者</th>
                <th className="p-3 font-medium">状态</th>
                <th className="p-3 font-medium">时间</th>
                <th className="w-36 p-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="p-3">
                    <Link href={`/posts/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">
                    {post.author.name || post.author.email}
                  </td>
                  <td className="p-3">
                    {post.published ? (
                      <span className="text-green-600">已发布</span>
                    ) : (
                      <span className="text-amber-600">草稿</span>
                    )}
                  </td>
                  <td className="p-3 text-zinc-500">
                    {new Intl.DateTimeFormat("zh-CN").format(post.createdAt)}
                  </td>
                  <td className="flex flex-wrap gap-2 p-3">
                    <AdminPostDelete postId={post.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex justify-center gap-4 text-sm">
          {page > 1 && (
            <Link
              href={`/admin?page=${page - 1}`}
              className="rounded-lg border border-zinc-300 px-3 py-1 dark:border-zinc-600"
            >
              上一页
            </Link>
          )}
          <span>{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/admin?page=${page + 1}`}
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
