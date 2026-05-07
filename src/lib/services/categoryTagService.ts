import { prisma } from "../db";

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name required");
  return prisma.category.create({
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
