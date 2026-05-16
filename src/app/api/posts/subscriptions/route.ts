import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showAllDays = searchParams.get('showAllDays') === 'true';

  const followings = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  const followingIds = followings.map((f) => f.followingId);

  const dateFilter = showAllDays
    ? { createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } }
    : { createdAt: { gte: new Date(new Date().toDateString()) } };

  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: followingIds },
      published: true,
      ...dateFilter,
    },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const accessiblePosts = await Promise.all(
    posts.map(async (post) => {
      if (post.visibility === 'PUBLIC') {
        return post;
      }

      if (post.visibility === 'FRIENDS') {
        const isMutual = followingIds.includes(session.user.id) && 
          followingIds.includes(post.authorId);
        if (!isMutual) {
          return null;
        }
        return post;
      }

      if (post.visibility === 'GROUP') {
        try {
          const visibleGroupIds = JSON.parse(post.visibleGroupIds || '[]');
          const invisibleGroupIds = JSON.parse(post.invisibleGroupIds || '[]');
          
          if (visibleGroupIds.length === 0 && invisibleGroupIds.length === 0) {
            return null;
          }
          
          const viewerGroups = await prisma.friendGroupMember.findMany({
            where: {
              userId: session.user.id,
              groupId: { in: visibleGroupIds.length > 0 ? visibleGroupIds : invisibleGroupIds },
            },
            select: { groupId: true },
          });
          
          const viewerGroupIds = viewerGroups.map(g => g.groupId);
          
          if (visibleGroupIds.length > 0) {
            const canSee = visibleGroupIds.some((id: string) => viewerGroupIds.includes(id));
            if (!canSee) return null;
          }
          
          if (invisibleGroupIds.length > 0) {
            const isExcluded = invisibleGroupIds.some((id: string) => viewerGroupIds.includes(id));
            if (isExcluded) return null;
          }
          
          return post;
        } catch {
          return null;
        }
      }

      return post;
    })
  );

  const filteredPosts = accessiblePosts.filter((post): post is NonNullable<typeof post> => post !== null);

  return NextResponse.json({
    success: true,
    posts: filteredPosts.map((post) => ({
      id: post.id,
      title: post.title,
      authorId: post.author.id,
      authorName: post.author.name || '匿名用户',
      authorAvatar: post.author.avatar || null,
      createdAt: post.createdAt.toISOString(),
    })),
  });
}
