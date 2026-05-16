import { prisma } from "../db";

export type RelationStatus = 'none' | 'following' | 'followed' | 'mutual';

export interface FollowInfo {
  status: RelationStatus;
  followId?: string;
}

export async function getRelationStatus(
  userId: string,
  targetUserId: string
): Promise<FollowInfo> {
  if (userId === targetUserId) {
    return { status: 'none' };
  }

  const [iFollow, theyFollow] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: targetUserId, followingId: userId } },
    }),
  ]);

  if (iFollow && theyFollow) {
    return { status: 'mutual', followId: iFollow.id };
  } else if (iFollow) {
    return { status: 'following', followId: iFollow.id };
  } else if (theyFollow) {
    return { status: 'followed' };
  } else {
    return { status: 'none' };
  }
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error('不能关注自己');
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    throw new Error('已关注该用户');
  }

  return prisma.follow.create({
    data: { followerId, followingId },
  });
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error('不能取消关注自己');
  }

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (!follow) {
    throw new Error('未关注该用户');
  }

  return prisma.follow.delete({
    where: { id: follow.id },
  });
}

export async function getFollowings(userId: string) {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFollowers(userId: string) {
  return prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMutualFriends(userId: string) {
  const followings = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = followings.map((f) => f.followingId);

  return prisma.follow.findMany({
    where: {
      followingId: userId,
      followerId: { in: followingIds },
    },
    include: { follower: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFollowRequests(userId: string) {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const myFollowing = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const myFollowingIds = new Set(myFollowing.map((f) => f.followingId));

  return followers.filter((f) => !myFollowingIds.has(f.follower.id));
}

export async function getFollowingCount(userId: string) {
  return prisma.follow.count({ where: { followerId: userId } });
}

export async function getFollowerCount(userId: string) {
  return prisma.follow.count({ where: { followingId: userId } });
}