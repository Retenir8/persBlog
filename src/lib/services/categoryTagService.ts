import { prisma } from "../db";

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoriesWithPostCount() {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { posts: { where: { published: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTagsWithPostCount() {
  return prisma.tag.findMany({
    include: {
      _count: {
        select: { posts: { where: { post: { published: true } } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name required");
  return prisma.category.create({
    data: { name: trimmed },
  });
}

export async function updateCategory(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name required");
  return prisma.category.update({
    where: { id },
    data: { name: trimmed },
  });
}

export async function createTag(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name required");
  return prisma.tag.create({
    data: { name: trimmed },
  });
}

/** 删除分类：先将关联文章的 categoryId 置空，再删分类 */
export async function deleteCategory(id: string) {
  await prisma.$transaction([
    prisma.post.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    }),
    prisma.category.delete({ where: { id } }),
  ]);
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
}

export async function updateTag(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name required");
  return prisma.tag.update({
    where: { id },
    data: { name: trimmed },
  });
}
