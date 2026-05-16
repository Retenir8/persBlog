import { Prisma } from "@/generated/prisma";
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
      { title: { contains: keyword } },
      { content: { contains: keyword } },
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
  if (post.published) {
    if (post.authorId === viewerId) return true;
    if (viewerRole === "ADMIN") return true;
    
    if (post.visibility === "PUBLIC") {
      return true;
    }
    
    if (!viewerId) return false;
    
    if (post.visibility === "FRIENDS") {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: post.authorId,
          },
        },
      });
      const reverseFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: post.authorId,
            followingId: viewerId,
          },
        },
      });
      return !!(follow && reverseFollow);
    }
    
    if (post.visibility === "GROUP") {
      try {
        const visibleGroupIds = JSON.parse(post.visibleGroupIds || "[]");
        const invisibleGroupIds = JSON.parse(post.invisibleGroupIds || "[]");
        
        if (visibleGroupIds.length === 0 && invisibleGroupIds.length === 0) {
          return false;
        }
        
        const viewerGroups = await prisma.friendGroupMember.findMany({
          where: {
            userId: viewerId,
            groupId: { in: visibleGroupIds.length > 0 ? visibleGroupIds : invisibleGroupIds },
          },
          select: { groupId: true },
        });
        
        const viewerGroupIds = viewerGroups.map(g => g.groupId);
        
        if (visibleGroupIds.length > 0) {
          const canSee = visibleGroupIds.some((id: string) => viewerGroupIds.includes(id));
          if (!canSee) return false;
        }
        
        if (invisibleGroupIds.length > 0) {
          const isExcluded = invisibleGroupIds.some((id: string) => viewerGroupIds.includes(id));
          if (isExcluded) return false;
        }
        
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  }
  
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
    visibility?: string;
    visibleGroupIds?: string;
    invisibleGroupIds?: string;
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
      visibility: data.visibility ?? "PUBLIC",
      visibleGroupIds: data.visibleGroupIds ?? "[]",
      invisibleGroupIds: data.invisibleGroupIds ?? "[]",
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
    visibility?: string;
    visibleGroupIds?: string;
    invisibleGroupIds?: string;
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
      visibility: data.visibility ?? post.visibility,
      visibleGroupIds: data.visibleGroupIds ?? post.visibleGroupIds,
      invisibleGroupIds: data.invisibleGroupIds ?? post.invisibleGroupIds,
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

export async function listAllPostsForAdmin(
  page: number,
  pageSize: number
) {
  const where = {};
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true } },
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
