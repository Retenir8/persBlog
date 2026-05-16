import { redirect } from "next/navigation";
import PostEditorForm from "@/components/blog/PostEditorForm";
import { auth } from "@/lib/auth";
import {
  listCategories,
  listTags,
} from "@/lib/services/categoryTagService";
import { PageIntro } from "@/components/layout/PageIntro";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/posts/new"));
  }

  const [categories, tags] = await Promise.all([
    listCategories(session.user.id),
    listTags(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro title="写文章" />
      <PostEditorForm categories={categories} tags={tags} />
    </div>
  );
}
