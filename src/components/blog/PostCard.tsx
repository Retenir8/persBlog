import Link from "next/link";
import type { Post, User, Category, PostTag, Tag } from "@/generated/prisma";
import { postCardSurfaceClass, surfaceChipClass } from "@/lib/surfaceStyles";
import { ViewCount } from "./ViewCount";

type PostWithRelations = Post & {
  author: Pick<User, "id" | "name">;
  category: Category | null;
  tags: (PostTag & { tag: Tag })[];
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function PostCard({ post }: { post: PostWithRelations }) {
  const excerpt = stripHtml(post.content).slice(0, 160);
  const date = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(new Date(post.createdAt));

  return (
    <article className={`p-5 ${postCardSurfaceClass}`}>
      <Link href={`/posts/${post.id}`}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {post.title}
        </h2>
      </Link>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
        {excerpt}
        {stripHtml(post.content).length > 160 ? "…" : ""}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
        <Link href={`/users/${post.author.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
          {post.author.name || "作者"}
        </Link>
        <span>·</span>
        <time dateTime={post.createdAt.toISOString()}>{date}</time>
        <span>·</span>
        <ViewCount postId={post.id} initialCount={post.viewCount} />
        {post.category && (
          <>
            <span>·</span>
            <span className={surfaceChipClass}>
              {post.category.name}
            </span>
          </>
        )}
        {post.tags.map((pt) => (
          <span
            key={pt.tagId}
            className={surfaceChipClass}
          >
            {pt.tag.name}
          </span>
        ))}
      </div>
    </article>
  );
}
