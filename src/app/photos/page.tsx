import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PhotoGalleryManage } from "@/components/photos/PhotoGalleryManage";
import {
  listPhotoCategories,
  listPhotos,
} from "@/lib/services/photoService";
import { PageIntro } from "@/components/layout/PageIntro";

export const metadata: Metadata = {
  title: "摄影",
  description: "我的相册与分类",
};

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/photos");
  }

  const sp = await searchParams;
  const raw =
    typeof sp.category === "string" ? sp.category.trim() : "";
  const selectedCategoryId =
    raw === "" || raw === "all" ? null : raw;

  const [categories, photos] = await Promise.all([
    listPhotoCategories(session.user.id),
    listPhotos(session.user.id, selectedCategoryId ?? undefined),
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
      <PageIntro
        title="我的摄影"
        description="仅自己可见与管理；按分类浏览与上传照片。"
      />

      <PhotoGalleryManage
        key={selectedCategoryId ?? "all"}
        categories={categoryRows}
        photos={photoRows}
        canManage
        selectedCategoryId={selectedCategoryId}
      />
    </div>
  );
}
