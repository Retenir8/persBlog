import { Prisma } from "@prisma/client";
import { prisma } from "../db";

export interface SearchParams {
  page: number;
  pageSize: number;
  categoryId?: string;
  tagId?: string;
  keyword?: string;
}

export async function searchPosts(params: SearchParams) {
  const { page, pageSize, categoryId, tagId, keyword } = params;
  const where: Prisma.PostWhereInput = { published: true };

  if (categoryId) where.categoryId = categoryId;
  if (tagId) where.tags = { some: { tagId } };
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { content: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total, page, pageSize };
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!post) return null;

  const likeCount = await prisma.like.count({ where: { postId: id } });

  return {
    ...post,
    likeCount,
  };
}

export async function canViewPost(
  post: NonNullable<Awaited<ReturnType<typeof getPostById>>>,
  viewerId?: string,
  viewerRole?: string
) {
  if (post.published) return true;
  if (!viewerId) return false;
  if (post.authorId === viewerId) return true;
  if (viewerRole === "ADMIN") return true;
  return false;
}

export async function createPost(
  authorId: string,
  data: {
    title: string;
    content: string;
    categoryId?: string | null;
    tagIds?: string[];
    published?: boolean;
  }
) {
  return prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      authorId,
      published: data.published ?? true,
      categoryId: data.categoryId ?? null,
      tags: data.tagIds
        ? { create: data.tagIds.map((id) => ({ tagId: id })) }
        : undefined,
    },
  });
}

export async function updatePost(
  postId: string,
  userId: string,
  userRole: string,
  data: {
    title?: string;
    content?: string;
    categoryId?: string | null;
    tagIds?: string[];
    published?: boolean;
  }
) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Not found");
  if (post.authorId !== userId && userRole !== "ADMIN") {
    throw new Error("Forbidden");
  }

  if (data.tagIds) {
    await prisma.postTag.deleteMany({ where: { postId } });
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      title: data.title,
      content: data.content,
      ...(data.categoryId !== undefined
        ? { categoryId: data.categoryId }
        : {}),
      published: data.published,
      tags: data.tagIds
        ? { create: data.tagIds.map((id) => ({ tagId: id })) }
        : undefined,
    },
  });
}

export async function deletePost(
  postId: string,
  userId: string,
  userRole: string
) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Not found");
  if (post.authorId !== userId && userRole !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return prisma.post.delete({ where: { id: postId } });
}

export async function getMyPosts(
  userId: string,
  page: number,
  pageSize: number
) {
  const where = { authorId: userId };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, page, pageSize };
}

export async function listAllPostsForAdmin(page: number, pageSize: number) {
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.count(),
  ]);
  return { posts, total, page, pageSize };
}
