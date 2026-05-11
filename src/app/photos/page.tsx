import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PhotoGalleryManage } from "@/components/photos/PhotoGalleryManage";
import {
  listPhotoCategories,
  listPhotos,
} from "@/lib/services/photoService";

export const metadata: Metadata = {
  title: "摄影",
  description: "相册与分类",
};

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw =
    typeof sp.category === "string" ? sp.category.trim() : "";
  const selectedCategoryId =
    raw === "" || raw === "all" ? null : raw;

  const [categories, photos, session] = await Promise.all([
    listPhotoCategories(),
    listPhotos(selectedCategoryId ?? undefined),
    auth(),
  ]);

  const categoryRows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
  }));

  const photoRows = photos.map((p) => ({
    id: p.id,
    title: p.title,
    imageUrl: p.imageUrl,
    categoryId: p.categoryId,
    createdAt: p.createdAt.toISOString(),
    category: p.category
      ? { id: p.category.id, name: p.category.name }
      : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">摄影</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          按分类浏览照片；登录后可上传图片并管理分类。
        </p>
      </div>

      <PhotoGalleryManage
        key={selectedCategoryId ?? "all"}
        categories={categoryRows}
        photos={photoRows}
        canManage={!!session?.user}
        selectedCategoryId={selectedCategoryId}
      />
    </div>
  );
}
