import { redirect } from "next/navigation";
import PostEditorForm from "@/components/blog/PostEditorForm";
import { auth } from "@/lib/auth";
import {
  listCategories,
  listTags,
} from "@/lib/services/categoryTagService";
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
    <PostEditorForm
      categories={categories}
      tags={tags}
      heading="写文章"
    />
  );
}
