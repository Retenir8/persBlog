import { prisma } from "@/lib/db";

export async function listPhotoCategories() {
  return prisma.photoCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createPhotoCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("分类名称不能为空");
  return prisma.photoCategory.create({
    data: { name: trimmed },
  });
}

export async function deletePhotoCategory(id: string) {
  await prisma.photoCategory.delete({ where: { id } });
}

export async function updatePhotoCategory(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("分类名称不能为空");
  return prisma.photoCategory.update({
    where: { id },
    data: { name: trimmed },
  });
}

export async function listPhotos(categoryId?: string | null) {
  return prisma.photo.findMany({
    where:
      categoryId === undefined || categoryId === null || categoryId === ""
        ? undefined
        : { categoryId },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function createPhotoRecord(input: {
  imageUrl: string;
  title?: string | null;
  categoryId?: string | null;
}) {
  return prisma.photo.create({
    data: {
      imageUrl: input.imageUrl,
      title: input.title?.trim() || null,
      categoryId: input.categoryId || null,
    },
    include: { category: true },
  });
}

export async function deletePhotoRecord(id: string) {
  const row = await prisma.photo.findUnique({ where: { id } });
  if (!row) return null;
  await prisma.photo.delete({ where: { id } });
  return row;
}
