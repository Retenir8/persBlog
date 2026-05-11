import { prisma } from "@/lib/db";

export async function listPhotoCategories(userId: string) {
  return prisma.photoCategory.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createPhotoCategory(name: string, userId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("分类名称不能为空");
  return prisma.photoCategory.create({
    data: { name: trimmed, userId },
  });
}

export async function deletePhotoCategory(id: string, userId: string) {
  const row = await prisma.photoCategory.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");
  await prisma.photoCategory.delete({ where: { id } });
}

export async function updatePhotoCategory(id: string, name: string, userId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("分类名称不能为空");
  const row = await prisma.photoCategory.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");
  return prisma.photoCategory.update({
    where: { id },
    data: { name: trimmed },
  });
}

export async function listPhotos(userId: string, categoryId?: string | null) {
  return prisma.photo.findMany({
    where: {
      userId,
      ...(categoryId === undefined || categoryId === null || categoryId === ""
        ? {}
        : { categoryId }),
    },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function createPhotoRecord(input: {
  userId: string;
  imageUrl: string;
  title?: string | null;
  categoryId?: string | null;
}) {
  if (input.categoryId) {
    const cat = await prisma.photoCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!cat || cat.userId !== input.userId) {
      throw new Error("无效的图片分类");
    }
  }
  return prisma.photo.create({
    data: {
      userId: input.userId,
      imageUrl: input.imageUrl,
      title: input.title?.trim() || null,
      categoryId: input.categoryId || null,
    },
    include: { category: true },
  });
}

export async function deletePhotoRecord(id: string, userId: string) {
  const row = await prisma.photo.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  await prisma.photo.delete({ where: { id } });
  return row;
}
