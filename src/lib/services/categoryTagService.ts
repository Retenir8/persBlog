import { prisma } from "../db";

export async function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function listTags(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function getCategoriesWithPostCount(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          posts: { where: { published: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTagsWithPostCount(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          posts: { where: { post: { published: true } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(name: string, userId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name required");
  return prisma.category.create({
    data: { name: trimmed, userId },
  });
}

export async function updateCategory(id: string, name: string, userId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name required");
  const row = await prisma.category.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");
  return prisma.category.update({
    where: { id },
    data: { name: trimmed },
  });
}

export async function createTag(name: string, userId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name required");
  return prisma.tag.create({
    data: { name: trimmed, userId },
  });
}

/** 删除分类：先将关联文章的 categoryId 置空，再删分类 */
export async function deleteCategory(id: string, userId: string) {
  const row = await prisma.category.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");
  await prisma.$transaction([
    prisma.post.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    }),
    prisma.category.delete({ where: { id } }),
  ]);
}

export async function deleteTag(id: string, userId: string) {
  const row = await prisma.tag.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");
  await prisma.tag.delete({ where: { id } });
}

export async function updateTag(id: string, name: string, userId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name required");
  const row = await prisma.tag.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new Error("Forbidden");
  return prisma.tag.update({
    where: { id },
    data: { name: trimmed },
  });
}
