import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PostEditorForm from "@/components/blog/PostEditorForm";
import { outlineLinkClassName } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import {
  listCategories,
  listTags,
} from "@/lib/services/categoryTagService";
import { getPostById } from "@/lib/services/postService";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const post = await getPostById(id);

  if (!post) {
    notFound();
  }
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const taxonomyUserId =
    session.user.role === "ADMIN" && post.authorId !== session.user.id
      ? post.authorId
      : session.user.id;

  const [categories, tags] = await Promise.all([
    listCategories(taxonomyUserId),
    listTags(taxonomyUserId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/posts/${post.id}`} className={outlineLinkClassName}>
          查看文章
        </Link>
      </div>
      <h1 className="text-2xl font-bold">编辑文章</h1>
      <PostEditorForm categories={categories} tags={tags} post={post} />
    </div>
  );
}
