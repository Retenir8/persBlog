import { Prisma } from "@prisma/client";
import { prisma } from "../db";

export interface SearchParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

/** 朋友圈动态：仅展示已发布文章；分类/标签为各人私有，不在全站时间线筛选 */
export async function searchPosts(params: SearchParams) {
  const { page, pageSize, keyword } = params;
  const where: Prisma.PostWhereInput = { published: true };

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

async function ensureTaxonomyOwnedByAuthor(
  authorId: string,
  categoryId: string | null | undefined,
  tagIds: string[] | undefined
) {
  if (categoryId) {
    const c = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!c || c.userId !== authorId) throw new Error("无效的分类");
  }
  if (tagIds && tagIds.length > 0) {
    const n = await prisma.tag.count({
      where: { id: { in: tagIds }, userId: authorId },
    });
    if (n !== tagIds.length) throw new Error("无效的标签");
  }
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
  await ensureTaxonomyOwnedByAuthor(
    authorId,
    data.categoryId ?? null,
    data.tagIds
  );
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

  const ownerId = post.authorId;
  const nextCategoryId =
    data.categoryId !== undefined ? data.categoryId : post.categoryId;
  let nextTagIds: string[];
  if (data.tagIds !== undefined) {
    nextTagIds = data.tagIds;
  } else {
    const rows = await prisma.postTag.findMany({ where: { postId } });
    nextTagIds = rows.map((r) => r.tagId);
  }
  await ensureTaxonomyOwnedByAuthor(ownerId, nextCategoryId ?? null, nextTagIds);

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
