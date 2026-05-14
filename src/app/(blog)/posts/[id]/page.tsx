import Link from "next/link";
import { notFound } from "next/navigation";
import { outlineLinkClassName } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import {
  getPostById,
  canViewPost,
} from "@/lib/services/postService";
import { getCommentsForPost } from "@/lib/services/commentService";
import { serializeComments } from "@/lib/commentSerialize";
import CommentSection from "@/components/comment/CommentSection";
import { ViewCount } from "@/components/blog/ViewCount";
import { LikeButton } from "@/components/blog/LikeButton";
import { surfacePanelClass } from "@/lib/surfaceStyles";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) {
    notFound();
  }

  const session = await auth();
  const viewOk = await canViewPost(post, session?.user?.id, session?.user?.role);
  if (!viewOk) {
    notFound();
  }

  const rawComments = await getCommentsForPost(id);
  const comments = serializeComments(rawComments);
  const commentsRemountKey = JSON.stringify(
    rawComments.flatMap((c) => [
      c.id,
      ...c.replies.flatMap((r) => [
        r.id,
        ...(r.replies ?? []).map((rr) => rr.id),
      ]),
    ])
  );

  const canEdit =
    session?.user &&
    (session.user.id === post.authorId || session.user.role === "ADMIN");

  const dateFmt = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div className={`p-5 sm:p-6 ${surfacePanelClass}`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/posts" className={outlineLinkClassName}>
            返回列表
          </Link>
          {canEdit && (
            <Link
              href={`/posts/${post.id}/edit`}
              className={outlineLinkClassName}
            >
              编辑
            </Link>
          )}
        </div>

        <header>
          {!post.published && (
            <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              草稿 · 仅作者与管理员可见
            </p>
          )}
          <h1 className="text-3xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{post.author.name || "作者"}</span>
            <time dateTime={post.createdAt.toISOString()}>
              {dateFmt.format(post.createdAt)}
            </time>
            <ViewCount postId={post.id} initialCount={post.viewCount} isDetailPage={true} />
            <LikeButton postId={post.id} initialCount={post.likeCount || 0} initialLiked={false} />
            {post.category && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {post.category.name}
              </span>
            )}
            {post.tags.map((pt) => (
              <span
                key={pt.tagId}
                className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-700"
              >
                {pt.tag.name}
              </span>
            ))}
          </div>
        </header>
      </div>

      <div
        className="post-content mx-auto max-w-[65ch] py-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <CommentSection
        key={commentsRemountKey}
        postId={post.id}
        postAuthorId={post.authorId}
        initialComments={comments}
        allowGuest={post.published}
      />
    </article>
  );
}
