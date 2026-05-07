import { prisma } from "../db";

export async function createComment(
  postId: string,
  content: string,
  userId?: string,
  guestName?: string,
  parentId?: string
) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (!post.published) throw new Error("Cannot comment on draft");

  const guestNeedsName = !userId && !guestName?.trim();
  if (guestNeedsName) throw new Error("Guest name is required");

  return prisma.comment.create({
    data: {
      content,
      postId,
      userId: userId || null,
      guestName: userId ? null : guestName?.trim() ?? null,
      parentId: parentId || null,
    },
  });
}

export async function getCommentsForPost(postId: string) {
  return prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      user: { select: { id: true, name: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true } },
          replies: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function deleteCommentDescendants(commentId: string) {
  const children = await prisma.comment.findMany({
    where: { parentId: commentId },
    select: { id: true },
  });
  for (const c of children) {
    await deleteCommentDescendants(c.id);
  }
  await prisma.comment.delete({ where: { id: commentId } });
}

export async function deleteComment(
  commentId: string,
  currentUserId: string,
  currentUserRole: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { authorId: true } } },
  });
  if (!comment) throw new Error("Not found");
  const isCommentAuthor = comment.userId === currentUserId;
  const isPostOwner = comment.post.authorId === currentUserId;
  if (!isCommentAuthor && !isPostOwner && currentUserRole !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await deleteCommentDescendants(commentId);
}
