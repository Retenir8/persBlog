import { auth } from "@/lib/auth";
import { PaginationNav } from "@/components/layout/PaginationNav";
import {
  surfaceFieldClass,
  surfacePanelNestedClass,
  surfacePanelSubtleClass,
} from "@/lib/surfaceStyles";
import { searchPosts } from "@/lib/services/postService";
import { listCategories, listTags } from "@/lib/services/categoryTagService";
import { PostCard } from "./PostCard";
import { TaxonomyManageSection } from "./TaxonomyManageSection";

function firstParam(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export async function PostIndex({
  searchParams,
  path = "/posts",
}: {
  searchParams: Record<string, string | string[] | undefined>;
  path?: string;
}) {
  const page = Math.max(1, parseInt(String(firstParam(searchParams.page) || "1"), 10));
  const keyword = String(firstParam(searchParams.keyword) || "").trim() || undefined;

  const session = await auth();
  const uid = session?.user?.id;

  const [result, categories, tags] = await Promise.all([
    searchPosts({
      page,
      pageSize: 10,
      keyword,
    }),
    uid ? listCategories(uid) : Promise.resolve([]),
    uid ? listTags(uid) : Promise.resolve([]),
  ]);

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (keyword) p.set("keyword", keyword);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    });
    const q = p.toString();
    return q ? `?${q}` : "";
  };

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const withQuery = (qs: string) => (qs ? `${path}${qs}` : path);

  return (
    <div className="space-y-8">
      <form
        className={`space-y-4 p-4 ${surfacePanelSubtleClass}`}
        method="get"
        action={path}
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          搜索
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              关键词
            </span>
            <input
              name="keyword"
              defaultValue={keyword ?? ""}
              placeholder="搜索标题或正文"
              className={`h-10 px-3 py-2 text-sm ${surfaceFieldClass}`}
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            搜索
          </button>
        </div>
      </form>

      {uid ? (
        <TaxonomyManageSection
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          tags={tags.map((t) => ({ id: t.id, name: t.name }))}
          canManage
        />
      ) : null}

      {result.posts.length === 0 ? (
        <div
          className={`px-6 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400 ${surfacePanelNestedClass}`}
        >
          暂无文章
        </div>
      ) : (
        <ul className="space-y-4">
          {result.posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      <PaginationNav
        page={page}
        totalPages={totalPages}
        hrefBuilder={(p) => withQuery(buildQuery({ page: String(p) }))}
      />
    </div>
  );
}
