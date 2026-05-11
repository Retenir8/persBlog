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
    redirect("/login");
  }

  const [categories, tags] = await Promise.all([
    listCategories(session.user.id),
    listTags(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">写文章</h1>
      <PostEditorForm categories={categories} tags={tags} />
    </div>
  );
}
