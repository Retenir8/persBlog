import PostEditorForm from "@/components/blog/PostEditorForm";
import {
  listCategories,
  listTags,
} from "@/lib/services/categoryTagService";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    listCategories(),
    listTags(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">写文章</h1>
      <PostEditorForm categories={categories} tags={tags} />
    </div>
  );
}
